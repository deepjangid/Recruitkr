import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { Application } from '../models/Application.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { JobRequirement } from '../models/JobRequirement.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { publishLiveUpdate } from '../services/liveUpdate.service.js';
import { generateResumePdfBuffer } from '../services/resume.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const LEGACY_STATUS_MAP = {
  pending: 'applied',
  applied: 'applied',
  reviewing: 'under-review',
  reviewed: 'under-review',
  shortlisted: 'screening',
  screening: 'screening',
  interview: 'interview',
  offered: 'offer',
  offer: 'offer',
  hired: 'hired',
  rejected: 'rejected',
};

const normalizeJobKey = (value) => String(value || '').trim().toLowerCase();

const mapLegacyStatus = (status) => LEGACY_STATUS_MAP[String(status || '').trim().toLowerCase()] || 'applied';

const getObjectIdTimestamp = (value) => {
  if (value && typeof value.getTimestamp === 'function') {
    return value.getTimestamp();
  }

  try {
    return new mongoose.Types.ObjectId(String(value)).getTimestamp();
  } catch {
    return new Date();
  }
};

const toISOStringSafe = (value, fallback) => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : date.toISOString();
};

const buildLegacyTimeline = (legacyApplication, fallbackCreatedAt, mappedStatus, statusNote) => {
  if (Array.isArray(legacyApplication.timeline) && legacyApplication.timeline.length > 0) {
    return legacyApplication.timeline.map((item) => ({
      status: mapLegacyStatus(item?.status),
      note: item?.note || '',
      changedByRole: item?.changedByRole || 'system',
      changedAt: toISOStringSafe(item?.changedAt, fallbackCreatedAt),
    }));
  }

  return [
    {
      status: 'applied',
      note: 'Application submitted successfully.',
      changedByRole: 'candidate',
      changedAt: fallbackCreatedAt,
    },
    ...(mappedStatus !== 'applied' || statusNote
      ? [
          {
            status: mappedStatus,
            note: statusNote || '',
            changedByRole: 'system',
            changedAt: toISOStringSafe(
              legacyApplication.updatedAt || legacyApplication.statusUpdatedAt,
              fallbackCreatedAt,
            ),
          },
        ]
      : []),
  ];
};

const transformLegacyApplication = (legacyApplication, jobsByKey = new Map()) => {
  const createdAt = toISOStringSafe(
    legacyApplication.createdAt || legacyApplication.submittedAt || getObjectIdTimestamp(legacyApplication._id),
    new Date().toISOString(),
  );
  const status = mapLegacyStatus(legacyApplication.status);
  const statusNote = String(
    legacyApplication.statusNote || legacyApplication.notes || legacyApplication.note || '',
  ).trim();
  const jobTitle = String(legacyApplication.jobTitle || legacyApplication.appliedFor || 'Job').trim();
  const matchedJob = jobsByKey.get(normalizeJobKey(jobTitle));
  const experienceLabel = String(legacyApplication.experience?.[0]?.jobProfile || '').toLowerCase();

  return {
    _id: String(legacyApplication._id),
    fullName: legacyApplication.fullName || '',
    status,
    createdAt,
    statusNote,
    statusUpdatedAt: toISOStringSafe(
      legacyApplication.statusUpdatedAt || legacyApplication.updatedAt,
      createdAt,
    ),
    interviewDetails: legacyApplication.interviewDetails || undefined,
    timeline: buildLegacyTimeline(legacyApplication, createdAt, status, statusNote),
    jobId: matchedJob
      ? {
          _id: String(matchedJob._id),
          jobTitle: matchedJob.jobTitle,
        }
      : {
          jobTitle,
        },
    candidateId: {
      email: legacyApplication.email || '',
      mobile: legacyApplication.phone || '',
    },
    candidateProfile: {
      fullName: legacyApplication.fullName || '',
      highestQualification: legacyApplication.qualification || '',
      experienceStatus: experienceLabel.includes('experience') ? 'experienced' : 'fresher',
      preferences: {
        preferredRole: legacyApplication.jobTitle || legacyApplication.appliedFor || '',
        preferredLocation: legacyApplication.currentCity || '',
      },
      summary: legacyApplication.notes || '',
    },
    resume: legacyApplication.resumeData || legacyApplication.resumePath
      ? {
          _id: String(legacyApplication._id),
          fileName:
            String(legacyApplication.resumePath || '').split(/[\\/]/).pop() ||
            `${(legacyApplication.fullName || 'candidate').replace(/\s+/g, '_')}_resume.pdf`,
          mimeType: 'application/pdf',
          source: legacyApplication.hasCustomResume ? 'uploaded' : 'generated',
          updatedAt: toISOStringSafe(legacyApplication.updatedAt, createdAt),
        }
      : undefined,
    isLegacy: true,
  };
};

