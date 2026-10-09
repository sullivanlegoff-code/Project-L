import {regressionStart as createGame} from './regression-start';
import {withoutHabitats} from './legacy';
import {createMissions} from '../src/simulation/missions';
import {describe, expect, it, vi} from 'vitest';
import {HOUR, MINUTE} from '../src/config/balance';
import {act, advance,  decodeGame, encodeGame, pendingDiscoveries} from '../src/simulation';
import {quoteComplement} from '../src/simulation/actions';
import {accelerationCost, complementCost, quoteAcceleration} from '../src/simulation/hearts';
import {GameController} from '../src/application/GameController';
import {MIGRATION_BACKUP_KEY, SAVE_KEY, type SaveStorage} from '../src/persistence/storage';
import type {Command, GameState, PattesCommand, TimedStage} from '../src/state/types';

const DAY = 24 * HOUR;
function run(s: GameState, command: Command, now = s.lastSimulatedAt): GameState {
  const result = act(s, command, now, () => .9);
  if (!result.ok) throw new Error(result.reason);
  return result.state;
}
function prepared(): GameState {
  let s = createGame(0); s.pattes = 5000;
  s = run(s, {type: 'buyBuilding', kind: 'farm', x: 4, y: 3});
  s = run(s, {type: 'buyBuilding', kind: 'nest', x: 5, y: 3});
  s = run(s, {type: 'buyBuilding', kind: 'nursery', x: 3, y: 4});
  s = run(s, {type: 'feed', id: 'rabbit-2'}); s = run(s, {type: 'feed', id: 'rabbit-3'});
  return s;
}
const breed: PattesCommand = {type: 'breed', parents: ['rabbit-2', 'rabbit-3']};
function speed(s: GameState, id: string, stage: TimedStage, now = s.lastSimulatedAt): Extract<Command, {type: 'accelerate'}> {
  const q = quoteAcceleration(s, id, stage, now); if (!q.ok) throw new Error(q.reason);
  return {type: 'accelerate', id, stage, jobKey: q.jobKey, maxHearts: q.hearts};
}
function pay(s: GameState, action: PattesCommand): Extract<Command, {type: 'payWithHearts'}> {
  const q = quoteComplement(s, action, s.lastSimulatedAt); if (!q.ok) throw new Error(q.reason);
  return {type: 'payWithHearts', action, maxHearts: q.hearts, maxPattes: q.pattes};
}
function legacy(s = createGame(0)): string {
  const {hearts: _hearts, nextHeartGiftAt: _gift, missions: _missions, ...rest} = withoutHabitats(s);
  return JSON.stringify({...rest, version: 1});
}
function store(raw?: string) {
  const data = new Map<string, string>(raw === undefined ? [] : [[SAVE_KEY, raw]]);
  const flags = {fail: ''};
  const storage: SaveStorage = {getItem: key => data.get(key) ?? null, setItem: (key, value) => {
    if (key === flags.fail) throw new Error('write denied'); data.set(key, value);
  }};
  return {data, flags, storage};
}
const current = (c: GameController) => c.getSnapshot().state!;

