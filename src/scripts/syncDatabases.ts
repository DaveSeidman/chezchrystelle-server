import 'dotenv/config';

import mongoose, { type Connection } from 'mongoose';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const baseCollections = ['configs', 'orders', 'products', 'stores', 'storememberships'] as const;
const userCollection = 'users' as const;
type SyncDirection = 'pull' | 'push';

function getSyncDirection(): SyncDirection {
  const direction = process.argv[2];

  if (direction === 'pull' || direction === 'push') {
    return direction;
  }

  throw new Error('Usage: tsx src/scripts/syncDatabases.ts <pull|push> [--include-users]');
}

function shouldIncludeUsers() {
  return process.argv.includes('--include-users') || process.env.SYNC_INCLUDE_USERS === 'true';
}

function getCollections() {
  return shouldIncludeUsers() ? [...baseCollections, userCollection] : [...baseCollections];
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function maskMongoUri(uri: string) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@');
}

function getDatabaseName(uri: string) {
  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    return pathname || 'test';
  } catch {
    return 'unknown';
  }
}

async function connect(uri: string) {
  return mongoose.createConnection(uri).asPromise();
}

async function getCounts(connection: Connection, collections: readonly string[]) {
  const counts = await Promise.all(
    collections.map(async (collectionName) => ({
      collectionName,
      count: await connection.collection(collectionName).countDocuments({})
    }))
  );

  return counts;
}

function formatCounts(counts: Array<{ collectionName: string; count: number }>) {
  return counts.map(({ collectionName, count }) => `${collectionName}: ${count}`).join(', ');
}

async function prompt(question: string) {
  const rl = readline.createInterface({ input, output });

  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}

async function confirmSync(params: {
  direction: SyncDirection;
  sourceUri: string;
  targetUri: string;
  targetLabel: 'local' | 'remote';
  targetCounts: Array<{ collectionName: string; count: number }>;
  collections: readonly string[];
}) {
  if (!input.isTTY || !output.isTTY) {
    throw new Error('Database sync requires an interactive terminal.');
  }

  const answer = await prompt(
    [
      `You are about to replace your ${params.targetLabel} database with the ${params.direction === 'pull' ? 'remote' : 'local'} version.`,
      `Source: ${maskMongoUri(params.sourceUri)} (${getDatabaseName(params.sourceUri)})`,
      `Target: ${maskMongoUri(params.targetUri)} (${getDatabaseName(params.targetUri)})`,
      `These target collections will be deleted first: ${formatCounts(params.targetCounts)}.`,
      `Collections included in this sync: ${params.collections.join(', ')}.`,
      'Are you sure? (Y/N): '
    ].join('\n')
  );

  if (answer.toLowerCase() !== 'y') {
    throw new Error('Sync cancelled.');
  }
}

async function verifyPushPassword() {
  if (!input.isTTY || !output.isTTY) {
    throw new Error('Production push requires an interactive terminal.');
  }

  const expectedPassword = requireEnv('SYNC_PUSH_PASSWORD');
  const enteredPassword = await prompt('Enter sync password to continue with production push: ');

  if (enteredPassword !== expectedPassword) {
    throw new Error('Incorrect sync password.');
  }
}

async function clearTarget(connection: Connection, collections: readonly string[]) {
  for (const collectionName of collections) {
    await connection.collection(collectionName).deleteMany({});
  }
}

async function copyCollection(source: Connection, target: Connection, collectionName: string) {
  const documents = await source.collection(collectionName).find({}).toArray();

  if (!documents.length) {
    return 0;
  }

  await target.collection(collectionName).insertMany(documents, { ordered: true });
  return documents.length;
}

async function main() {
  const direction = getSyncDirection();
  const collections = getCollections();
  const localUri = requireEnv('LOCAL_MONGODB_URI');
  const remoteUri = requireEnv('REMOTE_MONGODB_URI');

  const sourceUri = direction === 'pull' ? remoteUri : localUri;
  const targetUri = direction === 'pull' ? localUri : remoteUri;

  if (sourceUri === targetUri) {
    throw new Error('Source and target database URIs are the same. Refusing to sync.');
  }

  const source = await connect(sourceUri);
  const target = await connect(targetUri);

  try {
    if (direction === 'push') {
      await verifyPushPassword();
    }

    const targetCounts = await getCounts(target, collections);

    await confirmSync({
      direction,
      sourceUri,
      targetUri,
      targetLabel: direction === 'pull' ? 'local' : 'remote',
      targetCounts,
      collections
    });

    await clearTarget(target, collections);

    for (const collectionName of collections) {
      const copiedCount = await copyCollection(source, target, collectionName);
      console.log(`Synced ${collectionName}: ${copiedCount} document(s)`);
    }

    console.log(`Database sync complete: ${direction}`);
  } finally {
    await Promise.all([source.close(), target.close()]);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
