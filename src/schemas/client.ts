import { z } from 'zod';

import { objectIdSchema } from './common';

export const createOrderSchema = z.object({
  storeId: objectIdSchema,
  fulfillmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().trim().max(1000).optional().default(''),
  lineItems: z
    .array(
      z.object({
        productId: objectIdSchema,
        quantity: z.coerce.number().int().min(1)
      })
    )
    .min(1)
});
