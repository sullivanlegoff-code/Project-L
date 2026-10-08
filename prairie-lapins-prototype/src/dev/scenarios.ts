import {SPECIES, SPECIES_IDS, type SpeciesId} from '../config/balance';
import {HABITAT_TYPES} from '../config/habitats';
import {act, createGame, decodeGame, encodeGame} from '../simulation';
import {createMissions} from '../simulation/missions';
import {emptyBuilding} from '../state/initial';
import type {Command, GameState} from '../state/types';

export const SCENARIOS = {collection: 'Collection — onze espèces', reproduction: 'Reproduction — parents prêts', missions: 'Missions — récompenses à réclamer', habitats: 'Habitats — sept occupants par enclos'} as const;
export type ScenarioId = keyof typeof SCENARIOS;

/** Explicit test fixtures only; ordinary play still uses act/controller.perform. */
export function scenarioState(id: ScenarioId, now: number): GameState {
  let s = createGame(now);
  s.pattes = 50_000; s.grass = 1_000; s.hearts = 100;
  const run = (command: Command) => {
    const result = act(s, command, now, () => .99);
    if (!result.ok) throw new Error(`Scenario action refused: ${result.reason}`);
    s = result.state;
  };
  if (id === 'reproduction') {
    run({type: 'buyBuilding', kind: 'nest', x: 1, y: 0});
    run({type: 'buyBuilding', kind: 'nursery', x: 2, y: 0});
    run({type: 'feed', id: 'rabbit-2'}); run({type: 'feed', id: 'rabbit-3'});
    // Ready parents; the player starts the real breeding action.
  } else {
    run({type: 'expand', stage: 1}); run({type: 'expand', stage: 2});
    s.rabbits = []; s.buildings = []; s.discovered = [];
    const types = id === 'habitats' ? HABITAT_TYPES : ['universal', 'universal'] as const;
    for (const [index, type] of types.entries()) {
      const home = emptyBuilding(`building-${s.nextId++}`, 'enclosure', index, 0, type);
      home.habitat!.level = 3; s.buildings.push(home);
      const species: SpeciesId[] = id === 'habitats' ? SPECIES_IDS.filter(species => type === 'universal' || SPECIES[species].types.includes(type)) : SPECIES_IDS.slice(index * 7, index * 7 + 7);
      const count = id === 'habitats' ? 7 : species.length;
      for (let i = 0; i < count; i++) {
        const speciesId = species[i % species.length];
        s.rabbits.push({id: `rabbit-${s.nextId++}`, species: speciesId, affection: 5, enclosureId: home.id});
        if (!s.discovered.includes(speciesId)) s.discovered.push(speciesId);
      }
    }
    if (id === 'missions') {
      for (const [x, kind] of ['farm', 'nest', 'nursery'].entries()) s.buildings.push(emptyBuilding(`building-${s.nextId++}`, kind as 'farm' | 'nest' | 'nursery', x, 1));
    }
    s.missions = createMissions(s, now);
    if (id === 'missions') s.missions.daily.progress = {'collect-pattes': 100, 'collect-grass': 40, 'gain-affection': 3};
  }
  // Enforce exactly the same v4 validation used by every player import.
  const checked = decodeGame(encodeGame(s), now);
  if (!checked.ok) throw new Error(`Invalid scenario: ${checked.reason}`);
  return checked.state;
}
