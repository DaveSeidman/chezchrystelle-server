import { UserModel } from '../models/User';
import type { MigrationDefinition } from './types';

export async function runBackfillUserStatusMigration() {
  const result = await UserModel.updateMany(
    { status: { $exists: false } },
    [
      {
        $set: {
          status: {
            $switch: {
              branches: [
                {
                  case: { $eq: ['$isAdmin', true] },
                  then: 'approved'
                },
                {
                  case: { $eq: ['$isApproved', true] },
                  then: 'approved'
                }
              ],
              default: 'pending'
            }
          }
        }
      }
    ]
  );

  console.log(`[migration] Backfilled status on ${result.modifiedCount} users`);
}

export const backfillUserStatusMigration: MigrationDefinition = {
  key: '20260425_backfill_user_status',
  description: 'Set status on legacy users based on admin/approval flags',
  run: runBackfillUserStatusMigration
};
