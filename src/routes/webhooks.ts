import { Router } from 'express';

import { env } from '../config/env';
import { asyncHandler } from '../lib/asyncHandler';
import { forwardReceivedEmail, verifyReceivedEmailWebhook } from '../lib/email';

export const webhookRouter = Router();

function getHeader(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

webhookRouter.post(
  '/',
  asyncHandler(async (request, response) => {
    const id = getHeader(request.headers['svix-id']);
    const timestamp = getHeader(request.headers['svix-timestamp']);
    const signature = getHeader(request.headers['svix-signature']);

    if (!id || !timestamp || !signature || typeof request.body !== 'string') {
      return response.status(400).json({ message: 'Invalid webhook request' });
    }

    let event;

    try {
      event = verifyReceivedEmailWebhook({ payload: request.body, id, timestamp, signature });
    } catch {
      return response.status(400).json({ message: 'Invalid webhook signature' });
    }

    if (event.type !== 'email.received') {
      return response.status(200).json({ received: true });
    }

    const configuredAddresses = new Set(env.inboundAddresses);
    const matchedAddress = event.data.to.some((email) => configuredAddresses.has(email.toLowerCase()));

    if (!matchedAddress) {
      return response.status(200).json({ received: true, forwarded: false });
    }

    if (!env.inboundForwardTo.length) {
      throw new Error('INBOUND_FORWARD_TO is required to forward received email');
    }

    await forwardReceivedEmail({
      emailId: event.data.email_id,
      to: env.inboundForwardTo
    });

    return response.status(200).json({ received: true, forwarded: true });
  })
);
