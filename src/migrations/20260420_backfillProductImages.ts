import { ProductModel } from '../models/Product';
import type { MigrationDefinition } from './types';

export async function runBackfillProductImagesMigration() {
  const result = await ProductModel.collection.updateMany(
    {
      image: {
        $exists: false
      }
    },
    {
      $set: {
        image: ''
      }
    }
  );

  console.log(`[migration] Backfilled image='' on ${result.modifiedCount} products`);
}

export const backfillProductImagesMigration: MigrationDefinition = {
  key: '20260420_backfill_product_images',
  description: "Set image='' on legacy products missing the field",
  run: runBackfillProductImagesMigration
};
