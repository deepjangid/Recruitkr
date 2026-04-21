import { StatusCodes } from 'http-status-codes';
import crypto from 'node:crypto';

import { env } from '../config/env.js';
import { CandidateProfile } from '../models/CandidateProfile.js';
import { ClientProfile } from '../models/ClientProfile.js';
import { Resume } from '../models/Resume.js';
import { User } from '../models/User.js';
import { sendPasswordResetEmail } from '../services/mail.service.js';
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

const parseDurationToMs = (input) => {
  const match = /^(\d+)([smhd])$/.exec(input);
  if (!match) return 30 * 24 * 60 * 60 * 1000;

  const value = Number(match[1]);
  const unit = match[2];
  const factor = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
  return value * factor;
};

const getRefreshCookieOptions = () => {
  const isProduction = env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth/refresh',
  };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie('refreshToken', refreshToken, {
    ...getRefreshCookieOptions(),
    maxAge: parseDurationToMs(env.JWT_REFRESH_EXPIRES),
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', getRefreshCookieOptions());
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

const buildResetPasswordUrl = (token) => {
  const base = env.FRONTEND_URL.replace(/\/$/, '');
  return `${base}/reset-password?token=${encodeURIComponent(token)}`;
};

const syncCandidateLegacyFields = ({ profile, user, resumeFileName = '' }) => {
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
  profile.resumePath = resumeFileName ? `resumes/${resumeFileName}` : profile.resumePath || '';
  profile.workModes = workModes;
};

const syncClientLegacyFields = ({ profile, user }) => {
  const companyName = profile.companyName || '';
  const spocName = profile.spoc?.name || '';
  const spocMobile = profile.spoc?.mobile || user?.mobile || '';
  const spocEmail = profile.spoc?.email || user?.email || '';
  const city = profile.billing?.billingAddress?.split(/\r?\n/)[0] || '';

  profile.city = city;
  profile.company = companyName;
  profile.contactName = spocName;
  profile.description = profile.description || '';
  profile.email = user?.email || profile.email || '';
  profile.location = city;
  profile.mobile = spocMobile;
  profile.name = spocName;
  profile.phone = spocMobile;
  profile.requirements = profile.requirements || '';
  profile.website = profile.companyWebsite || '';
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
    passwordChangedAt: new Date(),
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
    about: payload.summary || '',
    city: payload.preferences?.preferredLocation || '',
    currentCity: payload.preferences?.preferredLocation || '',
    email: payload.email,
    isActive: true,
    mobile: payload.mobile,
    name: payload.fullName,
    phone: payload.mobile,
    preferredIndustry: payload.preferences?.preferredIndustry || '',
    preferredLocation: payload.preferences?.preferredLocation || '',
    preferredRole: payload.preferences?.preferredRole || '',
    workModes: payload.preferences?.workModes || [],
    declarationAccepted: payload.declarationAccepted,
    representationAuthorized: payload.representationAuthorized,
  });

  let generatedResumePayload = null;
  let storedResumeFileName = '';
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
    storedResumeFileName = payload.resume.fileName;
  } else {
    const generatedBuffer = await generateResumePdfBuffer({
      fullName: payload.fullName,
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
      pincode: payload.pincode,
      dateOfBirth: payload.dateOfBirth,
      gender: payload.gender,
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
    storedResumeFileName = generatedFileName;

    generatedResumePayload = {
      fileName: generatedFileName,
      mimeType: 'application/pdf',
      dataBase64: generatedBuffer.toString('base64'),
    };
  }

  syncCandidateLegacyFields({ profile: candidateProfile, user, resumeFileName: storedResumeFileName });
  await candidateProfile.save();

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
    passwordChangedAt: new Date(),
  });

  const clientProfile = await ClientProfile.create({
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

  syncClientLegacyFields({ profile: clientProfile, user });
  await clientProfile.save();

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
    .select('+passwordHash +refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
    .exec();

  if (!user || user.role !== role) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

  const passwordOk = await verifyPassword(user.passwordHash, password);
  if (!passwordOk) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid credentials');
  }

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

  clearRefreshCookie(res);
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

  clearRefreshCookie(res);
  res.json({ success: true, message: 'Password updated. Please log in again.' });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  let resetUrl;
  let emailDelivery = 'sent';

  const user = await User.findOne({ email })
    .select('+resetPasswordTokenHash +resetPasswordExpiresAt')
    .exec();

  if (user) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordTokenHash = hashToken(rawToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + env.PASSWORD_RESET_EXPIRES_MIN * 60 * 1000);
    await user.save();

    resetUrl = buildResetPasswordUrl(rawToken);

    try {
      await sendPasswordResetEmail({ to: email, resetUrl });
    } catch (error) {
      emailDelivery = 'manual';
      if (env.NODE_ENV !== 'production') {
        console.warn('Password reset email could not be sent. Use this reset URL manually:', resetUrl);
      } else {
        console.error('Password reset email failed:', error?.message || error);
      }
    }
  }

  // Always return success to prevent account enumeration.
  res.json({
    success: true,
    message: 'If an account exists for this email, a password reset link has been sent.',
    ...(emailDelivery === 'manual' && resetUrl ? { resetUrl, delivery: emailDelivery } : {}),
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const tokenHash = hashToken(token);

  const user = await User.findOne({
    resetPasswordTokenHash: tokenHash,
    resetPasswordExpiresAt: { $gt: new Date() },
  })
    .select('+passwordHash +resetPasswordTokenHash +resetPasswordExpiresAt +refreshTokenHash +refreshTokenJti +refreshTokenExpiresAt')
    .exec();

  if (!user) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid or expired reset token');
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordChangedAt = new Date();
  user.resetPasswordTokenHash = undefined;
  user.resetPasswordExpiresAt = undefined;
  user.refreshTokenHash = undefined;
  user.refreshTokenJti = undefined;
  user.refreshTokenExpiresAt = undefined;
  await user.save();

  clearRefreshCookie(res);
  res.json({ success: true, message: 'Password reset successful. Please log in again.' });
});
