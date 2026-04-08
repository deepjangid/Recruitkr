import { Router } from 'express';

import { downloadMyGeneratedResume, getMyResume, parseResume } from '../controllers/resume.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { resumeUpload } from '../middlewares/upload.js';

const router = Router();

router.post('/parse', resumeUpload.single('resume'), parseResume);
router.get('/mine', requireAuth, requireRole('candidate'), getMyResume);
router.get('/generated', requireAuth, requireRole('candidate'), downloadMyGeneratedResume);

export default router;