const getLegacyResumeBuffer = (resumeData) => {
  if (!resumeData) return null;
  if (Buffer.isBuffer(resumeData)) return resumeData;
  if (resumeData?.buffer && Buffer.isBuffer(resumeData.buffer)) return resumeData.buffer;
  if (typeof resumeData?.value === 'function') {
    const value = resumeData.value(true);
    if (Buffer.isBuffer(value)) return value;
  }
  if (resumeData?.$binary?.base64) {
    return Buffer.from(resumeData.$binary.base64, 'base64');
  }
  if (resumeData?.base64) {
    return Buffer.from(resumeData.base64, 'base64');
  }
  return null;
};

const getClientJobsMap = async (clientId) => {
  const jobs = await JobRequirement.find({ clientId }).select('_id jobTitle').lean();
  return new Map(jobs.map((job) => [normalizeJobKey(job.jobTitle), job]));
};

export const fetchLegacyApplicationsForClient = async (clientId) => {
  const jobsByKey = await getClientJobsMap(clientId);
  if (jobsByKey.size === 0) {
    return [];
  }

  const legacyDocs = await Application.collection
    .find({
      $or: [
        { clientId: { $exists: false } },
        { clientId: null },
      ],
    })
    .toArray();

  return legacyDocs
    .filter((doc) => {
      const titleKey = normalizeJobKey(doc?.jobTitle || doc?.appliedFor);
      return titleKey && jobsByKey.has(titleKey);
    })
    .map((doc) => transformLegacyApplication(doc, jobsByKey))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const findLegacyApplicationForClient = async (clientId, applicationId) => {
  const jobsByKey = await getClientJobsMap(clientId);
  if (jobsByKey.size === 0) return null;

  const legacyDoc = await Application.collection.findOne({ _id: new mongoose.Types.ObjectId(applicationId) });
  if (!legacyDoc) return null;

  const titleKey = normalizeJobKey(legacyDoc.jobTitle || legacyDoc.appliedFor);
  if (!titleKey || !jobsByKey.has(titleKey)) {
    return null;
  }

  return transformLegacyApplication(legacyDoc, jobsByKey);
};

const sanitizeInterviewDetails = (details) => {
  if (!details) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries({
      ...(details.scheduledAt ? { scheduledAt: new Date(details.scheduledAt) } : {}),
      ...(details.timezone ? { timezone: details.timezone } : {}),
      ...(details.mode ? { mode: details.mode } : {}),
      ...(details.locationText ? { locationText: details.locationText } : {}),
      ...(details.googleMapsUrl ? { googleMapsUrl: details.googleMapsUrl } : {}),
      ...(details.meetingLink ? { meetingLink: details.meetingLink } : {}),
      ...(details.contactPerson ? { contactPerson: details.contactPerson } : {}),
      ...(details.contactEmail ? { contactEmail: details.contactEmail } : {}),
      ...(details.contactPhone ? { contactPhone: details.contactPhone } : {}),
      ...(details.notes ? { notes: details.notes } : {}),
    }).filter(([, value]) => value !== undefined && value !== ''),
  );

  return Object.keys(sanitized).length ? sanitized : undefined;
};

