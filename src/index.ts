import { createApp } from './app';
import { connectToDatabase } from './config/database';
import { env } from './config/env';
import { configurePassport } from './lib/auth';

async function start() {
  await connectToDatabase();
  configurePassport();

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`Chez Chrystelle server listening on ${env.PORT}`);
  });
}

void start();
