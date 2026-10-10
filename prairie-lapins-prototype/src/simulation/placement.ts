import {DECORATIONS, FINE_GRID, type DecorationId} from '../config/decorations';
import {acquiredFootprint} from '../config/land';
import type {GameState, Refusal} from '../state/types';

/** All rectangles use integer fine-grid coordinates; touching edges is allowed. */
export interface Footprint {x: number; y: number; width: number; height: number}
export const buildingFootprint = (position: {x: number; y: number}): Footprint =>
  ({x: position.x, y: position.y, width: FINE_GRID, height: FINE_GRID});
export function decorationFootprint(catalogId: DecorationId, rotation: 0 | 1 = 0) {
  const d = DECORATIONS[catalogId];
  return rotation ? {width: d.height, height: d.width} : {width: d.width, height: d.height};
}
export const overlaps = (a: Footprint, b: Footprint): boolean =>
  a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
export function decorationsInFootprint(s: Pick<GameState, 'decorations'>, rect: Footprint): string[] {
  return s.decorations.filter(d => d.location.kind === 'outside' &&
    overlaps(rect, {...d.location, ...decorationFootprint(d.catalogId, d.location.rotation)})).map(d => d.id);
}
export function footprintPlacementReason(s: Pick<GameState, 'acquiredParcels' | 'buildings' | 'decorations'>,
  rect: Footprint, ignore: {buildingId?: string; decorationId?: string} = {}): Refusal | null {
  if (!acquiredFootprint(s, rect.x, rect.y, rect.width, rect.height)) return 'INVALID_CELL';
  if (s.buildings.some(b => b.id !== ignore.buildingId && overlaps(rect, buildingFootprint(b)))) return 'CELL_OCCUPIED';
  if (s.decorations.some(d => d.id !== ignore.decorationId && d.location.kind === 'outside' &&
    overlaps(rect, {...d.location, ...decorationFootprint(d.catalogId, d.location.rotation)}))) return 'DECORATION_OVERLAP';
  return null;
}
export function buildingPlacementReason(s: Pick<GameState, 'acquiredParcels' | 'buildings' | 'decorations'>,
  x: number, y: number, movingId?: string): Refusal | null {
  if (movingId && !s.buildings.some(b => b.id === movingId)) return 'NOT_FOUND';
  const reason = footprintPlacementReason(s, buildingFootprint({x, y}), {buildingId: movingId});
  return reason === 'DECORATION_OVERLAP' ? 'DECORATION_BLOCKS_BUILDING' : reason;
}
export function buildingAt(s: Pick<GameState, 'buildings'>, p: {x: number; y: number}) {
  return s.buildings.find(b => p.x >= b.x && p.x < b.x + FINE_GRID && p.y >= b.y && p.y < b.y + FINE_GRID);
}