describe('hearts initialization, migration and gifts', () => {
  it('creates 12 hearts and a first gift exactly 24 hours after creation', () => {
    expect(createGame(123)).toMatchObject({version: 6, hearts: 12, nextHeartGiftAt: 123 + DAY});
  });
  it('migrates all v1 fields including guaranteed results, reservations and income fractions', () => {
    let s = prepared(); s.pityFailures = 9; s = run(s, breed, 17);
    const raw = legacy(s), migrated = decodeGame(raw, HOUR);
    expect(migrated).toEqual({ok: true, migratedFrom: 1, state: {...s, hearts: 12, nextHeartGiftAt: HOUR + DAY, missions: createMissions(s, HOUR)}});
    if (migrated.ok) {
      expect(pendingDiscoveries(migrated.state)).toEqual(['brumelin']);
      expect(decodeGame(encodeGame(migrated.state), 10 * DAY)).toEqual({ok: true, state: migrated.state});
    }
  });
  it('anchors migration to simulated time when the physical clock has moved backwards', () => {
    const result = decodeGame(legacy(advance(createGame(0), DAY)), HOUR);
    expect(result.ok && result.state.nextHeartGiftAt).toBe(2 * DAY);
  });
  it('backs up v1 intact and does not grant a second initial balance on reload', () => {
    const raw = legacy(), memory = store(raw);
    const c = new GameController(memory.storage, () => HOUR);
    expect(memory.data.get(MIGRATION_BACKUP_KEY)).toBe(raw);
    expect(current(c)).toMatchObject({hearts: 12, nextHeartGiftAt: HOUR + DAY});
    expect(c.perform({type: 'payWithHearts', action: {type:'expand',parcelId:'east',expectedCost:500}, maxPattes: 300, maxHearts: 8}).ok).toBe(true);
    const reloaded = new GameController(memory.storage, () => 2 * HOUR);
    expect(current(reloaded)).toMatchObject({hearts: 4, nextHeartGiftAt: HOUR + DAY});
  });
  it.each([MIGRATION_BACKUP_KEY, SAVE_KEY])('preserves v1 if migration writing %s fails', key => {
    const raw = legacy(), memory = store(raw); memory.flags.fail = key;
    const c = new GameController(memory.storage, () => HOUR);
    expect(memory.data.get(SAVE_KEY)).toBe(raw); expect(c.getSnapshot().status).toBe('write-error');
    expect(c.exportGame().ok).toBe(true); expect(current(c).hearts).toBe(12);
    memory.flags.fail = ''; c.retrySave(); expect(c.getSnapshot().status).toBe('saved');
    expect(current(new GameController(memory.storage, () => HOUR)).hearts).toBe(12);
  });
  it('refuses a gift before 24 hours, allows the boundary once and schedules from the claim', () => {
    const initial = createGame(0);
    expect(act(initial, {type: 'claimHearts'}, DAY - 1)).toMatchObject({ok: false, state: initial, reason: 'NOT_READY'});
    const s = run(initial, {type: 'claimHearts'}, DAY);
    expect(s).toMatchObject({hearts: 14, nextHeartGiftAt: 2 * DAY});
    expect(act(s, {type: 'claimHearts'}, DAY)).toMatchObject({ok: false, state: s});
    expect(act(s, {type: 'claimHearts'}, 0)).toMatchObject({ok: false, state: s});
    expect(run(s, {type: 'claimHearts'}, 2 * DAY).hearts).toBe(16);
  });
  it('never accumulates missed gifts across multiple days', () => {
    const s = run(createGame(0), {type: 'claimHearts'}, 9 * DAY + HOUR);
    expect(s).toMatchObject({hearts: 14, nextHeartGiftAt: 10 * DAY + HOUR});
    expect(act(s, {type: 'claimHearts'}, 10 * DAY)).toMatchObject({ok: false});
  });
  it('preserves claimed gifts across reload and refuses another claim after clock reversal', () => {
    const memory = store(); let now = 0; const c = new GameController(memory.storage, () => now);
    now = DAY; c.perform({type: 'claimHearts'}); now = HOUR;
    const reloaded = new GameController(memory.storage, () => now);
    expect(reloaded.perform({type: 'claimHearts'})).toMatchObject({ok: false, reason: 'NOT_READY'});
    expect(current(reloaded)).toMatchObject({hearts: 14, nextHeartGiftAt: 2 * DAY, lastSimulatedAt: DAY});
  });
});

