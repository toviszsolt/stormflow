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
    update(query: any, updates: any): Promise<any | any[]>;
    deleteOne(query: any): Promise<any>;
    deleteMany(query: any): Promise<any[]>;
  }

  interface StormFlowStats {
    diskWrites: { [key: string]: number };
    skippedWrites: { [key: string]: number };
  }

  function start(options?: Options): void;

  function model(collectionName: string, schema: SchemaDefinition): StormFlowModel;

  function stats(): StormFlowStats;

  const Schema: {
    (schemaObj: SchemaDefinition): SchemaDefinition;
  };

  export { Schema, model, start, stats };
}
