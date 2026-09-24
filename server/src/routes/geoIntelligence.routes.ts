// server/src/routes/geoIntelligence.routes.ts
import { Router } from 'express';
import { searchLocation, getLocationIntelligence } from '../controllers/geoIntelligence.controller.js';

const router = Router();

router.get('/search', searchLocation);
router.get('/location', getLocationIntelligence);

export default router;
