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

const parseFlexibleScheduledAt = (dateValue, timeValue) => {
  const dateText = String(dateValue || '').trim();
  const timeText = String(timeValue || '').trim();
  if (!dateText) return undefined;

  if (!timeText) {
    const directDate = new Date(dateText);
    return Number.isNaN(directDate.getTime()) ? undefined : directDate;
  }

  const directDateTime = new Date(`${dateText} ${timeText}`);
  if (!Number.isNaN(directDateTime.getTime())) {
    return directDateTime;
  }

  const dateMatch = dateText.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  const timeMatch = timeText.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!dateMatch || !timeMatch) return undefined;

  const day = Number(dateMatch[1]);
  const monthIndex = Number(dateMatch[2]) - 1;
  const year = Number(dateMatch[3]);
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const meridiem = timeMatch[3].toUpperCase();

  if (meridiem === 'PM' && hour < 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;

  const composed = new Date(year, monthIndex, day, hour, minute, 0, 0);
  return Number.isNaN(composed.getTime()) ? undefined : composed;
};

const normalizeInterviewMode = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized === 'google meet' || normalized === 'gmeet' || normalized === 'meet') {
    return 'google-meet';
  }
  if (normalized === 'video call' || normalized === 'video') return 'video';
  if (normalized === 'phone call' || normalized === 'phone') return 'phone';
  if (normalized === 'on-site' || normalized === 'onsite') return 'onsite';
  if (normalized === 'zoom') return 'zoom';
  if (normalized === 'other') return 'other';
  return normalized;
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
  const statusNote = deriveStatusNoteFromRecord(legacyApplication);
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
    interviewDetails: deriveInterviewDetailsFromRecord(legacyApplication),
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

const PUBLIC_JOB_COLLECTIONS = ['jobs', 'openings'];

const getSourceCollectionLabel = (sourceCollection) => {
  if (sourceCollection === 'openings') return 'RecruitKr Hiring';
  if (sourceCollection === 'jobs') return 'Imported Hiring';
  return 'Client Requirement';
};

const resolveJobOwnerId = (job, sourceCollection) => {
  if (!job) return '';

  if (!sourceCollection || sourceCollection === 'jobRequirements') {
    return String(job.clientId || '').trim();
  }

  const ownerCandidate = [
    job.clientId,
    job.ownerId,
    job.createdBy,
    job.postedBy,
  ].find((value) => mongoose.isValidObjectId(String(value || '').trim()));

  return ownerCandidate ? String(ownerCandidate).trim() : '';
};

const resolveJobOwnerRole = ({ sourceCollection, ownerId, ownerRole }) => {
  if (ownerRole) return ownerRole;
  if (!ownerId) return sourceCollection === 'openings' ? 'admin' : 'client';
  return sourceCollection === 'openings' ? 'admin' : 'client';
};

const findExternalJobById = async (jobId) => {
  for (const collectionName of PUBLIC_JOB_COLLECTIONS) {
    const doc = await JobRequirement.db.collection(collectionName).findOne({
      _id: new mongoose.Types.ObjectId(jobId),
    });
    if (doc) {
      return { collectionName, job: doc };
    }
  }

  return null;
};

const normalizeApplicationJobRef = (application) => {
  if (application?.jobId && typeof application.jobId === 'object') {
    return {
      _id: String(application.jobId._id),
      jobTitle: application.jobId.jobTitle || application.jobId.title || application.appliedFor || 'Job',
      jobLocation: application.jobId.jobLocation || application.jobId.location || 'Location not shared',
      employmentType: application.jobId.employmentType || application.jobId.type || 'Employment type pending',
      sourceCollection: 'jobRequirements',
      sourceLabel: getSourceCollectionLabel('jobRequirements'),
    };
  }

  if (application?.sourceJobId || application?.sourceJobSnapshot?.jobTitle) {
    return {
      _id: application.sourceJobId || undefined,
      jobTitle: application.sourceJobSnapshot?.jobTitle || application.appliedFor || 'Job',
      jobLocation: application.sourceJobSnapshot?.jobLocation || 'Location not shared',
      employmentType: application.sourceJobSnapshot?.employmentType || 'Employment type pending',
      sourceCollection: application.sourceCollection || undefined,
      sourceLabel: getSourceCollectionLabel(application.sourceCollection),
    };
  }

  return application?.jobId;
};

const normalizeApplicationResponse = (application) => {
  const base = typeof application.toObject === 'function' ? application.toObject() : application;
  const interviewDetails = deriveInterviewDetailsFromRecord(base);
  const statusNote = deriveStatusNoteFromRecord(base);
  return {
    ...base,
    statusNote,
    interviewDetails,
    jobId: normalizeApplicationJobRef(base),
  };
};

