/**
 * Options for instantiating the fileStorageAdapter.
 */
export interface FileStorageAdapterOptions {
  /** Path to the data folder (default: './data') */
  dataFolder?: string;
  /** Write throttling time in ms (default: 100) */
  throttle?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * File-based storage adapter factory.
 * @param options Settings
 */
declare function fileStorageAdapter(options?: FileStorageAdapterOptions): {
  /** Initialize and restore collections */
  init: () => Promise<any>;
  /** Insert new documents */
  insert: (params: { collectionName: string; collectionData: any[] }) => Promise<void>;
  /** Update documents */
  update: (params: { collectionName: string; collectionData: any[] }) => Promise<void>;
  /** Delete documents */
  delete: (params: { collectionName: string; collectionData: any[] }) => Promise<void>;
};

export default fileStorageAdapter;
