import { Router, type Response } from 'express';
import passport from 'passport';
import type { Profile } from 'passport-google-oauth20';

import { env } from '../config/env';
import { asyncHandler } from '../lib/asyncHandler';
import { signAuthToken, syncGoogleUser } from '../lib/auth';

export const authRouter = Router();

function redirectToClientError(response: Response, errorCode: string) {
  response.redirect(`${env.CLIENT_URL}/clients?error=${encodeURIComponent(errorCode)}`);
}

authRouter.get('/google', (request, response, next) => {
  if (!env.googleAuthEnabled) {
    return redirectToClientError(response, 'google_auth_not_configured');
  }

  return passport.authenticate('google', { scope: ['profile', 'email'], session: false, prompt: 'select_account' })(request, response, next);
});

authRouter.get(
  '/google/callback',
  (request, response, next) => {
    if (!env.googleAuthEnabled) {
      return redirectToClientError(response, 'google_auth_not_configured');
    }

    return passport.authenticate('google', {
      failureRedirect: `${env.CLIENT_URL}/clients?error=google_auth_failed`,
      session: false
    })(request, response, next);
  },
  asyncHandler(async (request, response) => {
    const profile = request.user as Express.User & { id: string };
    const user = await syncGoogleUser(profile as never);
    const token = signAuthToken(user.id);
    response.redirect(`${env.CLIENT_URL}/clients/auth/callback?token=${encodeURIComponent(token)}`);
  })
);

authRouter.get(
  '/dev-login',
  asyncHandler(async (_request, response) => {
    if (!env.DEV_AUTH_ENABLED || env.NODE_ENV === 'production') {
      return response.status(403).json({ message: 'Dev login is disabled' });
    }

    const profile = {
      id: `dev-${env.DEV_AUTH_EMAIL.toLowerCase()}`,
      displayName: env.DEV_AUTH_NAME,
      emails: [{ value: env.DEV_AUTH_EMAIL }],
      photos: [{ value: '' }],
      provider: 'google'
    } as Profile;

    const user = await syncGoogleUser(profile);
    const token = signAuthToken(user.id);

    return response.redirect(`${env.CLIENT_URL}/clients/auth/callback?token=${encodeURIComponent(token)}`);
  })
);
