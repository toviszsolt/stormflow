# StormFlow

A Lightweight Data Modeling and Storage Library

## Introduction

StormFlow is a lightweight data modeling and storage library for Node.js. It provides a simple and
flexible way to create, query, and manage data collections with schemas. StormFlow is particularly
well-suited for small to medium-sized projects where you need a data storage solution without the
complexity of a full-fledged database.

<!-- StormFlow is a versatile Node.js data management library designed for efficient data handling and
persistence. It provides a robust framework for creating, updating, querying, and storing data
collections, along with built-in support for data schema management. With StormFlow, you can
streamline data operations and enhance data integrity in your Node.js applications, making it an
essential tool for full-stack developers. -->

## Features

- **Data Modeling:** Define data schemas using the Schema module to ensure data consistency and
  structure.

- **Data Collection:** Create and manage collections of data with CRUD (Create, Read, Update,
  Delete) operations.

- **Middleware Support:** Add custom pre and post middleware functions to intercept and modify data
  operations.

- **Querying:** Use powerful queries to retrieve data from collections based on criteria.

- **Data Persistence:** StormFlow supports data persistence to disk, allowing you to store and
  retrieve data even after the application restarts.

- **References:** Easily handle references between objects in your data model.

## Compatibility

This package includes both `ES modules` and `CommonJS` versions, so you can safely use both
`require` and `import` statements in any environment. In the examples I'll use the `require` syntax,
so don't be scared, feel free to use the `import` syntax if you like, that will work too. TypeScript
support is also available.

## Getting Started

### Installation

To get started with StormFlow, you can install it using yarn or npm:

```bash
yarn add stormflow
```

```bash
npm i stormflow
```

### Initializing StormFlow

Before using StormFlow, you need to initialize it with your configuration. Here's an example of how
to start StormFlow with default options:

```js
const db = require('stormflow');

db.start({ dataFolder: './data_blog' });
```

You can also provide custom configuration options when initializing StormFlow.

### Creating Models

StormFlow allows you to define data models with schemas. Schemas help validate and structure your
data. Here's an example of creating a model with a schema:

```js
const db = require('stormflow');

const userSchema = db.Schema({
  name: String,
  email: {
    type: String,
    required: true,
  },
  age: Number,
})

const User = db.model('user', userSchema});
```

CRUD Operations Once you've defined a model, you can perform CRUD (Create, Read, Update, Delete)
operations on your data. Here are some examples:

```js
// Create a new user
const newUser = await User.create({ name: 'John', email: 'john@example.com' });

// Find users based on a query
const users = await User.find({ age: { $gte: 18 } });

// Update a user
const updatedUser = await User.update({ _id: newUser._id }, { age: 30 });

// Delete a user
const deletedUser = await User.deleteOne({ _id: newUser._id });
```

### Middleware

StormFlow supports middleware functions that can be executed before or after CRUD operations. You
can register middleware functions for your models. For example:

```js
User.pre('create', async (user, next) => {
  // Do something before creating a user
  console.log('Creating user:', user.name);
  next();
});

User.post('update', async (user, next) => {
  // Do something after updating a user
  console.log('User created:', user.name);
  next();
});
```

## File-Based Storage

StormFlow supports file-based storage, allowing you to persist your data. By default, StormFlow will
store data in a 'data' directory in your project's root.

## Statistics

You can retrieve statistics about disk writes and skipped writes using StormFlow's stats feature.

```js
const stats = db.stats();
console.log('Disk Writes in user collection:', stats.diskWrites.user);
console.log('Skipped Writes user collection:', stats.skippedWrites.user);
```

## Documentation

### start(options)

Initializes the module with the provided options.

#### Parameters

- `options` (Object, optional): An object with configuration options.

