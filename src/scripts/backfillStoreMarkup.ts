import { connectToDatabase } from '../config/database';
import { StoreModel } from '../models/Store';

async function backfillStoreMarkup() {
  await connectToDatabase();

  const result = await StoreModel.updateMany(
    { markupAmount: { $exists: false } },
    {
      $set: {
        markupAmount: 0
      }
    }
  );

  console.log(`Backfilled markupAmount=0 on ${result.modifiedCount} stores`);
  process.exit(0);
}

void backfillStoreMarkup().catch((error) => {
  console.error('Failed to backfill store markup', error);
  process.exit(1);
});
