/**
 * Opciók a fileStorageAdapter példányosításához.
 */
export interface FileStorageAdapterOptions {
  /** Adatmappa elérési útja (alapértelmezett: './data') */
  dataFolder?: string;
  /** Írási throttling idő (ms, alapértelmezett: 100) */
  throttle?: number;
  /** Naplózás bekapcsolása */
  verbose?: boolean;
}

/**
 * File alapú storage adapter factory.
 * @param options Beállítások
 */
declare function fileStorageAdapter(options?: FileStorageAdapterOptions): {
  /** Inicializálás, visszaadja a kollekciókat */
  init: () => Promise<any>;
  /** Új dokumentum beszúrása */
  insert: (params: { collectionName: string; collectionData: any[] }) => Promise<void>;
  /** Dokumentum frissítése */
  update: (params: { collectionName: string; collectionData: any[] }) => Promise<void>;
  /** Dokumentum törlése */
  delete: (params: { collectionName: string; collectionData: any[] }) => Promise<void>;
};

export default fileStorageAdapter;
