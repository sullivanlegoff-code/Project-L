import type {BuildingKind, OrderId, SpeciesId} from '../config/balance';

export interface Birth {
  id: string;
  species: SpeciesId;
  guaranteed: boolean;
  reservedDiscovery: boolean;
}
export interface Building {
  id: string; kind: BuildingKind; x: number; y: number;
  /** Exact numerator: one patte = HOUR units. Never round each update. */
  incomeUnits: number;
  order: {recipe: OrderId; startedAt: number; endsAt: number} | null;
  breeding: {parents: [string, string]; startedAt: number; endsAt: number; birth: Birth} | null;
  baby: {birth: Birth; startedAt: number; readyAt: number} | null;
}
export interface Rabbit { id: string; species: SpeciesId; affection: number; enclosureId: string }
export interface GameState {
  version: 2; lastSimulatedAt: number; nextId: number;
  hearts: number; nextHeartGiftAt: number;
  pattes: number; grass: number; expanded: boolean;
  buildings: Building[]; rabbits: Rabbit[]; discovered: SpeciesId[];
  pityFailures: number;
}
export type Refusal = 'INVALID_TIME' | 'INVALID_RANDOM' | 'INVALID_CHOICE' | 'NOT_FOUND' |
  'NOT_ENOUGH_PATTES' | 'NOT_ENOUGH_GRASS' | 'INVALID_CELL' | 'CELL_OCCUPIED' |
  'BUILDING_LIMIT' | 'CAPACITY_FULL' | 'BUSY' | 'NOT_READY' | 'MAX_AFFECTION' |
  'SAME_PARENT' | 'AFFECTION_TOO_LOW' | 'MISSING_BUILDING' | 'ALREADY_EXPANDED' |
  'LAST_OF_SPECIES' | 'PARENT_BUSY' | 'NOT_ENOUGH_HEARTS' | 'ACTION_FINISHED' |
  'STALE_ACTION' | 'PRICE_CHANGED' | 'NO_MISSING_PATTES';
export type ActionResult = {ok: true; state: GameState; value?: string | number} |
  {ok: false; state: GameState; reason: Refusal};
export type BaseCommand =
  | {type: 'buyBuilding'; kind: BuildingKind; x: number; y: number}
  | {type: 'moveBuilding'; id: string; x: number; y: number}
  | {type: 'buyRabbit'; species: SpeciesId; enclosureId: string}
  | {type: 'moveRabbit'; id: string; enclosureId: string}
  | {type: 'collectIncome'; id: string}
  | {type: 'startOrder'; id: string; recipe: OrderId}
  | {type: 'collectOrder'; id: string}
  | {type: 'feed'; id: string}
  | {type: 'breed'; parents: [string, string]}
  | {type: 'welcome'; enclosureId: string}
  | {type: 'expand'}
  | {type: 'release'; id: string};
export type PattesCommand = Extract<BaseCommand, {type: 'buyBuilding' | 'buyRabbit' | 'expand' | 'startOrder' | 'breed'}>;
export type TimedStage = 'order' | 'breeding' | 'growth';
export type Command = BaseCommand
  | {type: 'claimHearts'}
  | {type: 'accelerate'; id: string; stage: TimedStage; jobKey: string; maxHearts: number}
  | {type: 'payWithHearts'; action: PattesCommand; maxHearts: number; maxPattes: number};
