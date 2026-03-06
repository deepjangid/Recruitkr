import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { generateResumePdfBuffer, extractResumeText } from '../services/resume.service.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  generateJti,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/security.js';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const parseDurationToMs = (input) => {
  const match = /^(\d+)([smhd])$/.exec(input);
  if (!match) return 30 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return value * factor;
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth/refresh',
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES),
  });
};

const issueTokensAndPersistRefresh = async (user) => {
  const jti = generateJti();
  const accessToken = signAccessToken({ userId: user.id, role: user.role });
  const refreshToken = signRefreshToken({ userId: user.id, role: user.role, jti });

  user.refreshTokenHash = hashToken(refreshToken);
  user.refreshTokenJti = jti;
  user.refreshTokenExpiresAt = new Date(
    Date.now() + parseDurationToMs(env.JWT_REFRESH_EXPIRES),
  );
  await user.save();

  return { accessToken, refreshToken };
};

export const registerCandidate = asyncHandler(async (req, res) => {
  const payload = req.body;

  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
  }

  const passwordHash = await hashPassword(payload.password);

  const user = await User.create({
    role: 'candidate',
    email: payload.email,
    mobile: payload.mobile,
    passwordHash,
  });

  const candidateProfile = await CandidateProfile.create({
    userId: user.id,
    fullName: payload.fullName,
    dateOfBirth: payload.dateOfBirth,
    gender: payload.gender,
    address: payload.address,
    pincode: payload.pincode,
    linkedinUrl: payload.linkedinUrl,
    portfolioUrl: payload.portfolioUrl,
    highestQualification: payload.highestQualification,
    experienceStatus: payload.experienceStatus,
    experienceDetails: payload.experienceDetails,
    preferences: payload.preferences,
    declarationAccepted: payload.declarationAccepted,
    representationAuthorized: payload.representationAuthorized,
  });

  let generatedResumePayload = null;
  if (payload.resume?.dataBase64) {
    const resumeBuffer = Buffer.from(payload.resume.dataBase64, 'base64');
    const resumeText = await extractResumeText({
      mimeType: payload.resume.mimeType,
      buffer: resumeBuffer,
    });

    await Resume.create({
      candidateUserId: user.id,
      fileName: payload.resume.fileName,
      mimeType: payload.resume.mimeType,
      source: 'uploaded',
      textExtract: resumeText,
      data: resumeBuffer,
    });
  } else {
    const generatedBuffer = await generateResumePdfBuffer({
      fullName: payload.fullName,
      email: payload.email,
      mobile: payload.mobile,
      highestQualification: payload.highestQualification,
      linkedinUrl: payload.linkedinUrl,
      portfolioUrl: payload.portfolioUrl,
      experienceStatus: payload.experienceStatus,
      experienceDetails: payload.experienceDetails,
      preferences: payload.preferences,
    });

    const generatedFileName = `${payload.fullName.replace(/\s+/g, '_')}_Resume.pdf`;
    await Resume.create({
      candidateUserId: user.id,
      fileName: generatedFileName,
      mimeType: 'application/pdf',
      source: 'generated',
      textExtract: '',
      data: generatedBuffer,
    });

    generatedResumePayload = {
      fileName: generatedFileName,
      mimeType: 'application/pdf',
      dataBase64: generatedBuffer.toString('base64'),
    };
  }

  const tokens = await issueTokensAndPersistRefresh(user);
  setRefreshCookie(res, tokens.refreshToken);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Candidate registered successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
      profileId: candidateProfile.id,
      generatedResume: generatedResumePayload,
    },
  });
});

export const registerClient = asyncHandler(async (req, res) => {
  const payload = req.body;

  const existing = await User.findOne({ email: payload.email });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Email already registered');
  }

  const passwordHash = await hashPassword(payload.password);
  const user = await User.create({
    role: 'client',
    email: payload.email,
    mobile: payload.mobile,
    passwordHash,
  });

  await ClientProfile.create({
    userId: user.id,
    companyName: payload.companyName,
    industry: payload.industry,
    companyWebsite: payload.companyWebsite,
    companySize: payload.companySize,
    companyType: payload.companyType,
    spoc: payload.spoc,
    commercial: payload.commercial,
    billing: payload.billing,
    declarationAccepted: payload.declarationAccepted,
  });

  const tokens = await issueTokensAndPersistRefresh(user);
  setRefreshCookie(res, tokens.refreshToken);

  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Client registered successfully',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const user = await User.findOne({ email })
    .select('+passwordHash +loginAttempts +lockUntil +refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
    .exec();

  if (!user || user.role !== role) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  if (user.lockUntil && user.lockUntil.getTime() > Date.now()) {
    throw new ApiError(StatusCodes.TOO_MANY_REQUESTS, 'Account temporarily locked');
  }

  const passwordOk = await verifyPassword(user.passwordHash, password);
  if (!passwordOk) {
    user.loginAttempts += 1;
    if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
      user.loginAttempts = 0;
    }
    await user.save();
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  user.loginAttempts = 0;
  user.lockUntil = undefined;

  const tokens = await issueTokensAndPersistRefresh(user);
  setRefreshCookie(res, tokens.refreshToken);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: { id: user.id, email: user.email, role: user.role },
    },
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const suppliedToken = req.body.refreshToken || req.cookies?.refreshToken;
  if (!suppliedToken) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Missing refresh token');
  }

  const payload = verifyRefreshToken(suppliedToken);
  const user = await User.findById(payload.sub)
    .select('+refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
    .exec();

  if (!user || !user.refreshTokenHash || !user.refreshTokenJti) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  if (payload.jti !== user.refreshTokenJti) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token rotation detected');
  }

  if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired');
  }

  if (hashToken(suppliedToken) !== user.refreshTokenHash) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  const tokens = await issueTokensAndPersistRefresh(user);
  setRefreshCookie(res, tokens.refreshToken);

  res.json({
    success: true,
    data: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const suppliedToken = req.body?.refreshToken || req.cookies?.refreshToken;
  if (suppliedToken) {
    try {
      const payload = verifyRefreshToken(suppliedToken);
      const user = await User.findById(payload.sub)
        .select('+refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
        .exec();
      if (user) {
        user.refreshTokenHash = undefined;
        user.refreshTokenJti = undefined;
        user.refreshTokenExpiresAt = undefined;
        await user.save();
      }
    } catch (_error) {
      // Always return success for logout to avoid token state probing.
    }
  }

  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  res.json({ success: true, message: 'Logged out' });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id).select('+passwordHash').exec();

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
  }

  const ok = await verifyPassword(user.passwordHash, currentPassword);
  if (!ok) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Current password is incorrect');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.refreshTokenHash = undefined;
  user.refreshTokenJti = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  res.json({ success: true, message: 'Password updated. Please log in again.' });
});
