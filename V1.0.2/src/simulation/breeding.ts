import {BALANCE, BREEDING_ODDS, SPECIES, type Odds, type SpeciesId} from '../config/balance';
import type {GameState} from '../state/types';
export function breedingOdds(a: SpeciesId, b: SpeciesId): Odds {
  const key = [...new Set([...SPECIES[a].types, ...SPECIES[b].types])].sort().join(',');
  return {...BREEDING_ODDS[key]};
}
export function chooseBirth(state: GameState, a: SpeciesId, b: SpeciesId, random: number) {
  const odds = breedingOdds(a, b);
  const missing = (Object.keys(odds) as SpeciesId[]).filter(id =>
    SPECIES[id].rarity === 'uncommon' && !state.discovered.includes(id));
  const eligible = missing.length > 0;
  const guaranteed = eligible && state.pityFailures >= BALANCE.guaranteeAttempt - 1;
  let species: SpeciesId;
  if (guaranteed) species = missing[Math.floor(random * missing.length)];
  else {
    const entries = Object.entries(odds) as [SpeciesId, number][];
    let cursor = random * 100;
    species = entries[entries.length - 1][0];
    for (const [candidate, weight] of entries) {
      if (cursor < weight) { species = candidate; break; }
      cursor -= weight;
    }
  }
  const reservedDiscovery = eligible && missing.includes(species);
  // A saved novel result ends the failure streak provisionally; actual discovery is at welcome.
  const pityFailures = reservedDiscovery ? 0 : eligible ? state.pityFailures + 1 : state.pityFailures;
  return {species, guaranteed, reservedDiscovery, pityFailures};
}
