import {SPECIES, type SpeciesId} from '../config/balance';
import {HABITATS, habitatLevel} from '../config/habitats';
import type {Building, GameState, Refusal} from '../state/types';
export const habitatStats = (b: Building) => habitatLevel(b.habitat!.type, b.habitat!.level);
export const habitatName = (b: Building) => HABITATS[b.habitat!.type].name;
export const habitatAccepts = (b: Building, species: SpeciesId): boolean => b.kind === 'enclosure' && !!b.habitat &&
  (b.habitat.type === 'universal' || SPECIES[species].types.includes(b.habitat.type));
export function habitatEntryReason(s: GameState, b: Building, species: SpeciesId): Refusal | null {
  if (!habitatAccepts(b, species)) return 'TYPE_INCOMPATIBLE';
  return s.rabbits.filter(r => r.enclosureId === b.id).length >= habitatStats(b).capacity ? 'CAPACITY_FULL' : null;
}
export const terrainWidth = (_s?: unknown) => 9;
export const visibleColumns = (_s?: unknown) => 9;
