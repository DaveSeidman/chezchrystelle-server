import { connectToDatabase } from '../config/database';
import { OrderModel } from '../models/Order';

async function backfillOrderDeleted() {
  await connectToDatabase();

  const result = await OrderModel.updateMany(
    { deleted: { $exists: false } },
    {
      $set: {
        deleted: false
      }
    }
  );

  console.log(`Backfilled deleted=false on ${result.modifiedCount} orders`);
  process.exit(0);
}

void backfillOrderDeleted().catch((error) => {
  console.error('Failed to backfill order deleted flag', error);
  process.exit(1);
});