const normalizePublicJob = (job) => {
  const isLegacy = Boolean(!job.clientId && (job.title || job.location || job.type));

  return {
    _id: String(job._id),
    jobTitle: job.jobTitle || job.title || 'Job Opening',
    jobLocation: job.jobLocation || job.location || 'Location not shared',
    employmentType: job.employmentType || job.type || 'Not specified',
    minCtcLpa: job.minCtcLpa,
    maxCtcLpa: job.maxCtcLpa,
    companyName: job.company || '',
    openings: job.openings,
    description: job.jobDescription || job.description || '',
    department: job.department || job.category || '',
    experienceRequired: job.experienceRequired || job.experience || '',
    qualification: job.qualification || '',
    preferredIndustryBackground: job.preferredIndustryBackground || '',
    workModes: Array.isArray(job.workModes) ? job.workModes : [],
    urgencyLevel: job.urgencyLevel || '',
    requirements: Array.isArray(job.requirements) ? job.requirements : [],
    responsibilities: Array.isArray(job.responsibilities) ? job.responsibilities : [],
    skills: Array.isArray(job.skills) ? job.skills : [],
    genderRequirement: job.genderRequirement || job.genderPreference || '',
    salary: job.salary || undefined,
    applicationDeadline: toISOStringSafe(job.applicationDeadline, ''),
    createdAt: toISOStringSafe(job.createdAt, new Date().toISOString()),
    canApply: Boolean(job.clientId),
    applyDisabledReason: isLegacy
      ? 'This opening is visible from older data and cannot accept new applications yet.'
      : undefined,
    isLegacy,
  };
};

const isActiveStatus = (status) => String(status || '').trim().toLowerCase() === 'active';

const buildJobDocumentPayload = (body, clientProfile, clientId) => {
  const companyName = clientProfile?.companyName || '';
  const contactEmail = body.contactEmail || clientProfile?.spoc?.email || '';
  const normalizedEmploymentType = body.employmentType || '';
  const normalizedJobTitle = body.jobTitle || '';
  const normalizedLocation = body.jobLocation || '';
  const normalizedExperience = body.experienceRequired || body.experience || '';
  const normalizedQualification = body.qualification || body.preferredIndustryBackground || body.department || '';
  const normalizedGender = body.genderRequirement || body.genderPreference || 'No Preference';
  const maxCtcLpa = Number(body.maxCtcLpa || 0);
  const salaryCurrency = body.salaryCurrency || body.salary?.currency || 'INR';

  return {
    ...body,
    clientId,
    title: normalizedJobTitle,
    company: companyName,
    location: normalizedLocation,
    type: normalizedEmploymentType,
    category: body.category || body.department,
    genderRequirement: normalizedGender,
    qualification: normalizedQualification,
    experience: normalizedExperience,
    fixedPrice: body.fixedPrice !== undefined ? Number(body.fixedPrice) : maxCtcLpa,
    ageRequirement: body.ageRequirement || '',
    salary: {
      min: Number(body.minCtcLpa || 0),
      max: maxCtcLpa,
      currency: salaryCurrency,
    },
    requirements: Array.isArray(body.requirements) ? body.requirements : [],
    responsibilities: Array.isArray(body.responsibilities) ? body.responsibilities : [],
    skills: Array.isArray(body.skills) ? body.skills : [],
    contactEmail,
    applicationDeadline: body.expectedJoiningDate || undefined,
  };
};

