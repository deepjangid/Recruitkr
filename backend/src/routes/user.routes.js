import { Router } from 'express';

import {
  getCandidateProfile,
  getClientProfile,
  getMe,
  updateCandidateProfile,
} from '../controllers/user.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  deleteMyCertificate,
  deleteMyProfilePhoto,
  downloadMyCertificate,
  getMyProfilePhoto,
  listMyCertificates,
  uploadMyCertificate,
  uploadMyProfilePhoto,
} from '../controllers/candidateFiles.controller.js';
import { certificateUpload, profilePhotoUpload } from '../middlewares/upload.js';
import { updateCandidateProfileSchema } from '../schemas/user.schema.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.get('/candidate/me', requireAuth, requireRole('candidate'), getCandidateProfile);
router.patch(
  '/candidate/me',
  requireAuth,
  requireRole('candidate'),
  validate(updateCandidateProfileSchema),
  updateCandidateProfile,
);

router.post(
  '/candidate/profile-photo',
  requireAuth,
  requireRole('candidate'),
  profilePhotoUpload.single('photo'),
  uploadMyProfilePhoto,
);
router.get('/candidate/profile-photo', requireAuth, requireRole('candidate'), getMyProfilePhoto);
router.delete('/candidate/profile-photo', requireAuth, requireRole('candidate'), deleteMyProfilePhoto);

router.post(
  '/candidate/certificates',
  requireAuth,
  requireRole('candidate'),
  certificateUpload.single('file'),
  uploadMyCertificate,
);
router.get('/candidate/certificates', requireAuth, requireRole('candidate'), listMyCertificates);
router.get(
  '/candidate/certificates/:certificateId',
  requireAuth,
  requireRole('candidate'),
  downloadMyCertificate,
);
router.delete(
  '/candidate/certificates/:certificateId',
  requireAuth,
  requireRole('candidate'),
  deleteMyCertificate,
);
router.get('/client/me', requireAuth, requireRole('client'), getClientProfile);

export default router;

