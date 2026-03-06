import crypto from 'node:crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

export const signAccessToken = ({ userId, role }) =>
  jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES,
  });

export const signRefreshToken = ({ userId, role, jti }) =>
  jwt.sign({ sub: userId, role, jti }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES,
  });

export const verifyAccessToken = (token) => jwt.verify(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) => jwt.verify(token, env.JWT_REFRESH_SECRET);

export const generateJti = () => crypto.randomUUID();

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