const ensureCandidateResume = async ({ candidateUser, candidateProfile }) => {
  let resume = await Resume.findOne({ candidateUserId: candidateUser._id }).select('+data fileName source').lean();
  if (resume) return resume;

  const fileName = `${String(candidateProfile?.fullName || 'Resume')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Resume'}_Resume.pdf`;

  const pdfBuffer = await generateResumePdfBuffer({
    ...candidateProfile,
    email: candidateUser.email,
    mobile: candidateUser.mobile,
  });

  await Resume.findOneAndUpdate(
    { candidateUserId: candidateUser._id },
    {
      candidateUserId: candidateUser._id,
      fileName,
      mimeType: 'application/pdf',
      source: 'generated',
      textExtract: '',
      data: pdfBuffer,
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  resume = await Resume.findOne({ candidateUserId: candidateUser._id }).select('+data fileName source').lean();
  return resume;
};

export const createJob = asyncHandler(async (req, res) => {
  const clientProfile = await ClientProfile.findOne({ userId: req.user.id })
    .select('companyName spoc.email industry')
    .lean();

  const job = await JobRequirement.create({
    ...buildJobDocumentPayload(req.body, clientProfile, req.user.id),
    status: 'active',
  });
  res.status(StatusCodes.CREATED).json({ success: true, data: job });
});

export const listPublicJobs = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10, location, type } = req.query;
  const currentPage = Number(page);
  const pageLimit = Number(limit);
  const skip = (currentPage - 1) * pageLimit;

  const [jobRequirements, jobsCollectionDocs, openingsCollectionDocs] = await Promise.all([
    JobRequirement.find({}).sort({ createdAt: -1 }).lean(),
    JobRequirement.db.collection('jobs').find({}).sort({ createdAt: -1 }).toArray(),
    JobRequirement.db.collection('openings').find({}).sort({ createdAt: -1 }).toArray(),
  ]);

  const normalizedJobs = [...jobRequirements, ...jobsCollectionDocs, ...openingsCollectionDocs]
    .filter((job) => isActiveStatus(job.status))
    .map(normalizePublicJob)
    .filter((job) => {
      if (q && !job.jobTitle.toLowerCase().includes(String(q).trim().toLowerCase())) return false;
      if (location && !job.jobLocation.toLowerCase().includes(String(location).trim().toLowerCase())) return false;
      if (type && job.employmentType !== type) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = normalizedJobs.length;
  const paginatedJobs = normalizedJobs.slice(skip, skip + pageLimit);

  res.json({
    success: true,
    data: paginatedJobs,
    meta: { page: currentPage, limit: pageLimit, total, totalPages: Math.ceil(total / pageLimit) || 1 },
  });
});

export const listMyJobs = asyncHandler(async (req, res) => {
  const jobs = await JobRequirement.find({ clientId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: jobs });
});

export const updateMyJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid job id');
  }

  const job = await JobRequirement.findOneAndUpdate(
    { _id: jobId, clientId: req.user.id },
    { status: req.body.status },
    { new: true },
  );

  if (!job) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found');
  }
  res.json({ success: true, data: job });
});

export const updateMyJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid job id');
  }

  const clientProfile = await ClientProfile.findOne({ userId: req.user.id })
    .select('companyName spoc.email industry')
    .lean();

  const payload = buildJobDocumentPayload(req.body, clientProfile, req.user.id);
  const job = await JobRequirement.findOneAndUpdate(
    { _id: jobId, clientId: req.user.id },
    payload,
    { new: true },
  );

  if (!job) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found');
  }

  res.json({ success: true, data: job });
});

export const deleteMyJob = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid job id');
  }

  const job = await JobRequirement.findOneAndDelete({ _id: jobId, clientId: req.user.id });
  if (!job) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found');
  }

  res.json({ success: true, data: { _id: jobId } });
});

export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid job id');
  }

  const job = await JobRequirement.findOne({ _id: jobId, status: 'active' }).select('_id clientId');
  if (!job) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found');
  }
  if (!job.clientId) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This job cannot accept applications right now because the employer record is missing.',
    );
  }

  const exists = await Application.findOne({ candidateId: req.user.id, jobId });
  if (exists) {
    throw new ApiError(StatusCodes.CONFLICT, 'Already applied to this job');
  }

  const [candidateUser, candidateProfile] = await Promise.all([
    User.findById(req.user.id).select('email mobile').lean(),
    CandidateProfile.findOne({ userId: req.user.id }).lean(),
  ]);

  const resume = await ensureCandidateResume({ candidateUser, candidateProfile });

  const application = await Application.create({
    candidateId: req.user.id,
    clientId: job.clientId,
    jobId,
    fullName: candidateProfile?.fullName || '',
    email: candidateUser?.email || '',
    phone: candidateUser?.mobile || '',
    qualification: candidateProfile?.highestQualification || '',
    college: '',
    currentCity: candidateProfile?.preferences?.preferredLocation || '',
    experience: [
      {
        jobProfile:
          candidateProfile?.experienceStatus === 'experienced' ? 'Experienced' : 'Fresher',
      },
    ],
    resumePath: resume?.fileName ? `resumes/${resume.fileName}` : '',
    resumeData: resume?.data,
    hasCustomResume: resume?.source === 'uploaded',
    submittedAt: new Date(),
    notes: '',
    appliedFor:
      (job.jobTitle || job.title || '').trim() || undefined,
    statusUpdatedAt: new Date(),
    timeline: [
      {
        status: 'applied',
        note: 'Application submitted successfully.',
        changedByRole: 'candidate',
        changedAt: new Date(),
      },
    ],
  });

  publishLiveUpdate({
    userId: req.user.id,
    role: 'candidate',
    event: 'application-created',
    payload: {
      applicationId: String(application._id),
      jobId: String(jobId),
      status: application.status,
    },
  });

  publishLiveUpdate({
    userId: String(job.clientId),
    role: 'client',
    event: 'application-created',
    payload: {
      applicationId: String(application._id),
      jobId: String(jobId),
      status: application.status,
    },
  });

  res.status(StatusCodes.CREATED).json({ success: true, data: application });
});

