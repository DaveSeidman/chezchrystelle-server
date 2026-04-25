import { Schema, model, type InferSchemaType } from 'mongoose';

const productSchema = new Schema(
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
    baseName: {
      type: String,
      required: true
    },
    size: {
      type: String,
      enum: ['small', 'large'],
      required: true
    },
    ingredients: {
      type: [String],
      default: []
    },
    images: {
      type: [String],
      default: []
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    isActive: {
      type: Boolean,
      default: true
    },
    sortOrder: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export type ProductDocument = InferSchemaType<typeof productSchema>;

export const ProductModel = model('Product', productSchema);
