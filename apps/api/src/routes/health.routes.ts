import { Router } from 'express';
import { isDatabaseReady } from '../config/database.js';

export const healthRouter = Router();

healthRouter.get('/', (_request, response) => {
  response.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'circutrace-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
    },
  });
});

healthRouter.get('/ready', (_request, response) => {
  const databaseReady = isDatabaseReady();
  response.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    data: { status: databaseReady ? 'ready' : 'not_ready', dependencies: { mongodb: databaseReady ? 'up' : 'down' } },
  });
});