| Option              | Type    | Default    | Description                                                                          |
| ------------------- | ------- | ---------- | ------------------------------------------------------------------------------------ |
| `dataDirectory`     | String  | `'./data'` | The directory where data and backup files are stored.                                |
| `diskWrite`         | Boolean | `true`     | Enables or disables disk write operations.                                           |
| `diskWriteThrottle` | Number  | `100`      | Time interval (in milliseconds) for disk write throttling.                           |
| `backupFiles`       | Boolean | `true`     | Enables or disables backup file (GZip) creation.                                     |
| `defaultFields`     | Boolean | `true`     | Enables or disables make default `_created` and `_updated` fields as Unix timestamp. |
| `verbose`           | Boolean | `false`    | Enables or disables the verbose mode in console.                                     |

#### Example

```js
// Initialize the module with custom options
db.start({
  dataDirectory: './my-data',
  diskWrite: true,
  diskWriteThrottle: 200,
  backupFiles: false,
  defaultFields: false,
});
```

### Schema(schemaObj)

Creates a schema for data models. Pass an object defining the schema structure.

#### Parameters

- `schemaObj` (Object): An object defining the schema structure. The keys represent field names, and
  the values define field constraints.

#### Returns

A schema object that can be used when creating data models.

#### Example

```js
const db = require('db');

// Define a schema for a user model
const userSchema = db.Schema({
  name: String,
  age: Number,
  email: {
    type: String,
    required: true,
  },
  address: {
    street: String,
    city: String,
    zipCode: String,
  },
});

// Use the userSchema when creating a data model
const UserModel = db.model('users', userSchema);

// Create a new user
const newUser = UserModel.create({
  name: 'Alice',
  age: 28,
  email: 'alice@example.com',
  address: {
    street: '123 Main St',
    city: 'Exampleville',
    zipCode: '12345',
  },
});
```

### `model(collectionName, schema)`

Creates a data model for a collection based on the provided schema.

#### Parameters

- `collectionName` (String): The name of the collection. It is used to identify the collection and
  its associated data.
- `schema` (Object): The schema for the collection, defining the structure and constraints of its
  data.

#### Returns

An object with methods for performing CRUD (Create, Read, Update, Delete) operations on the
collection's data.

#### Example

```js
const db = require('db');

// Define a schema for a user model
const userSchema = db.Schema({
  name: String,
  age: Number,
  email: {
    type: String,
    required: true,
  },
});

// Create a data model for the "users" collection
const UserModel = db.model('users', userSchema);

// Create a new user
const newUser = UserModel.create({ name: 'Alice', age: 28, email: 'alice@example.com' });

// Find users matching a query
const usersAbove25 = UserModel.find({ age: { $gt: 25 } });

// Update a user's age
UserModel.update({ name: 'Alice' }, { age: 29 });

// Delete a user by ID
UserModel.deleteOne({ \_id: newUser.\_id });
```

Returns an object with the following methods:

- `create(items)`: Create new items in the collection.
- `find(query)`: Find items in the collection based on a query.
- `findById(id)`: Find an item by its ID.
- `findOne(query)`: Find the first item matching the query.
- `update(query, updates)`: Update items in the collection.
- `deleteOne(query)`: Delete one item matching the query.
- `deleteMany(query)`: Delete multiple items matching the query.

### Query Parameter

The query parameter is an essential part of data retrieval when using the functions provided by the
model object. It allows you to filter and search for specific data items within a collection based
on defined criteria.

#### Basic Query

A basic query consists of a JavaScript object where each key represents a field in the data, and the
corresponding value is the condition you want to apply to that field. Here's a breakdown:

- Field Key: This should be a string that matches a field name in your data schema.
- Condition Value: The value associated with the field key defines the condition for filtering data.
  It can be of various types, such as strings, numbers, booleans, or objects, depending on your
  schema.

#### Example

```js
// Find users with the name "John"
const johnUsers = UserModel.find({ name: 'John' });
```

In this example, we use a basic query to find all users whose name field matches the string 'John'.
The UserModel.find() method will return an array of user objects that meet this condition.

