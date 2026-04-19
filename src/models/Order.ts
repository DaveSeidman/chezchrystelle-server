import { Schema, Types, model, type InferSchemaType } from 'mongoose';

export const orderStatuses = ['pending', 'confirmed', 'ready', 'completed', 'cancelled'] as const;

const orderLineItemSchema = new Schema(
  {
    productId: {
      type: Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    basePrice: {
      type: Number,
      required: true,
      min: 0
    },
    markupAmount: {
      type: Number,
      required: true,
      min: 0
    },
    finalUnitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  {
    _id: false
  }
);

const orderSchema = new Schema(
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
      required: true
    },
    fulfillmentDate: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: orderStatuses,
      default: 'pending'
    },
    lineItems: {
      type: [orderLineItemSchema],
      default: []
    },
    notes: {
      type: String,
      default: ''
    },
    deleted: {
      type: Boolean,
      default: false,
      index: true
    },
    totals: {
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      markupTotal: {
        type: Number,
        required: true,
        min: 0
      },
      total: {
        type: Number,
        required: true,
        min: 0
      }
    }
  },
  {
    timestamps: true
  }
);

export type OrderDocument = InferSchemaType<typeof orderSchema>;

export const OrderModel = model('Order', orderSchema);
