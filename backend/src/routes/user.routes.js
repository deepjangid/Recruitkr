import { Router } from 'express';

import { getCandidateProfile, getClientProfile, getMe } from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.get('/candidate/me', requireAuth, requireRole('candidate'), getCandidateProfile);
router.get('/client/me', requireAuth, requireRole('client'), getClientProfile);

export default router;

