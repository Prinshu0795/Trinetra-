// server/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import disasterRoutes from './disasters.routes.js';
import alertRoutes from './alerts.routes.js';
import reportRoutes from './reports.routes.js';
import safeZoneRoutes from './safeZones.routes.js';
import resourceRoutes from './resources.routes.js';
import riskRoutes from './risk.routes.js';
import devRoutes from './dev.routes.js';
import geoIntelligenceRoutes from './geoIntelligence.routes.js';
import relayRoutes from './relay.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/disasters', disasterRoutes);
router.use('/alerts', alertRoutes);
router.use('/reports', reportRoutes);
router.use('/safe-zones', safeZoneRoutes);
router.use('/resources', resourceRoutes);
router.use('/risk', riskRoutes);
router.use('/dev', devRoutes);
router.use('/geo-intelligence', geoIntelligenceRoutes);
router.use('/relay', relayRoutes);

export default router;
