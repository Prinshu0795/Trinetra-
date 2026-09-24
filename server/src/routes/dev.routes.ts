// server/src/routes/dev.routes.ts
import { Router } from 'express';
import { resetScenario } from '../controllers/dev.controller.js';

const router = Router();

router.post('/reset-scenario', resetScenario);

export default router;
