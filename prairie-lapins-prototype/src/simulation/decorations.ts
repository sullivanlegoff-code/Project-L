import {DECORATIONS, FINE_GRID, MAX_DECORATIONS, type DecorationId} from '../config/decorations';
import type {DecorationLocation, GameState, Refusal} from '../state/types';
import {acquiredFootprint} from '../config/land';

export function footprint(catalogId: DecorationId, rotation: 0 | 1 = 0) {
  const d = DECORATIONS[catalogId];
  return rotation ? {width: d.height, height: d.width} : {width: d.width, height: d.height};
}
function overlaps(a: {x: number; y: number; width: number; height: number}, b: {x: number; y: number; width: number; height: number}) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}
export function decorationsInCell(s: Pick<GameState, 'decorations'>, x: number, y: number): string[] {
  return s.decorations.filter(d => d.location.kind === 'outside' && overlaps({...d.location, ...footprint(d.catalogId, d.location.rotation)},
    {x: x * FINE_GRID, y: y * FINE_GRID, width: FINE_GRID, height: FINE_GRID})).map(d => d.id);
}
export function purchaseDecorationReason(s: GameState, catalogId: DecorationId): Refusal | null {
  if (!Object.hasOwn(DECORATIONS, catalogId)) return 'INVALID_CHOICE';
  if (s.decorations.length >= MAX_DECORATIONS || !Number.isSafeInteger(s.nextId + 1)) return 'DECORATION_LIMIT';
  return s.pattes < DECORATIONS[catalogId].price ? 'NOT_ENOUGH_PATTES' : null;
}
/** Used by commands, imports, ghosts and fine-grid feedback. Moving excludes only itself. */
export function decorationPlacementReason(s: GameState, id: string, location: DecorationLocation): Refusal | null {
  const owned = s.decorations.find(d => d.id === id);
  if (!owned) return 'NOT_FOUND';
  const definition = DECORATIONS[owned.catalogId];
  if (location.kind === 'inventory') return null;
  if (location.kind !== 'outside') return 'INVALID_CHOICE';
  if (definition.area !== 'outside' || (location.rotation !== 0 && location.rotation !== 1) || (location.rotation && !definition.rotates)) return 'INVALID_CHOICE';
  const rect = {...location, ...footprint(owned.catalogId, location.rotation)};
  if (!acquiredFootprint(s, rect.x, rect.y, rect.width, rect.height)) return 'INVALID_CELL';
  if (s.buildings.some(b => overlaps(rect, {x: b.x * FINE_GRID, y: b.y * FINE_GRID, width: FINE_GRID, height: FINE_GRID}))) return 'CELL_OCCUPIED';
  if (s.decorations.some(d => d.id !== id && d.location.kind === 'outside' && overlaps(rect, {...d.location, ...footprint(d.catalogId, d.location.rotation)}))) return 'DECORATION_OVERLAP';
  return null;
}
