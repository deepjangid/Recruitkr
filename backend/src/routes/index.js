import { Router } from 'express';

import authRoutes from './auth.routes.js';
import contactRoutes from './contact.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import jobsRoutes from './jobs.routes.js';
import resumeRoutes from './resume.routes.js';
import userRoutes from './user.routes.js';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ success: true, message: 'Recruitkr API is running' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/jobs', jobsRoutes);
router.use('/resumes', resumeRoutes);
router.use('/dashboards', dashboardRoutes);
router.use('/contact', contactRoutes);

export default router;
