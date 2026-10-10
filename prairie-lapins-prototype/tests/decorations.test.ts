import {regressionStart as createGame} from './regression-start';
import {describe, expect, it, vi} from 'vitest';
import {act, advance,  decodeGame, encodeGame} from '../src/simulation';
import {DECORATIONS, DECORATION_IDS, DECORATION_RESALE_RATE, decorationResalePrice, MAX_DECORATIONS, type DecorationId} from '../src/config/decorations';
import {decorationsInCell, footprint} from '../src/simulation/decorations';
import type {Command, DecorationLocation, GameState} from '../src/state/types';
import {GameController} from '../src/application/GameController';
import {DECORATIONS_MIGRATION_BACKUP_KEY, SAVE_KEY, type SaveStorage} from '../src/persistence/storage';
import {DECORATIONS_PREVIEW_PREFIX, developmentEnvironment, TEST_PREFIX} from '../src/dev/tools';
import {scenarioState} from '../src/dev/scenarios';
import v4 from '../docs/test-saves/visual-ready-v4.json';
import {HOUR} from '../src/config/balance';

function rich() {const s = createGame(0); s.pattes = 100_000; return s;}
function run(s: GameState, command: Command) {const r = act(s, command, s.lastSimulatedAt); if (!r.ok) throw Error(r.reason); return r.state;}
function buy(s: GameState, catalogId: DecorationId = 'wildflowers') {return run(s, {type: 'buyDecoration', catalogId});}
function pose(s: GameState, location: DecorationLocation, id = s.decorations.at(-1)!.id) {return run(s, {type: 'placeDecoration', id, location});}
const outside = (x = 4, y = 0, rotation: 0 | 1 = 0): DecorationLocation => ({kind: 'outside', x:x<24?x+12:x-24, y:y+12, rotation});
function refused(s: GameState, command: Command, reason: string) {
  const before = structuredClone(s), r = act(s, command, s.lastSimulatedAt);
  expect(r).toEqual({ok: false, state: before, reason}); expect(s).toEqual(before);
}
function memory(raw?: string) {
  const values = new Map<string, string>(raw ? [[SAVE_KEY, raw]] : []), fail = {key: ''};
  const reads: string[] = [], writes: string[] = [];
  const storage: SaveStorage = {getItem: key => {reads.push(key); return values.get(key) ?? null;}, setItem: (key, value) => {writes.push(key); if (key === fail.key) throw Error('quota'); values.set(key, value);}};
  return {values, storage, fail, reads, writes};
}

