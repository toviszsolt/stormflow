import Benchmark from 'benchmark';
import crypto from 'crypto';
import db from 'stormflow';

await db.start({ verbose: false });

const User = db.model(
  'users',
  db.Schema({
    name: { type: 'string' },
    age: { type: 'number' },
  }),
);

// Ensure 'Peter' exists for update/find benchmarks
const peterDoc = await User.insertOne({ name: 'Peter', age: 42 });

const suite = new Benchmark.Suite();

const oneDoc = { name: 'Teszt', age: 33 };
let inserted;

suite
  // Reference crypto benchmarks
  .add('crypto.randomBytes 32', () => {
    crypto.randomBytes(32);
  })
  .add('crypto.createHash("sha256")', () => {
    crypto.createHash('sha256').update('benchmark test string').digest('hex');
  })

  // StormFlow benchmarks
  .add('insertOne', {
    defer: true,
    fn: async (deferred) => {
      await User.insertOne(oneDoc);
      deferred.resolve();
    },
  })
  .add('find', {
    defer: true,
    fn: async (deferred) => {
      await User.find({ name: 'Peter' });
      deferred.resolve();
    },
  })
  .add('findById', {
    defer: true,
    fn: async (deferred) => {
      if (!inserted) inserted = await User.insertOne(oneDoc);
      await User.findById(inserted._id);
      deferred.resolve();
    },
  })
  .add('updateOne', {
    defer: true,
    fn: async (deferred) => {
      // Always update the existing Peter doc
      await User.updateOne({ _id: peterDoc._id }, { age: Math.random() * 100 });
      deferred.resolve();
    },
  })
  .add('findByIdAndDelete', {
    defer: true,
    fn: async (deferred) => {
      const doc = await User.insertOne(oneDoc);
      await User.findByIdAndDelete(doc._id);
      deferred.resolve();
    },
  })
  .on('cycle', (event) => {
    console.log(String(event.target));
  })
  .on('complete', function () {
    console.log('Benchmark completed.');
  })
  .run({ async: true });
