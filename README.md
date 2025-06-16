[![GitHub License](https://img.shields.io/github/license/toviszsolt/stormflow?style=flat)](https://github.com/toviszsolt/stormflow/blob/main/LICENSE)
[![npm](https://img.shields.io/npm/v/stormflow?style=flat&color=red)](https://www.npmjs.com/package/@toviszsolt/stormflow)
[![GitHub Repo stars](https://img.shields.io/github/stars/toviszsolt/stormflow?color=DAAA3F)](https://github.com/toviszsolt/stormflow/stargazers)
[![Run tests](https://github.com/toviszsolt/stormflow/actions/workflows/main.yml/badge.svg)](https://github.com/toviszsolt/stormflow/actions/workflows/main.yml)
[![codecov](https://codecov.io/gh/toviszsolt/stormflow/graph/badge.svg?token=IONV9YMZXG)](https://codecov.io/gh/toviszsolt/stormflow)
[![Sponsor](https://img.shields.io/static/v1?label=sponsor&message=❤&color=ff69b4)](https://github.com/sponsors/toviszsolt)

# StormFlow

A Lightweight Data Modeling and Storage Library for Node.js

## Introduction

StormFlow is a lightweight, flexible data modeling and storage library designed for Node.js applications. It enables you
to define data schemas, manage collections, and perform CRUD operations with ease, without the complexity of a full
database system.

Ideal for small to medium-sized projects, StormFlow provides persistent file-based storage with schema enforcement,
middleware support, and powerful querying capabilities.

## Features

- **Schema Definition:** Create strict or flexible data schemas to ensure data consistency.
- **Data Collections:** Manage collections with full CRUD support.
- **Middleware:** Add pre- and post-operation middleware hooks for custom logic.
- **Query Engine:** Perform advanced queries with comparison and logical operators.
- **File Persistence:** Automatically persist data to disk with configurable backups.
- **References:** Handle references between documents seamlessly.
- **Universal Compatibility:** Supports CommonJS and ES modules, plus TypeScript typings.

## Installation

Install StormFlow via npm or yarn:

```bash
npm install stormflow
# or
yarn add stormflow
```

## Getting Started

### Initialization

Initialize StormFlow with optional configuration:

```js
const db = require('stormflow');

db.start({
  dataDirectory: './data_blog', // Default is './data'
  diskWrite: true, // Enable or disable disk writes
  diskWriteThrottle: 100, // Throttle disk writes in ms
  backupFiles: true, // Enable backup files
  defaultFields: true, // Auto add _created and _updated timestamps
  verbose: false, // Enable verbose logging
  strict: false, // Enforce strict schema validation
});
```

### Defining Schemas and Models

Define schemas using the `Schema` function to enforce structure:

```js
const userSchema = db.Schema({
  name: { type: 'string', required: true },
  email: { type: 'string', required: true, unique: true },
  age: { type: 'number', default: 0 },
  friends: [{ type: 'string', $ref: 'user' }], // Reference to other users
});
```

Create a model tied to a collection and schema:

```js
const User = db.model('users', userSchema);
```

### CRUD Operations

You can perform standard CRUD operations asynchronously:

```js
// Create a user
const newUser = await User.insertOne({ name: 'John Doe', email: 'john@example.com', age: 30 });

// Find users older than 18
const adults = await User.find({ age: { $gte: 18 } });

// Update a user by ID
const updatedUser = await User.findByIdAndUpdate(newUser._id, { age: 31 });

// Delete a user by ID
await User.findByIdAndDelete(newUser._id);
```

### Model Methods

The object returned by `model(collectionName, schema)` supports the following asynchronous methods:

| Method                                | Parameters                                                                                | Description                                                      |
| ------------------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `insertOne(item)`                     | `item: any`                                                                               | Insert a single document into the collection.                    |
| `insertMany(items)`                   | `items: any[]`                                                                            | Insert multiple documents at once.                               |
| `find(query)`                         | `query: object`                                                                           | Find all documents matching the query, with references resolved. |
| `findById(id)`                        | `id: string`                                                                              | Find a document by its unique ID.                                |
| `findOne(query)`                      | `query: object`                                                                           | Find the first document matching the query.                      |
| `findByIdAndReplace(id, replacement)` | `id: string, replacement: any`                                                            | Replace a document by ID with a new one.                         |
| `findByIdAndUpdate(id, updates)`      | `id: string, updates: any`                                                                | Update fields of a document by ID.                               |
| `findByIdAndDelete(id)`               | `id: string`                                                                              | Delete a document by its ID.                                     |
| `updateOne(query, updates)`           | `query: object, updates: any`                                                             | Update one document matching the query.                          |
| `updateMany(query, updates)`          | `query: object, updates: any`                                                             | Update multiple documents matching the query.                    |
| `replaceOne(query, replacement)`      | `query: object, replacement: any`                                                         | Replace one document matching the query.                         |
| `replaceMany(query, replacement)`     | `query: object, replacement: any`                                                         | Replace multiple documents matching the query.                   |
| `deleteOne(query)`                    | `query: object`                                                                           | Delete one document matching the query.                          |
| `deleteMany(query)`                   | `query: object`                                                                           | Delete multiple documents matching the query.                    |
| `count(query)`                        | `query: object`                                                                           | Count documents matching the query.                              |
| `exists(query)`                       | `query: object`                                                                           | Check if at least one document matches the query.                |
| `pre(method, fn)`                     | `method: 'create' \| 'read' \| 'update' \| 'replace' \| 'delete', fn: MiddlewareFunction` | Register a middleware function before the given action.          |
| `post(method, fn)`                    | `method: 'create' \| 'read' \| 'update' \| 'replace' \| 'delete', fn: MiddlewareFunction` | Register a middleware function after the given action.           |

### Middleware Support

Register middleware to run before or after operations:

```js
User.pre('create', async (doc) => {
  console.log('Before creating user:', doc);
});

User.post('update', async (doc) => {
  console.log('After updating user:', doc);
});
```

Supported middleware methods: `'create' | 'read' | 'update' | 'replace' | 'delete'`.

### Querying

StormFlow supports rich queries with comparison and logical operators.

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
// Find users either younger than 20 or older than 60
const result = await User.find({
  $or: [{ age: { $lt: 20 } }, { age: { $gt: 60 } }],
});
```

### File-Based Storage

Data is stored in the configured `dataDirectory` (default: `./data`), with automatic backups if enabled.

### Statistics

Retrieve runtime statistics about disk and skipped writes:

```js
const stats = await db.stats();
console.log('Disk Writes:', stats.diskWrites);
console.log('Skipped Writes:', stats.skippedWrites);
```

## API Reference

### `start(options?: Options): void`

Starts StormFlow with optional configuration.

### `setConfig(options: Options): void`

Update runtime configuration.

### `getConfig(): Options`

Get current configuration.

### `stats(): Promise<StormFlowStats>`

Get operation statistics.

### `Schema(definition: SchemaDefinition): SchemaDefinition`

Create a schema definition.

### `model(name: string, schema?: SchemaDefinition): StormFlowModel`

Create or get a model bound to a collection.

## Guidelines

To learn about the guidelines, please read the [Code of Conduct](./CODE_OF_CONDUCT.md),
[Contributing](./CONTRIBUTING.md) and [Security Policy](./SECURITY.md) documents.

## License

MIT License @ 2022 [Zsolt Tövis](https://github.com/toviszsolt)

If you found this project interesting, please consider supporting my open source work by
[sponsoring me on GitHub](https://github.com/sponsors/toviszsolt) /
[sponsoring me on PayPal](https://www.paypal.com/paypalme/toviszsolt) /
[give the repo a star](https://github.com/toviszsolt/stormflow).
