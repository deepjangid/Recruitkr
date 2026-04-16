import { StatusCodes } from 'http-status-codes';

import { Application } from '../models/Application.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { CandidateFile } from '../models/CandidateFile.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { fetchLegacyApplicationsForClient } from './job.controller.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractResumeText,
  generateResumePdfBuffer,
  parseResumeToCandidateHints,
} from '../services/resume.service.js';

export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Resume file is required');
  }

  const text = await extractResumeText({
    mimeType: req.file.mimetype,
    buffer: req.file.buffer,
  });
  const hints = await parseResumeToCandidateHints(text);

  res.json({
    success: true,
    data: {
      parsed: hints,
      file: { fileName: req.file.originalname, mimeType: req.file.mimetype },
    },
  });
});

export const listClientResumes = asyncHandler(async (req, res) => {
  const applications = await Application.find({ clientId: req.user.id })
    .select('candidateId jobId fullName email resumePath hasCustomResume createdAt updatedAt')
    .populate('jobId', 'jobTitle')
    .populate({ path: 'candidateId', select: 'email' })
    .sort({ createdAt: -1 })
    .lean();

  const candidateUserIds = [...new Set(applications.map((application) => String(application.candidateId?._id || application.candidateId || '')).filter(Boolean))];
  const resumes = await Resume.find({ candidateUserId: { $in: candidateUserIds } })
    .select('_id candidateUserId fileName mimeType source updatedAt')
    .lean();

  const resumesByCandidateId = new Map(resumes.map((resume) => [String(resume.candidateUserId), resume]));

  const currentResumeItems = applications
    .map((application) => {
      const candidateUserId = String(application.candidateId?._id || application.candidateId || '');
      const storedResume = candidateUserId ? resumesByCandidateId.get(candidateUserId) : null;
      const fallbackResume = application.resumePath
        ? {
            _id: String(application._id),
            fileName: String(application.resumePath).split(/[\\/]/).pop() || 'candidate_resume.pdf',
            mimeType: 'application/pdf',
            source: application.hasCustomResume ? 'uploaded' : 'generated',
            updatedAt: application.updatedAt || application.createdAt,
          }
        : null;
      const resumeMeta = storedResume || fallbackResume;

      if (!resumeMeta) return null;

      return {
        _id: String(application._id),
        applicationId: String(application._id),
        candidateName: application.fullName || 'Candidate',
        candidateEmail: application.candidateId?.email || application.email || '',
        jobTitle: application.jobId?.jobTitle || 'Job',
        fileName: resumeMeta.fileName || 'candidate_resume.pdf',
        mimeType: resumeMeta.mimeType || 'application/pdf',
        source: resumeMeta.source || 'generated',
        updatedAt: resumeMeta.updatedAt || application.updatedAt || application.createdAt,
        isLegacy: false,
      };
    })
    .filter(Boolean);

  const legacyApplications = await fetchLegacyApplicationsForClient(req.user.id);
  const legacyResumeItems = legacyApplications
    .filter((application) => application.resume)
    .map((application) => ({
      _id: String(application._id),
      applicationId: String(application._id),
      candidateName: application.candidateProfile?.fullName || 'Candidate',
      candidateEmail: application.candidateId?.email || '',
      jobTitle: application.jobId?.jobTitle || 'Job',
      fileName: application.resume?.fileName || 'candidate_resume.pdf',
      mimeType: application.resume?.mimeType || 'application/pdf',
      source: application.resume?.source || 'generated',
      updatedAt: application.resume?.updatedAt || application.createdAt,
      isLegacy: true,
    }));

  const data = [...currentResumeItems, ...legacyResumeItems].sort(
    (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
  );

  res.json({ success: true, data });
});

export const getMyResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ candidateUserId: req.user.id }).select('+data').exec();

  if (!resume) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Resume not found');
  }

  res.setHeader('Content-Type', resume.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
  res.send(resume.data);
});

export const downloadMyGeneratedResume = asyncHandler(async (req, res) => {
  const [user, profile, certificateFiles] = await Promise.all([
    User.findById(req.user.id).select('_id email mobile').exec(),
    CandidateProfile.findOne({ userId: req.user.id }).exec(),
    CandidateFile.find({ candidateUserId: req.user.id, kind: 'certificate' })
      .select('title fileName createdAt')
      .sort({ createdAt: -1 })
      .exec(),
  ]);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }

  const photo = await CandidateFile.findOne({
    candidateUserId: req.user.id,
    kind: 'profile_photo',
  })
    .select('+data mimeType')
    .exec();

  const profilePhotoDataUrl =
    photo?.data && photo?.mimeType ? `data:${photo.mimeType};base64,${photo.data.toString('base64')}` : '';

  const uploadedCertifications = (certificateFiles || []).map((file) => ({
    name: file.title?.trim() || file.fileName?.trim() || 'Certificate',
    institute: '',
  }));

  const mergedCertifications = [
    ...(((profile.certifications || []).map((item) => ({
      name: item?.name?.trim() || '',
      institute: item?.institute?.trim() || '',
    })))),
    ...uploadedCertifications,
  ].filter((item) => item.name || item.institute);

  const uniqueCertifications = mergedCertifications.filter((item, index, array) => {
    const key = `${item.name.toLowerCase()}|${item.institute.toLowerCase()}`;
    return array.findIndex((candidate) => `${candidate.name.toLowerCase()}|${candidate.institute.toLowerCase()}` === key) === index;
  });

  const pdfBuffer = await generateResumePdfBuffer({
    ...profile.toObject(),
    email: user.email,
    mobile: user.mobile,
    profilePhotoDataUrl,
    certifications: uniqueCertifications,
  });

  const safeName = String(profile.fullName || 'Resume').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_');
  const fileName = `${safeName || 'Resume'}_RecruitKr.pdf`;

  await Resume.findOneAndUpdate(
    { candidateUserId: req.user.id },
    {
      candidateUserId: req.user.id,
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

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(pdfBuffer);
});

