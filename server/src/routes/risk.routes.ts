// server/src/routes/risk.routes.ts
import { Router } from 'express';
import { getRisk } from '../controllers/risk.controller.js';
import { optionalAuthenticate } from '../middleware/auth.js';

const router = Router();

router.get('/:location', optionalAuthenticate, getRisk);

export default router;
