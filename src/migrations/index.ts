import { backfillOrderDeletedMigration } from './20260418_backfillOrderDeleted';
import { backfillStoreMarkupMigration } from './20260419_backfillStoreMarkup';
import { backfillProductImagesMigration } from './20260420_backfillProductImages';
import { backfillUserStatusMigration } from './20260425_backfillUserStatus';
import type { MigrationDefinition } from './types';

export const migrations: MigrationDefinition[] = [
  backfillOrderDeletedMigration,
  backfillStoreMarkupMigration,
  backfillProductImagesMigration,
  backfillUserStatusMigration
];
