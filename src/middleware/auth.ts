import type { NextFunction, Request, Response } from 'express';

import { UserModel } from '../models/User';
import { verifyAuthToken } from '../lib/auth';

function getTokenFromRequest(request: Request) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length);
}

export async function optionalAuth(request: Request, _response: Response, next: NextFunction) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await UserModel.findById(payload.sub);

    if (user) {
      request.authUser = user;
    }
  } catch (_error) {
    request.authUser = undefined;
  }

  return next();
}

export async function requireAuth(request: Request, response: Response, next: NextFunction) {
  const token = getTokenFromRequest(request);

  if (!token) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = verifyAuthToken(token);
    const user = await UserModel.findById(payload.sub);

    if (!user) {
      return response.status(401).json({ message: 'Invalid token' });
    }

    request.authUser = user;
    return next();
  } catch (_error) {
    return response.status(401).json({ message: 'Invalid token' });
  }
}

export function requireApprovedUser(request: Request, response: Response, next: NextFunction) {
  if (!request.authUser) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  if (!request.authUser.isApproved && !request.authUser.isAdmin) {
    return response.status(403).json({ message: 'Account pending approval' });
  }

  return next();
}

export function requireAdmin(request: Request, response: Response, next: NextFunction) {
  if (!request.authUser?.isAdmin) {
    return response.status(403).json({ message: 'Admin access required' });
  }

  return next();
}
