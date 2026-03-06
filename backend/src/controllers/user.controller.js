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

export const getClientProfile = asyncHandler(async (req, res) => {
  const profile = await ClientProfile.findOne({ userId: req.user.id });
  if (!profile) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Client profile not found');
  }
  res.json({ success: true, data: profile });
});

