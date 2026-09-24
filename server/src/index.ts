// server/src/index.ts
import { createApp } from './app.js';
import { config } from './config/index.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(`👁️  TRINETRA API SERVER (SIH 26206) INITIALIZED`);
  console.log(`🚀  Port:         http://localhost:${config.port}`);
  console.log(`📡  SSE Alerts:   http://localhost:${config.port}/api/v1/alerts/stream`);
  console.log(`🏥  Health Check: http://localhost:${config.port}/api/health`);
  console.log(`📂  Environment:  ${config.nodeEnv}`);
  console.log(`=======================================================`);
});

// Graceful termination
const shutdown = () => {
  console.log('\n[TRINETRA] Shutting down gracefully...');
  server.close(() => {
    console.log('[TRINETRA] Closed HTTP connections. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
