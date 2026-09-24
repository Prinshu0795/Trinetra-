// server/src/routes/reports.routes.ts
import { Router } from 'express';
import {
  submitReport,
  listReports,
  getReportById,
  triageReport,
} from '../controllers/report.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { uploadIncidentImage } from '../middleware/upload.js';
import { validateBody } from '../middleware/validate.js';
import { triageReportSchema } from '../schemas/index.js';

const router = Router();

// Public / Citizen reporting with optional image
router.post(
  '/',
  optionalAuthenticate,
  uploadIncidentImage.single('image'),
  submitReport
);

// Authority triage
router.get('/', authenticate, requireRole(['AUTHORITY', 'RESPONDER']), listReports);
router.get('/:id', optionalAuthenticate, getReportById);
router.patch(
  '/:id/triage',
  authenticate,
  requireRole(['AUTHORITY', 'RESPONDER']),
  validateBody(triageReportSchema),
  triageReport
);

export default router;
