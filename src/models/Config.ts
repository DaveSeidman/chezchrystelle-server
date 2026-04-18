import { Schema, model, type InferSchemaType } from 'mongoose';

const configSchema = new Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: 'general'
    },
    deliveryDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6]
    },
    lastOrderTime: {
      type: String,
      default: '20:00'
    },
    orderThanksMessage: {
      type: String,
      default: 'Thank you for your order!'
    },
    contactEmail: {
      type: String,
      default: 'chrystelleseidman@gmail.com'
    },
    orderNotificationEmails: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export type ConfigDocument = InferSchemaType<typeof configSchema>;

export const ConfigModel = model('Config', configSchema);
