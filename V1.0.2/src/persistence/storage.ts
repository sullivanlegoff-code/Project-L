/** setItem must be atomic on failure, like Web Storage: old contents stay intact. */
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export const SAVE_KEY = 'prairie-lapins.save.v1';

// Keep the historical active key so existing browsers find their save after upgrading.
export const MIGRATION_BACKUP_KEY = 'prairie-lapins.backup.before-v2';