const buildApplicationOwnerQuery = (user) => ({
  _id: { $exists: true },
  clientId: user.id,
});

const findOwnedApplication = (applicationId, user) =>
  Application.findOne({
    ...buildApplicationOwnerQuery(user),
    _id: applicationId,
  });

const getClientJobsMap = async (clientId) => {
  const jobs = await JobRequirement.find({ clientId, sourceCollection: { $exists: false } })
    .select('_id jobTitle')
    .lean();
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

const sanitizeInterviewDetails = (details, fallbackPayload = {}) => {
  const mergedDetails = {
    ...(details || {}),
    ...(fallbackPayload.interviewMode
      ? { mode: normalizeInterviewMode(fallbackPayload.interviewMode) }
      : {}),
    ...(fallbackPayload.interviewLocation
      ? { locationText: String(fallbackPayload.interviewLocation).trim() }
      : {}),
    ...(fallbackPayload.googleMapLocation
      ? { googleMapsUrl: String(fallbackPayload.googleMapLocation).trim() }
      : {}),
    ...(fallbackPayload.contactPerson
      ? { contactPerson: String(fallbackPayload.contactPerson).trim() }
      : {}),
    ...(fallbackPayload.contactEmail
      ? { contactEmail: String(fallbackPayload.contactEmail).trim() }
      : {}),
    ...(fallbackPayload.contactPhone
      ? { contactPhone: String(fallbackPayload.contactPhone).trim() }
      : {}),
    ...(fallbackPayload.reportingNotes
      ? { reportingNotes: String(fallbackPayload.reportingNotes).trim() }
      : {}),
    ...(fallbackPayload.documentsRequired
      ? { documentsRequired: String(fallbackPayload.documentsRequired).trim() }
      : {}),
    ...(fallbackPayload.additionalInstructions
      ? { additionalInstructions: String(fallbackPayload.additionalInstructions).trim() }
      : {}),
  };

  const derivedScheduledAt =
    mergedDetails.scheduledAt ||
    parseFlexibleScheduledAt(fallbackPayload.interviewDate, fallbackPayload.interviewTime);

  if (!Object.keys(mergedDetails).length && !derivedScheduledAt) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries({
      ...(derivedScheduledAt ? { scheduledAt: new Date(derivedScheduledAt) } : {}),
      ...(mergedDetails.timezone ? { timezone: mergedDetails.timezone } : {}),
      ...(mergedDetails.mode ? { mode: normalizeInterviewMode(mergedDetails.mode) } : {}),
      ...(mergedDetails.locationText ? { locationText: mergedDetails.locationText } : {}),
      ...(mergedDetails.googleMapsUrl ? { googleMapsUrl: mergedDetails.googleMapsUrl } : {}),
      ...(mergedDetails.meetingLink ? { meetingLink: mergedDetails.meetingLink } : {}),
      ...(mergedDetails.contactPerson ? { contactPerson: mergedDetails.contactPerson } : {}),
      ...(mergedDetails.contactEmail ? { contactEmail: mergedDetails.contactEmail } : {}),
      ...(mergedDetails.contactPhone ? { contactPhone: mergedDetails.contactPhone } : {}),
      ...(mergedDetails.notes ? { notes: mergedDetails.notes } : {}),
      ...(mergedDetails.reportingNotes ? { reportingNotes: mergedDetails.reportingNotes } : {}),
      ...(mergedDetails.documentsRequired ? { documentsRequired: mergedDetails.documentsRequired } : {}),
      ...(mergedDetails.additionalInstructions
        ? { additionalInstructions: mergedDetails.additionalInstructions }
        : {}),
    }).filter(([, value]) => value !== undefined && value !== ''),
  );

  return Object.keys(sanitized).length ? sanitized : undefined;
};

const deriveInterviewDetailsFromRecord = (record = {}) =>
  sanitizeInterviewDetails(record.interviewDetails, {
    interviewDate: record.interviewDate,
    interviewTime: record.interviewTime,
    interviewMode: record.interviewMode || record.mode,
    interviewLocation: record.interviewLocation || record.locationText,
    googleMapLocation: record.googleMapLocation || record.googleMapsUrl,
    contactPerson: record.contactPerson,
    contactEmail: record.contactEmail,
    contactPhone: record.contactPhone,
    reportingNotes: record.reportingNotes,
    documentsRequired: record.documentsRequired,
    additionalInstructions: record.additionalInstructions,
  });

