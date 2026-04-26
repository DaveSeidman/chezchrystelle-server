import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';

import { env } from '../config/env';
import { asyncHandler } from '../lib/asyncHandler';
import { logAuditEvent } from '../lib/auditLog';
import { buildOrderTotals, assertFulfillmentDateAllowed, getGeneralConfig } from '../lib/order';
import { sendAdminOrderNotificationEmail, sendOrderConfirmationEmail } from '../lib/email';
import { userHasStoreAccess } from '../lib/storeMemberships';
import { requireApprovedUser } from '../middleware/auth';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { StoreModel } from '../models/Store';
import { createOrderSchema } from '../schemas/client';

export const clientRouter = Router();

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20)
});

clientRouter.get(
  '/orders/me',
  asyncHandler(async (request, response) => {
    const { page, pageSize } = paginationQuerySchema.parse(request.query);
    const query = { userId: request.authUser?._id, deleted: { $ne: true } };
    const totalItems = await OrderModel.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const orders = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .populate('storeId')
      .populate('lineItems.productId')
      .lean<any[]>();

    response.json({
      items: orders,
      page: currentPage,
      pageSize,
      totalItems,
      totalPages
    });
  })
);

clientRouter.post(
  '/orders',
  requireApprovedUser,
  asyncHandler(async (request, response) => {
    const user = request.authUser;

    if (!user) {
      return response.status(401).json({ message: 'Authentication required' });
    }

    const payload = createOrderSchema.parse(request.body);
    const config = await getGeneralConfig();
    const hasStoreAccess = user.isAdmin ? true : await userHasStoreAccess(String(user._id), payload.storeId);

    if (!hasStoreAccess) {
      return response.status(403).json({ message: 'You do not have access to place orders for that store' });
    }

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

    const { lineItems, totals } = buildOrderTotals(store, products as any, payload.lineItems);

    const order = await OrderModel.create({
      userId: user._id,
      storeId: store._id,
      fulfillmentDate: payload.fulfillmentDate,
      status: 'pending',
      deleted: false,
      notes: payload.notes,
      lineItems,
      totals
    });

    logAuditEvent('order_placed', {
      orderId: String(order._id),
      userId: String(user._id),
      userEmail: user.email,
      userDisplayName: user.displayName,
      storeId: String(store._id),
      storeName: store.name,
      fulfillmentDate: order.fulfillmentDate,
      lineItemCount: order.lineItems.length,
      subtotal: totals.subtotal,
      markupTotal: totals.markupTotal,
      total: totals.total,
      status: order.status
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
