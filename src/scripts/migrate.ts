import { connectToDatabase } from '../config/database';
import { migrations } from '../migrations';
import { MigrationRunModel } from '../models/MigrationRun';

async function runMigrations() {
  await connectToDatabase();

  for (const migration of migrations) {
    const existingRun = await MigrationRunModel.findOne({ key: migration.key }).lean();

    if (existingRun) {
      console.log(`[migration] Skipping ${migration.key}`);
      continue;
    }

    console.log(`[migration] Running ${migration.key}: ${migration.description}`);
    await migration.run();
    await MigrationRunModel.create({
      key: migration.key,
      description: migration.description
    });
    console.log(`[migration] Completed ${migration.key}`);
  }

  console.log('[migration] All migrations complete');
  process.exit(0);
}

void runMigrations().catch((error) => {
  console.error('[migration] Failed to run migrations', error);
  process.exit(1);
});
