import Benchmark from 'benchmark';
import { uniqueId } from '../src/utils/hash.js';
import { objClone, objPathResolve, objPathSet, objTraverse } from '../src/utils/object.js';
import { getType } from '../src/utils/type.js';
import { timeFromStr, timeNow, timeToDateObj, timeToDateStr } from '../src/utils/unixtime.js';

const object = { a: 1, b: 2, c: [1, 2], d: { a: 1, b: 2 } };
const collection = Array(10000).fill(objClone(object));
const query = { a: { $eq: 1 } };

const runSuite1 = () => {
  new Benchmark.Suite('getType vs typeof')
    .add('typeof plain object', () => {
      typeof object === 'object' && !Array.isArray(object) && object !== null;
    })
    .add('getType plain object', () => {
      getType(object);
    })
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
      runSuite2();
    })
    .run({ async: true });
};

const runSuite2 = () => {
  new Benchmark.Suite('Other utils')
    .add('uniqueId', () => {
      uniqueId();
    })
    .add('timeNow', () => {
      timeNow();
    })
    .add('timeFromStr', () => {
      timeFromStr('2024-02-28T12:00:00Z');
    })
    .add('timeToDateObj', () => {
      timeToDateObj(1646044800);
    })
    .add('timeToDateStr', () => {
      timeToDateStr(1646044800);
    })
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Other utils benchmark done.\n');
      runSuite3();
    })
    .run({ async: true });
};

const runSuite3 = () =>
  new Benchmark.Suite('Object utils')
    .add('objTraverse', () => {
      objTraverse(object, () => {});
    })
    .add('objPathResolve', () => {
      objPathResolve(object, 'a.b.c');
    })
    .add('objPathSet', () => {
      objPathSet(object, 'd.a', 123);
    })
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Object utils benchmark done.\n');
      runSuite4();
    })
    .run({ async: true });

const runSuite4 = () => {
  new Benchmark.Suite('Object cloning')
    .add('JSON clone', () => {
      JSON.parse(JSON.stringify(object));
    })
    .add('structuredClone', () => {
      structuredClone(object);
    })
    .add('objClone', () => {
      objClone(object);
    })
    .on('cycle', (event) => {
      console.log(String(event.target));
    })
    .on('complete', function () {
      console.log('Fastest is ' + this.filter('fastest').map('name'));
    })
    .run({ async: true });
};

runSuite1();
