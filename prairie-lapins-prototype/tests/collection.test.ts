import {sendToNursery} from './manual-transfer';
import {regressionStart as createGame} from './regression-start';
import {withoutHabitats, withUniversalHabitats} from './legacy';
import {createMissions} from '../src/simulation/missions';
import {describe, expect, it, vi} from 'vitest';
import {BALANCE, BREEDING_ODDS, LEGACY_SPECIES_IDS, MINUTE, RECIPE_SPECIES, SHOP_SPECIES, SPECIES, SPECIES_IDS, growthDuration, type SpeciesId} from '../src/config/balance';
import {act, advance,  decodeGame, encodeGame, pendingDiscoveries, rabbitIncome} from '../src/simulation';
import {breedingOdds, breedingPool, breedingWeights, chooseBirth} from '../src/simulation/breeding';
import {quoteAcceleration} from '../src/simulation/hearts';
import {GameController} from '../src/application/GameController';
import {SAVE_KEY, type SaveStorage} from '../src/persistence/storage';
import {collectionView, nurseryView, oddsView, probabilityLabel, recipeBook} from '../src/ui/models';
import {COATS, portrait} from '../src/ui/portraits';
import type {Command, GameState} from '../src/state/types';
import previous from './fixtures/before-collection-v2.json';
import testSave from '../docs/test-saves/collection-ready-v2.json';

const rares = [
  ['lunettes', 'paille', 'belier-gris'], ['perroquet', 'volant', 'feu'], ['feu-glace', 'feu', 'neige'],
] as const;
function run(s: GameState, command: Command, now = s.lastSimulatedAt, random = .99): GameState {
  const result = act(s, command, now, () => random); if (!result.ok) throw Error(result.reason); return result.state;
}
function couple(a: SpeciesId, b: SpeciesId, affectionA = 4, affectionB = 4): GameState {
  let s = createGame(0); s.pattes = 2000; s.grass = 200;
  s.rabbits[0].species = a; s.rabbits[1].species = b;
  s.rabbits[0].affection = affectionA; s.rabbits[1].affection = affectionB;
  s.discovered = [...new Set([a, b])];
  s = run(s, {type: 'placeStarterBuilding', kind: 'nest', x: 16, y: 12});
  return run(s, {type: 'placeStarterBuilding', kind: 'nursery', x: 20, y: 12});
}
const breed: Command = {type: 'breed', parents: ['rabbit-2', 'rabbit-3']};
function memory(raw: string) {
  const data = new Map([[SAVE_KEY, raw]]);
  const storage: SaveStorage = {getItem: k => data.get(k) ?? null, setItem: (k, v) => { data.set(k, v); }};
  return {data, storage};
}

describe('fifteen species and acquisition', () => {
  it('contains six base types, six shop commons and nine reproduction recipes, without rainbow', () => {
    expect(SPECIES_IDS).toHaveLength(15); expect(SHOP_SPECIES).toHaveLength(6); expect(RECIPE_SPECIES).toHaveLength(9);
    expect(new Set(SPECIES_IDS.flatMap(id => SPECIES[id].types))).toEqual(new Set(['paille', 'neige', 'terre', 'feu', 'metal', 'vol']));
    for (const id of SHOP_SPECIES) expect(SPECIES[id]).toMatchObject({price: 80, rarity: 'common'});
  });
  it.each(['feu', 'belier-gris', 'volant'] as const)('purchases %s for 80 with immediate enclosure welcome and discovery', species => {
    const s = run(createGame(0), {type: 'buyRabbit', species, enclosureId: 'building-1'});
    expect(s).toMatchObject({pattes: 220, hearts: 12});
    expect(s.rabbits[2]).toMatchObject({species, affection: 1, enclosureId: 'building-1'});
    expect(s.discovered).toContain(species);
    expect(decodeGame(encodeGame(s))).toEqual({ok: true, state: s});
  });
  it.each(rares)('refuses to buy %s without spending', (species) => {
    const s = createGame(0);
    expect(act(s, {type: 'buyRabbit', species, enclosureId: 'building-1'}, 0)).toEqual({ok: false, reason: 'INVALID_CHOICE', state: s});
  });
  it('keeps affection, income, building capacities, costs and established growth times', () => {
    expect(BALANCE).toMatchObject({minAffection: 1, maxAffection: 20, enclosureCapacity: 3, enclosureCap: 600, breedingCost: 0, breedingDuration: 20 * MINUTE});
    expect([rabbitIncome(1), rabbitIncome(20)]).toEqual([12, 50]);
    for (const id of SHOP_SPECIES) expect(growthDuration(id)).toBe(5 * MINUTE);
    for (const id of ['brumelin', 'mottelin'] as const) expect(growthDuration(id)).toBe(15 * MINUTE);
  });
});

