import { Router } from 'express';

import {
  applyToJob,
  createJob,
  downloadClientApplicationResume,
  getClientApplicationDetails,
  listCandidateApplications,
  listClientApplications,
  listMyJobs,
  listPublicJobs,
  updateApplicationStatus,
  updateMyJobStatus,
} from '../controllers/job.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import {
  applyJobSchema,
  updateApplicationStatusSchema,
} from '../schemas/application.schema.js';
import { createJobSchema, listJobsQuerySchema, updateJobStatusSchema } from '../schemas/job.schema.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.get('/', validate(listJobsQuerySchema, 'query'), listPublicJobs);

router.post('/', requireAuth, requireRole('client'), validate(createJobSchema), createJob);
router.get('/mine', requireAuth, requireRole('client'), listMyJobs);
router.patch(
  '/:jobId/status',
  requireAuth,
  requireRole('client'),
  validate(updateJobStatusSchema),
  updateMyJobStatus,
);

router.post('/apply', requireAuth, requireRole('candidate'), validate(applyJobSchema), applyToJob);
router.get(
  '/applications/mine',
  requireAuth,
  requireRole('candidate'),
  listCandidateApplications,
);
router.get('/applications', requireAuth, requireRole('client'), listClientApplications);
router.get(
  '/applications/:applicationId',
  requireAuth,
  requireRole('client'),
  getClientApplicationDetails,
);
router.get(
  '/applications/:applicationId/resume',
  requireAuth,
  requireRole('client'),
  downloadClientApplicationResume,
);
router.patch(
  '/applications/:applicationId/status',
  requireAuth,
  requireRole('client'),
  validate(updateApplicationStatusSchema),
  updateApplicationStatus,
);

export default router;

