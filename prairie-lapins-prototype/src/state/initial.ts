import type {HabitatType} from '../config/habitats';
import {MISSION_CYCLE_DURATION} from '../config/missions';
import {createMissions} from '../simulation/missions';
import {BALANCE, HEARTS, type BuildingKind} from '../config/balance';
import type {Building, GameState} from './types';
export function emptyBuilding(id: string, kind: BuildingKind, x: number, y: number, habitatType: HabitatType = 'universal'): Building {
  return {id, kind, x, y, incomeUnits: 0, habitat: kind === 'enclosure' ? {type: habitatType, level: 1} : null, order: null, breeding: null, baby: null};
}
export function createGame(now: number = Date.now()): GameState {
  if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(now + HEARTS.giftInterval) || !Number.isSafeInteger(now + MISSION_CYCLE_DURATION)) throw new RangeError('Invalid timestamp');
  const state: Omit<GameState, 'missions'> = {
    version: 5, decorations: [], lastSimulatedAt: now, nextId: 4,
    hearts: HEARTS.initial, nextHeartGiftAt: now + HEARTS.giftInterval,
    pattes: BALANCE.initialPattes, grass: BALANCE.initialGrass, expanded: false, secondExpanded: false,
    buildings: [emptyBuilding('building-1', 'enclosure', 0, 0)],
    rabbits: [
      {id: 'rabbit-2', species: 'paille', affection: 1, enclosureId: 'building-1'},
      {id: 'rabbit-3', species: 'neige', affection: 1, enclosureId: 'building-1'},
    ], discovered: ['paille', 'neige'], pityFailures: 0,
  };
  return {...state, missions: createMissions(state, now)};
}
