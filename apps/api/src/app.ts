import { randomUUID } from 'node:crypto';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { env } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { healthRouter } from './routes/health.routes.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use((request, response, next) => {
  const requestId = request.header('x-request-id')?.slice(0, 128) || randomUUID();
  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
});

app.use(pinoHttp({
  level: env.LOG_LEVEL,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  customProps: (request) => ({ requestId: request.requestId }),
}));

app.use(helmet());
app.use(cors({
  origin: env.CLIENT_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));

app.get('/', (_request, response) => {
  response.json({ name: 'CircuTrace API', version: 'v1', docs: '/api/v1/health' });
});
app.use('/api/v1/health', healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);
