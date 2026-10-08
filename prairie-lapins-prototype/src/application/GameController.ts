import {HABITATS_MIGRATION_BACKUP_KEY, DECORATIONS_MIGRATION_BACKUP_KEY} from '../persistence/storage';
import {act, advance, createGame, decodeGame, encodeGame} from '../simulation';
import {MAX_JSON_LENGTH, type DecodeResult} from '../persistence/json';
import {MIGRATION_BACKUP_KEY, MISSIONS_MIGRATION_BACKUP_KEY, SAVE_KEY, type SaveStorage} from '../persistence/storage';
import type {ActionResult, Command, GameState} from '../state/types';

type DecodeFailure = Extract<DecodeResult, {ok: false}>['reason'];
export type ControllerIssue = DecodeFailure | 'READ_FAILED' | 'WRITE_FAILED' | 'STORAGE_CHANGED' |
  'NO_GAME' | 'NOT_CONFIRMED' | 'STALE_IMPORT' | 'DISPOSED' | 'ENCODING_FAILED';
export type Operation = {ok: true} | {ok: false; reason: ControllerIssue};
export type SaveStatus = 'saved' | 'unsaved' | 'read-error' | 'write-error' | 'invalid-save' | 'conflict';
export interface Snapshot {
  state: GameState | null; status: SaveStatus; issue: ControllerIssue | null;
  lastSavedAt: number | null; dirty: boolean; hasUnreadableBackup: boolean;
}
export interface ImportSummary {hearts: number; pattes: number; grass: number; rabbits: number; discovered: GameState['discovered']}
export type PreparedImport = {ok: true; token: number; summary: ImportSummary} | {ok: false; reason: ControllerIssue};

/** Owns the only mutable game reference. No Phaser, DOM, timers or browser APIs. */
export class GameController {
  private state: GameState | null = null;
  private status: SaveStatus = 'unsaved';
  private issue: ControllerIssue | null = null;
  private lastSavedAt: number | null = null;
  private dirty = false;
  private storedRaw: string | null = null;
  private hasRead = false;
  private disposed = false;
  private importSequence = 0;
  private pendingImport: {token: number; state: GameState; legacyJson?: string} | null = null;
  private listeners = new Set<(snapshot: Snapshot) => void>();

  constructor(private storage: SaveStorage, private clock: () => number = Date.now,
    private rng: () => number = Math.random) { this.load(); }

  get storageScope(): 'normal' | 'laboratory' { return this.storage.scope ?? 'normal'; }

  getSnapshot(): Snapshot {
    return {state: this.state ? structuredClone(this.state) : null, status: this.status, issue: this.issue,
      lastSavedAt: this.lastSavedAt, dirty: this.dirty,
      hasUnreadableBackup: this.status === 'invalid-save' && this.storedRaw !== null};
  }
  subscribe(listener: (snapshot: Snapshot) => void): () => void {
    if (this.disposed) return () => {};
    this.listeners.add(listener); listener(this.getSnapshot());
    return () => { this.listeners.delete(listener); };
  }
  private emit(): void { for (const listener of this.listeners) listener(this.getSnapshot()); }

  private load(): void {
    let raw: string | null;
    try { raw = this.storage.getItem(SAVE_KEY); }
    catch { this.status = 'read-error'; this.issue = 'READ_FAILED'; this.emit(); return; }
    this.hasRead = true; this.storedRaw = raw;
    const now = this.clock();
    const decoded = raw === null ? null : decodeGame(raw, now);
    if (decoded && !decoded.ok) {
      this.status = 'invalid-save'; this.issue = decoded.reason; this.emit(); return;
    }
    this.state = decoded?.ok ? advance(decoded.state, now) : createGame(now);
    this.dirty = true;
    this.saveCurrent(now); this.emit();
  }

