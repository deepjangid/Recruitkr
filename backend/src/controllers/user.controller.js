import { StatusCodes } from 'http-status-codes';

import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { buildGeneratedResumeData } from '../services/resume.service.js';
import { deleteImageKitFile } from '../services/imagekit.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const DEFAULT_LEGACY_DATE_OF_BIRTH = new Date('2000-01-01T00:00:00.000Z');

const syncCandidateLegacyFields = ({ profile, user, resumeLocation = '' }) => {
  const summary = profile.summary || '';
  const preferredLocation = profile.preferences?.preferredLocation || '';
  const preferredIndustry = profile.preferences?.preferredIndustry || '';
  const preferredRole = profile.preferences?.preferredRole || '';
  const workModes = profile.preferences?.workModes || [];

  profile.about = summary;
  profile.city = preferredLocation;
  profile.currentCity = preferredLocation;
  profile.email = user?.email || profile.email || '';
  profile.isActive = true;
  profile.mobile = user?.mobile || profile.mobile || '';
  profile.name = profile.fullName || '';
  profile.phone = user?.mobile || profile.phone || '';
  profile.preferredIndustry = preferredIndustry;
  profile.preferredLocation = preferredLocation;
  profile.preferredRole = preferredRole;
  if (resumeLocation) {
    profile.resumePath = resumeLocation;
  }
  profile.workModes = workModes;
};

const ensureCandidateProfile = async ({ reqUserId, user, body = {} }) => {
  const existingProfile = await CandidateProfile.findOne({ userId: reqUserId });
  if (existingProfile) return existingProfile;

  const preferences = body.preferences || {};

  const profile = await CandidateProfile.create({
    userId: reqUserId,
    fullName: body.fullName || user?.email?.split('@')[0] || 'Candidate',
    dateOfBirth: body.dateOfBirth || DEFAULT_LEGACY_DATE_OF_BIRTH,
    gender: body.gender || 'Prefer Not to Say',
    address: body.address || 'Not provided',
    pincode: body.pincode || '000000',
    linkedinUrl: body.linkedinUrl || '',
    portfolioUrl: body.portfolioUrl || '',
    highestQualification: body.highestQualification || 'Not specified',
    experienceStatus: body.experienceStatus || 'fresher',
    experienceDetails: body.experienceDetails,
    preferences: {
      preferredLocation: preferences.preferredLocation || 'Not specified',
      preferredIndustry: preferences.preferredIndustry || 'Not specified',
      preferredRole: preferences.preferredRole || 'Not specified',
      workModes: preferences.workModes || [],
    },
    summary: body.summary || '',
    skills: Array.isArray(body.skills) ? body.skills : [],
    projects: Array.isArray(body.projects) ? body.projects : [],
    certifications: Array.isArray(body.certifications) ? body.certifications : [],
    referral: body.referral || '',
    email: user?.email || '',
    mobile: user?.mobile || '',
    name: body.fullName || user?.email?.split('@')[0] || 'Candidate',
    phone: user?.mobile || '',
    declarationAccepted: true,
    representationAuthorized: true,
  });

  syncCandidateLegacyFields({ profile, user, resumeLocation: '' });
  await profile.save();
  return profile;
};

const upsertCandidateResume = async ({ profile, user, body }) => {
  const existingResume = await Resume.findOne({ candidateUserId: user._id });
  const hasExplicitResumePayload =
    body.resumeType !== undefined ||
    body.resumeUrl !== undefined ||
    body.resumeFileId !== undefined ||
    body.resumeData !== undefined;

  if (!hasExplicitResumePayload && existingResume?.resumeType === 'uploaded') {
    return {
      resumeLocation: existingResume.resumeUrl || '',
      resumeFileId: existingResume.resumeFileId || '',
    };
  }

  if (body.resumeType === 'uploaded') {
    const isReplacingUploadedResume =
      existingResume?.resumeType === 'uploaded' &&
      existingResume.resumeFileId &&
      existingResume.resumeFileId !== body.resumeFileId;
    if (isReplacingUploadedResume) {
      try {
        await deleteImageKitFile(existingResume.resumeFileId);
      } catch (error) {
        console.error('[resume] failed to delete previous uploaded resume', error);
      }
    }

    const savedResume = await Resume.findOneAndUpdate(
      { candidateUserId: user._id },
      {
        candidateUserId: user._id,
        resumeType: 'uploaded',
        resumeUrl: body.resumeUrl,
        resumeFileId: body.resumeFileId,
        resumeFileName: body.resumeFileName || '',
        resumeData: undefined,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      },
    );

      return {
        resumeLocation: savedResume?.resumeUrl || '',
        resumeFileId: savedResume?.resumeFileId || '',
        resumeFileName: savedResume?.resumeFileName || '',
      };
  }

  if (existingResume?.resumeType === 'uploaded' && existingResume.resumeFileId) {
    try {
      await deleteImageKitFile(existingResume.resumeFileId);
    } catch (error) {
      console.error('[resume] failed to delete previous uploaded resume', error);
    }
  }

  const explicitResumeData = body.resumeType === 'generated' ? body.resumeData : null;

  const resumeData = buildGeneratedResumeData({
    ...(explicitResumeData ? { resumeData: explicitResumeData } : profile.toObject()),
    name: explicitResumeData?.name || profile.fullName,
    fullName: profile.fullName,
    email: user.email,
    mobile: user.mobile,
  });

  const savedResume = await Resume.findOneAndUpdate(
    { candidateUserId: user._id },
      {
        candidateUserId: user._id,
        resumeType: 'generated',
        resumeUrl: '',
        resumeFileId: '',
        resumeFileName: '',
        resumeData,
      },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
      runValidators: true,
    },
  );

  return { resumeLocation: 'generated', resumeFileId: '', resumeFileName: '' };
};

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('_id email role mobile createdAt');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  res.json({ success: true, data: user });
});

