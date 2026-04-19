import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';

import { env } from '../config/env';
import { ConfigModel } from '../models/Config';
import { UserModel } from '../models/User';
import { sendSignupNotificationEmail } from './email';

export type AuthTokenPayload = {
  sub: string;
};

function isInitialAdmin(email: string) {
  return env.initialAdminEmails.includes(email.toLowerCase());
}

export async function syncGoogleUser(profile: Profile) {
  const email = profile.emails?.[0]?.value?.toLowerCase();

  if (!email) {
    throw new Error('Google account is missing an email address');
  }

  const initialAdmin = isInitialAdmin(email);
  const existingUser = await UserModel.findOne({ googleId: profile.id });
  const nextStatus = initialAdmin ? 'approved' : existingUser?.status ?? 'pending';
  const nextIsApproved = initialAdmin ? true : existingUser?.isApproved ?? false;

  const user = await UserModel.findOneAndUpdate(
    { googleId: profile.id },
    {
      $set: {
        email,
        displayName: profile.displayName || email,
        photoUrl: profile.photos?.[0]?.value ?? '',
        status: nextStatus,
        isApproved: nextIsApproved
      },
      $setOnInsert: {
        isAdmin: initialAdmin,
        markupAmount: 0
      }
    },
    {
      new: true,
      upsert: true
    }
  );

  if (!user.isAdmin && initialAdmin) {
    user.isAdmin = true;
    user.isApproved = true;
    user.status = 'approved';
    await user.save();
  }

  if (!existingUser && !initialAdmin) {
    const config = await ConfigModel.findOne({ singletonKey: 'general' }).lean();

    if (config) {
      try {
        await sendSignupNotificationEmail({
          user,
          config
        });
      } catch (error) {
        console.error('Signup notification email failed', error);
      }
    }
  }

  return user;
}

export function signAuthToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']
  });
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as AuthTokenPayload;
}

export function configurePassport() {
  if (!env.googleAuthEnabled) {
    return passport;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, profile);
      }
    )
  );

  return passport;
}
