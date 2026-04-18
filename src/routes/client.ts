import { Router } from 'express';
import { Types } from 'mongoose';

import { env } from '../config/env';
import { asyncHandler } from '../lib/asyncHandler';
import { buildOrderTotals, assertFulfillmentDateAllowed, getGeneralConfig } from '../lib/order';
import { sendAdminOrderNotificationEmail, sendOrderConfirmationEmail } from '../lib/email';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { StoreModel } from '../models/Store';
import { createOrderSchema } from '../schemas/client';

export const clientRouter = Router();

clientRouter.get(
  '/orders/me',
  asyncHandler(async (request, response) => {
    const orders = await OrderModel.find({ userId: request.authUser?._id })
      .sort({ createdAt: -1 })
      .populate('storeId')
      .populate('lineItems.productId')
      .lean<any[]>();

    response.json(orders);
  })
);

clientRouter.post(
  '/orders',
  asyncHandler(async (request, response) => {
    const user = request.authUser;

    if (!user) {
      return response.status(401).json({ message: 'Authentication required' });
    }

    const payload = createOrderSchema.parse(request.body);
    const config = await getGeneralConfig();

    assertFulfillmentDateAllowed(payload.fulfillmentDate, config.deliveryDays, config.lastOrderTime, env.BUSINESS_TIME_ZONE);

    const store = await StoreModel.findById(payload.storeId);

    if (!store || !store.isActive) {
      return response.status(400).json({ message: 'Invalid store selected' });
    }

    const requestedProductIds = payload.lineItems.map((item) => new Types.ObjectId(item.productId));
    const products = await ProductModel.find({ _id: { $in: requestedProductIds }, isActive: true });

    const allowedIds = new Set(store.availableProductIds.map((value) => String(value)));
    const invalidSelection = payload.lineItems.some((item) => !allowedIds.has(item.productId));

    if (invalidSelection) {
      return response.status(400).json({ message: 'Selected products are not available for that store' });
    }

    const { lineItems, totals } = buildOrderTotals(user, products as any, payload.lineItems);

    const order = await OrderModel.create({
      userId: user._id,
      storeId: store._id,
      fulfillmentDate: payload.fulfillmentDate,
      status: 'pending',
      notes: payload.notes,
      lineItems,
      totals
    });

    const productNames = Object.fromEntries(products.map((product) => [String(product._id), product.name]));

    try {
      await Promise.all([
        sendOrderConfirmationEmail({
          order: order.toObject() as any,
          user,
          config,
          productNames
        }),
        sendAdminOrderNotificationEmail({
          order: order.toObject() as any,
          user,
          store,
          config,
          productNames
        })
      ]);
    } catch (error) {
      console.error('Email send failed after order creation', error);
    }

    response.status(201).json(order);
  })
);
