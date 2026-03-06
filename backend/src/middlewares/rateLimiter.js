import rateLimit from 'express-rate-limit';

import { env } from '../config/env.js';

const buildLimiter = ({ max, windowMs, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    message: { success: false, message },
  });

export const globalLimiter = buildLimiter({
  max: env.RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  message: 'Too many requests. Please retry later.',
});

export const authLimiter = buildLimiter({
  max: env.AUTH_RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts. Try again later.',
});

export const contactLimiter = buildLimiter({
  max: env.CONTACT_RATE_LIMIT_MAX,
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  message: 'Too many contact requests. Try again later.',
});