describe('acceleration transactions', () => {
  it.each([[0, 0], [1, 1], [5 * MINUTE, 1], [5 * MINUTE + 1, 2], [6 * MINUTE, 2], [20 * MINUTE, 4]])('rounds %i milliseconds to %i hearts', (remaining, expected) => {
    expect(accelerationCost(remaining)).toBe(expected);
  });
  it('finishes only the selected farm at now, without extra income or changing another timer', () => {
    let s = run(prepared(), {type: 'startOrder', id: 'building-4', recipe: 'large'});
    s = run(s, {type: 'buyBuilding', kind: 'farm', x: 4, y: 4});
    s = run(s, {type: 'startOrder', id: 'building-7', recipe: 'medium'});
    const baseline = advance(s, MINUTE), command = speed(s, 'building-4', 'order', MINUTE);
    const result = run(s, command, MINUTE);
    expect(result.lastSimulatedAt).toBe(MINUTE); expect(result.grass).toBe(s.grass);
    expect(result.buildings[0].incomeUnits).toBe(baseline.buildings[0].incomeUnits);
    expect(result.buildings.find(b => b.id === 'building-7')).toEqual(baseline.buildings.find(b => b.id === 'building-7'));
    expect(result.buildings[1].order?.endsAt).toBe(MINUTE); expect(result.hearts).toBe(0);
    expect(run(result, {type: 'collectOrder', id: 'building-4'}).grass).toBe(s.grass + 100);
    expect(decodeGame(encodeGame(result))).toEqual({ok: true, state: result});
  });
  it('uses the lower price at confirmation, without resetting the clock or next gift', () => {
    const s = run(prepared(), {type: 'startOrder', id: 'building-4', recipe: 'medium'});
    const command = speed(s, 'building-4', 'order'); expect(command.maxHearts).toBe(3);
    const memory = store(encodeGame(s)); const c = new GameController(memory.storage, () => 11 * MINUTE);
    expect(c.perform(command)).toMatchObject({ok: true, value: 1});
    expect(current(c)).toMatchObject({hearts: 11, nextHeartGiftAt: DAY, lastSimulatedAt: 11 * MINUTE});
  });
  it('spends nothing if the stage has already ended or the button is pressed twice', () => {
    const s = run(prepared(), {type: 'startOrder', id: 'building-4', recipe: 'small'});
    const command = speed(s, 'building-4', 'order');
    expect(act(s, command, 5 * MINUTE)).toMatchObject({ok: false, reason: 'ACTION_FINISHED', state: s});
    const paid = run(s, command); expect(act(paid, command)).toMatchObject({ok: false, state: paid});
  });
  it('refuses insufficient hearts, unconfirmed higher prices and changed targets without mutation', () => {
    const s = run(prepared(), {type: 'startOrder', id: 'building-4', recipe: 'medium'});
    const command = speed(s, 'building-4', 'order');
    expect(act(s, {...command, maxHearts: 2}, 0)).toMatchObject({ok: false, reason: 'PRICE_CHANGED', state: s});
    expect(act(s, {...command, jobKey: 'old'}, 0)).toMatchObject({ok: false, reason: 'STALE_ACTION', state: s});
    s.hearts = 0; expect(act(s, command, 0)).toMatchObject({ok: false, reason: 'NOT_ENOUGH_HEARTS', state: s});
  });
  it('keeps the reserved birth and starts full growth now without any random redraw', () => {
    let s = prepared(); s.pityFailures = 9; s = run(s, breed);
    const birth = s.buildings.find(b => b.breeding)!.breeding!.birth, rng = vi.fn(() => 0);
    const result = act(s, speed(s, 'building-5', 'breeding'), MINUTE, rng);
    expect(result.ok).toBe(true); if (!result.ok) return;
    expect(rng).not.toHaveBeenCalled();
    const baby = result.state.buildings.find(b => b.baby)!.baby!;
    expect(baby).toEqual({birth, startedAt: MINUTE, readyAt: 16 * MINUTE});
    expect(result.state.discovered).not.toContain(birth.species); expect(pendingDiscoveries(result.state)).toEqual(['brumelin']);
    expect(result.state.pityFailures).toBe(0);
    expect(decodeGame(encodeGame(result.state))).toEqual({ok: true, state: result.state});
  });
  it('allows a running reproduction to finish into an occupied nursery wait, then transfers normally', () => {
    let s = advance(run(prepared(), breed), 20 * MINUTE);
    const firstBaby = s.buildings.find(b => b.baby)!.baby;
    s = run(s, breed); const birth = s.buildings.find(b => b.breeding)!.breeding!.birth;
    s = run(s, speed(s, 'building-5', 'breeding'));
    expect(s.buildings.find(b => b.baby)!.baby).toEqual(firstBaby);
    expect(s.buildings.find(b => b.breeding)!.breeding).toMatchObject({endsAt: 20 * MINUTE, birth});
    expect(quoteAcceleration(s, 'building-5', 'breeding', s.lastSimulatedAt)).toMatchObject({ok: false, reason: 'ACTION_FINISHED'});
    expect(decodeGame(encodeGame(s))).toEqual({ok: true, state: s});
    s = run(s, {type: 'welcome', enclosureId: 'building-1'}, 35 * MINUTE);
    expect(s.buildings.find(b => b.baby)!.baby).toEqual({birth, startedAt: 35 * MINUTE, readyAt: 50 * MINUTE});
  });
  it('makes growth ready without welcoming, and refuses accelerating a capacity blockage', () => {
    let s = advance(run(prepared(), breed), 20 * MINUTE);
    const command = speed(s, 'building-6', 'growth'), paid = run(s, command);
    expect(paid.rabbits).toHaveLength(2); expect(paid.discovered).toEqual(s.discovered);
    expect(paid.buildings.find(b => b.baby)!.baby!.readyAt).toBe(s.lastSimulatedAt);
    expect(decodeGame(encodeGame(paid))).toEqual({ok: true, state: paid});
    s = run(s, {type: 'buyRabbit', species: 'terre', enclosureId: 'building-1'});
    expect(act(s, command, s.lastSimulatedAt)).toMatchObject({ok: false, reason: 'CAPACITY_FULL', state: s});
  });
  it('keeps strict v1 durations and rejects incomplete or negative v2 heart fields', () => {
    let s = run(prepared(), {type: 'startOrder', id: 'building-4', recipe: 'small'});
    s = run(s, speed(s, 'building-4', 'order'));
    expect(decodeGame(legacy(s), 0)).toMatchObject({ok: false, reason: 'INVALID_STATE'});
    const raw = JSON.parse(encodeGame(s)); delete raw.hearts; expect(decodeGame(JSON.stringify(raw)).ok).toBe(false);
    raw.hearts = -1; expect(decodeGame(JSON.stringify(raw)).ok).toBe(false);
    raw.hearts = 0; raw.nextHeartGiftAt = -1; expect(decodeGame(JSON.stringify(raw)).ok).toBe(false);
    raw.nextHeartGiftAt = DAY; raw.buildings[1].order.endsAt = MINUTE;
    expect(decodeGame(JSON.stringify(raw)).ok).toBe(false); // A shortened stage cannot still be in the future.
  });
});

