import { app } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

let server: ReturnType<typeof app.listen> | undefined;

async function shutdown(signal: string): Promise<void> {
  console.info(`Received ${signal}; shutting down gracefully.`);
  server?.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

async function bootstrap(): Promise<void> {
  await connectDatabase();
  server = app.listen(env.PORT, () => {
    console.info(`CircuTrace API listening on port ${env.PORT}`);
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

bootstrap().catch((error: unknown) => {
  console.error('Failed to start CircuTrace API:', error);
  process.exit(1);
});
