import cors from 'cors';
import express from 'express';
import passport from 'passport';

import { env } from './config/env';
import { optionalAuth, requireAdmin, requireApprovedUser, requireAuth } from './middleware/auth';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { adminRouter } from './routes/admin';
import { authRouter } from './routes/auth';
import { clientRouter } from './routes/client';
import { publicRouter } from './routes/public';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        if (env.allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
      credentials: false
    })
  );
  app.use(passport.initialize());
  app.use(express.json());

  app.get('/health', (_request, response) => {
    response.json({ ok: true });
  });

  app.use('/auth', authRouter);
  app.use('/api', optionalAuth, publicRouter);
  app.use('/api', requireAuth, requireApprovedUser, clientRouter);
  app.use('/api/admin', requireAuth, requireAdmin, adminRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
