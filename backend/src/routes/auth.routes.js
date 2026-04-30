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
import {
  candidateRegisterSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  clientRegisterSchema,
  loginSchema,
  refreshSchema,
  resetPasswordParamsSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/register/candidate', validate(candidateRegisterSchema), registerCandidate);
router.post('/register/client', validate(clientRegisterSchema), registerClient);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshSchema), refresh);
router.post('/logout', logout);
router.post('/change-password', requireAuth, validate(changePasswordSchema), changePassword);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post(
  '/reset-password/:token',
  validate(resetPasswordParamsSchema, 'params'),
  validate(resetPasswordSchema),
  resetPassword,
);

export default router;

