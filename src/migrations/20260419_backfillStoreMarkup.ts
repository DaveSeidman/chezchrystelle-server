import { StoreModel } from '../models/Store';
import type { MigrationDefinition } from './types';

export async function runBackfillStoreMarkupMigration() {
  const result = await StoreModel.updateMany(
    { markupAmount: { $exists: false } },
    {
      $set: {
        markupAmount: 0
      }
    }
  );

  console.log(`[migration] Backfilled markupAmount=0 on ${result.modifiedCount} stores`);
}

export const backfillStoreMarkupMigration: MigrationDefinition = {
  key: '20260419_backfill_store_markup',
  description: 'Set markupAmount=0 on legacy stores missing the field',
  run: runBackfillStoreMarkupMigration
};
