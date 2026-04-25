import { Router } from 'express';

import { env } from '../config/env';
import { asyncHandler } from '../lib/asyncHandler';
import { sendContactEmail } from '../lib/email';
import { enrichUserWithAssignedStores } from '../lib/storeMemberships';
import { ConfigModel } from '../models/Config';
import { ProductModel } from '../models/Product';
import { StoreModel } from '../models/Store';
import { contactSchema } from '../schemas/public';

export const publicRouter = Router();

publicRouter.get(
  '/auth/me',
  asyncHandler(async (request, response) => {
    response.json({ user: await enrichUserWithAssignedStores(request.authUser ?? null) });
  })
);

publicRouter.get(
  '/config/public',
  asyncHandler(async (_request, response) => {
    const config = await ConfigModel.findOne({ singletonKey: 'general' }).lean();
    response.json(
      config
        ? {
            ...config,
            businessTimeZone: env.BUSINESS_TIME_ZONE
          }
        : null
    );
  })
);

publicRouter.get(
  '/stores/public',
  asyncHandler(async (_request, response) => {
    const stores = await StoreModel.find({ isActive: true }).sort({ name: 1 }).lean();
    response.json(stores);
  })
);

publicRouter.get(
  '/products/public',
  asyncHandler(async (request, response) => {
    const storeId = typeof request.query.storeId === 'string' ? request.query.storeId : '';
    const products = await ProductModel.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean();

    if (!storeId) {
      return response.json(products);
    }

    const store = await StoreModel.findById(storeId).lean();

    if (!store) {
      return response.json([]);
    }

    const allowedIds = new Set(store.availableProductIds.map((value) => String(value)));
    return response.json(products.filter((product) => allowedIds.has(String(product._id))));
  })
);

publicRouter.post(
  '/contact',
  asyncHandler(async (request, response) => {
    const payload = contactSchema.parse(request.body);
    const config = await ConfigModel.findOne({ singletonKey: 'general' }).lean();

    if (!config) {
      return response.status(500).json({ message: 'General config not found' });
    }

    await sendContactEmail(payload, config);
    return response.status(201).json({ message: 'Message sent' });
  })
);
