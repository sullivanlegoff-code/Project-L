import {BALANCE, BREEDING_ODDS, BREEDING_WEIGHTS, SPECIES, SPECIES_IDS, type Odds, type SpeciesId} from '../config/balance';
import type {GameState} from '../state/types';

/** Integer weights retain exact ratios; legacy tables and their iteration order are untouched. */
export function breedingWeights(a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2): Odds {
  const types = new Set([...SPECIES[a].types, ...SPECIES[b].types]);
  const key = [...types].sort().join(',');
  if (Object.hasOwn(BREEDING_ODDS, key)) return {...BREEDING_ODDS[key]};
  const weights: Odds = {};
  for (const id of SPECIES_IDS) {
    const species = SPECIES[id];
    if (!species.types.every(type => types.has(type))) continue;
    if (!species.recipe) weights[id] = BREEDING_WEIGHTS.common;
    else if (affectionA >= species.recipe.minAffection && affectionB >= species.recipe.minAffection)
      weights[id] = BREEDING_WEIGHTS.recipe;
  }
  return weights;
}
export function breedingOdds(a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2): Odds {
  const weights = breedingWeights(a, b, affectionA, affectionB);
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return Object.fromEntries(Object.entries(weights).map(([id, weight]) => [id, weight * 100 / total]));
}
/** Shared by the actual draw and every preview. Reservations retain their existing semantics. */
export function breedingPool(state: GameState, a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2) {
  const ordinary = breedingWeights(a, b, affectionA, affectionB);
  const missing = (Object.keys(ordinary) as SpeciesId[]).filter(id =>
    SPECIES[id].recipe !== null && !state.discovered.includes(id));
  const eligible = missing.length > 0;
  const guaranteed = eligible && state.pityFailures >= BALANCE.guaranteeAttempt - 1;
  const weights: Odds = guaranteed ? Object.fromEntries(missing.map(id => [id, 1])) : ordinary;
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
  // A saved novel result ends the failure streak provisionally; actual discovery is at welcome.
  const pityFailures = reservedDiscovery ? 0 : eligible ? state.pityFailures + 1 : state.pityFailures;
  return {species, guaranteed, reservedDiscovery, pityFailures};
}