  private write(candidate: GameState, savedAt: number, legacySource?: string): Operation {
    let json: string;
    try { json = encodeGame(candidate); }
    catch { return {ok: false, reason: 'ENCODING_FAILED'}; }
    // Also prevents a superseded controller from silently overwriting a successful import.
    let raw: string | null;
    try { raw = this.storage.getItem(SAVE_KEY); }
    catch { return {ok: false, reason: 'READ_FAILED'}; }
    if (this.hasRead && raw !== this.storedRaw) return {ok: false, reason: 'STORAGE_CHANGED'};
    try {
      const old = raw === null ? null : decodeGame(raw, savedAt);
      const backup = legacySource ?? (old?.ok && old.migratedFrom ? raw : null);
      if (backup !== null && backup !== undefined) {
        const source = decodeGame(backup, savedAt);
        this.storage.setItem(source.ok && source.migratedFrom === 1 ? MIGRATION_BACKUP_KEY : source.ok && source.migratedFrom === 2 ? MISSIONS_MIGRATION_BACKUP_KEY : source.ok && source.migratedFrom === 3 ? HABITATS_MIGRATION_BACKUP_KEY : DECORATIONS_MIGRATION_BACKUP_KEY, backup);
      }
      this.storage.setItem(SAVE_KEY, json);
    }
    catch { return {ok: false, reason: 'WRITE_FAILED'}; }
    this.hasRead = true; this.storedRaw = json; this.lastSavedAt = savedAt;
    return {ok: true};
  }
  private saveCurrent(now: number): Operation {
    if (!this.state) return {ok: false, reason: 'NO_GAME'};
    const result = this.write(this.state, now);
    if (result.ok) { this.status = 'saved'; this.issue = null; this.dirty = false; }
    else {
      this.status = result.reason === 'STORAGE_CHANGED' ? 'conflict' : result.reason === 'READ_FAILED' ? 'read-error' : 'write-error';
      this.issue = result.reason; this.dirty = true;
    }
    return result;
  }
  /** Separate time advance survives action refusal. */
  private updateTime(now: number): boolean {
    if (!this.state) return false;
    const next = advance(this.state, now);
    const changed = JSON.stringify(next) !== JSON.stringify(this.state);
    if (changed) { this.state = next; this.dirty = true; }
    return changed;
  }
  refresh(): void {
    if (this.disposed || !this.state) return;
    const now = this.clock();
    if (this.updateTime(now)) this.saveCurrent(now);
    this.emit();
  }
  perform(command: Command): ActionResult | {ok: false; reason: 'NO_GAME' | 'DISPOSED'} {
    if (this.disposed) return {ok: false, reason: 'DISPOSED'};
    if (!this.state) return {ok: false, reason: 'NO_GAME'};
    const now = this.clock();
    const changed = this.updateTime(now);
    const result = act(this.state!, command, now, this.rng);
    if (result.ok) { this.state = result.state; this.dirty = true; }
    if (changed || result.ok) this.saveCurrent(now);
    this.emit();
    return structuredClone(result);
  }
  retrySave(): Operation {
    if (this.disposed) return {ok: false, reason: 'DISPOSED'};
    if (!this.state) {
      // An invalid save must never be overwritten by the Retry button.
      if (this.status === 'invalid-save') return {ok: false, reason: this.issue!};
      this.load(); return this.state && this.status === 'saved' ? {ok: true} : {ok: false, reason: this.issue ?? 'NO_GAME'};
    }
    const now = this.clock(); this.updateTime(now);
    const result = this.saveCurrent(now); this.emit(); return result;
  }
  exportGame(): {ok: true; json: string; filename: string} | {ok: false; reason: ControllerIssue} {
    if (this.disposed) return {ok: false, reason: 'DISPOSED'};
    if (!this.state) return {ok: false, reason: 'NO_GAME'};
    this.refresh();
    try {
      const date = new Date(this.clock()).toISOString().replaceAll(':', '-').replace(/\.\d{3}Z$/, 'Z');
      return {ok: true, json: encodeGame(this.state), filename: `prairie-lapins-${date}.json`};
    } catch { return {ok: false, reason: 'ENCODING_FAILED'}; }
  }
  unreadableBackup(): string | null { return this.status === 'invalid-save' ? this.storedRaw : null; }

  prepareImport(json: string, fileSize?: number): PreparedImport {
    this.cancelImport();
    if (this.disposed) return {ok: false, reason: 'DISPOSED'};
    if (fileSize !== undefined && fileSize > MAX_JSON_LENGTH) return {ok: false, reason: 'FILE_TOO_LARGE'};
    const decoded = decodeGame(json, this.clock());
    if (!decoded.ok) return decoded;
    const token = ++this.importSequence;
    this.pendingImport = {token, state: decoded.state, ...(decoded.migratedFrom ? {legacyJson: json} : {})};
    return {ok: true, token, summary: {hearts: decoded.state.hearts, pattes: decoded.state.pattes, grass: decoded.state.grass,
      rabbits: decoded.state.rabbits.length, discovered: [...decoded.state.discovered]}};
  }
  cancelImport(): void { this.pendingImport = null; this.importSequence++; }
  confirmImport(token: number, confirmed: boolean): Operation {
    if (this.disposed) return {ok: false, reason: 'DISPOSED'};
    if (!this.pendingImport || this.pendingImport.token !== token) return {ok: false, reason: 'STALE_IMPORT'};
    if (!confirmed) { this.cancelImport(); return {ok: false, reason: 'NOT_CONFIRMED'}; }
    const now = this.clock();
    const source = this.pendingImport.legacyJson ? decodeGame(this.pendingImport.legacyJson, now) : null;
    if (source && !source.ok) return source;
    const candidate = advance(source?.ok ? source.state : this.pendingImport.state, now);
    // Persist first. Failure cannot replace the current game or change its save status.
    const result = this.write(candidate, now, this.pendingImport.legacyJson);
    if (!result.ok) return result;
    this.state = candidate; this.dirty = false; this.status = 'saved'; this.issue = null;
    this.cancelImport(); this.emit(); return {ok: true};
  }
  restart(confirmed: boolean): Operation {
    if (this.disposed) return {ok: false, reason: 'DISPOSED'};
    if (!confirmed) return {ok: false, reason: 'NOT_CONFIRMED'};
    const now = this.clock(); const candidate = createGame(now);
    const result = this.write(candidate, now);
    if (!result.ok) return result;
    this.state = candidate; this.dirty = false; this.status = 'saved'; this.issue = null;
    this.cancelImport(); this.emit(); return {ok: true};
  }
  dispose(): void { this.disposed = true; this.cancelImport(); this.listeners.clear(); }
}