const deriveStatusNoteFromRecord = (record = {}) =>
  String(record.statusNote || record.candidateResponse || record.clientNote || record.note || record.notes || '').trim();

const normalizePublicJob = (job, overrides = {}) => {
  const sourceCollection = overrides.sourceCollection || (job.sourceCollection ? String(job.sourceCollection) : 'jobRequirements');
  const ownerId = overrides.ownerId || resolveJobOwnerId(job, sourceCollection);
  const ownerRole = resolveJobOwnerRole({ sourceCollection, ownerId, ownerRole: overrides.ownerRole });
  const isLegacy = Boolean(!ownerId && (job.title || job.location || job.type));
  const isActive = isActiveStatus(overrides.status ?? job.status ?? 'active');
  const isApplyable = overrides.canApply ?? (Boolean(ownerId) && isActive);

  return {
    _id: overrides._id || String(job._id),
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
    sourceCollection,
    sourceLabel: getSourceCollectionLabel(sourceCollection),
    ownerRole,
    canApply: isApplyable,
    applyDisabledReason: isApplyable
      ? undefined
      : !isActive
        ? 'This opening is not active right now, so new applications are paused.'
      : isLegacy
        ? 'This opening is visible from older data and cannot accept new applications yet.'
        : 'This opening is visible, but the employer account is not linked yet so applications are temporarily disabled.',
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
    JobRequirement.find({
      status: 'active',
      clientId: { $exists: true, $ne: null },
      sourceCollection: { $exists: false },
    }).sort({ createdAt: -1 }).lean(),
    JobRequirement.db.collection('jobs').find({}).sort({ createdAt: -1 }).toArray(),
    JobRequirement.db.collection('openings').find({}).sort({ createdAt: -1 }).toArray(),
  ]);

  const externalJobs = [
    ...jobsCollectionDocs.map((job) => ({ collectionName: 'jobs', job })),
    ...openingsCollectionDocs.map((job) => ({ collectionName: 'openings', job })),
  ]
    .filter(({ job }) => isActiveStatus(job.status));

  const normalizedJobs = [
    ...jobRequirements.map((job) =>
      normalizePublicJob(job, {
        _id: String(job._id),
        ownerId: resolveJobOwnerId(job, 'jobRequirements'),
        ownerRole: 'client',
        canApply: Boolean(resolveJobOwnerId(job, 'jobRequirements')) && isActiveStatus(job.status),
        status: job.status,
      }),
    ),
    ...externalJobs.map(({ collectionName, job }) =>
      normalizePublicJob(job, {
        _id: String(job._id),
        ownerId: resolveJobOwnerId(job, collectionName),
        ownerRole: collectionName === 'openings' ? 'admin' : 'client',
        canApply: Boolean(resolveJobOwnerId(job, collectionName)) && isActiveStatus(job.status),
        sourceCollection: collectionName,
        status: job.status,
      }),
    ),
  ]
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
  const jobs = await JobRequirement.find({
    clientId: req.user.id,
    sourceCollection: { $exists: false },
  }).sort({ createdAt: -1 });
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

  const primaryJob = await JobRequirement.findOne({ _id: jobId, status: 'active' })
    .select('_id clientId jobTitle jobLocation employmentType company')
    .lean();

  const externalMatch = primaryJob ? null : await findExternalJobById(jobId);
  const externalJob = externalMatch?.job || null;
  const sourceCollection = primaryJob ? 'jobRequirements' : externalMatch?.collectionName;
  const ownerId = primaryJob
    ? resolveJobOwnerId(primaryJob, 'jobRequirements')
    : resolveJobOwnerId(externalJob, sourceCollection);
  const ownerRole = primaryJob
    ? 'client'
    : resolveJobOwnerRole({ sourceCollection, ownerId, ownerRole: sourceCollection === 'openings' ? 'admin' : 'client' });

  if (!primaryJob && !externalJob) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found');
  }
  if (!ownerId) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This job cannot accept applications right now because the employer record is missing.',
    );
  }

  const duplicateQuery = primaryJob
    ? { candidateId: req.user.id, jobId }
    : { candidateId: req.user.id, sourceCollection, sourceJobId: String(jobId) };
  const exists = await Application.findOne(duplicateQuery);
  if (exists) {
    throw new ApiError(StatusCodes.CONFLICT, 'Already applied to this job');
  }

  const [candidateUser, candidateProfile] = await Promise.all([
    User.findById(req.user.id).select('email mobile').lean(),
    CandidateProfile.findOne({ userId: req.user.id }).lean(),
  ]);

  const resume = await ensureCandidateResume({ candidateUser, candidateProfile });

  const jobTitle = primaryJob?.jobTitle || externalJob?.jobTitle || externalJob?.title || 'Job Opening';
  const jobLocation = primaryJob?.jobLocation || externalJob?.jobLocation || externalJob?.location || '';
  const employmentType =
    primaryJob?.employmentType || externalJob?.employmentType || externalJob?.type || '';
  const companyName = primaryJob?.company || externalJob?.company || '';

  const application = await Application.create({
    candidateId: req.user.id,
    clientId: ownerId,
    ...(primaryJob ? { jobId } : {}),
    ...(!primaryJob
      ? {
          sourceCollection,
          sourceJobId: String(jobId),
          sourceJobSnapshot: {
            jobTitle,
            jobLocation,
            employmentType,
            companyName,
          },
        }
      : {}),
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
    appliedFor: jobTitle.trim() || undefined,
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
    userId: String(ownerId),
    role: ownerRole,
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
  res.json({ success: true, data: applications.map(normalizeApplicationResponse) });
});

