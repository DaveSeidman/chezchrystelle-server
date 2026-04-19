import { createApp } from './app';
import { connectToDatabase } from './config/database';
import { env } from './config/env';
import { configurePassport } from './lib/auth';

function logProcessError(label: string, error: unknown) {
  console.error(`[process] ${label}`, error);
}

process.on('unhandledRejection', (error) => {
  logProcessError('Unhandled rejection', error);
});

process.on('uncaughtException', (error) => {
  logProcessError('Uncaught exception', error);
});

async function start() {
  await connectToDatabase();
  configurePassport();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`Chez Chrystelle server listening on ${env.PORT}`);
  });

  server.on('error', (error) => {
    console.error('[server] Failed to start or crashed', error);
  });
}

void start().catch((error) => {
  console.error('[startup] Failed to start server', error);
});
