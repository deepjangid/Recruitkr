import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

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
  generatePDF,
  generateResumeHTML,
  generateResumePdfBuffer,
  generateStructuredResumePdfBuffer,
  parseResumeToCandidateHints,
} from '../services/resume.service.js';

const getSafeResumeFileName = (fullName = 'Resume') =>
  `${String(fullName || 'Resume')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_') || 'Resume'}_RecruitKr.pdf`;

const getStoredUploadedResumeFileName = (resumeLike = {}) =>
  String(resumeLike.resumeFileName || '').trim() ||
  String(resumeLike.resumeUrl || '').split(/[\\/]/).pop() ||
  'candidate_resume.pdf';

const detectRemoteResumeMimeType = (url = '', contentType = '') => {
  const normalizedType = String(contentType || '').split(';')[0].trim().toLowerCase();
  if (normalizedType === 'application/pdf') return normalizedType;
  if (
    normalizedType ===
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return normalizedType;
  }

  const lowerUrl = String(url || '').toLowerCase();
  if (lowerUrl.endsWith('.pdf')) return 'application/pdf';
  if (lowerUrl.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return '';
};

export const parseResume = asyncHandler(async (req, res) => {
  const resumeUrl = String(req.body?.resumeUrl || '').trim();
  if (!resumeUrl) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Resume URL is required');
  }

  const remoteResponse = await fetch(resumeUrl);
  if (!remoteResponse.ok) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Unable to download resume from the uploaded URL');
  }

  const mimeType = detectRemoteResumeMimeType(
    resumeUrl,
    remoteResponse.headers.get('content-type') || '',
  );
  if (!mimeType) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Only PDF and DOCX resumes are supported');
  }

  const arrayBuffer = await remoteResponse.arrayBuffer();
  const text = await extractResumeText({
    mimeType,
    buffer: Buffer.from(arrayBuffer),
  });
  const hints = await parseResumeToCandidateHints(text);

  res.json({
    success: true,
    data: {
      parsed: hints,
      file: {
        fileName: resumeUrl.split('/').pop() || 'resume',
        mimeType,
      },
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
    .select('_id candidateUserId resumeType resumeUrl resumeFileId resumeFileName updatedAt')
    .lean();

  const resumesByCandidateId = new Map(resumes.map((resume) => [String(resume.candidateUserId), resume]));

  const currentResumeItems = applications
    .map((application) => {
      const candidateUserId = String(application.candidateId?._id || application.candidateId || '');
      const storedResume = candidateUserId ? resumesByCandidateId.get(candidateUserId) : null;
      const fallbackResume = application.resumePath
        ? {
            _id: String(application._id),
            resumeType: application.hasCustomResume ? 'uploaded' : 'generated',
            resumeUrl: application.hasCustomResume ? application.resumePath : '',
            updatedAt: application.updatedAt || application.createdAt,
          }
        : null;
      const resumeMeta = storedResume || fallbackResume;

      if (!resumeMeta) return null;

      return {
        _id: String(resumeMeta._id || application._id),
        resumeId: storedResume?._id ? String(storedResume._id) : '',
        applicationId: String(application._id),
        candidateName: application.fullName || 'Candidate',
        candidateEmail: application.candidateId?.email || application.email || '',
        jobTitle: application.jobId?.jobTitle || 'Job',
        fileName:
          resumeMeta.resumeType === 'uploaded'
            ? getStoredUploadedResumeFileName(resumeMeta)
            : getSafeResumeFileName(application.fullName || 'Resume'),
        mimeType: 'application/pdf',
        source: resumeMeta.resumeType || 'generated',
        resumeUrl: resumeMeta.resumeType === 'uploaded' ? resumeMeta.resumeUrl || '' : '',
        resumeFileId: resumeMeta.resumeType === 'uploaded' ? resumeMeta.resumeFileId || '' : '',
        updatedAt: resumeMeta.updatedAt || application.updatedAt || application.createdAt,
        isLegacy: false,
      };
    })
    .filter(Boolean);

  const legacyApplications =
    req.user.role === 'client' ? await fetchLegacyApplicationsForClient(req.user.id) : [];
  const legacyResumeItems = legacyApplications
    .filter((application) => application.resume)
    .map((application) => ({
      _id: String(application._id),
      resumeId: '',
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
  const resume = await Resume.findOne({ candidateUserId: req.user.id }).lean().exec();

  if (!resume) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Resume not found');
  }

  res.json({
    success: true,
    data: {
      resumeType: resume.resumeType,
      resumeId: String(resume._id),
      resumeUrl: resume.resumeType === 'uploaded' ? resume.resumeUrl : '',
      resumeFileId: resume.resumeType === 'uploaded' ? resume.resumeFileId || '' : '',
      fileName:
        resume.resumeType === 'uploaded'
          ? getStoredUploadedResumeFileName(resume)
          : getSafeResumeFileName('Resume'),
    },
  });
});

export const downloadResumeById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid resume id');
  }

  const resume = await Resume.findById(id).lean().exec();
  if (!resume) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Resume not found');
  }

  if (req.user.role === 'candidate' && String(resume.candidateUserId) !== String(req.user.id)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to this resume');
  }

  if (req.user.role === 'client') {
    const clientOwnsCandidate = await Application.exists({
      clientId: req.user.id,
      candidateId: resume.candidateUserId,
    });

    if (!clientOwnsCandidate) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'You do not have access to this resume');
    }
  }

  if (resume.resumeType === 'uploaded') {
    if (!resume.resumeUrl) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Resume URL not found');
    }

    return res.redirect(resume.resumeUrl);
  }

  const html = generateResumeHTML(resume.resumeData || {});
  const pdf = await generatePDF(html);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': 'attachment; filename=resume.pdf',
  });

  return res.send(pdf);
});

export const downloadMyGeneratedResume = asyncHandler(async (req, res) => {
  const [user, profile, certificateFiles, resumeRecord] = await Promise.all([
    User.findById(req.user.id).select('_id email mobile').exec(),
    CandidateProfile.findOne({ userId: req.user.id }).exec(),
    CandidateFile.find({ candidateUserId: req.user.id, kind: 'certificate' })
      .select('title fileName createdAt')
      .sort({ createdAt: -1 })
      .exec(),
    Resume.findOne({ candidateUserId: req.user.id }).exec(),
  ]);

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }
  if (!resumeRecord) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Resume not found');
  }
  if (resumeRecord.resumeType === 'uploaded') {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This candidate uses an uploaded resume. Open the stored resume URL instead.');
  }

  const uploadedCertifications = (certificateFiles || [])
    .map((file) => ({
      name: file.title?.trim() || file.fileName?.trim() || 'Certificate',
      institute: '',
    }))
    .filter((item) => item.name || item.institute);

  const fallbackResumeBuffer = await generateResumePdfBuffer({
    ...profile.toObject(),
    email: user.email,
    mobile: user.mobile,
    certifications: uploadedCertifications,
  });

  const pdfBuffer = resumeRecord.resumeData?.name
    ? await generateStructuredResumePdfBuffer(resumeRecord.resumeData)
    : fallbackResumeBuffer;

  const fileName = getSafeResumeFileName(profile.fullName);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  res.send(pdfBuffer);
});

