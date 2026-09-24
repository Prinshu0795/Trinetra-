// server/src/routes/safeZones.routes.ts
import { Router } from 'express';
import {
  listSafeZones,
  createSafeZone,
  updateSafeZoneOccupancy,
} from '../controllers/resource.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createSafeZoneSchema, updateSafeZoneOccupancySchema } from '../schemas/index.js';

const router = Router();

router.get('/', listSafeZones);
router.post(
  '/',
  authenticate,
  requireRole(['AUTHORITY']),
  validateBody(createSafeZoneSchema),
  createSafeZone
);
router.patch(
  '/:id/occupancy',
  authenticate,
  requireRole(['AUTHORITY', 'RESPONDER']),
  validateBody(updateSafeZoneOccupancySchema),
  updateSafeZoneOccupancy
);

export default router;