describe('exact breeding pools', () => {
  it('leaves every historical union and table unchanged even with high affection', () => {
    for (const a of LEGACY_SPECIES_IDS) for (const b of LEGACY_SPECIES_IDS) {
      const key = [...new Set([...SPECIES[a].types, ...SPECIES[b].types])].sort().join(',');
      expect(breedingWeights(a, b, 4, 20)).toEqual(BREEDING_ODDS[key]);
      expect(breedingOdds(a, b, 4, 20)).toEqual(breedingOdds(a, b, 2, 2));
    }
  });
  it('checks all 120 unordered species pairs at four affection combinations for symmetry, total and admissible draws', () => {
    for (let i = 0; i < SPECIES_IDS.length; i++) for (let j = i; j < SPECIES_IDS.length; j++) {
      const a = SPECIES_IDS[i], b = SPECIES_IDS[j];
      for (const [levelA, levelB] of [[2, 2], [2, 4], [4, 2], [4, 4]]) {
        const weights = breedingWeights(a, b, levelA, levelB), odds = breedingOdds(a, b, levelA, levelB);
        expect(weights).toEqual(breedingWeights(b, a, levelB, levelA));
        expect(odds).toEqual(breedingOdds(b, a, levelB, levelA));
        expect(Object.values(odds).reduce((x, y) => x + y, 0)).toBeCloseTo(100, 12);
        const total = Object.values(weights).reduce((x, y) => x + y, 0); let cursor = 0;
        for (const [id, weight] of Object.entries(weights)) {
          const roll = (cursor + weight / 2) / total;
          expect(chooseBirth(createGame(0), a, b, roll, levelA, levelB).species).toBe(id);
          expect(SPECIES[id as SpeciesId].types.every(t => [...SPECIES[a].types, ...SPECIES[b].types].includes(t))).toBe(true);
          cursor += weight;
        }
      }
    }
  });
  it.each(rares)('admits %s only when both parents have affection 4', (rare, a, b) => {
    const commons = Object.fromEntries([a, b].map(id => [id, 50]));
    expect(breedingOdds(a, b, 2, 2)).toEqual(commons);
    expect(breedingOdds(a, b, 4, 3)).toEqual(commons);
    expect(breedingOdds(a, b, 4, 4)).toEqual({...Object.fromEntries([a, b].map(id => [id, 40])), [rare]: 20});
    const low = run(couple(a, b, 2, 2), breed);
    expect(low.buildings.find(x => x.breeding)!.breeding!.birth.species).not.toBe(rare);
    expect(low.pityFailures).toBe(0);
  });
  it('normalizes a four-type pool while retaining eligible historical hybrids', () => {
    expect(breedingWeights('lunettes', 'feu-glace', 4, 4)).toEqual({paille: 40, neige: 40, brumelin: 20, feu: 40, 'belier-gris': 40, lunettes: 20, 'feu-glace': 20, bouee: 20});
    expect(breedingWeights('lunettes', 'feu-glace', 2, 4)).toEqual({paille: 40, neige: 40, brumelin: 20, feu: 40, 'belier-gris': 40});
    const odds = oddsView(createGame(0), 'lunettes', 'feu-glace', 4, 4);
    expect(odds.entries.filter(e => e.weight === 100 / 12)).toHaveLength(4);
    expect(odds.entries.find(e => e.description === 'feu + neige · Rare')?.probability).toBe('1/12 (≈ 8,33 %)');
    expect(probabilityLabel(40, 180)).toBe('2/9 (≈ 22,22 %)');
  });
});

