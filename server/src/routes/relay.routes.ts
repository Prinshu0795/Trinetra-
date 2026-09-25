// server/src/routes/relay.routes.ts
import { Router } from 'express';
import {
  ingestRelayPacket,
  getActiveRelayPackets,
  dispatchRelayTo112,
  getRelayStats,
} from '../controllers/relay.controller.js';

const router = Router();

// Public / Gateway route: Ingest relayed offline packets from any device that finds connection
router.post('/packet', ingestRelayPacket);

// Fetch recent/active relayed emergency packets
router.get('/active', getActiveRelayPackets);

// Fetch mesh network statistics
router.get('/stats', getRelayStats);

// Emergency response dispatch (112 / NDRF CAD)
router.post('/:id/dispatch-112', dispatchRelayTo112);

export default router;
