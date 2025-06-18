import blockedAt from 'blocked-at';
import { performance } from 'perf_hooks';
import fileBackupAdapter from '../src/storage/fileBackupAdapter.js';
import fileStorageAdapter from '../src/storage/fileStorageAdapter.js';
import db from '../src/stormflow.js';

const startInit = performance.now();
const tableData = [];

await db.start(
  { verbose: true },
  // fileStorageAdapter({ verbose: true }),
  // fileBackupAdapter({ verbose: true, backupInterval: 1 }),
);

const memUsage = process.memoryUsage();
const endInit = performance.now();

console.log(`Memory RSS: ${formatBytes(memUsage.rss)}`);
console.log(`→ Start time: ${Math.round(endInit - startInit)} ms`);

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024,
    dm = 2,
    sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function formatHundreds(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

function calculateOpsPerSec(start, end, itemCount) {
  const duration = end - start;
  const ops = itemCount / (duration / 1000);
  return formatHundreds(Math.round(ops));
}

async function benchmark() {
  try {
    const testCollection = db.model('testitems', {
      name: { type: 'string' },
      value: { type: 'number' },
    });

    const itemCount = 1_000_000;
    const batchSize = 50_000;

    // Optional warm-up
    await testCollection.insertMany([
      { name: 'warmup', value: 0.123 },
      { name: 'warmup', value: 0.789 },
    ]);
    await testCollection.deleteMany({ name: 'warmup' });

    console.log(`Starting insert of ${itemCount} items in batches of ${batchSize}...`);

    let inserted = 0;
    const startBatchInsert = performance.now();

    while (inserted < itemCount) {
      const batch = [];

      for (let i = 0; i < batchSize && inserted + i < itemCount; i++) {
        batch.push({
          name: `name-${inserted + i}`,
          value: Math.random(),
        });
      }

      const startInsert = performance.now();
      await testCollection.insertMany(batch);
      inserted += batch.length; // fix: actual inserted count

      if (inserted % 100_000 === 0) {
        const endInsert = performance.now();
        const memUsage = process.memoryUsage();
        console.log(
          `Inserted ${formatHundreds(inserted)} items in ${Math.round(
            endInsert - startInsert,
          )} ms. Memory RSS: ${formatBytes(memUsage.rss)}`,
        );
      }
    }

    const endBatchInsert = performance.now();

    tableData.push({
      action: 'Insert',
      records: `${formatHundreds(itemCount)} items`,
      duration: `${Math.round(endBatchInsert - startBatchInsert)} ms`,
      ops: `${calculateOpsPerSec(startBatchInsert, endBatchInsert, itemCount)} ops/sec`,
    });

    // Query find benchmark
    const queryStart = performance.now();
    const found = await testCollection.find({ value: { $gte: 0.5 } });
    const queryEnd = performance.now();

    tableData.push({
      action: 'Query find',
      records: `${formatHundreds(found?.length || 0)} items`,
      duration: `${Math.round(queryEnd - queryStart)} ms`,
      ops: `${calculateOpsPerSec(queryStart, queryEnd, found?.length || 0)} ops/sec`,
    });

    // Update benchmark
    const updateStart = performance.now();
    const updates = await testCollection.updateMany({ value: { $lt: 0.5 } }, { value: 5 });
    const updateEnd = performance.now();

    const updateCount = Array.isArray(updates) ? updates.length : updates?.modifiedCount || 0;

    tableData.push({
      action: 'Update',
      records: `${formatHundreds(updateCount)} items`,
      duration: `${Math.round(updateEnd - updateStart)} ms`,
      ops: `${calculateOpsPerSec(updateStart, updateEnd, updateCount)} ops/sec`,
    });

    // Replace benchmark
    const replaceStart = performance.now();
    const replaces = await testCollection.replaceMany({ value: { $gte: 5 } }, { value: 10 });
    const replaceEnd = performance.now();

    const replaceCount = Array.isArray(replaces) ? replaces.length : replaces?.modifiedCount || 0;

    tableData.push({
      action: 'Replace',
      records: `${formatHundreds(replaceCount)} items`,
      duration: `${Math.round(replaceEnd - replaceStart)} ms`,
      ops: `${calculateOpsPerSec(replaceStart, replaceEnd, replaceCount)} ops/sec`,
    });

    // Delete benchmark
    const deleteStart = performance.now();
    const deletes = await testCollection.deleteMany({ value: { $gte: 0.9 } });
    const deleteEnd = performance.now();

    const deleteCount = Array.isArray(deletes) ? deletes.length : deletes?.deletedCount || 0;

    tableData.push({
      action: 'Delete',
      records: `${formatHundreds(deleteCount)} items`,
      duration: `${Math.round(deleteEnd - deleteStart)} ms`,
      ops: `${calculateOpsPerSec(deleteStart, deleteEnd, deleteCount)} ops/sec`,
    });

    const memEnd = process.memoryUsage();
    console.log(`Final Memory Usage - RSS: ${formatBytes(memEnd.rss)}, HeapUsed: ${formatBytes(memEnd.heapUsed)}`);

    const keys = Object.keys(tableData[0]);

    const maxLengths = {};
    for (const key of keys) {
      maxLengths[key] = Math.max(key.length, ...tableData.map((item) => String(item[key]).length));
    }

    tableData.forEach((item) => {
      for (const key of keys) {
        if (key === 'action') continue;
        item[key] = String(item[key]).padStart(maxLengths[key]);
      }
    });

    console.table(tableData);
  } catch (err) {
    console.error('Benchmark error:', err);
  }
}

// blockedAt(
//   (time, stack) => {
//     console.log(`Event loop blokkolva ${time} ms-ig!`);
//     console.log(stack);
//   },
//   { threshold: 25 },
// );

benchmark();
