import { OrderModel } from '../models/Order';
import type { MigrationDefinition } from './types';

export async function runBackfillOrderDeletedMigration() {
  const result = await OrderModel.updateMany(
    { deleted: { $exists: false } },
    {
      $set: {
        deleted: false
      }
    }
  );

  console.log(`[migration] Backfilled deleted=false on ${result.modifiedCount} orders`);
}

export const backfillOrderDeletedMigration: MigrationDefinition = {
  key: '20260418_backfill_order_deleted',
  description: 'Set deleted=false on legacy orders missing the field',
  run: runBackfillOrderDeletedMigration
};
