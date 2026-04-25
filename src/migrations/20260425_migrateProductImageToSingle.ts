import { ProductModel } from '../models/Product';
import type { MigrationDefinition } from './types';

export async function runMigrateProductImageToSingleMigration() {
  const result = await ProductModel.collection.updateMany(
    {},
    [
      {
        $set: {
          image: {
            $cond: [
              {
                $and: [
                  { $eq: [{ $type: '$image' }, 'missing'] },
                  { $isArray: '$images' },
                  { $gt: [{ $size: '$images' }, 0] }
                ]
              },
              { $arrayElemAt: ['$images', 0] },
              {
                $cond: [{ $eq: [{ $type: '$image' }, 'missing'] }, '', '$image']
              }
            ]
          }
        }
      },
      {
        $unset: 'images'
      }
    ]
  );

  console.log(`[migration] Migrated product images to image on ${result.modifiedCount} products`);
}

export const migrateProductImageToSingleMigration: MigrationDefinition = {
  key: '20260425_migrate_product_image_to_single',
  description: 'Convert legacy images[] product data to a single image field',
  run: runMigrateProductImageToSingleMigration
};
