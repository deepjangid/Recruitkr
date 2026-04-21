import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import { ContactMessage } from '../models/ContactMessage.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createContactMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Message submitted',
    data: { id: message.id },
  });
});

export const listContactMessages = asyncHandler(async (_req, res) => {
  const messages = await ContactMessage.find()
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  res.json({
    success: true,
    data: messages.map((message) => ({
      ...message,
      status: message.status || 'unread',
      readAt: message.readAt || null,
    })),
  });
});

export const updateContactMessageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid contact message id');
  }

  const update = {
    status,
    readAt: status === 'read' ? new Date() : null,
  };

  const message = await ContactMessage.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  }).lean();

  if (!message) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Contact message not found');
  }

  res.json({
    success: true,
    message: 'Contact message updated',
    data: message,
  });
});

