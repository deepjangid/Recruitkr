import { Router } from 'express';

import {
  changePassword,
  forgotPassword,
  login,
  logout,
  refresh,
  registerCandidate,
  registerClient,
  resetPassword,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import {
  candidateRegisterSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  clientRegisterSchema,
  loginSchema,
  refreshSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/register/candidate', authLimiter, validate(candidateRegisterSchema), registerCandidate);
router.post('/register/client', authLimiter, validate(clientRegisterSchema), registerClient);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.post('/logout', authLimiter, logout);
router.post('/change-password', requireAuth, authLimiter, validate(changePasswordSchema), changePassword);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;

