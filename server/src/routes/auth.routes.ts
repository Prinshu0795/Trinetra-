// server/src/routes/auth.routes.ts
import { Router } from 'express';
import {
  register,
  login,
  getMe,
  listUsers,
  deleteUser,
  getSystemStatus,
} from '../controllers/auth.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/index.js';

const router = Router();

// Public auth routes
router.get('/status', getSystemStatus);
router.post('/login', validateBody(loginSchema), login);

// Account creation: requires ADMIN authentication if users exist, or allows initial setup if DB is empty
router.post('/register', optionalAuthenticate, validateBody(registerSchema), register);
router.get('/me', authenticate, getMe);

// Admin-only user management
router.get('/users', authenticate, requireRole(['ADMIN']), listUsers);
router.delete('/users/:id', authenticate, requireRole(['ADMIN']), deleteUser);

export default router;