describe('extended guarantee and persisted rare births', () => {
  it.each(rares)('guarantees and reserves %s on the tenth eligible attempt, without discovering before welcome', (rare, a, b) => {
    let s = couple(a, b);
    for (let i = 0; i < 9; i++) {
      s = run(s, breed, s.lastSimulatedAt, 0);
      expect(s.pityFailures).toBe(i + 1);
      s = sendToNursery(s,s.lastSimulatedAt+20*MINUTE);
      s = run(s, {type: 'welcome', enclosureId: 'building-1'}, s.lastSimulatedAt + 5 * MINUTE);
      const duplicate = s.rabbits[2].id; s = run(s, {type: 'release', id: duplicate});
    }
    s = run(s, breed, s.lastSimulatedAt, 0);
    const birth = s.buildings.find(x => x.breeding)!.breeding!.birth;
    expect(birth).toMatchObject({species: rare, guaranteed: true, reservedDiscovery: true});
    expect(s.pityFailures).toBe(0); expect(s.discovered).not.toContain(rare); expect(pendingDiscoveries(s)).toEqual([rare]);
    const stored = memory(encodeGame(s)), rng = vi.fn(() => 0);
    const c = new GameController(stored.storage, () => s.lastSimulatedAt, rng);
    expect(c.getSnapshot().state).toEqual(s); expect(rng).not.toHaveBeenCalled();
    const growing = sendToNursery(advance(s, s.lastSimulatedAt + 20 * MINUTE));
    const baby = growing.buildings.find(x => x.baby)!.baby!;
    expect(baby.birth).toEqual(birth); expect(baby.readyAt - baby.startedAt).toBe(30 * MINUTE);
    const q = quoteAcceleration(growing, 'building-5', 'growth', growing.lastSimulatedAt);
    expect(q).toMatchObject({ok: true, hearts: 6}); if (!q.ok) return;
    const ready = run(growing, {type: 'accelerate', id: 'building-5', stage: 'growth', jobKey: q.jobKey, maxHearts: 6});
    expect(ready.hearts).toBe(6); expect(ready.rabbits).toHaveLength(2); expect(ready.discovered).not.toContain(rare);
    expect(ready.buildings.find(x => x.baby)!.baby!.birth).toEqual(birth);
    expect(decodeGame(encodeGame(ready))).toEqual({ok: true, state: ready});
    ready.pityFailures = 5;
    const welcomed = run(ready, {type: 'welcome', enclosureId: 'building-1'});
    expect(welcomed.discovered).toContain(rare); expect(welcomed.pityFailures).toBe(0);
    expect(welcomed.rabbits[2]).toMatchObject({id: birth.id, species: rare, affection: 1});
  });
  it('does not advance or consume a guarantee when rare recipes are excluded by affection', () => {
    let s = couple('feu', 'neige', 4, 3); s.pityFailures = 9;
    s = run(s, breed);
    expect(s.pityFailures).toBe(9); expect(s.buildings.find(b => b.breeding)!.breeding!.birth.guaranteed).toBe(false);
    expect(pendingDiscoveries(s)).toEqual([]);
  });
  it('splits a theoretical pool of four undiscovered recipes equally after affection filtering', () => {
    const s = createGame(0); s.pityFailures = 9;
    const pool = breedingPool(s, 'lunettes', 'feu-glace', 4, 4);
    expect(pool.weights).toEqual({brumelin: 1, lunettes: 1, 'feu-glace': 1, bouee: 1}); expect(pool.total).toBe(4);
    expect([1/8, 3/8, 5/8, 7/8].map(roll => chooseBirth(s, 'lunettes', 'feu-glace', roll, 4, 4).species)).toEqual(['brumelin', 'lunettes', 'feu-glace', 'bouee']);
    expect(breedingPool(s, 'lunettes', 'feu-glace', 4, 2).weights).toEqual({brumelin: 1});
    expect(oddsView(s, 'lunettes', 'feu-glace', 4, 4).entries.every(e => e.probability === '25 %')).toBe(true);
  });
  it('starts the full rare growth only when an occupied nursery becomes available', () => {
    let s = sendToNursery(advance(run(couple('feu', 'neige'), breed),20 * MINUTE));
    s = run(s, breed); const waitingBirth = s.buildings.find(b => b.breeding)!.breeding!.birth;
    s = advance(s, 120 * MINUTE);
    expect(s.buildings.find(b => b.breeding)!.breeding!.birth).toEqual(waitingBirth);
    s = run(s, {type: 'welcome', enclosureId: 'building-1'});
    expect(s.buildings.find(b=>b.baby)).toBeUndefined();s=sendToNursery(s);
    expect(s.buildings.find(b => b.baby)!.baby).toEqual({birth: waitingBirth, startedAt: 120 * MINUTE, readyAt: 150 * MINUTE});
  });
});

