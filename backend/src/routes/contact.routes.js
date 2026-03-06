import { Router } from 'express';

import { createContactMessage } from '../controllers/contact.controller.js';
import { contactLimiter } from '../middlewares/rateLimiter.js';
import { contactSchema } from '../schemas/contact.schema.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/', contactLimiter, validate(contactSchema), createContactMessage);

export default router;

