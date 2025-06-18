/**
 * Opciók a fileBackupAdapter példányosításához.
 */
export interface FileBackupAdapterOptions {
  /** Backup mappa elérési útja (alapértelmezett: './data/backup') */
  backupFolder?: string;
  /** Backup időköz (perc, alapértelmezett: 60) */
  backupInterval?: number;
  /** Megtartandó backupok száma (alapértelmezett: 5) */
  maxBackups?: number;
  /** Naplózás bekapcsolása */
  verbose?: boolean;
}

/**
 * File alapú backup adapter factory.
 * @param options Beállítások
 */
declare function fileBackupAdapter(options?: FileBackupAdapterOptions): {
  /** Inicializálás, backup időzítő beállítása */
  init?: () => Promise<{ backupInterval?: number }>;
  /** Backup készítése */
  backup: (data: Record<string, any[]>) => Promise<void>;
};

export default fileBackupAdapter;