describe('catalogue, notebook, visuals and compatibility', () => {
  it('shows fifteen entries and nine recipes without revealing an unknown portrait or pending outcome', () => {
    const s = couple('feu', 'neige');
    const a = run(s, breed, 0, 0), b = run(s, breed, 0, .99);
    expect(a.buildings.find(x => x.breeding)!.breeding!.birth.species).not.toBe(b.buildings.find(x => x.breeding)!.breeding!.birth.species);
    expect(collectionView(a)).toEqual(collectionView(b)); expect(collectionView(a)).toHaveLength(15);
    // Equal public progression gives the same notebook whatever the secret birth.
    a.pityFailures = b.pityFailures;
    expect(recipeBook(a, 0)).toEqual(recipeBook(b, 0)); expect(recipeBook(a, 0)).toHaveLength(9);
    const growing = sendToNursery(advance(b, 20 * MINUTE));
    expect(nurseryView(growing, 20 * MINUTE)).toEqual({stage: 'growing', readyAt: 50 * MINUTE});
    expect(nurseryView(growing, 50 * MINUTE)).toMatchObject({stage: 'ready', species: 'feu-glace'});
  });
  it('explains feeding, compatible distinct parents, availability and possible versus guaranteed results', () => {
    const s = couple('feu', 'neige', 2, 4);
    let recipe = recipeBook(s, 0).find(r => r.species === 'feu-glace')!;
    expect(recipe.pairs).toEqual([{parents: ['rabbit-2', 'rabbit-3'], feeding: ['rabbit-2'], busy: false, probability: '0 %', guaranteed: false, certain: false, possible: false}]);
    s.rabbits[0].affection = 4; recipe = recipeBook(s, 0).find(r => r.species === 'feu-glace')!;
    expect(recipe.pairs[0]).toMatchObject({probability: '20 %', guaranteed: false, possible: true});
    s.pityFailures = 9; recipe = recipeBook(s, 0).find(r => r.species === 'feu-glace')!;
    expect(recipe.pairs[0]).toMatchObject({probability: '100 %', guaranteed: true, certain: true});
    const busy = run(s, breed);
    expect(recipeBook(busy, 0).find(r => r.species === 'feu-glace')!.pairs[0]).toMatchObject({busy: true, possible: false});
    expect(recipeBook(createGame(0), 0).find(r => r.species === 'lunettes')!.pairs).toEqual([]);
  });
  it('defines distinct original portraits and the six requested visual markers', () => {
    expect(new Set(SPECIES_IDS.map(id => portrait(id))).size).toBe(15);
    expect(COATS.feu.flame).toBe(true); expect(COATS['belier-gris']).toMatchObject({lop: true, metal: true});
    expect(COATS.volant.wings).toBe(true); expect(COATS.lunettes.glasses).toBe(true);
    expect(COATS.perroquet).toMatchObject({wings: true, plumage: true}); expect(COATS['feu-glace']).toMatchObject({flame: true, frost: true});
    expect(portrait()).not.toContain('feu'); expect(portrait()).toContain('>?</text>');
  });
  it('loads and imports an actual previous-build v2 export with its reserved birth and 7 hearts unchanged', () => {
    const raw = JSON.stringify(previous), parsed = decodeGame(raw, previous.lastSimulatedAt); expect(parsed.ok).toBe(true); if (!parsed.ok) return;
    const expected = {...withUniversalHabitats(previous), missions: createMissions(previous as unknown as GameState, previous.lastSimulatedAt)};
    expect(parsed.state).toEqual(expected); expect(parsed.state.version).toBe(8);
    const saved = memory(raw), rng = vi.fn(() => 0), c = new GameController(saved.storage, () => previous.lastSimulatedAt, rng);
    expect(c.getSnapshot().state).toEqual(expected); expect(rng).not.toHaveBeenCalled();
    const preview = c.prepareImport(raw); if (!preview.ok) throw Error(preview.reason);
    expect(c.confirmImport(preview.token, true)).toEqual({ok: true}); expect(c.getSnapshot().state).toEqual(expected);
    expect(pendingDiscoveries(c.getSnapshot().state!)).toEqual(['brumelin']);
    expect(collectionView(c.getSnapshot().state!)).toHaveLength(15);
  });
  it('keeps v1 migration available and rejects unknown identifiers', () => {
    const {hearts: _hearts, nextHeartGiftAt: _gift, ...rest} = previous;
    const migrated = decodeGame(JSON.stringify({...rest, version: 1}), previous.lastSimulatedAt);
    expect(migrated.ok && migrated.state).toMatchObject({version: 8, hearts: 12, discovered: previous.discovered, buildings: previous.buildings.map(b=>({...b,x:(b.x+3)*4,y:(b.y+3)*4}))});
    const invalid = structuredClone(previous); invalid.rabbits[0].species = 'arc-en-ciel';
    expect(decodeGame(JSON.stringify(invalid))).toEqual({ok: false, reason: 'INVALID_STATE'});
  });
  it('imports and exports a full fifteen-species current collection without new hearts or changed identifiers', () => {
    const parsed = decodeGame(JSON.stringify(testSave), testSave.lastSimulatedAt); if (!parsed.ok) throw Error(parsed.reason);
    const complete = parsed.state;
    const pens = complete.buildings.filter(b => b.kind === 'enclosure');
    for (const pen of pens) pen.habitat!.level = 3;
    complete.rabbits = SPECIES_IDS.map((species, index) => ({id: `rabbit-${complete.nextId++}`, species, affection: 1, enclosureId: pens[index % pens.length].id}));
    complete.discovered = [...SPECIES_IDS]; complete.hearts = 7; complete.pityFailures = 0; complete.missions = createMissions(complete, complete.lastSimulatedAt);
    const current = createGame(complete.lastSimulatedAt), saved = memory(encodeGame(current));
    const c = new GameController(saved.storage, () => complete.lastSimulatedAt);
    const preview = c.prepareImport(encodeGame(complete)); if (!preview.ok) throw Error(preview.reason);
    expect(c.getSnapshot().state).toEqual(current);
    expect(c.confirmImport(preview.token, true)).toEqual({ok: true});
    expect(c.getSnapshot().state).toEqual(complete);
    expect(decodeGame(encodeGame(c.getSnapshot().state!))).toEqual({ok: true, state: complete});
    const reloaded = new GameController(saved.storage, () => complete.lastSimulatedAt);
    expect(reloaded.getSnapshot().state).toEqual(complete); expect(collectionView(complete).every(e => e.known)).toBe(true);
  });
  it('accepts the documented development scenario and preserves its gift schedule on import', () => {
    const result = decodeGame(JSON.stringify(testSave), testSave.lastSimulatedAt); expect(result.ok).toBe(true); if (!result.ok) return;
    expect(result.state.version).toBe(8); expect(result.state.discovered).toHaveLength(6); expect(result.state.pityFailures).toBe(9);
    expect(result.state.rabbits.every(r => r.affection === 2)).toBe(true);
    const {missions, ...fields} = withoutHabitats(result.state);
    expect({...fields, version: 2}).toEqual(testSave); expect(missions.daily.referenceAt).toBe(testSave.lastSimulatedAt);
  });
});
