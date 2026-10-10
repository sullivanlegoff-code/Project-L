import {PARCEL_IDS, extensionPrice, type ParcelId} from '../config/land';
import {SPECIES, SPECIES_IDS, type SpeciesId} from '../config/balance';
import {HABITAT_TYPES} from '../config/habitats';
import {act, createGame, decodeGame, encodeGame} from '../simulation';
import {createMissions} from '../simulation/missions';
import {emptyBuilding} from '../state/initial';
import type {Command, GameState} from '../state/types';
import {DECORATIONS, DECORATION_IDS, MAX_DECORATIONS} from '../config/decorations';
import {decorationPlacementReason} from '../simulation/decorations';

export const DECORATION_SCENARIOS = ['islandStart', 'islandExpanded', 'islandFull', 'islandDiagonal', 'islandL', 'parcelEdges', 'decorationStart', 'decorationDemo', 'decoratedHabitat', 'decorationDense'] as const;
export const SCENARIOS = {fineBuildings:'Bâtiments décalés — grille fine 4 × 4',islandStart: 'Centre seul — 3 × 3', islandExpanded: 'Extension cardinale — Centre + Est', islandDiagonal: 'Extension diagonale — Centre + Nord-ouest', islandL: 'Forme en L — Centre + Est + Nord', islandFull: 'Île complète — 9 × 9', parcelEdges: 'Décorations proches des frontières',decorationStart: 'Prairie de départ — acheter et placer', decorationDense: 'Prairie dense — sélection et performances', collection: 'Collection — quinze espèces et recettes', reproduction: 'Reproduction — parents prêts', missions: 'Missions — récompenses à réclamer', habitats: 'Habitats — sept occupants par enclos', decorationDemo: 'Prairie de démonstration décorée', decoratedHabitat: 'Habitat entouré de décorations — sept occupants'} as const;
export type ScenarioId = keyof typeof SCENARIOS;

