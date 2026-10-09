import {SPECIES} from '../config/balance';
import {DAILY_MISSIONS, DAILY_MISSION_IDS, MAIN_MISSIONS, MAIN_MISSION_IDS, MISSION_CYCLE_DURATION, type MainMissionId} from '../config/missions';
import type {GameState, MissionState} from '../state/types';

type ObservableState = Pick<GameState, 'rabbits' | 'discovered'> & {acquiredParcels?: GameState['acquiredParcels']; expanded?: boolean} & {buildings: Pick<GameState['buildings'][number], 'kind'>[]};
export function mainProgress(state: ObservableState, id: MainMissionId): {value: number; target: number} {
  const c = MAIN_MISSIONS[id].condition;
  switch (c.kind) {
    case 'building': return {value: Number(state.buildings.some(b => b.kind === c.building)), target: 1};
    case 'discoveries': return {value: state.discovered.length, target: c.target};
    case 'affection': return {value: Math.max(0, ...state.rabbits.map(r => r.affection)), target: c.target};
    case 'extension': return {value: Number(state.acquiredParcels ? state.acquiredParcels.length > 1 : state.expanded), target: 1};
    case 'rare': return {value: Number(state.discovered.some(id => SPECIES[id].rarity === 'rare')), target: 1};
  }
}
export function emptyDailyProgress(): MissionState['daily']['progress'] {
  return {'collect-pattes': 0, 'collect-grass': 0, 'gain-affection': 0};
}
export function createMissions(state: ObservableState, referenceAt: number): MissionState {
  return {completed: MAIN_MISSION_IDS.filter(id => { const p = mainProgress(state, id); return p.value >= p.target; }), claimed: [],
    daily: {referenceAt, cycleIndex: 0, progress: emptyDailyProgress(), claimed: [], bonusClaimed: false}};
}
export const cycleIndexAt = (referenceAt: number, now: number) => Math.floor(Math.max(0, now - referenceAt) / MISSION_CYCLE_DURATION);
export const dailyCycleStart = (s: GameState) => s.missions.daily.referenceAt + s.missions.daily.cycleIndex * MISSION_CYCLE_DURATION;
export const dailyCycleEnd = (s: GameState) => dailyCycleStart(s) + MISSION_CYCLE_DURATION;
/** Mutates only the transaction/advance copy; never reconstructs absent action history. */
export function updateMissions(state: GameState, now: number): void {
  const m = state.missions, d = m.daily;
  const cycle = cycleIndexAt(d.referenceAt, now);
  if (cycle > d.cycleIndex) {
    d.cycleIndex = cycle; d.progress = emptyDailyProgress(); d.claimed = []; d.bonusClaimed = false;
  }
  for (const id of MAIN_MISSION_IDS) {
    const p = mainProgress(state, id);
    if (p.value >= p.target && !m.completed.includes(id)) m.completed.push(id);
  }
}
/** Called once after a successful simulation action; rewards/imports are not events. */
export function recordMissionAction(s: GameState, action: string, amount: number): boolean {
  const id = DAILY_MISSION_IDS.find(id => DAILY_MISSIONS[id].event === action);
  if (!id) return true;
  const next = s.missions.daily.progress[id] + amount;
  if (!Number.isSafeInteger(next)) return false;
  s.missions.daily.progress[id] = next; return true;
}
export function availableMissionRewards(s: GameState): number {
  const d = s.missions.daily;
  return s.missions.completed.filter(id => !s.missions.claimed.includes(id)).length +
    DAILY_MISSION_IDS.filter(id => d.progress[id] >= DAILY_MISSIONS[id].target && !d.claimed.includes(id)).length +
    Number(d.claimed.length === DAILY_MISSION_IDS.length && !d.bonusClaimed);
}
