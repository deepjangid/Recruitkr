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

