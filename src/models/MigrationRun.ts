import { Schema, model, type InferSchemaType } from 'mongoose';

const migrationRunSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    description: {
      type: String,
      required: true
    },
    ranAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
);

export type MigrationRunDocument = InferSchemaType<typeof migrationRunSchema>;

export const MigrationRunModel = model('MigrationRun', migrationRunSchema);
