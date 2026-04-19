import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../lib/asyncHandler';
import { sendOrderStatusEmail } from '../lib/email';
import { enrichUserWithAssignedStores, enrichUsersWithAssignedStores, replaceUserStoreMemberships } from '../lib/storeMemberships';
import { createSlug } from '../lib/createSlug';
import { ConfigModel } from '../models/Config';
import { OrderModel } from '../models/Order';
import { ProductModel } from '../models/Product';
import { StoreModel } from '../models/Store';
import { UserModel } from '../models/User';
import { configSchema, productSchema, storeSchema, updateOrderStatusSchema, updateUserSchema } from '../schemas/admin';

export const adminRouter = Router();

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20)
});

adminRouter.get(
  '/users',
  asyncHandler(async (_request, response) => {
    const users = await UserModel.find({}).sort({ createdAt: -1 }).lean();
    response.json(await enrichUsersWithAssignedStores(users));
  })
);

adminRouter.patch(
  '/users/:id',
  asyncHandler(async (request, response) => {
    const userId = String(request.params.id);
    const payload = updateUserSchema.parse(request.body);
    const nextPayload = { ...payload } as typeof payload;
    const assignedStoreIds = nextPayload.assignedStoreIds;

    delete nextPayload.assignedStoreIds;

    if (nextPayload.status) {
      nextPayload.isApproved = nextPayload.status === 'approved';
    } else if (typeof nextPayload.isApproved === 'boolean') {
      nextPayload.status = nextPayload.isApproved ? 'approved' : 'pending';
    }

    const user = await UserModel.findByIdAndUpdate(userId, nextPayload, { new: true });

    if (!user) {
      return response.status(404).json({ message: 'User not found' });
    }

    if (Array.isArray(assignedStoreIds)) {
      await replaceUserStoreMemberships(userId, assignedStoreIds);
    }

    response.json(await enrichUserWithAssignedStores(user));
  })
);

adminRouter.get(
  '/stores',
  asyncHandler(async (_request, response) => {
    const stores = await StoreModel.find({}).sort({ name: 1 }).lean();
    response.json(stores);
  })
);

adminRouter.post(
  '/stores',
  asyncHandler(async (request, response) => {
    const payload = storeSchema.parse(request.body);
    const store = await StoreModel.create({
      ...payload,
      slug: createSlug(payload.slug)
    });
    response.status(201).json(store);
  })
);

adminRouter.patch(
  '/stores/:id',
  asyncHandler(async (request, response) => {
    const payload = storeSchema.partial().parse(request.body);

    if (payload.slug) {
      payload.slug = createSlug(payload.slug);
    }

    const store = await StoreModel.findByIdAndUpdate(request.params.id, payload, { new: true });
    response.json(store);
  })
);

adminRouter.delete(
  '/stores/:id',
  asyncHandler(async (request, response) => {
    await StoreModel.findByIdAndDelete(request.params.id);
    response.status(204).send();
  })
);

adminRouter.get(
  '/products',
  asyncHandler(async (_request, response) => {
    const products = await ProductModel.find({}).sort({ sortOrder: 1, name: 1 }).lean();
    response.json(products);
  })
);

adminRouter.post(
  '/products',
  asyncHandler(async (request, response) => {
    const payload = productSchema.parse(request.body);
    const product = await ProductModel.create({
      ...payload,
      slug: createSlug(payload.slug)
    });
    response.status(201).json(product);
  })
);

adminRouter.patch(
  '/products/:id',
  asyncHandler(async (request, response) => {
    const payload = productSchema.partial().parse(request.body);

    if (payload.slug) {
      payload.slug = createSlug(payload.slug);
    }

    const product = await ProductModel.findByIdAndUpdate(request.params.id, payload, { new: true });
    response.json(product);
  })
);

adminRouter.delete(
  '/products/:id',
  asyncHandler(async (request, response) => {
    await ProductModel.findByIdAndDelete(request.params.id);
    response.status(204).send();
  })
);

adminRouter.get(
  '/orders',
  asyncHandler(async (request, response) => {
    const { page, pageSize } = paginationQuerySchema.parse(request.query);
    const query = { deleted: { $ne: true } };
    const totalItems = await OrderModel.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const orders = await OrderModel.find(query)
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * pageSize)
      .limit(pageSize)
      .populate('userId')
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

adminRouter.patch(
  '/orders/:id',
  asyncHandler(async (request, response) => {
    const payload = updateOrderStatusSchema.parse(request.body);
    const order = await OrderModel.findOneAndUpdate(
      { _id: request.params.id, deleted: { $ne: true } },
      { status: payload.status },
      { new: true }
    )
      .populate('userId')
      .populate('lineItems.productId');

    if (!order) {
      return response.status(404).json({ message: 'Order not found' });
    }

    if (payload.sendEmail) {
      const populatedOrder = order.toObject() as any;
      const productNames = Object.fromEntries(
        populatedOrder.lineItems.map((item: any) => [String(item.productId._id), item.productId.name])
      );

      try {
        await sendOrderStatusEmail({
          order: populatedOrder,
          user: populatedOrder.userId,
          productNames
        });
      } catch (error) {
        console.error('Order status email failed', error);
      }
    }

    return response.json(order);
  })
);

adminRouter.delete(
  '/orders/:id',
  asyncHandler(async (request, response) => {
    const order = await OrderModel.findOneAndUpdate(
      { _id: request.params.id, deleted: { $ne: true } },
      { deleted: true },
      { new: true }
    );

    if (!order) {
      return response.status(404).json({ message: 'Order not found' });
    }

    return response.status(204).send();
  })
);

adminRouter.get(
  '/config',
  asyncHandler(async (_request, response) => {
    const config = await ConfigModel.findOne({ singletonKey: 'general' }).lean();
    response.json(config);
  })
);

adminRouter.put(
  '/config',
  asyncHandler(async (request, response) => {
    const payload = configSchema.parse(request.body);
    const config = await ConfigModel.findOneAndUpdate(
      { singletonKey: 'general' },
      {
        ...payload,
        singletonKey: 'general'
      },
      {
        upsert: true,
        new: true
      }
    );

    response.json(config);
  })
);
