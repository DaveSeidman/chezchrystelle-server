import { Schema, model, type InferSchemaType } from 'mongoose';

const userSchema = new Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },
    displayName: {
      type: String,
      required: true
    },
    photoUrl: {
      type: String,
      default: ''
    },
    isAdmin: {
      type: Boolean,
      default: false
    },
    isApproved: {
      type: Boolean,
      default: false
    },
    markupAmount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel = model('User', userSchema);