export const listClientApplications = asyncHandler(async (req, res) => {
  const [applications, legacyApplications] = await Promise.all([
    Application.find(buildApplicationOwnerQuery(req.user))
      .populate('jobId')
      .populate({
        path: 'candidateId',
        select: 'email mobile',
      })
      .sort({ createdAt: -1 }),
    req.user.role === 'client' ? fetchLegacyApplicationsForClient(req.user.id) : Promise.resolve([]),
  ]);

  const data = [...applications, ...legacyApplications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  res.json({ success: true, data: data.map(normalizeApplicationResponse) });
});

export const getClientApplicationDetails = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid application id');
  }

  const application = await findOwnedApplication(applicationId, req.user)
    .populate('jobId')
    .populate({
      path: 'candidateId',
      select: 'email mobile',
    });

  if (!application) {
    if (req.user.role !== 'client') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }
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
      application: normalizeApplicationResponse(application),
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

  const application = await findOwnedApplication(applicationId, req.user)
    .select('candidateId')
    .lean();

  if (!application) {
    if (req.user.role !== 'client') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }
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

  const existingApplication = await findOwnedApplication(applicationId, req.user);
  if (!existingApplication) {
    if (req.user.role !== 'client') {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }
    const legacyApplication = await findLegacyApplicationForClient(req.user.id, applicationId);
    if (!legacyApplication) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
    }

    const responseNote =
      req.body.note || req.body.candidateResponse || req.body.clientNote || '';
    const interviewDetails = sanitizeInterviewDetails(req.body.interviewDetails, req.body);
    const currentTimeline = Array.isArray(legacyApplication.timeline) ? legacyApplication.timeline : [];
    const legacyStatusEntry = {
      status: req.body.status,
      note: responseNote || (req.body.status === 'interview' ? 'Interview scheduled by client.' : ''),
      changedByRole: 'client',
      changedAt: new Date(),
    };

    await Application.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(applicationId) },
      {
        $set: {
          status: req.body.status,
          statusNote: responseNote,
          notes: responseNote,
          statusUpdatedAt: new Date(),
          updatedAt: new Date(),
          ...(interviewDetails ? { interviewDetails } : {}),
          timeline: [...currentTimeline, legacyStatusEntry],
        },
      },
    );

    publishLiveUpdate({
      userId: req.user.id,
      role: req.user.role,
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
        statusNote: responseNote,
        statusUpdatedAt: new Date().toISOString(),
        interviewDetails: interviewDetails || legacyApplication.interviewDetails,
        timeline: [...currentTimeline, legacyStatusEntry],
      },
    });
    return;
  }

  const responseNote =
    req.body.note || req.body.candidateResponse || req.body.clientNote || '';
  const interviewDetails = sanitizeInterviewDetails(req.body.interviewDetails, req.body);
  if (req.body.status === 'interview' && !interviewDetails && !existingApplication.interviewDetails) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Interview schedule details are required before moving an application to interview.',
    );
  }

  existingApplication.status = req.body.status;
  existingApplication.statusNote = responseNote;
  existingApplication.statusUpdatedAt = new Date();

  if (interviewDetails) {
    existingApplication.interviewDetails = interviewDetails;
  }

  existingApplication.timeline = [
    ...(existingApplication.timeline || []),
    {
      status: req.body.status,
      note: responseNote || (req.body.status === 'interview' ? 'Interview scheduled by client.' : ''),
      changedByRole: 'client',
      changedAt: new Date(),
    },
  ];

  const application = await existingApplication.save();

  publishLiveUpdate({
    userId: req.user.id,
    role: req.user.role,
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
