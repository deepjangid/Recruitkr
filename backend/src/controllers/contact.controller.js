import { StatusCodes } from 'http-status-codes';

import { ContactMessage } from '../models/ContactMessage.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createContactMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.create(req.body);
  res.status(StatusCodes.CREATED).json({
    success: true,
    message: 'Message submitted',
    data: { id: message.id },
  });
});

