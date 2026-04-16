import { StatusCodes } from 'http-status-codes';

import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

const resolveAccessToken = (req) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice(7);
  }

  if (typeof req.query?.token === 'string' && req.query.token.trim()) {
    return req.query.token.trim();
  }

  if (typeof req.query?.accessToken === 'string' && req.query.accessToken.trim()) {
    return req.query.accessToken.trim();
  }

  return null;
};

const authenticateRequest = async (req) => {
  const token = resolveAccessToken(req);

  if (!token) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Missing bearer token');
  }

  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).select('_id role passwordChangedAt');

  if (!user) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid token subject');
  }

  if (
    user.passwordChangedAt &&
    payload.iat &&
    payload.iat * 1000 < new Date(user.passwordChangedAt).getTime() - 1000
  ) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token expired due to password change');
  }

  req.user = { id: user.id, role: user.role };
};

export const requireAuth = async (req, _res, next) => {
  try {
    await authenticateRequest(req);
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

export const requireStreamAuth = async (req, _res, next) => {
  try {
    await authenticateRequest(req);
    next();
  } catch (error) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired token'));
  }
};

export const requireRole = (...allowedRoles) => (req, _res, next) => {
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return next(new ApiError(StatusCodes.FORBIDDEN, 'Forbidden'));
  }
  return next();
};

