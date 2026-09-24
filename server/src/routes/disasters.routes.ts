// server/src/routes/disasters.routes.ts
import { Router } from 'express';
import {
  listDisasters,
  getDisasterById,
  createDisaster,
  updateDisaster,
} from '../controllers/disaster.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createDisasterSchema, updateDisasterSchema } from '../schemas/index.js';

const router = Router();

router.get('/', listDisasters);
router.get('/:id', getDisasterById);
router.post(
  '/',
  authenticate,
  requireRole(['AUTHORITY']),
  validateBody(createDisasterSchema),
  createDisaster
);
router.patch(
  '/:id',
  authenticate,
  requireRole(['AUTHORITY']),
  validateBody(updateDisasterSchema),
  updateDisaster
);

export default router;
