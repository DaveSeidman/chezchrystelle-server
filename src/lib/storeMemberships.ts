import { Types } from 'mongoose';

import { StoreMembershipModel } from '../models/StoreMembership';

type StoreLike = {
  _id: unknown;
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  pickupAddress: string;
  pickupNotes: string;
  availableProductIds: unknown[];
  options: Record<string, unknown>;
};

type UserLike = {
  _id: unknown;
  toObject?: () => Record<string, unknown>;
};

function serializeStore(store: StoreLike) {
  return {
    _id: String(store._id),
    name: store.name,
    slug: store.slug,
    description: store.description,
    isActive: store.isActive,
    pickupAddress: store.pickupAddress,
    pickupNotes: store.pickupNotes,
    availableProductIds: (store.availableProductIds ?? []).map((value) => String(value)),
    options: store.options ?? {}
  };
}

export async function getAssignedStoresForUser(userId: string) {
  const memberships = await StoreMembershipModel.find({
    userId: new Types.ObjectId(userId),
    isActive: true
  })
    .sort({ isPrimary: -1, createdAt: 1 })
    .populate('storeId')
    .lean<any[]>();

  return memberships
    .map((membership) => membership.storeId)
    .filter(Boolean)
    .map((store) => serializeStore(store));
}

export async function enrichUserWithAssignedStores<T extends UserLike>(user: T | null) {
  if (!user) {
    return null;
  }

  const assignedStores = await getAssignedStoresForUser(String(user._id));
  const baseUser = typeof user.toObject === 'function' ? user.toObject() : user;

  return {
    ...baseUser,
    _id: String(user._id),
    assignedStoreIds: assignedStores.map((store) => store._id),
    assignedStores
  };
}

export async function enrichUsersWithAssignedStores<T extends UserLike>(users: T[]) {
  const userIds = users.map((user) => new Types.ObjectId(String(user._id)));

  if (!userIds.length) {
    return [];
  }

  const memberships = await StoreMembershipModel.find({
    userId: { $in: userIds },
    isActive: true
  })
    .sort({ isPrimary: -1, createdAt: 1 })
    .populate('storeId')
    .lean<any[]>();

  const storesByUserId = new Map<string, ReturnType<typeof serializeStore>[]>();

  for (const membership of memberships) {
    if (!membership.storeId) {
      continue;
    }

    const userId = String(membership.userId);
    const nextStores = storesByUserId.get(userId) ?? [];
    nextStores.push(serializeStore(membership.storeId));
    storesByUserId.set(userId, nextStores);
  }

  return users.map((user) => {
    const assignedStores = storesByUserId.get(String(user._id)) ?? [];
    const baseUser = typeof user.toObject === 'function' ? user.toObject() : user;

    return {
      ...baseUser,
      _id: String(user._id),
      assignedStoreIds: assignedStores.map((store) => store._id),
      assignedStores
    };
  });
}

export async function replaceUserStoreMemberships(userId: string, storeIds: string[]) {
  const uniqueStoreIds = [...new Set(storeIds)];

  await StoreMembershipModel.deleteMany({
    userId: new Types.ObjectId(userId),
    storeId: {
      $nin: uniqueStoreIds.map((storeId) => new Types.ObjectId(storeId))
    }
  });

  await Promise.all(
    uniqueStoreIds.map((storeId, index) =>
      StoreMembershipModel.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          storeId: new Types.ObjectId(storeId)
        },
        {
          $set: {
            isActive: true,
            isPrimary: index === 0,
            role: 'manager'
          }
        },
        {
          upsert: true,
          new: true
        }
      )
    )
  );
}

export async function userHasStoreAccess(userId: string, storeId: string) {
  const membership = await StoreMembershipModel.exists({
    userId: new Types.ObjectId(userId),
    storeId: new Types.ObjectId(storeId),
    isActive: true
  });

  return Boolean(membership);
}
