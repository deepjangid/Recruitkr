import { Router } from 'express';

import {
  downloadResumeById,
  downloadMyGeneratedResume,
  getMyResume,
  listClientResumes,
  parseResume,
} from '../controllers/resume.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.post('/parse', parseResume);
router.get('/mine', requireAuth, requireRole('candidate'), getMyResume);
router.get('/client', requireAuth, requireRole('client', 'admin'), listClientResumes);
router.get('/download/:id', requireAuth, requireRole('candidate', 'client', 'admin'), downloadResumeById);
router.get('/generated', requireAuth, requireRole('candidate'), downloadMyGeneratedResume);

export default router;