describe('pattes complement transactions', () => {
  it.each([[0, 0], [1, 1], [25, 1], [26, 2], [50, 2], [51, 3]])('rounds %i missing pattes to %i hearts', (missing, expected) => {
    expect(complementCost(missing)).toBe(expected);
  });
  it.each<PattesCommand>([
    {type: 'buyBuilding', kind: 'enclosure', x: 4, y: 4},
    {type: 'buyRabbit', species: 'terre', enclosureId: 'building-1'},
    {type:'expand',parcelId:'east',expectedCost:500}, {type: 'startOrder', id: 'building-4', recipe: 'small'}, breed,
  ])('explicitly pays the exact shortage for $type and does not grant change', action => {
    const s = prepared(); s.pattes = 3; s.hearts = 100;
    const before = structuredClone(s), q = quoteComplement(s, action, 0); expect(s).toEqual(before);
    if (!q.ok) throw new Error(q.reason);
    expect(act(s, action, 0)).toMatchObject({ok: false, reason: 'NOT_ENOUGH_PATTES', state: s});
    const result = run(s, pay(s, action)); expect(result.pattes).toBe(0); expect(result.hearts).toBe(100 - q.hearts);
    expect(decodeGame(encodeGame(result))).toEqual({ok: true, state: result});
  });
  it('implements 30 pattes + 2 hearts for an 80-patte rabbit', () => {
    const s = createGame(0); s.pattes = 30; const action: PattesCommand = {type: 'buyRabbit', species: 'terre', enclosureId: 'building-1'};
    expect(quoteComplement(s, action, 0)).toEqual({ok: true, cost: 80, pattes: 30, missing: 50, hearts: 2});
    const paid = run(s, pay(s, action)); expect(paid).toMatchObject({pattes: 0, hearts: 10}); expect(paid.rabbits).toHaveLength(3);
  });
  it('checks space and parent availability before proposing any payment', () => {
    let s = prepared(); s.pattes = 0;
    expect(quoteComplement(s, {type: 'buyBuilding', kind: 'farm', x: 3, y: 3}, 0)).toEqual({ok: false, reason: 'CELL_OCCUPIED'});
    expect(quoteComplement(s, {type: 'buyBuilding', kind: 'farm', x: 8, y: 3}, 0)).toEqual({ok: false, reason: 'INVALID_CELL'});
    expect(quoteComplement(s, {type: 'breed', parents: ['rabbit-2', 'rabbit-2']}, 0)).toEqual({ok: false, reason: 'SAME_PARENT'});
    s.rabbits[0].affection = 1; expect(quoteComplement(s, breed, 0)).toEqual({ok: false, reason: 'AFFECTION_TOO_LOW'});
    s.rabbits[0].affection = 2; s = run(s, pay(s, breed));
    expect(quoteComplement(s, breed, 0)).toEqual({ok: false, reason: 'BUSY'});
  });
  it('rejects payment if another condition changes, funds are insufficient or a cap is exceeded', () => {
    const s = prepared(); s.pattes = 30; const action: PattesCommand = {type: 'buyRabbit', species: 'terre', enclosureId: 'building-1'}, command = pay(s, action);
    s.hearts = 1; expect(act(s, command)).toMatchObject({ok: false, reason: 'NOT_ENOUGH_HEARTS', state: s});
    s.hearts = 12; s.pattes = 0; expect(act(s, command)).toMatchObject({ok: false, reason: 'PRICE_CHANGED', state: s});
    s.pattes = 31; expect(act(s, command)).toMatchObject({ok: false, reason: 'PRICE_CHANGED', state: s});
    s.pattes = 30; const full = run(s, command);
    expect(act(full, command)).toMatchObject({ok: false, reason: 'CAPACITY_FULL', state: full});
  });
  it('cannot substitute hearts for grass', () => {
    const s = createGame(0); s.grass = 0;
    expect(act(s, {type: 'feed', id: 'rabbit-2'}, 0)).toMatchObject({ok: false, reason: 'NOT_ENOUGH_GRASS', state: s});
    expect(act(s, {type: 'payWithHearts', action: {type: 'feed', id: 'rabbit-2'}, maxPattes: 0, maxHearts: 12} as unknown as Command, 0)).toMatchObject({ok: false, reason: 'INVALID_CHOICE', state: s});
  });
});

