import { Schema, model, type InferSchemaType } from 'mongoose';

export const userStatuses = ['pending', 'approved', 'denied'] as const;

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
    status: {
      type: String,
      enum: userStatuses,
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export type UserDocument = InferSchemaType<typeof userSchema>;

export const UserModel = model('User', userSchema);
