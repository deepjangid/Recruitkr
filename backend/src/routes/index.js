import { Router } from 'express';

import authRoutes from './auth.routes.js';
import blogRoutes from './blog.routes.js';
import contactRoutes from './contact.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import eventsRoutes from './events.routes.js';
import jobsRoutes from './jobs.routes.js';
import resumeRoutes from './resume.routes.js';
import { downloadResumeById } from '../controllers/resume.controller.js';
import { getUploadAuth } from '../controllers/upload.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Recruitkr API is running' });
});
router.get('/ping', (_req, res) => {
  res.json({ success: true, message: 'pong' });
});
router.get('/upload-auth', getUploadAuth);
router.get(
  '/resume/download/:id',
  requireAuth,
  requireRole('candidate', 'client', 'admin'),
  downloadResumeById,
);

router.use('/auth', authRoutes);
router.use('/blogs', blogRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobsRoutes);
router.use('/events', eventsRoutes);
router.use('/resumes', resumeRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/contact', contactRoutes);

export default router;
