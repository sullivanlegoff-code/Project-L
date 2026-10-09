import {SPECIES, SPECIES_IDS, type SpeciesId} from '../config/balance';
import {HABITAT_TYPES} from '../config/habitats';
import {act, createGame, decodeGame, encodeGame} from '../simulation';
import {createMissions} from '../simulation/missions';
import {emptyBuilding} from '../state/initial';
import type {Command, GameState} from '../state/types';
import {DECORATIONS, DECORATION_IDS, MAX_DECORATIONS} from '../config/decorations';
import {decorationPlacementReason} from '../simulation/decorations';

export const DECORATION_SCENARIOS = ['islandStart', 'islandExpanded', 'islandFull', 'decorationStart', 'decorationDemo', 'decoratedHabitat', 'decorationDense'] as const;
export const SCENARIOS = {islandStart: 'Île presque vide — 3 × 2', islandExpanded: 'Île presque vide — 6 × 2', islandFull: 'Île presque vide — 9 × 2',decorationStart: 'Prairie de départ — acheter et placer', decorationDense: 'Prairie dense — sélection et performances', collection: 'Collection — quinze espèces et recettes', reproduction: 'Reproduction — parents prêts', missions: 'Missions — récompenses à réclamer', habitats: 'Habitats — sept occupants par enclos', decorationDemo: 'Prairie de démonstration décorée', decoratedHabitat: 'Habitat décoré — sept occupants'} as const;
export type ScenarioId = keyof typeof SCENARIOS;

/** Explicit test fixtures only; ordinary play still uses act/controller.perform. */
export function scenarioState(id: ScenarioId, now: number): GameState {
  let s = createGame(now);
  if (id === 'decorationStart') return s;
  s.pattes = 50_000; s.grass = 1_000; s.hearts = 100;
  const run = (command: Command) => {
    const result = act(s, command, now, () => .99);
    if (!result.ok) throw new Error(`Scenario action refused: ${result.reason}`);
    s = result.state;
  };
  if (id === 'islandStart' || id === 'islandExpanded' || id === 'islandFull') {
    if (id !== 'islandStart') run({type: 'expand', stage: 1});
    if (id === 'islandFull') run({type: 'expand', stage: 2});
    // Almost empty, not an automatic reset: ordinary starting habitat and two rabbits.
    const checked = decodeGame(encodeGame(s), now);
    if (!checked.ok) throw new Error('Invalid island scenario');
    return checked.state;
  }
  if (id === 'decorationDemo' || id === 'decoratedHabitat' || id === 'decorationDense') {
    run({type: 'expand', stage: 1});
    run({type: 'upgradeHabitat', id: 'building-1', fromLevel: 1});
    run({type: 'upgradeHabitat', id: 'building-1', fromLevel: 2});
    const home = emptyBuilding(`building-${s.nextId++}`, 'enclosure', 2, 0, 'terre'); home.habitat!.level = 3; s.buildings.push(home);
    if (id === 'decoratedHabitat' || id === 'decorationDense') {
      s.rabbits = SPECIES_IDS.slice(0, 7).map(species => ({id: `rabbit-${s.nextId++}`, species, affection: 3, enclosureId: 'building-1'}));
      s.discovered = s.rabbits.map(r => r.species);
    }
    const interior = DECORATION_IDS.filter(id => DECORATIONS[id].area === 'habitat');
    for (const [index, habitat] of s.buildings.entries()) for (const slot of [0, 1, 2] as const) {
      const catalogId = interior[(index * 3 + slot) % interior.length];
      run({type: 'buyDecoration', catalogId});
      run({type: 'placeDecoration', id: s.decorations.at(-1)!.id, location: {kind: 'habitat', habitatId: habitat.id, slot: slot as 0 | 1 | 2}});
    }
    const outside = DECORATION_IDS.filter(id => DECORATIONS[id].area === 'outside');
    // Spacious demonstration: every catalogue entry is actually placed.
    const positions = [[1, 5], [4, 6], [7, 5], [8, 4], [12, 5], [18, 4], [21, 5], [15, 5]];
    for (const [index, catalogId] of outside.entries()) {
      run({type: 'buyDecoration', catalogId});
      const [x, y] = positions[index];
      run({type: 'placeDecoration', id: s.decorations.at(-1)!.id, location: {kind: 'outside', x, y, rotation: 0}});
    }
    if (id === 'decorationDense') {
      run({type: 'expand', stage: 2});
      // Fill through real commands, then keep surplus copies in the inventory.
      // This deliberately reaches the existing import/device protection bound.
      while (s.decorations.length < MAX_DECORATIONS) {
        const catalogId = outside[s.decorations.length % outside.length];
        run({type: 'buyDecoration', catalogId});
        const id = s.decorations.at(-1)!.id;
        let installed = false;
        for (let y = 0; y < 8 && !installed; y++) for (let x = 0; x < 36 && !installed; x++) {
          const location = {kind: 'outside' as const, x, y, rotation: DECORATIONS[catalogId].rotates && s.decorations.length % 2 ? 1 as const : 0 as const};
          if (!decorationPlacementReason(s, id, location)) { run({type: 'placeDecoration', id, location}); installed = true; }
        }
      }
    }
  } else if (id === 'reproduction') {
    run({type: 'buyBuilding', kind: 'nest', x: 1, y: 0});
    run({type: 'buyBuilding', kind: 'nursery', x: 2, y: 0});
    run({type: 'feed', id: 'rabbit-2'}); run({type: 'feed', id: 'rabbit-3'});
    // Ready parents; the player starts the real breeding action.
  } else {
    run({type: 'expand', stage: 1}); run({type: 'expand', stage: 2});
    s.rabbits = []; s.buildings = []; s.discovered = [];
    const types = id === 'habitats' ? HABITAT_TYPES : id === 'collection' ? ['universal', 'universal', 'universal'] as const : ['universal', 'universal'] as const;
    for (const [index, type] of types.entries()) {
      const home = emptyBuilding(`building-${s.nextId++}`, 'enclosure', index, 0, type);
      home.habitat!.level = 3; s.buildings.push(home);
      const species: SpeciesId[] = id === 'habitats' ? SPECIES_IDS.slice(0, 11).filter(species => type === 'universal' || SPECIES[species].types.includes(type)) : (id === 'collection' ? SPECIES_IDS : SPECIES_IDS.slice(0, 11)).slice(index * 7, index * 7 + 7);
      const count = id === 'habitats' ? 7 : species.length;
      for (let i = 0; i < count; i++) {
        const speciesId = species[i % species.length];
        s.rabbits.push({id: `rabbit-${s.nextId++}`, species: speciesId, affection: id === 'collection' ? 10 : 5, enclosureId: home.id});
        if (!s.discovered.includes(speciesId)) s.discovered.push(speciesId);
      }
    }
    if (id === 'missions' || id === 'collection') {
      for (const [x, kind] of ['farm', 'nest', 'nursery'].entries()) s.buildings.push(emptyBuilding(`building-${s.nextId++}`, kind as 'farm' | 'nest' | 'nursery', x, 1));
    }
    s.missions = createMissions(s, now);
    if (id === 'missions') s.missions.daily.progress = {'collect-pattes': 100, 'collect-grass': 40, 'gain-affection': 3};
  }
  // Enforce exactly the same save validation used by every player import.
  const checked = decodeGame(encodeGame(s), now);
  if (!checked.ok) throw new Error(`Invalid scenario: ${checked.reason}`);
  return checked.state;
}
