import { StatusCodes } from 'http-status-codes';

import { CandidateFile } from '../models/CandidateFile.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const uploadMyProfilePhoto = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Profile photo file is required');
  }

  await CandidateFile.findOneAndUpdate(
    { candidateUserId: req.user.id, kind: 'profile_photo' },
    {
      candidateUserId: req.user.id,
      kind: 'profile_photo',
      title: '',
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  ).exec();

  res.json({ success: true, message: 'Profile photo uploaded' });
});

export const getMyProfilePhoto = asyncHandler(async (req, res) => {
  const file = await CandidateFile.findOne({
    candidateUserId: req.user.id,
    kind: 'profile_photo',
  })
    .select('+data')
    .exec();

  if (!file) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Profile photo not found');
  }

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `inline; filename="${file.fileName}"`);
  res.send(file.data);
});

export const deleteMyProfilePhoto = asyncHandler(async (req, res) => {
  await CandidateFile.deleteOne({ candidateUserId: req.user.id, kind: 'profile_photo' }).exec();
  res.json({ success: true, message: 'Profile photo removed' });
});

export const uploadMyCertificate = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Certificate file is required');
  }

  const title = typeof req.body?.title === 'string' ? req.body.title.trim() : '';

  const doc = await CandidateFile.create({
    candidateUserId: req.user.id,
    kind: 'certificate',
    title,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    data: req.file.buffer,
  });

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: {
      id: doc.id,
      title: doc.title,
      fileName: doc.fileName,
      mimeType: doc.mimeType,
      size: doc.size,
      createdAt: doc.createdAt,
    },
  });
});

export const listMyCertificates = asyncHandler(async (req, res) => {
  const items = await CandidateFile.find({ candidateUserId: req.user.id, kind: 'certificate' })
    .select('_id title fileName mimeType size createdAt')
    .sort({ createdAt: -1 })
    .exec();

  res.json({
    success: true,
    data: items.map((i) => ({
      id: i.id,
      title: i.title,
      fileName: i.fileName,
      mimeType: i.mimeType,
      size: i.size,
      createdAt: i.createdAt,
    })),
  });
});

export const downloadMyCertificate = asyncHandler(async (req, res) => {
  const file = await CandidateFile.findOne({
    _id: req.params.certificateId,
    candidateUserId: req.user.id,
    kind: 'certificate',
  })
    .select('+data')
    .exec();

  if (!file) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Certificate not found');
  }

  res.setHeader('Content-Type', file.mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${file.fileName}"`);
  res.send(file.data);
});

export const deleteMyCertificate = asyncHandler(async (req, res) => {
  const result = await CandidateFile.deleteOne({
    _id: req.params.certificateId,
    candidateUserId: req.user.id,
    kind: 'certificate',
  }).exec();

  if (!result.deletedCount) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Certificate not found');
  }

  res.json({ success: true, message: 'Certificate deleted' });
});

