import {BALANCE, BREEDING_ODDS, BREEDING_WEIGHTS, GUARANTEE_SPECIES, SPECIES, SPECIES_IDS, type Odds, type SpeciesId} from '../config/balance';
import type {GameState} from '../state/types';

/** Shared recipe identity/types; no inspection of a pending birth. */
export function recipeMatches(id: SpeciesId, a: SpeciesId, b: SpeciesId): boolean {
  const config = SPECIES[id], recipe = config.recipe;
  if (!recipe) return false;
  if (recipe.parents) {
    const [first, second] = recipe.parents;
    return a === first && b === second || a === second && b === first;
  }
  const types = new Set([...SPECIES[a].types, ...SPECIES[b].types]);
  return config.types.every(type => types.has(type));
}
export function recipeAdmissible(id: SpeciesId, a: SpeciesId, b: SpeciesId, affectionA: number, affectionB: number): boolean {
  return recipeMatches(id, a, b) && affectionA >= SPECIES[id].recipe!.minAffection && affectionB >= SPECIES[id].recipe!.minAffection;
}
/** Ordinary weights preserve historical tables and their iteration order. */
export function breedingWeights(a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2): Odds {
  const types = new Set([...SPECIES[a].types, ...SPECIES[b].types]);
  const key = [...types].sort().join(',');
  if (Object.hasOwn(BREEDING_ODDS, key)) return {...BREEDING_ODDS[key]};
  const weights: Odds = {};
  for (const id of SPECIES_IDS) {
    const species = SPECIES[id];
    if (!species.recipe && species.types.every(type => types.has(type))) weights[id] = BREEDING_WEIGHTS.common;
    else if (species.recipe && species.recipe.probability === undefined && recipeAdmissible(id, a, b, affectionA, affectionB)) weights[id] = BREEDING_WEIGHTS.recipe;
  }
  return weights;
}
/** Exact integer ratios: reserve specials once, then scale ordinary results. */
export function breedingDistributionWeights(a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2): Odds {
  const ordinary = breedingWeights(a, b, affectionA, affectionB);
  const specials = SPECIES_IDS.filter(id => SPECIES[id].recipe?.probability !== undefined && recipeAdmissible(id, a, b, affectionA, affectionB));
  if (!specials.length) return ordinary;
  const total = Object.values(ordinary).reduce((sum, weight) => sum + weight, 0);
  const remaining = 100 - specials.reduce((sum, id) => sum + SPECIES[id].recipe!.probability!, 0);
  const weights: Odds = Object.fromEntries(Object.entries(ordinary).map(([id, weight]) => [id, weight * remaining]));
  for (const id of specials) weights[id] = SPECIES[id].recipe!.probability! * total;
  return weights;
}
export function breedingOdds(a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2): Odds {
  const weights = breedingDistributionWeights(a, b, affectionA, affectionB);
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return Object.fromEntries(Object.entries(weights).map(([id, weight]) => [id, weight * 100 / total]));
}
/** Shared by all previews and simulation. Specials never join the guarantee. */
export function breedingPool(state: GameState, a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2) {
  const ordinary = breedingWeights(a, b, affectionA, affectionB);
  const missing = (Object.keys(ordinary) as SpeciesId[]).filter(id => GUARANTEE_SPECIES.includes(id) && !state.discovered.includes(id));
  const eligible = missing.length > 0;
  const guaranteed = eligible && state.pityFailures >= BALANCE.guaranteeAttempt - 1;
  const weights: Odds = guaranteed ? Object.fromEntries(missing.map(id => [id, 1])) : breedingDistributionWeights(a, b, affectionA, affectionB);
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return {weights, total, missing, eligible, guaranteed};
}
export function chooseBirth(state: GameState, a: SpeciesId, b: SpeciesId, random: number, affectionA = 2, affectionB = 2) {
  const {weights, total, missing, eligible, guaranteed} = breedingPool(state, a, b, affectionA, affectionB);
  const entries = Object.entries(weights) as [SpeciesId, number][];
  let cursor = random * total;
  let species = entries[entries.length - 1][0];
  for (const [candidate, weight] of entries) {
    if (cursor < weight) { species = candidate; break; }
    cursor -= weight;
  }
  const reservedDiscovery = eligible && missing.includes(species);
  const pityFailures = reservedDiscovery ? 0 : eligible ? state.pityFailures + 1 : state.pityFailures;
  return {species, guaranteed, reservedDiscovery, pityFailures};
}

/** A parent remains in its original habitat data (capacity and income), until explicit transfer. */
export function nestForParent(state: Pick<GameState, 'buildings'>, rabbitId: string) {
  return state.buildings.find(b => b.kind === 'nest' && b.breeding?.parents.includes(rabbitId));
}
