import { StatusCodes } from 'http-status-codes';

import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select('_id email role mobile createdAt');
  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }
  res.json({ success: true, data: user });
});

export const getCandidateProfile = asyncHandler(async (req, res) => {
  const profile = await CandidateProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }
  res.json({ success: true, data: profile });
});

export const updateCandidateProfile = asyncHandler(async (req, res) => {
  const body = req.body;

  const profile = await CandidateProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Candidate profile not found');
  }

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

