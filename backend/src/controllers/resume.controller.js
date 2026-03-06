import { StatusCodes } from 'http-status-codes';

import { Resume } from '../models/Resume.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  extractResumeText,
  parseResumeToCandidateHints,
} from '../services/resume.service.js';

export const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Resume file is required');
  }

  const text = await extractResumeText({
    mimeType: req.file.mimetype,
    buffer: req.file.buffer,
  });
  const hints = await parseResumeToCandidateHints(text);

  res.json({
    success: true,
    data: {
      parsed: hints,
      file: { fileName: req.file.originalname, mimeType: req.file.mimetype },
    },
  });
});

export const getMyResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ candidateUserId: req.user.id }).select('+data').exec();

  if (!resume) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Resume not found');
  }

  res.setHeader('Content-Type', resume.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
  res.send(resume.data);
});