describe('decoration ownership and atomic commands', () => {
  it.each(DECORATION_IDS)('buys %s at its central pattes price without bonuses or birth RNG', id => {
    const s = rich(), rng = vi.fn(() => {throw Error('No birth draw');}), r = act(s, {type: 'buyDecoration', catalogId: id}, 0, rng);
    expect(r.ok).toBe(true); if (!r.ok) return;
    expect(r.state).toEqual({...s, pattes: s.pattes - DECORATIONS[id].price, nextId: 5, decorations: [{id: 'decoration-4', catalogId: id, location: {kind: 'inventory'}}]});
    expect(r.value).toBe('decoration-4'); expect(rng).not.toHaveBeenCalled(); expect(s.decorations).toEqual([]);
    expect(decodeGame(encodeGame(r.state), 0)).toEqual({ok: true, state: r.state});
  });
  it('permits separate copies, spends nothing on insufficiency, and never offers a hearts payment', () => {
    let s = buy(buy(rich())); expect(s.decorations.map(d => d.id)).toEqual(['decoration-4', 'decoration-5']);
    s.pattes = 19; refused(s, {type: 'buyDecoration', catalogId: 'wildflowers'}, 'NOT_ENOUGH_PATTES');
    refused(s, {type: 'payWithHearts', action: {type: 'buyDecoration', catalogId: 'wildflowers'}, maxHearts: 99, maxPattes: 99} as unknown as Command, 'INVALID_CHOICE');
    refused(s, {type: 'buyDecoration', catalogId: 'missing' as DecorationId}, 'INVALID_CHOICE');
  });
  it('bounds inventories without deleting old exemplars', () => {
    const s = rich(); s.decorations = Array.from({length: MAX_DECORATIONS}, (_, i) => ({id: `decoration-${i + 4}`, catalogId: 'wildflowers', location: {kind: 'inventory'}})); s.nextId = MAX_DECORATIONS + 4;
    expect(decodeGame(encodeGame(s), 0).ok).toBe(true); refused(s, {type: 'buyDecoration', catalogId: 'wildflowers'}, 'DECORATION_LIMIT');
  });
  it('stores and re-places the same exemplar for free, without duplication', () => {
    let s = pose(buy(rich()), outside()), original = structuredClone(s);
    s = pose(s, outside(6, 2)); expect(s.decorations).toHaveLength(1); expect(s.decorations[0].id).toBe(original.decorations[0].id);
    s = pose(s, {kind: 'inventory'}); s = pose(s, outside(5, 3));
    expect(s.pattes).toBe(original.pattes); expect(s.nextId).toBe(original.nextId); expect(s.decorations).toHaveLength(1);
  });
  it.each([outside(-1, 0), outside(12, 0), outside(4, 12), outside(4.5, 0)])('refuses exterior outside the unlocked fine grid: %j', location => {
    const s = buy(rich()); refused(s, {type: 'placeDecoration', id: 'decoration-4', location}, 'INVALID_CELL');
  });
  it('refuses building footprints and other objects but allows crossing two free logical cells', () => {
    let s = buy(rich()); refused(s, {type: 'placeDecoration', id: 'decoration-4', location: outside(1, 1)}, 'CELL_OCCUPIED');
    s = pose(s, outside(4, 0)); s = buy(s); refused(s, {type: 'placeDecoration', id: 'decoration-5', location: outside(4, 0)}, 'DECORATION_OVERLAP');
    s = buy(s, 'wood-bench'); s = pose(s, outside(7, 2));
    expect(decorationsInCell(s, 4, 3)).toContain('decoration-6'); expect(decorationsInCell(s, 5, 3)).toEqual(['decoration-6']);
  });
  it.each(['wood-bench', 'flower-arch', 'play-tunnel'] as const)('rotates %s with its footprint and validates the resulting edges', catalogId => {
    let s = buy(rich(), catalogId); expect(footprint(catalogId, 0)).toEqual({width: 2, height: 1}); expect(footprint(catalogId, 1)).toEqual({width: 1, height: 2});
    refused(s, {type: 'placeDecoration', id: 'decoration-4', location: outside(11, 0)}, 'INVALID_CELL');
    s = pose(s, outside(11, 0, 1)); expect(s.decorations[0].location).toEqual(outside(11, 0, 1));
    refused(s, {type: 'placeDecoration', id: 'decoration-4', location: outside(11, 0)}, 'INVALID_CELL');
    expect(decodeGame(encodeGame(s), 0).ok).toBe(true);
  });
  it('refuses arbitrary rotations and exterior/interior mix-ups', () => {
    let s = buy(rich()); refused(s, {type: 'placeDecoration', id: 'decoration-4', location: outside(4, 0, 1)}, 'INVALID_CHOICE');
    refused(s, {type: 'placeDecoration', id: 'decoration-4', location: {kind: 'habitat', habitatId: 'building-1', slot: 0} as unknown as import('../src/state/types').DecorationLocation}, 'INVALID_CHOICE');
    s = pose(buy(s, 'soft-cushion'), outside(5, 0));
  });
  it('blocks both buying and moving buildings before payment and stores blockers only on an explicit command', () => {
    let s = pose(buy(rich(), 'wood-bench'), outside(7, 2));
    refused(s, {type: 'buyBuilding', kind: 'farm', x: 16, y: 12}, 'DECORATION_BLOCKS_BUILDING');
    refused(s, {type: 'moveBuilding', id: 'building-1', x: 20, y: 12}, 'DECORATION_BLOCKS_BUILDING');
    const original = structuredClone(s); s = run(s, {type: 'storeDecorationsInCell', x: 5, y: 3});
    expect(s.pattes).toBe(original.pattes); expect(s.buildings).toEqual(original.buildings); expect(s.decorations[0].location).toEqual({kind: 'inventory'});
    expect(run(s, {type: 'buyBuilding', kind: 'farm', x: 16, y: 12}).buildings).toHaveLength(2);
  });
  it('unlocks 12×8, 24×8 and 36×8 while keeping building coordinates unchanged', () => {
    let s = buy(rich()); refused(s, {type: 'placeDecoration', id: 'decoration-4', location: outside(12, 0)}, 'INVALID_CELL');
    s = run(s, {type:'expand',parcelId:'east',expectedCost:500}); s = pose(s, outside(23, 7));
    refused(s, {type: 'placeDecoration', id: 'decoration-4', location: outside(24, 0)}, 'INVALID_CELL');
    s = run(s, {type:'expand',parcelId:'west',expectedCost:1000}); s = pose(s, outside(35, 7)); expect(s.buildings[0]).toMatchObject({x: 12, y: 12});
  });
  it('leaves income, affection, gifts, missions and birth RNG behavior unchanged', () => {
    let plain = rich(); plain.grass = 100; plain = run(plain, {type: 'feed', id: 'rabbit-2'}); plain = run(plain, {type: 'feed', id: 'rabbit-3'});
    plain = run(plain, {type: 'buyBuilding', kind: 'nest', x: 16, y: 12}); plain = run(plain, {type: 'buyBuilding', kind: 'nursery', x: 20, y: 12});
    const decorated = pose(buy(plain), outside(1, 6));
    expect(advance(decorated, HOUR).buildings).toEqual(advance(plain, HOUR).buildings); expect(decorated.missions).toEqual(plain.missions);
    const a = vi.fn(() => .57), b = vi.fn(() => .57), command: Command = {type: 'breed', parents: ['rabbit-2', 'rabbit-3']};
    const x = act(plain, command, 0, a), y = act(decorated, command, 0, b); expect(a).toHaveBeenCalledTimes(1); expect(b).toHaveBeenCalledTimes(1);
    if (!x.ok || !y.ok) throw Error('Breeding failed');
    const birth = (s: GameState) => {const {id: _id, ...fields} = s.buildings.find(b => b.kind === 'nest')!.breeding!.birth; return fields;};
    expect(birth(x.state)).toEqual(birth(y.state)); expect(x.state.pityFailures).toBe(y.state.pityFailures); expect(x.state.hearts).toBe(y.state.hearts);
  });
});

