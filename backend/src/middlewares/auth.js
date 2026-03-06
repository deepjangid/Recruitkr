import { StatusCodes } from 'http-status-codes';

import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export const requireAuth = async (req, _res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;

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
      payload.iat * 1000 < new Date(user.passwordChangedAt).getTime()
    ) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Token expired due to password change');
    }

    req.user = { id: user.id, role: user.role };
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