export const listCandidateApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidateId: req.user.id })
    .populate('jobId')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: applications });
});

export const listClientApplications = asyncHandler(async (req, res) => {
  const [applications, legacyApplications] = await Promise.all([
    Application.find({ clientId: req.user.id })
      .populate('jobId')
      .populate({
        path: 'candidateId',
        select: 'email mobile',
      })
      .sort({ createdAt: -1 }),
    fetchLegacyApplicationsForClient(req.user.id),
  ]);

  const data = [...applications, ...legacyApplications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  res.json({ success: true, data });
});

export const getClientApplicationDetails = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid application id');
  }

  const application = await Application.findOne({ _id: applicationId, clientId: req.user.id })
    .populate('jobId')
    .populate({
      path: 'candidateId',
      select: 'email mobile',
    });

  if (!application) {
    const legacyApplication = await findLegacyApplicationForClient(req.user.id, applicationId);
    if (!legacyApplication) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }

    res.json({
      success: true,
      data: {
        application: {
          _id: legacyApplication._id,
          status: legacyApplication.status,
          createdAt: legacyApplication.createdAt,
          statusNote: legacyApplication.statusNote,
          statusUpdatedAt: legacyApplication.statusUpdatedAt,
          interviewDetails: legacyApplication.interviewDetails,
          timeline: legacyApplication.timeline,
          jobId: legacyApplication.jobId,
          candidateId: legacyApplication.candidateId,
        },
        candidateProfile: legacyApplication.candidateProfile,
        resume: legacyApplication.resume,
      },
    });
    return;
  }

  const [candidateProfile, resume] = await Promise.all([
    CandidateProfile.findOne({ userId: application.candidateId?._id || application.candidateId }),
    Resume.findOne({ candidateUserId: application.candidateId?._id || application.candidateId }).select(
      '_id fileName mimeType source updatedAt',
    ),
  ]);

  const fallbackCandidateProfile = candidateProfile || {
    fullName: application.fullName || '',
    highestQualification: application.qualification || '',
    experienceStatus:
      application.experience?.[0]?.jobProfile?.toLowerCase() === 'experienced' ? 'experienced' : 'fresher',
    preferences: {
      preferredRole: application.appliedFor || application.jobTitle || '',
      preferredLocation: application.currentCity || '',
    },
    summary: application.notes || '',
  };

  const fallbackResume =
    resume ||
    (application.resumePath || application.resumeData
      ? {
          _id: String(application._id),
          fileName: String(application.resumePath || '').split(/[\\/]/).pop() || 'candidate_resume.pdf',
          mimeType: 'application/pdf',
          source: application.hasCustomResume ? 'uploaded' : 'generated',
          updatedAt: toISOStringSafe(application.updatedAt, new Date().toISOString()),
        }
      : undefined);

  res.json({
    success: true,
    data: {
      application,
      candidateProfile: fallbackCandidateProfile,
      resume: fallbackResume,
    },
  });
});

