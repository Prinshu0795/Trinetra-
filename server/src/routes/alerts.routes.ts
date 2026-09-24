// server/src/routes/alerts.routes.ts
import { Router } from 'express';
import {
  listAlerts,
  createAlert,
  withdrawAlert,
  streamAlerts,
} from '../controllers/alert.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createAlertSchema } from '../schemas/index.js';

const router = Router();

// Server-Sent Events stream for real-time broadcasts
router.get('/stream', streamAlerts);

router.get('/', listAlerts);
router.post(
  '/',
  authenticate,
  requireRole(['AUTHORITY']),
  validateBody(createAlertSchema),
  createAlert
);
router.patch(
  '/:id/withdraw',
  authenticate,
  requireRole(['AUTHORITY']),
  withdrawAlert
);

export default router;
