import {BALANCE, HOUR, SPECIES} from '../config/balance';
import type {GameState} from '../state/types';
export function rabbitIncome(affection: number): number {
  return BALANCE.incomeBase + BALANCE.incomePerLevel * (affection - 1);
}
export function validTime(now: number): boolean { return Number.isSafeInteger(now) && now >= 0; }
/** Pure, monotonic update. No births are rerolled, no automatic farm repetition. */
export function advance(state: GameState, now: number): GameState {
  if (!validTime(now)) throw new RangeError('Invalid timestamp');
  const next = structuredClone(state);
  const target = Math.max(now, state.lastSimulatedAt);
  const elapsed = target - state.lastSimulatedAt;
  for (const enclosure of next.buildings.filter(b => b.kind === 'enclosure')) {
    const rate = next.rabbits.filter(r => r.enclosureId === enclosure.id)
      .reduce((sum, rabbit) => sum + rabbitIncome(rabbit.affection), 0);
    const cap = BALANCE.enclosureCap * HOUR;
    // Bound multiplication before applying a potentially enormous absence.
    const boundedElapsed = rate === 0 ? 0 : Math.min(elapsed, Math.ceil((cap - enclosure.incomeUnits) / rate));
    enclosure.incomeUnits = Math.min(cap, enclosure.incomeUnits + boundedElapsed * rate);
  }
  const nest = next.buildings.find(b => b.kind === 'nest');
  const nursery = next.buildings.find(b => b.kind === 'nursery');
  if (nest?.breeding && nursery && !nursery.baby && nest.breeding.endsAt <= target) {
    const startedAt = Math.max(state.lastSimulatedAt, nest.breeding.endsAt);
    const birth = nest.breeding.birth;
    const duration = SPECIES[birth.species].rarity === 'common' ? BALANCE.commonGrowth : BALANCE.hybridGrowth;
    nursery.baby = {birth, startedAt, readyAt: startedAt + duration};
    nest.breeding = null;
  }
  next.lastSimulatedAt = target;
  return next;
}
