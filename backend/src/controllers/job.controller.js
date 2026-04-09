import mongoose from 'mongoose';
import { StatusCodes } from 'http-status-codes';

import { Application } from '../models/Application.js';
import { JobRequirement } from '../models/JobRequirement.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createJob = asyncHandler(async (req, res) => {
  const job = await JobRequirement.create({
    ...req.body,
    clientId: req.user.id,
  });
  res.status(StatusCodes.CREATED).json({ success: true, data: job });
});

export const listPublicJobs = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 10, location, type } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { status: 'active', clientId: { $exists: true, $ne: null } };
  if (q) filter.jobTitle = { $regex: q, $options: 'i' };
  if (location) filter.jobLocation = { $regex: location, $options: 'i' };
  if (type) filter.employmentType = type;

  const [jobs, total] = await Promise.all([
    JobRequirement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    JobRequirement.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: jobs,
    meta: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
  });
});

export const listMyJobs = asyncHandler(async (req, res) => {
  const jobs = await JobRequirement.find({ clientId: req.user.id }).sort({ createdAt: -1 });
  res.json({ success: true, data: jobs });
});

export const updateMyJobStatus = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid job id');
  }

  const job = await JobRequirement.findOneAndUpdate(
    { _id: jobId, clientId: req.user.id },
    { status: req.body.status },
    { new: true },
  );

  if (!job) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found');
  }
  res.json({ success: true, data: job });
});

export const applyToJob = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid job id');
  }

  const job = await JobRequirement.findOne({ _id: jobId, status: 'active' }).select('_id clientId');
  if (!job) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Job not found');
  }
  if (!job.clientId) {
    throw new ApiError(
      StatusCodes.CONFLICT,
      'This job cannot accept applications right now because the employer record is missing.',
    );
  }

  const exists = await Application.findOne({ candidateId: req.user.id, jobId });
  if (exists) {
    throw new ApiError(StatusCodes.CONFLICT, 'Already applied to this job');
  }

  const application = await Application.create({
    candidateId: req.user.id,
    clientId: job.clientId,
    jobId,
  });
  res.status(StatusCodes.CREATED).json({ success: true, data: application });
});

export const listCandidateApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidateId: req.user.id })
    .populate('jobId')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: applications });
});

export const listClientApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ clientId: req.user.id })
    .populate('jobId')
    .populate({
      path: 'candidateId',
      select: 'email mobile',
    })
    .sort({ createdAt: -1 });
  res.json({ success: true, data: applications });
});

export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  if (!mongoose.isValidObjectId(applicationId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid application id');
  }

  const application = await Application.findOneAndUpdate(
    { _id: applicationId, clientId: req.user.id },
    { status: req.body.status },
    { new: true },
  );

  if (!application) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Application not found');
  }

  res.json({ success: true, data: application });
});

