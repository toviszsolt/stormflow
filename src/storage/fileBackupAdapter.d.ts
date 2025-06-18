/**
 * Options for instantiating the fileBackupAdapter.
 */
export interface FileBackupAdapterOptions {
  /** Path to the backup folder (default: './data/backup') */
  backupFolder?: string;
  /** Backup interval in minutes (default: 60) */
  backupInterval?: number;
  /** Number of backups to keep (default: 5) */
  maxBackups?: number;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * File-based backup adapter factory.
 * @param options Configuration options
 */
declare function fileBackupAdapter(options?: FileBackupAdapterOptions): {
  /** Initialize backup timer and folder */
  init: () => Promise<{ backupInterval?: number }>;

  /** Create a backup from the provided data */
  backup: (data: Record<string, any[]>) => Promise<void>;
};

export default fileBackupAdapter;