### Comparison Query Operators

You can create more complex queries by using operators like `$eq`, `$ne`, `$lt`, `$lte`, `$gt`,
`$gte`, `$in`, `$nin` and `$regex`. Here's how they work:

- `$eq` (Equal): Matches values that are equal to a specified value.
- `$ne` (Not Equal): Matches values that are not equal to a specified value.
- `$lt` (Less Than): Matches values less than the specified value.
- `$lte` (Less Than or Equal): Matches values less than or equal to the specified value.
- `$gt` (Greater Than): Matches values greater than the specified value.
- `$gte` (Greater Than or Equal): Matches values greater than or equal to the specified value.
- `$in` (In Array): Matches values that exist in the specified array.
- `$nin` (Not In Array): Matches values that not exist in the specified array.
- `$regex` (Regular Expression): Matches values using a regular expression pattern.

#### Examples

```js
// Find users younger than 30
const youngUsers = UserModel.find({ age: { $lt: 30 } });

// Find users with ages between 25 and 35
const midAgeUsers = UserModel.find({ $and: [{ age: { $gt: 25 } }, { age: { $lt: 35 } }] });

// Find users with specific emails
const specificEmailUsers = UserModel.find({
  email: { $in: ['john@example.com', 'alice@example.com'] },
});

// Find users with names starting with "A" using regex
const aNames = UserModel.find({ name: { $regex: '^A', $options: 'i' } });
```

In these examples, we use advanced queries to find users based on various conditions, such as age
range, email existence in an array, and names matching a regular expression pattern.

### Logical Query Operators

You can also use logical operators like `$and`, `$or`, `$not`, `$nor` to combine multiple conditions
within a single query.

- `$and`: the operator joins query clauses with a logical AND operator. It returns data that
  satisfies all of the specified conditions within the query.
- `$or`: the operator accepts an array of query objects and returns data that satisfies at least one
  of the conditions. It's used when you want to match documents that meet any of the specified
  conditions.
- `$not`: the operator joins query clauses with a logical NOT operator. It returns data that doesn't
  match the specified condition within the query. It's used to exclude documents that meet a certain
  condition.
- `$nor`: the operator joins query clauses with a logical NOR operator. It returns data that doesn't
  satisfy any of the conditions within the array. It's useful when you want to exclude documents
  that match any of the specified conditions.

#### Example

```js
// Find users with either age less than 25 or age greater than 40
const youngOrElderUsers = UserModel.find({
  $or: [{ age: { $lt: 25 } }, { age: { $gt: 40 } }],
});
```

In this example, we use the $or operator to find users who are either younger than 25 or older
than 40.

These query options provide powerful filtering capabilities for your data, allowing you to retrieve
specific records that meet your criteria efficiently.

#### Notes:

- When using multiple conditions in a query, the logical operators like $or help create complex
  queries to find data that matches any of the conditions.
- Combining basic and advanced queries allows for fine-grained data retrieval based on your schema's
  structure and the specific requirements of your application.
- Always refer to your schema definition to ensure that the field names and types in your query
  match the schema's structure.

  This concludes the documentation on how the query parameter works when using the model functions
  for data querying.

## stats()

Returns statistics about data operations, such as disk writes and skipped writes.

## Guidelines

To learn about the guidelines, please read the [Code of Conduct](./CODE_OF_CONDUCT.md),
[Contributing](./CONTRIBUTING.md) and [Security Policy](./SECURITY.md) documents.

## License

MIT License @ 2022 [Zsolt Tövis](https://github.com/toviszsolt)

If you found this project interesting, please consider supporting my open source work by
[sponsoring me on GitHub](https://github.com/sponsors/toviszsolt) /
[sponsoring me on PayPal](https://www.paypal.com/paypalme/toviszsolt) /
[give the repo a star](https://github.com/toviszsolt/stormflow).
