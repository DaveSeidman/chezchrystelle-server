import { connectToDatabase } from '../config/database';
import { StoreModel } from '../models/Store';
import { StoreMembershipModel } from '../models/StoreMembership';
import { OrderModel } from '../models/Order';

async function removePlaceholderStore() {
  await connectToDatabase();

  const store = await StoreModel.findOne({ slug: 'brooklyn' });

  if (!store) {
    console.log('No brooklyn placeholder store found');
    process.exit(0);
  }

  const storeId = store._id;

  await StoreMembershipModel.deleteMany({ storeId });
  await OrderModel.updateMany({ storeId }, { $set: { deleted: true } });
  await StoreModel.deleteOne({ _id: storeId });

  console.log('Removed brooklyn placeholder store');
  process.exit(0);
}

void removePlaceholderStore().catch((error) => {
  console.error('Failed to remove brooklyn placeholder store', error);
  process.exit(1);
});