describe('v5 saves, migrations and four-route boundaries', () => {
  it('migrates a real v4 save byte-for-field, without additional hearts or reward reset', () => {
    const decoded = decodeGame(JSON.stringify(v4), v4.lastSimulatedAt);
    expect(decoded.ok).toBe(true); if (!decoded.ok) return; expect(decoded.migratedFrom).toBe(4); expect([decoded.state.pattes,decoded.state.hearts,decoded.state.grass]).toEqual([v4.pattes,v4.hearts,v4.grass]); expect(decoded.state.rabbits).toEqual(v4.rabbits);
    const m = memory(JSON.stringify(v4)), c = new GameController(m.storage, () => v4.lastSimulatedAt);
    expect(m.values.get(DECORATIONS_MIGRATION_BACKUP_KEY)).toBe(JSON.stringify(v4)); expect(c.getSnapshot().state).toEqual(decoded.ok ? decoded.state : null);
    const c2 = new GameController(m.storage, () => v4.lastSimulatedAt); expect(c2.getSnapshot().state).toEqual(c.getSnapshot().state);
  });
  it.each([DECORATIONS_MIGRATION_BACKUP_KEY, SAVE_KEY])('keeps the original v4 save when the migration write fails at %s', key => {
    const raw = JSON.stringify(v4), m = memory(raw); m.fail.key = key;
    const c = new GameController(m.storage, () => v4.lastSimulatedAt); expect(m.values.get(SAVE_KEY)).toBe(raw); expect(c.getSnapshot().status).toBe('write-error');
    m.fail.key = ''; expect(c.retrySave()).toEqual({ok: true}); expect(JSON.parse(m.values.get(SAVE_KEY)!).version).toBe(7);
  });
  it.each(['decorationDemo', 'decoratedHabitat', 'decorationDense'] as const)('validates and restores the prepared %s scenario', id => {
    const s = scenarioState(id, 0); const placed = s.decorations.filter(d => d.location.kind !== 'inventory');
    expect(new Set(placed.map(d => d.catalogId))).toEqual(new Set(DECORATION_IDS));
    if (id === 'decorationDense') {expect(s.decorations).toHaveLength(MAX_DECORATIONS); expect(placed.length).toBeGreaterThan(100);}
    expect(decodeGame(encodeGame(s), 0)).toEqual({ok: true, state: s});
    if (id === 'decoratedHabitat' || id === 'decorationDense') expect(s.rabbits.filter(r => r.enclosureId === 'building-1')).toHaveLength(7);
    const m = memory(encodeGame(s)), c = new GameController(m.storage, () => 0), exported = c.exportGame();
    if (!exported.ok) throw Error(exported.reason); expect(JSON.parse(exported.json).version).toBe(7);
    expect(c.restart(true).ok).toBe(true); const p = c.prepareImport(exported.json); if (!p.ok) throw Error(p.reason);
    expect(c.confirmImport(p.token, true).ok).toBe(true); expect(new GameController(m.storage, () => 0).getSnapshot().state).toEqual(s);
  });
  it.each(['duplicate', 'catalog', 'next-id', 'overlap', 'bounds', 'building', 'rotation', 'missing-home', 'slot', 'slot-overlap', 'quantity', 'extra-location'] as const)('rejects malformed %s imports without replacing the current save', fault => {
    const s = pose(buy(rich()), outside());
    if (fault === 'duplicate') s.decorations.push(structuredClone(s.decorations[0]));
    if (fault === 'catalog') s.decorations[0].catalogId = 'bad-id' as DecorationId;
    if (fault === 'next-id') s.nextId = 4;
    if (fault === 'overlap') {s.decorations.push({...s.decorations[0], id: 'decoration-5'}); s.nextId = 6;}
    if (fault === 'bounds') s.decorations[0].location = outside(40, 30);
    if (fault === 'building') s.decorations[0].location = outside(0, 0);
    if (fault === 'rotation') s.decorations[0].location = outside(4, 0, 1);

    if (['missing-home', 'slot', 'slot-overlap'].includes(fault)) {s.decorations[0].catalogId = 'soft-cushion'; s.decorations[0].location = {kind: 'habitat', habitatId: fault === 'missing-home' ? 'building-999' : 'building-1', slot: fault === 'slot' ? 3 : 0} as unknown as import('../src/state/types').DecorationLocation;}
    if (fault === 'slot-overlap') {s.decorations.push({...s.decorations[0], id: 'decoration-5'}); s.nextId = 6;}
    if (fault === 'quantity') {s.decorations = Array.from({length: 513}, (_, i) => ({id: `decoration-${i + 4}`, catalogId: 'wildflowers', location: {kind: 'inventory'}})); s.nextId = 517;}
    if (fault === 'extra-location') Object.assign(s.decorations[0].location, {habitatId: 'building-1'});
    const m = memory(), c = new GameController(m.storage, () => 0), before = m.values.get(SAVE_KEY);
    expect(c.prepareImport(JSON.stringify(s))).toEqual({ok: false, reason: 'INVALID_STATE'}); expect(m.values.get(SAVE_KEY)).toBe(before);
  });
  it('prefixes every preview access, including migration backups, clock, resource tools and resets, preserving three other routes', () => {
    const m = memory(JSON.stringify(v4)); m.values.set(TEST_PREFIX + SAVE_KEY, 'laboratory-marker'); m.values.set('prairie-lapins.preview.accounts.' + SAVE_KEY, 'accounts-marker'); m.values.set('prairie-lapins.ui.v1', 'normal-prefs'); m.values.set('prairie-lapins.backup.before-v4', 'normal-backup');
    const original = new Map(m.values), env = developmentEnvironment(m.storage, {decorationPreview: true}), c = new GameController(env.storage, () => v4.lastSimulatedAt);
    expect(env.preferenceKey).toBe(DECORATIONS_PREVIEW_PREFIX + 'ui'); expect(env.policy.onlineServicesAllowed).toBe(false);
    const p = c.prepareImport(JSON.stringify(v4)); if (!p.ok) throw Error(p.reason); expect(c.confirmImport(p.token, true).ok).toBe(true);
    expect(env.grant(c, 'pattes', 1000).ok).toBe(true); expect(env.advanceTime(c, 60).ok).toBe(true); expect(env.loadScenario(c, 'decoratedHabitat').ok).toBe(true); expect(c.restart(true).ok).toBe(true);
    for (const [key, value] of original) expect(m.values.get(key)).toBe(value);
    expect(m.values.get(DECORATIONS_PREVIEW_PREFIX + DECORATIONS_MIGRATION_BACKUP_KEY)).toBe(JSON.stringify(v4));
    expect(m.reads.every(key => key.startsWith(DECORATIONS_PREVIEW_PREFIX))).toBe(true); expect(m.writes.every(key => key.startsWith(DECORATIONS_PREVIEW_PREFIX))).toBe(true);
  });
});

