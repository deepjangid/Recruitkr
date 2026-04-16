import { Router } from 'express';

import { streamLiveUpdates } from '../controllers/events.controller.js';
import { requireStreamAuth, requireRole } from '../middlewares/auth.js';

const router = Router();

router.get('/stream', requireStreamAuth, requireRole('candidate', 'client', 'admin'), streamLiveUpdates);

export default router;
