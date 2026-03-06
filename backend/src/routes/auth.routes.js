import { Router } from 'express';

import {
  changePassword,
  login,
  logout,
  refresh,
  registerCandidate,
  registerClient,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimiter.js';
import {
  candidateRegisterSchema,
  changePasswordSchema,
  clientRegisterSchema,
  loginSchema,
  refreshSchema,
} from '../schemas/auth.schema.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/register/candidate', authLimiter, validate(candidateRegisterSchema), registerCandidate);
router.post('/register/client', authLimiter, validate(clientRegisterSchema), registerClient);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/refresh', authLimiter, validate(refreshSchema), refresh);
router.post('/logout', authLimiter, logout);
router.post('/change-password', requireAuth, authLimiter, validate(changePasswordSchema), changePassword);

export default router;