describe('atomic decoration resale', () => {
  it.each(DECORATION_IDS)('sells exactly one inventory %s with the configured pattes refund only', catalogId => {
    const s = buy(buy(rich(), catalogId), catalogId), before = structuredClone(s);
    const sold = run(s, {type: 'sellDecoration', id: s.decorations[0].id});
    expect(sold).toEqual({...before, pattes: before.pattes + decorationResalePrice(catalogId), decorations: [before.decorations[1]]});
    expect(s).toEqual(before);
    expect(decodeGame(encodeGame(sold), 0)).toEqual({ok: true, state: sold});
    refused(sold, {type: 'sellDecoration', id: before.decorations[0].id}, 'NOT_FOUND');
  });
  it('floors the central rate, including an odd purchase price', () => {
    expect(DECORATION_RESALE_RATE).toBe(.5);
    const price = DECORATIONS.wildflowers.price;
    try {DECORATIONS.wildflowers.price = 21; expect(decorationResalePrice('wildflowers')).toBe(10);}
    finally {DECORATIONS.wildflowers.price = price;}
  });
  it.each([outside(), outside(5,1)] as DecorationLocation[])('frees the placed destination %j without changing rabbits or buildings', location => {
    const catalogId = location.kind === 'outside' ? 'wildflowers' : 'soft-cushion';
    const s = pose(buy(buy(rich(), catalogId), catalogId), location, 'decoration-4');
    const sold = run(s, {type: 'sellDecoration', id: 'decoration-4'});
    expect(sold.decorations).toEqual([s.decorations[1]]);
    expect(pose(sold, location, 'decoration-5').decorations[0].location).toEqual(location);
    expect(sold.buildings).toEqual(s.buildings); expect(sold.rabbits).toEqual(s.rabbits);
  });
  it('refuses absent exemplars, other entity IDs, overflow and hearts wrappers atomically', () => {
    const s = buy(rich(), 'wood-bench');
    for (const id of ['missing', 'building-1', 'rabbit-2']) refused(s, {type: 'sellDecoration', id}, 'NOT_FOUND');
    refused(s, {type: 'payWithHearts', action: {type: 'sellDecoration', id: 'decoration-4'}, maxHearts: 99, maxPattes: 99} as unknown as Command, 'INVALID_CHOICE');
    s.pattes = Number.MAX_SAFE_INTEGER - 39;
    refused(s, {type: 'sellDecoration', id: 'decoration-4'}, 'RESOURCE_LIMIT');
    s.pattes--; expect(run(s, {type: 'sellDecoration', id: 'decoration-4'}).pattes).toBe(Number.MAX_SAFE_INTEGER);
  });
  it('saves the entire sale once and a second controller reloads the same result', () => {
    const s = pose(buy(rich(), 'wood-bench'), outside()), m = memory(encodeGame(s)), c = new GameController(m.storage, () => 0);
    m.writes.length = 0;
    expect(c.perform({type: 'sellDecoration', id: 'decoration-4'}).ok).toBe(true);
    const result = c.getSnapshot().state!;
    expect(result.pattes).toBe(s.pattes + 40); expect(result.decorations).toEqual([]);
    expect(m.writes).toEqual([SAVE_KEY]);
    expect(c.perform({type: 'sellDecoration', id: 'decoration-4'}).ok).toBe(false);
    expect(m.writes).toEqual([SAVE_KEY]); expect(c.getSnapshot().state).toEqual(result);
    expect(new GameController(m.storage, () => 0).getSnapshot().state).toEqual(result);
  });
  it.each(['quota', 'conflict', 'read'] as const)('keeps both object and payment on %s save refusal, and retries cannot replay a sale', fault => {
    const s = pose(buy(rich(), 'wood-bench'), outside()), m = memory(encodeGame(s)), c = new GameController(m.storage, () => 0), raw = m.values.get(SAVE_KEY)!;
    if (fault === 'quota') m.fail.key = SAVE_KEY;
    if (fault === 'conflict') m.values.set(SAVE_KEY, encodeGame({...s, grass: s.grass + 1}));
    const spy = fault === 'read' ? vi.spyOn(m.storage, 'getItem').mockImplementation(() => {throw Error('read');}) : null;
    expect(c.perform({type: 'sellDecoration', id: 'decoration-4'})).toEqual({ok: false, reason: 'SALE_NOT_SAVED'});
    expect(c.getSnapshot().state).toEqual(s);
    expect(JSON.parse(m.values.get(SAVE_KEY)!).decorations).toEqual(s.decorations);
    expect(JSON.parse(m.values.get(SAVE_KEY)!).pattes).toBe(s.pattes);
    if (fault === 'conflict') expect(c.retrySave().ok).toBe(false);
    m.fail.key = ''; spy?.mockRestore(); m.values.set(SAVE_KEY, raw);
    expect(c.retrySave()).toEqual({ok: true}); expect(c.getSnapshot().state).toEqual(s);
    expect(c.perform({type: 'sellDecoration', id: 'decoration-4'}).ok).toBe(true);
    expect(c.getSnapshot().state!.pattes).toBe(s.pattes + 40);
    expect(c.retrySave()).toEqual({ok: true}); expect(c.getSnapshot().state!.pattes).toBe(s.pattes + 40);
  });
});
