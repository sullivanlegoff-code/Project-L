import type {GameState} from '../state/types';
export type ReplacementReason = 'import' | 'replace' | 'restore' | 'restart';
export interface Checkpoint {id: string; state: GameState; reason: ReplacementReason}
export interface RemoteSave {owner_id: string; state: GameState; format: 4; revision: number; saved_at: string; operation_id: string}
export interface HistoryPoint {id: string; owner_id: string; revision: number; state: GameState; saved_at: string; kind: 'revision' | 'checkpoint'; reason: string}
export interface SaveRequest {owner: string; expected: number; operation: string; state: GameState; reason: 'sync' | 'initial' | ReplacementReason; checkpoints: Checkpoint[]}
export interface Receipt {owner_id: string; revision: number; saved_at: string; operation_id: string}
export type CommitResult = {status: 'ok'; receipt: Receipt} | {status: 'conflict'; remote: RemoteSave | null};
export interface CloudGateway {
 read(owner: string, signal: AbortSignal): Promise<RemoteSave | null>;
 commit(request: SaveRequest, signal: AbortSignal): Promise<CommitResult>;
 history(owner: string, signal: AbortSignal): Promise<HistoryPoint[]>;
}
export class CloudFailure extends Error {
 constructor(public kind: 'network' | 'auth' | 'invalid' | 'unavailable' | 'local', message = kind) {super(message);}
}
