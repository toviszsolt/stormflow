[![GitHub License](https://img.shields.io/github/license/toviszsolt/stormflow?style=flat)](https://github.com/toviszsolt/stormflow/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/stormflow?style=flat&color=red)](https://www.npmjs.com/package/@toviszsolt/stormflow)
[![GitHub Repo stars](https://img.shields.io/github/stars/toviszsolt/stormflow?color=DAAA3F)](https://github.com/toviszsolt/stormflow/stargazers)
[![Run tests](https://github.com/toviszsolt/stormflow/actions/workflows/main.yml/badge.svg)](https://github.com/toviszsolt/stormflow/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/toviszsolt/stormflow/branch/main/graph/badge.svg?token=IONV9YMZXG)](https://codecov.io/gh/toviszsolt/stormflow)
[![Sponsor](https://img.shields.io/static/v1?label=sponsor&message=❤&color=ff69b4)](https://github.com/sponsors/toviszsolt)

# Stormflow

A lightweight, flexible data modeling and storage library for Node.js applications. Stormflow enables you to define data
schemas, manage collections, and perform CRUD operations easily, without the overhead of a full database system.

## Key Features

- **Schema Definition:** Strict or flexible schemas for data consistency.
- **Data Collections:** Full CRUD support for collections.
- **Middleware:** Pre- and post-operation hooks for custom logic.
- **Query Engine:** Advanced queries with comparison and logical operators.
- **File Persistence:** Data is persisted to disk with optional backups.
- **References:** Seamless handling of document references.
- **Universal Compatibility:** Works with CommonJS, ES modules, and TypeScript.

## Installation

Install via npm or yarn:

```bash
npm install stormflow
# or
yarn add stormflow
```

## Getting Started

### Initialization

```js
import db from 'stormflow';

await db.start({
  strict: false, // Enforce strict schema validation
  defaultFields: true, // Auto add _created/_updated timestamps
  verbose: false, // Verbose logging
});
```

### Defining Schemas and Models

```js
const userSchema = db.Schema({
  name: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  age: { type: 'number', default: 0 },
  friends: [{ type: 'string', $ref: 'user' }],
});

const User = db.model('users', userSchema);
```

### CRUD Operations

```js
const newUser = await User.insertOne({ name: 'John Doe', email: 'john@example.com', age: 30 });
const adults = await User.find({ age: { $gte: 18 } });
const updatedUser = await User.findByIdAndUpdate(newUser._id, { age: 31 });
await User.findByIdAndDelete(newUser._id);
```

### Model Methods

| Method                                | Description                                    |
| ------------------------------------- | ---------------------------------------------- |
| `insertOne(item)`                     | Insert a single document.                      |
| `insertMany(items)`                   | Insert multiple documents.                     |
| `find(query)`                         | Find all documents matching the query.         |
| `findById(id)`                        | Find a document by its unique ID.              |
| `findOne(query)`                      | Find the first document matching the query.    |
| `findByIdAndReplace(id, replacement)` | Replace a document by ID.                      |
| `findByIdAndUpdate(id, updates)`      | Update fields of a document by ID.             |
| `findByIdAndDelete(id)`               | Delete a document by its ID.                   |
| `updateOne(query, updates)`           | Update one document matching the query.        |
| `updateMany(query, updates)`          | Update multiple documents matching the query.  |
| `replaceOne(query, replacement)`      | Replace one document matching the query.       |
| `replaceMany(query, replacement)`     | Replace multiple documents matching the query. |
| `deleteOne(query)`                    | Delete one document matching the query.        |
| `deleteMany(query)`                   | Delete multiple documents matching the query.  |
| `count(query)`                        | Count documents matching the query.            |
| `exists(query)`                       | Check if at least one document matches.        |
| `pre(method, fn)`                     | Register middleware before the given action.   |
| `post(method, fn)`                    | Register middleware after the given action.    |

### Middleware

Register middleware for operations:

```js
User.pre('create', async (doc) => {
  // Before creating user
});

User.post('update', async (doc) => {
  // After updating user
});
```

Supported methods: `'create' | 'read' | 'update' | 'replace' | 'delete'`.

### Querying

Stormflow supports rich queries with comparison and logical operators.

#### Comparison Operators

| Operator | Description                |
| -------- | -------------------------- |
| `$eq`    | Equal                      |
| `$ne`    | Not equal                  |
| `$lt`    | Less than                  |
| `$lte`   | Less than or equal         |
| `$gt`    | Greater than               |
| `$gte`   | Greater than or equal      |
| `$in`    | Value in array             |
| `$nin`   | Value not in array         |
| `$regex` | Matches regular expression |

#### Logical Operators

| Operator | Description |
| -------- | ----------- |
| `$and`   | Logical AND |
| `$or`    | Logical OR  |
| `$not`   | Logical NOT |
| `$nor`   | Logical NOR |

##### Example Query

```js
const result = await User.find({
  $or: [{ age: { $lt: 20 } }, { age: { $gt: 60 } }],
});
```

### Storage Adapters

Stormflow uses a pluggable storage adapter system. The default file-based storage is implemented via a storage adapter,
but you can provide your own adapter for custom persistence.

#### File Storage Adapter

The file storage adapter persists collections in a specified directory. You can configure the location and behavior via
options.

Example usage:

```js
import fileStorageAdapter from 'stormflow/adapters/fileStorageAdapter';
const adapter = fileStorageAdapter({
  dataFolder: './data', // default: './data'
  throttle: 100, // ms, default: 100
  verbose: false, // logging
});
```

#### File Backup Adapter

For automatic backups, use the file backup adapter:

```js
import fileBackupAdapter from 'stormflow/adapters/fileBackupAdapter';
const backup = fileBackupAdapter({
  backupFolder: './data/backup', // default
  backupInterval: 60, // minutes
  maxBackups: 5, // how many to keep
  verbose: false,
});
```

> See the `src/storage/fileStorageAdapter.d.ts` and `fileBackupAdapter.d.ts` for full API details.

### Example: Using file-based storage and backup adapter

```js
import db from 'stormflow';
import fileStorageAdapter from 'stormflow/adapters/fileStorageAdapter';
import fileBackupAdapter from 'stormflow/adapters/fileBackupAdapter';

const storage = fileStorageAdapter({
  dataFolder: './data',
  throttle: 100,
  verbose: false,
});

const backup = fileBackupAdapter({
  backupFolder: './data/backup',
  backupInterval: 60,
  maxBackups: 5,
  verbose: false,
});

await db.start({}, storage, backup);
```

## API Reference

- `start(options?: Options, storageAdapter?: any, backupAdapter?: any): Promise<void>` — Start Stormflow with
  configuration.
- `setConfig(options: Options): void` — Update configuration at runtime.
- `getConfig(): Options` — Get current configuration.
- `Schema(definition: SchemaDefinition): SchemaDefinition` — Create a schema.
- `model(name: string, schema?: SchemaDefinition): StormflowModel` — Create or get a model.

## Guidelines

See [Code of Conduct](./CODE_OF_CONDUCT.md), [Contributing](./CONTRIBUTING.md), and [Security Policy](./SECURITY.md).

## License

MIT License © 2022–2024 [Zsolt Tövis](https://github.com/toviszsolt)

If you find this project useful, please consider [sponsoring me on GitHub](https://github.com/sponsors/toviszsolt),
[PayPal](https://www.paypal.com/paypalme/toviszsolt), or
[give the repo a star](https://github.com/toviszsolt/stormflow).
