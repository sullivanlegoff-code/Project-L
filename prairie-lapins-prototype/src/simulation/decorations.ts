import {DECORATIONS, FINE_GRID, MAX_DECORATIONS, type DecorationId} from '../config/decorations';
import type {DecorationLocation, GameState, Refusal} from '../state/types';

import {decorationFootprint as footprint, buildingFootprint, decorationsInFootprint, footprintPlacementReason} from './placement';
export {footprint};
/** Legacy explicit bulk command uses a coarse cell; building placement uses buildingFootprint. */
export function decorationsInCell(s: Pick<GameState, 'decorations'>, x: number, y: number): string[] {
  return decorationsInFootprint(s, buildingFootprint({x: x * FINE_GRID, y: y * FINE_GRID}));
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
  return footprintPlacementReason(s, rect, {decorationId: id});
}
