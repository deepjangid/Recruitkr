import { Router } from 'express';

import { candidateDashboard, clientDashboard } from '../controllers/dashboard.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/candidate', requireAuth, requireRole('candidate'), candidateDashboard);
router.get('/client', requireAuth, requireRole('client'), clientDashboard);

export default router;

