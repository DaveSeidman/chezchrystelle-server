import { z } from 'zod';

import { orderStatuses } from '../models/Order';
import { objectIdSchema } from './common';

export const updateUserSchema = z.object({
  isAdmin: z.boolean().optional(),
  isApproved: z.boolean().optional(),
  markupAmount: z.coerce.number().min(0).optional()
});

export const storeSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  description: z.string().optional().default(''),
  isActive: z.boolean().optional().default(true),
  pickupAddress: z.string().optional().default(''),
  pickupNotes: z.string().optional().default(''),
  availableProductIds: z.array(objectIdSchema).optional().default([]),
  options: z.record(z.string(), z.unknown()).optional().default({})
});

export const productSchema = z.object({
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  baseName: z.string().trim().min(1),
  size: z.enum(['small', 'large']),
  ingredients: z.array(z.string().trim().min(1)).optional().default([]),
  price: z.coerce.number().min(0),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().min(0).optional().default(0)
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatuses),
  sendEmail: z.boolean().optional().default(true)
});

export const configSchema = z.object({
  deliveryDays: z.array(z.coerce.number().int().min(0).max(6)).min(1),
  lastOrderTime: z.string().regex(/^\d{2}:\d{2}$/),
  orderThanksMessage: z.string().trim().min(1),
  contactEmail: z.email(),
  orderNotificationEmails: z.array(z.email())
});
