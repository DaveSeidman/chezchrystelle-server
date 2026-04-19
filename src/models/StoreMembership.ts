import { Schema, Types, model, type InferSchemaType } from 'mongoose';

const storeMembershipSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    storeId: {
      type: Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true
    },
    role: {
      type: String,
      default: 'manager'
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

storeMembershipSchema.index({ userId: 1, storeId: 1 }, { unique: true });

export type StoreMembershipDocument = InferSchemaType<typeof storeMembershipSchema>;

export const StoreMembershipModel = model('StoreMembership', storeMembershipSchema);
