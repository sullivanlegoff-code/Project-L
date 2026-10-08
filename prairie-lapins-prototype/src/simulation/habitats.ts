import {SPECIES, type SpeciesId} from '../config/balance';
import {HABITATS, LAND, habitatLevel} from '../config/habitats';
import type {Building, GameState, Refusal} from '../state/types';
export const habitatStats = (b: Building) => habitatLevel(b.habitat!.type, b.habitat!.level);
export const habitatName = (b: Building) => HABITATS[b.habitat!.type].name;
export const habitatAccepts = (b: Building, species: SpeciesId): boolean => b.kind === 'enclosure' && !!b.habitat &&
  (b.habitat.type === 'universal' || SPECIES[species].types.includes(b.habitat.type));
export function habitatEntryReason(s: GameState, b: Building, species: SpeciesId): Refusal | null {
  if (!habitatAccepts(b, species)) return 'TYPE_INCOMPATIBLE';
  return s.rabbits.filter(r => r.enclosureId === b.id).length >= habitatStats(b).capacity ? 'CAPACITY_FULL' : null;
}
export const landStage = (s: Pick<GameState, 'expanded' | 'secondExpanded'>): 0 | 1 | 2 => s.secondExpanded ? 2 : s.expanded ? 1 : 0;
export const terrainWidth = (s: Pick<GameState, 'expanded' | 'secondExpanded'>) => LAND[landStage(s)].width;
/** Show the next locked strip, without forcing the camera to fit it. */
export const visibleColumns = (s: Pick<GameState, 'expanded' | 'secondExpanded'>) => LAND[Math.min(2, landStage(s) + 1)].width;
export const nextExtension = (s: GameState) => s.secondExpanded ? null : {stage: (s.expanded ? 2 : 1) as 1 | 2, ...LAND[s.expanded ? 2 : 1]};