describe('v1/v2 imports and exports', () => {
  it('imports and exports the current version without granting hearts again', () => {
    const memory = store(), c = new GameController(memory.storage, () => HOUR);
    const s = createGame(0); s.hearts = 3;
    const preview = c.prepareImport(encodeGame(s)); if (!preview.ok) throw new Error(preview.reason);
    expect(preview.summary.hearts).toBe(3); expect(c.confirmImport(preview.token, true)).toEqual({ok: true});
    expect(current(c).hearts).toBe(3); const exported = c.exportGame(); if (!exported.ok) throw new Error(exported.reason);
    expect(JSON.parse(exported.json)).toMatchObject({version: 6, hearts: 3});
  });
  it('migrates v1 at confirmation time, with cancellation and write failures preserving the active save', () => {
    const memory = store(); let now = 0; const c = new GameController(memory.storage, () => now);
    const old = memory.data.get(SAVE_KEY), before = current(c), raw = legacy();
    let preview = c.prepareImport(raw); if (!preview.ok) throw new Error(preview.reason);
    c.confirmImport(preview.token, false); expect(current(c)).toEqual(before); expect(memory.data.get(SAVE_KEY)).toBe(old);
    preview = c.prepareImport(raw); if (!preview.ok) throw new Error(preview.reason);
    now = HOUR; memory.flags.fail = SAVE_KEY;
    expect(c.confirmImport(preview.token, true)).toEqual({ok: false, reason: 'WRITE_FAILED'});
    expect(current(c)).toEqual(before); expect(memory.data.get(SAVE_KEY)).toBe(old);
    now = 2 * HOUR; memory.flags.fail = ''; expect(c.confirmImport(preview.token, true)).toEqual({ok: true});
    expect(current(c)).toMatchObject({hearts: 12, nextHeartGiftAt: 2 * HOUR + DAY});
    expect(memory.data.get(MIGRATION_BACKUP_KEY)).toBe(raw);
  });
});
