import {habitatStats} from './habitats';
import {HEARTS} from '../config/balance';
import type {GameState, Refusal, TimedStage} from '../state/types';
import {advance, validTime} from './time';

export const accelerationCost = (remaining: number): number => Math.ceil(Math.max(0, remaining) / HEARTS.accelerationStep);
export const complementCost = (missing: number): number => Math.ceil(Math.max(0, missing) / HEARTS.pattesPerHeart);
export type AccelerationQuote = {ok: true; hearts: number; jobKey: string; endsAt: number} | {ok: false; reason: Refusal};
/** Quote only; never reveals the birth's species or consumes random numbers. */
export function quoteAcceleration(state: GameState, id: string, stage: TimedStage, now: number): AccelerationQuote {
  if (!validTime(now)) return {ok: false, reason: 'INVALID_TIME'};
  const s = advance(state, now), b = s.buildings.find(b => b.id === id);
  if (!b) return {ok: false, reason: 'NOT_FOUND'};
  const job = stage === 'order' ? b.order : stage === 'breeding' ? b.breeding : stage === 'growth' ? b.baby : null;
  if (!job) return {ok: false, reason: 'ACTION_FINISHED'};
  const endsAt = 'readyAt' in job ? job.readyAt : job.endsAt;
  if (endsAt <= s.lastSimulatedAt) return {ok: false, reason: 'ACTION_FINISHED'};
  if (stage === 'growth' && !s.buildings.some(enclosure => enclosure.kind === 'enclosure' &&
    s.rabbits.filter(r => r.enclosureId === enclosure.id).length < habitatStats(enclosure).capacity))
    return {ok: false, reason: 'CAPACITY_FULL'};
  // An occupied nursery does not stop a running reproduction. Its result will wait in the nest.
  const jobKey = JSON.stringify([id, stage, job.startedAt, endsAt, 'birth' in job ? job.birth.id : job.recipe]);
  return {ok: true, hearts: accelerationCost(endsAt - s.lastSimulatedAt), endsAt, jobKey};
}