export const downloadClientApplicationResume = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid application id');
  }

  const application = await Application.findOne({ _id: applicationId, clientId: req.user.id })
    .select('candidateId')
    .lean();

  if (!application) {
    const legacyApplication = await findLegacyApplicationForClient(req.user.id, applicationId);
    if (!legacyApplication) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }

    const rawLegacyDoc = await Application.collection.findOne({
      _id: new mongoose.Types.ObjectId(applicationId),
    });
    const legacyResumeBuffer = getLegacyResumeBuffer(rawLegacyDoc?.resumeData);
    if (!legacyResumeBuffer) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Resume not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${legacyApplication.resume?.fileName || 'candidate_resume.pdf'}"`,
    );
    res.send(legacyResumeBuffer);
    return;
  }

  const resume = await Resume.findOne({ candidateUserId: application.candidateId }).select('+data').exec();
  if (!resume) {
    const applicationWithResume = await Application.findById(applicationId).select('+resumeData resumePath hasCustomResume').lean();
    if (!applicationWithResume?.resumeData) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Resume not found');
    }

    const fallbackFileName =
      String(applicationWithResume.resumePath || '').split(/[\\/]/).pop() || 'candidate_resume.pdf';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fallbackFileName}"`);
    res.send(applicationWithResume.resumeData);
    return;
  }

  res.setHeader('Content-Type', resume.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
  res.send(resume.data);
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid application id');
  }

  const existingApplication = await Application.findOne({ _id: applicationId, clientId: req.user.id });
  if (!existingApplication) {
    const legacyApplication = await findLegacyApplicationForClient(req.user.id, applicationId);
    if (!legacyApplication) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }

    const interviewDetails = sanitizeInterviewDetails(req.body.interviewDetails);
    const currentTimeline = Array.isArray(legacyApplication.timeline) ? legacyApplication.timeline : [];
    const legacyStatusEntry = {
      status: req.body.status,
      note: req.body.note || (req.body.status === 'interview' ? 'Interview scheduled by client.' : ''),
      changedByRole: 'client',
      changedAt: new Date(),
    };

    await Application.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(applicationId) },
      {
        $set: {
          status: req.body.status,
          statusNote: req.body.note || '',
          notes: req.body.note || '',
          statusUpdatedAt: new Date(),
          updatedAt: new Date(),
          ...(interviewDetails ? { interviewDetails } : {}),
          timeline: [...currentTimeline, legacyStatusEntry],
        },
      },
    );

    publishLiveUpdate({
      userId: req.user.id,
      role: 'client',
      event: 'application-updated',
      payload: {
        applicationId,
        status: req.body.status,
      },
    });

    res.json({
      success: true,
      data: {
        ...legacyApplication,
        status: req.body.status,
        statusNote: req.body.note || '',
        statusUpdatedAt: new Date().toISOString(),
        interviewDetails: interviewDetails || legacyApplication.interviewDetails,
        timeline: [...currentTimeline, legacyStatusEntry],
      },
    });
    return;
  }

  const interviewDetails = sanitizeInterviewDetails(req.body.interviewDetails);
  if (req.body.status === 'interview' && !interviewDetails && !existingApplication.interviewDetails) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Interview schedule details are required before moving an application to interview.',
    );
  }

  existingApplication.status = req.body.status;
  existingApplication.statusNote = req.body.note || '';
  existingApplication.statusUpdatedAt = new Date();

  if (interviewDetails) {
    existingApplication.interviewDetails = interviewDetails;
  }

  existingApplication.timeline = [
    ...(existingApplication.timeline || []),
    {
      status: req.body.status,
      note: req.body.note || (req.body.status === 'interview' ? 'Interview scheduled by client.' : ''),
      changedByRole: 'client',
      changedAt: new Date(),
    },
  ];

  const application = await existingApplication.save();

  publishLiveUpdate({
    userId: req.user.id,
    role: 'client',
    event: 'application-updated',
    payload: {
      applicationId,
      status: application.status,
    },
  });

  publishLiveUpdate({
    userId: String(existingApplication.candidateId),
    role: 'candidate',
    event: 'application-updated',
    payload: {
      applicationId,
      status: application.status,
    },
  });

  res.json({ success: true, data: application });
});

