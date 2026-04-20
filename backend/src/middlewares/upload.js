import multer from 'multer';

import { ApiError } from '../utils/ApiError.js';

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

export const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only PDF and DOCX resumes are supported'));
    }
    return cb(null, true);
  },
});

const allowedPhotoMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const profilePhotoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedPhotoMimeTypes.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPG, PNG, or WEBP images are supported'));
    }
    return cb(null, true);
  },
});

const allowedCertificateMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const allowedBlogImageMimeTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const certificateUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedCertificateMimeTypes.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only PDF or image certificates are supported'));
    }
    return cb(null, true);
  },
});

export const blogImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!allowedBlogImageMimeTypes.has(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPG, PNG, WEBP, or GIF blog images are supported'));
    }
    return cb(null, true);
  },
});

