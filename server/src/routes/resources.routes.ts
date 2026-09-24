// server/src/routes/resources.routes.ts
import { Router } from 'express';
import {
  listResources,
  createResource,
  updateResource,
} from '../controllers/resource.controller.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createResourceSchema, updateResourceStatusSchema } from '../schemas/index.js';

const router = Router();

router.get('/', listResources);
router.post(
  '/',
  authenticate,
  requireRole(['AUTHORITY']),
  validateBody(createResourceSchema),
  createResource
);
router.patch(
  '/:id',
  authenticate,
  requireRole(['AUTHORITY', 'RESPONDER']),
  validateBody(updateResourceStatusSchema),
  updateResource
);

export default router;
