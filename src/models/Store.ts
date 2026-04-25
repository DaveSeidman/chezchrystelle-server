import { Schema, Types, model, type InferSchemaType } from 'mongoose';

const storeSchema = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true
    },
    pickupAddress: {
      type: String,
      default: ''
    },
    pickupNotes: {
      type: String,
      default: ''
    },
    mapLocation: {
      lat: {
        type: Number,
        required: false
      },
      lng: {
        type: Number,
        required: false
      }
    },
    markupAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    availableProductIds: {
      type: [Types.ObjectId],
      ref: 'Product',
      default: []
    },
    options: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

export type StoreDocument = InferSchemaType<typeof storeSchema>;

export const StoreModel = model('Store', storeSchema);
