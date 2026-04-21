import { Router } from 'express';

import {
  createContactMessage,
  listContactMessages,
  updateContactMessageStatus,
} from '../controllers/contact.controller.js';
import { requireAuth, requireRole } from '../middlewares/auth.js';
import { contactLimiter } from '../middlewares/rateLimiter.js';
import { contactSchema, contactStatusSchema } from '../schemas/contact.schema.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/', contactLimiter, validate(contactSchema), createContactMessage);
router.get('/', requireAuth, requireRole('admin'), listContactMessages);
router.put('/:id', requireAuth, requireRole('admin'), validate(contactStatusSchema), updateContactMessageStatus);

export default router;

