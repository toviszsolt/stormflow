/**
 * THIS FILE IS DEPRECIATED AND WILL BE REMOVED
 */
declare module 'stormflow' {
  interface Options {
    dataDirectory?: string;
    diskWrite?: boolean;
    diskWriteThrottle?: number;
    backupFiles?: boolean;
    backupInterval?: number;
    defaultFields?: boolean;
    verbose?: boolean;
  }

  interface SchemaField {
    type: string;
    required?: boolean;
    default?: any;
    ref?: string;
  }

  interface SchemaDefinition {
    [key: string]: SchemaField;
  }

  interface MiddlewareFunction {
    (item: any, next: () => Promise<void>): Promise<void>;
  }

  interface StormFlowModel {
    pre(method: string, fn: MiddlewareFunction): void;
    post(method: string, fn: MiddlewareFunction): void;
    create(items: any | any[]): Promise<any | any[]>;
    find(query: any): Promise<any[]>;
    findById(id: string): Promise<any>;
    findOne(query: any): Promise<any>;
    count(query: any): Promise<any>;
    exists(query: any): Promise<any>;
    update(query: any, updates: any): Promise<any | any[]>;
    deleteOne(query: any): Promise<any>;
    deleteMany(query: any): Promise<any[]>;
  }

  interface StormFlowStats {
    diskWrites: { [key: string]: number };
    skippedWrites: { [key: string]: number };
  }

  interface StormFlowUtils {
    unixNow(): number;
    unixFromStr(dateStr: string): number;
    unixToDateObj(unixTimestamp?: number): Date;
    unixToDateStr(unixTimestamp: number, format: string): string;
    deepClone<T>(obj: T): T;
    Serialize<T>(obj: T): T;
    uniqueId(): string;
  }

  function start(options?: Options): void;

  function model(collectionName: string, schema?: SchemaDefinition): StormFlowModel;

  function stats(): StormFlowStats;

  const utils: StormFlowUtils;

  const Schema: {
    (schemaObj: SchemaDefinition): SchemaDefinition;
  };

  export { Schema, model, start, stats, utils };
}