export const getCandidateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('email mobile');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  const profile = await ensureCandidateProfile({ reqUserId: req.user.id, user, body: {} });
  res.json({ success: true, data: profile });
});

export const updateCandidateProfile = asyncHandler(async (req, res) => {
  const body = req.body;

  const user = await User.findById(req.user.id).select('email mobile');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  const profile = await ensureCandidateProfile({ reqUserId: req.user.id, user, body });

  const assignIfDefined = (key, value) => {
    if (value === undefined) return;
    profile[key] = value;
  };

  assignIfDefined('fullName', body.fullName);
  assignIfDefined('dateOfBirth', body.dateOfBirth);
  assignIfDefined('gender', body.gender);
  assignIfDefined('address', body.address);
  assignIfDefined('pincode', body.pincode);
  assignIfDefined('linkedinUrl', body.linkedinUrl);
  assignIfDefined('portfolioUrl', body.portfolioUrl);
  assignIfDefined('highestQualification', body.highestQualification);

  if (body.experienceStatus !== undefined) {
    profile.experienceStatus = body.experienceStatus;
    if (body.experienceStatus === 'fresher') {
      profile.experienceDetails = undefined;
    }
  }

  if (body.experienceDetails !== undefined) {
    profile.experienceDetails = {
      ...(profile.experienceDetails?.toObject ? profile.experienceDetails.toObject() : profile.experienceDetails),
      ...body.experienceDetails,
    };
  }

  if (body.preferences !== undefined) {
    profile.preferences = {
      ...(profile.preferences?.toObject ? profile.preferences.toObject() : profile.preferences),
      ...body.preferences,
    };
  }

  assignIfDefined('summary', body.summary);
  if (body.skills !== undefined) profile.skills = body.skills;
  if (body.projects !== undefined) profile.projects = body.projects;
  if (body.certifications !== undefined) profile.certifications = body.certifications;
  assignIfDefined('referral', body.referral);
  if (body.profilePhotoUrl !== undefined) {
    const nextFileId = String(body.profilePhotoFileId || '').trim();
    const previousFileId = String(profile.profilePhotoFileId || '').trim();
    if (previousFileId && previousFileId !== nextFileId) {
      try {
        await deleteImageKitFile(previousFileId);
      } catch (error) {
        console.error('[profile-photo] failed to delete previous candidate profile photo', error);
      }
    }

    profile.profilePhotoUrl = body.profilePhotoUrl || '';
    profile.profilePhotoFileId = nextFileId;
  }

  const { resumeLocation } = await upsertCandidateResume({ profile, user, body });
  syncCandidateLegacyFields({ profile, user, resumeLocation });

  await profile.save();

  res.json({ success: true, data: profile });
});

export const getClientProfile = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }
  res.json({ success: true, data: profile });
});

export const uploadClientProfileImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Profile image file is required');
  }

  const profile = await ClientProfile.findOne({ userId: req.user.id }).select('+profileImage.data');
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  profile.profileImage = {
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    data: req.file.buffer,
  };

  await profile.save();

  res.json({ success: true, message: 'Profile image uploaded' });
});

export const getClientProfileImage = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ userId: req.user.id }).select('+profileImage.data');
  if (!profile?.profileImage?.data || !profile.profileImage?.mimeType) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Profile image not found');
  }

  res.setHeader('Content-Type', profile.profileImage.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${profile.profileImage.fileName || 'profile-image'}"`);
  res.send(profile.profileImage.data);
});

export const deleteClientProfileImage = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ userId: req.user.id }).select('+profileImage.data');
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }

  profile.profileImage = {
    fileName: '',
    mimeType: '',
    size: 0,
    data: undefined,
  };

  await profile.save();

  res.json({ success: true, message: 'Profile image removed' });
});

