import { connectToDatabase } from '../config/database';
import { runBackfillProductImagesMigration } from '../migrations/20260420_backfillProductImages';

async function backfillProductImages() {
  await connectToDatabase();
  await runBackfillProductImagesMigration();
  process.exit(0);
}

void backfillProductImages().catch((error) => {
  console.error('Failed to backfill product images', error);
  process.exit(1);
});