/** Explicit test fixtures only; ordinary play still uses act/controller.perform. */
export function scenarioState(id: ScenarioId, now: number): GameState {
  let s = createGame(now);
  if (id === 'decorationStart') return s;
  s.pattes = 500_000; s.grass = 1_000; s.hearts = 100;
  const run = (command: Command) => {
    const result = act(s, command, now, () => .99);
    if (!result.ok) throw new Error(`Scenario action refused: ${result.reason}`);
    s = result.state;
  };
  const acquire=(id:ParcelId)=>run({type:'expand',parcelId:id,expectedCost:extensionPrice(s)});
  if(id==='fineBuildings'){
    acquire('east');acquire('north');
    run({type:'moveBuilding',id:'building-1',x:13,y:14});
    run({type:'upgradeHabitat',id:'building-1',fromLevel:1});run({type:'upgradeHabitat',id:'building-1',fromLevel:2});
    const mixed:SpeciesId[]=['paille','neige','terre','belier-gris','feu','volant','brumelin'];
    s.rabbits=mixed.map(species=>({id:`rabbit-${s.nextId++}`,species,affection:4,enclosureId:'building-1'}));s.discovered=[...mixed];
    run({type:'buyBuilding',kind:'farm',x:22,y:15});
    run({type:'startOrder',id:s.buildings.at(-1)!.id,recipe:'small'});
    run({type:'buyBuilding',kind:'nest',x:18,y:10});
    run({type:'buyBuilding',kind:'nursery',x:27,y:13});
    run({type:'buyBuilding',kind:'enclosure',habitatType:'vol',x:18,y:18});
    run({type:'buyDecoration',catalogId:'flowering-bush'});
    run({type:'placeDecoration',id:s.decorations.at(-1)!.id,location:{kind:'outside',x:17,y:14,rotation:0}});
    const checked=decodeGame(encodeGame(s),now);if(!checked.ok)throw Error('Invalid fine building scenario');return checked.state;
  }
  if (id === 'islandStart' || id === 'islandExpanded' || id === 'islandDiagonal' || id === 'islandL' || id === 'islandFull' || id === 'parcelEdges') {
    if (['islandExpanded','islandL','parcelEdges'].includes(id)) acquire('east');
    if (id === 'islandDiagonal') acquire('northwest');
    if (id === 'islandL') acquire('north');
    if (id === 'islandFull') for(const id of PARCEL_IDS.filter(id=>id!=='center'))acquire(id);
    if(id==='parcelEdges'){run({type:'buyDecoration',catalogId:'wood-bench'});run({type:'placeDecoration',id:s.decorations.at(-1)!.id,location:{kind:'outside',x:23,y:12,rotation:0}});}
    // Almost empty, not an automatic reset: ordinary starting habitat and two rabbits.
    const checked = decodeGame(encodeGame(s), now);
    if (!checked.ok) throw new Error('Invalid island scenario');
    return checked.state;
  }
  if (id === 'decorationDemo' || id === 'decoratedHabitat' || id === 'decorationDense') {
    s.buildings[0].x=12;s.buildings[0].y=12;
    acquire('east');
    run({type: 'upgradeHabitat', id: 'building-1', fromLevel: 1});
    run({type: 'upgradeHabitat', id: 'building-1', fromLevel: 2});
    const home = emptyBuilding(`building-${s.nextId++}`, 'enclosure', 20, 12, 'terre'); home.habitat!.level = 3; s.buildings.push(home);
    if (id === 'decoratedHabitat' || id === 'decorationDense') {
      s.rabbits = SPECIES_IDS.slice(0, 7).map(species => ({id: `rabbit-${s.nextId++}`, species, affection: 3, enclosureId: 'building-1'}));
      s.discovered = s.rabbits.map(r => r.species);
    }
    const outside = DECORATION_IDS.filter(id => DECORATIONS[id].area === 'outside');
    // Spacious demonstration: every catalogue entry is actually placed.
    const positions = [[1, 5], [4, 6], [7, 5], [8, 4], [12, 5], [18, 4], [21, 5], [15, 5], [0, 7], [3, 7], [6, 7], [10, 7]];
    for (const [index, catalogId] of outside.entries()) {
      run({type: 'buyDecoration', catalogId});
      const [x, y] = positions[index];
      run({type: 'placeDecoration', id: s.decorations.at(-1)!.id, location: {kind: 'outside', x:x+12, y:y+12, rotation: 0}});
    }
    if (id === 'decorationDense') {
      for(const id of PARCEL_IDS.filter(id=>!s.acquiredParcels.includes(id)))acquire(id);
      // Fill through real commands, then keep surplus copies in the inventory.
      // This deliberately reaches the existing import/device protection bound.
      let cursor=0;
      while (s.decorations.length < MAX_DECORATIONS) {
        const catalogId = outside[s.decorations.length % outside.length];
        run({type: 'buyDecoration', catalogId});
        const id = s.decorations.at(-1)!.id;
        let installed = false;
        for (let index=cursor; index<1296 && !installed; index++) {
          const x=index%36,y=Math.floor(index/36);
          const location = {kind: 'outside' as const, x, y, rotation: DECORATIONS[catalogId].rotates && s.decorations.length % 2 ? 1 as const : 0 as const};
          if (!decorationPlacementReason(s, id, location)) { run({type: 'placeDecoration', id, location}); installed = true; cursor=index+1; }
        }
        if(!installed)cursor=1296;
      }
    }
  } else if (id === 'reproduction') {
    run({type: 'buyBuilding', kind: 'nest', x: 12, y: 12});
    run({type: 'buyBuilding', kind: 'nursery', x: 20, y: 12});
    run({type: 'feed', id: 'rabbit-2'}); run({type: 'feed', id: 'rabbit-3'});
    // Ready parents; the player starts the real breeding action.
  } else {
    acquire('east'); for(const id of PARCEL_IDS.filter(id=>!s.acquiredParcels.includes(id)))acquire(id);
    s.rabbits = []; s.buildings = []; s.discovered = [];
    const types = id === 'habitats' ? HABITAT_TYPES : id === 'collection' ? ['universal', 'universal', 'universal'] as const : ['universal', 'universal'] as const;
    for (const [index, type] of types.entries()) {
      const home = emptyBuilding(`building-${s.nextId++}`, 'enclosure', (3+index%3) * 4, (3+Math.floor(index/3)) * 4, type);
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
      for (const [x, kind] of ['farm', 'nest', 'nursery'].entries()) s.buildings.push(emptyBuilding(`building-${s.nextId++}`, kind as 'farm' | 'nest' | 'nursery', (x) * 4, 4));
    }
    s.missions = createMissions(s, now);
    if (id === 'missions') s.missions.daily.progress = {'collect-pattes': 100, 'collect-grass': 40, 'gain-affection': 3};
  }
  // Enforce exactly the same save validation used by every player import.
  const checked = decodeGame(encodeGame(s), now);
  if (!checked.ok) throw new Error(`Invalid scenario: ${checked.reason}`);
  return checked.state;
}
