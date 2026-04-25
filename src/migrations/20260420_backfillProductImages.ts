import { ProductModel } from '../models/Product';
import type { MigrationDefinition } from './types';

export async function runBackfillProductImagesMigration() {
  const result = await ProductModel.updateMany(
    {
      images: {
        $exists: false
      }
    },
    {
      $set: {
        images: []
      }
    }
  );

  console.log(`[migration] Backfilled images=[] on ${result.modifiedCount} products`);
}

export const backfillProductImagesMigration: MigrationDefinition = {
  key: '20260420_backfill_product_images',
  description: 'Set images=[] on legacy products missing the field',
  run: runBackfillProductImagesMigration
};
