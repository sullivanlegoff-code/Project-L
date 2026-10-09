/** setItem must be atomic on failure, like Web Storage: old contents stay intact. */
export interface SaveStorage {
  readonly scope?: 'normal' | 'laboratory';
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  /** External changes only; returns a listener cleanup. */
  onChange?(key: string, listener: () => void): () => void;
}
export const SAVE_KEY = 'prairie-lapins.save.v1';

// Keep the historical active key so existing browsers find their save after upgrading.
export const MIGRATION_BACKUP_KEY = 'prairie-lapins.backup.before-v2';

export const MISSIONS_MIGRATION_BACKUP_KEY = 'prairie-lapins.backup.before-v3';

export const HABITATS_MIGRATION_BACKUP_KEY = 'prairie-lapins.backup.before-v4';
export const DECORATIONS_MIGRATION_BACKUP_KEY = 'prairie-lapins.backup.before-v5';

export const LAND_MIGRATION_BACKUP_KEY = 'prairie-lapins.backup.before-v6';
