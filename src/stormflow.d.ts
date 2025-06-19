/**
 * Configuration options for initializing StormFlow.
 */
export interface Options {
  /** Automatically add default metadata fields (_created, _updated) */
  defaultFields?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Enforce strict schema validation */
  strict?: boolean;
}

/**
 * Definition of a single schema field.
 */
export type TypeKeyword =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | StringConstructor
  | NumberConstructor
  | BooleanConstructor
  | DateConstructor
  | ArrayConstructor
  | ObjectConstructor;

export interface SchemaField {
  /** Data type (e.g., 'string', 'number', 'boolean', 'date', 'array', 'object') */
  type: TypeKeyword;
  /** Whether the field is required */
  required?: boolean;
  /** Default value for the field */
  default?: any;
  /** Reference to another collection name */
  $ref?: string;
  /** Whether the field must be unique */
  unique?: boolean;
}

/**
 * Full schema definition for a collection, allowing nested or array types.
 */
export interface SchemaDefinition {
  [key: string]:
    | SchemaField
    | SchemaDefinition
    | [SchemaField]
    | 'string'
    | 'number'
    | 'boolean'
    | 'date'
    | 'array'
    | 'object'
    | StringConstructor
    | NumberConstructor
    | BooleanConstructor
    | DateConstructor
    | ArrayConstructor
    | ObjectConstructor;
}

/**
 * Signature for middleware functions.
 * Called before or after operations, receives the item and should resolve when done.
 */
export type MiddlewareFunction = (item: any) => Promise<void>;

/**
 * Interface representing a collection model.
 */
export interface StormFlowModel {
  /**
   * Register a middleware function to run before the specified action.
   * @param method One of 'create', 'read', 'update', 'replace', 'delete' vagy '*'
   * @param fn Middleware function to execute
   */
  pre(method: 'create' | 'read' | 'update' | 'replace' | 'delete' | '*', fn: MiddlewareFunction): void;
  /**
   * Register a middleware function to run after the specified action.
   * @param method One of 'create', 'read' | 'update' | 'replace' | 'delete' vagy '*'
   * @param fn Middleware function to execute
   */
  post(method: 'create' | 'read' | 'update' | 'replace' | 'delete' | '*', fn: MiddlewareFunction): void;
  /** Inserts a single document */
  insertOne(item: any): Promise<any>;
  /** Inserts multiple documents */
  insertMany(items: any[]): Promise<any[]>;
  /** Finds all documents matching the query, with references resolved */
  find(query: any): Promise<any[]>;
  /** Finds one document by its ID, with references resolved */
  findById(id: string): Promise<any>;
  /** Finds the first document matching the query */
  findOne(query: any): Promise<any>;
  /** Replaces a document by its ID */
  findByIdAndReplace(id: string, replacement: any): Promise<any>;
  /** Updates a document by its ID */
  findByIdAndUpdate(id: string, updates: any): Promise<any>;
  /** Deletes a document by its ID */
  findByIdAndDelete(id: string): Promise<any>;
  /** Updates a single document matching the query */
  updateOne(query: any, updates: any): Promise<any>;
  /** Updates multiple documents matching the query */
  updateMany(query: any, updates: any): Promise<any[]>;
  /** Replaces a single document matching the query */
  replaceOne(query: any, replacement: any): Promise<any>;
  /** Replaces multiple documents matching the query */
  replaceMany(query: any, replacement: any): Promise<any[]>;
  /** Deletes a single document matching the query */
  deleteOne(query: any): Promise<any>;
  /** Deletes multiple documents matching the query */
  deleteMany(query: any): Promise<any[]>;
  /** Counts documents matching the query */
  count(query: any): Promise<number>;
  /** Checks if at least one document matches the query */
  exists(query: any): Promise<boolean>;
}

/**
 * Utility functions provided by StormFlow.
 */
export interface StormFlowUtils {
  /** Deep-clone an object or array */
  objClone(obj: any): any;
  /** Get value from object by dot-notated path */
  objPathResolve(obj: any, path: string): any;
  /** Set or delete value in object by dot-notated path */
  objPathSet(obj: any, path: string, value: any): void;
  /** Traverse object or array and invoke callback with metadata about each node */
  objTraverse(obj: any, callback: (meta: any) => void): void;
  /** Generate a unique 12-character hexadecimal ID */
  uniqueId(): string;
  /** Get current UNIX timestamp (seconds) */
  timeNow(): number;
  /** Convert UNIX timestamp (seconds) to JS Date object */
  timeToDateObj(unix: number): Date;
  /** Parse a date string into a UNIX timestamp (seconds) */
  timeFromStr(dateStr: string): number;
  /**
   * Format a UNIX timestamp according to a pattern.
   * @param unix UNIX timestamp (seconds)
   * @param format Format string, supports tokens like YYYY, MM, DD, etc.
   */
  timeToDateStr(unix: number, format?: string): string;
}

/**
 * Initializes StormFlow with the given options and optional storage/backup adapters.
 * @param options The options to merge.
 * @param storageAdapter Optional storage adapter instance.
 * @param backupAdapter Optional backup adapter instance.
 */
export function start(options?: Options, storageAdapter?: any, backupAdapter?: any): Promise<void>;

/**
 * Update the runtime configuration.
 * @param options Configuration options.
 */
export function setConfig(options: Options): void;

/**
 * Retrieve the current configuration.
 * @returns Current configuration options.
 */
export function getConfig(): Options;

/**
 * Create a schema definition to enforce on a model.
 * @param definition The schema definition object.
 * @returns The same schema object (for chaining).
 */
export function Schema(definition: SchemaDefinition): SchemaDefinition;

/**
 * Obtain a model bound to a collection name and optional schema.
 * @param name Name of the collection.
 * @param schema Optional schema definition to enforce.
 * @returns The collection model.
 */
export function model(name: string, schema?: SchemaDefinition): StormFlowModel;

/** Utility functions namespace */
export const utils: StormFlowUtils;

/** Default export as an object matching the JS export */
declare const _default: {
  start: typeof start;
  setConfig: typeof setConfig;
  getConfig: typeof getConfig;
  Schema: typeof Schema;
  model: typeof model;
  utils: typeof utils;
};

export default _default;
