import { connectToDatabase } from '../config/database';
import { runBackfillOrderDeletedMigration } from '../migrations/20260418_backfillOrderDeleted';

async function backfillOrderDeleted() {
  await connectToDatabase();
  await runBackfillOrderDeletedMigration();
  process.exit(0);
}

void backfillOrderDeleted().catch((error) => {
  console.error('Failed to backfill order deleted flag', error);
  process.exit(1);
});
