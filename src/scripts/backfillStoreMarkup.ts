import { connectToDatabase } from '../config/database';
import { runBackfillStoreMarkupMigration } from '../migrations/20260419_backfillStoreMarkup';

async function backfillStoreMarkup() {
  await connectToDatabase();
  await runBackfillStoreMarkupMigration();
  process.exit(0);
}

void backfillStoreMarkup().catch((error) => {
  console.error('Failed to backfill store markup', error);
  process.exit(1);
});
