// @vitest-environment happy-dom
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {GameController} from '../src/application/GameController';
import {developmentEnvironment, TEST_PREFIX, TEST_CLOCK_KEY} from '../src/dev/tools';
import {SCENARIOS, scenarioState, type ScenarioId} from '../src/dev/scenarios';
import {sessionPolicy} from '../src/config/runtime';
import {browserStorage} from '../src/persistence/browserStorage';
import {SAVE_KEY, MIGRATION_BACKUP_KEY, MISSIONS_MIGRATION_BACKUP_KEY, HABITATS_MIGRATION_BACKUP_KEY} from '../src/persistence/storage';
import {createGame, decodeGame, encodeGame} from '../src/simulation';
import {PreferenceStore} from '../src/ui/preferences';
import previous from './fixtures/before-habitats-v3.json';
import html from '../index.html?raw';

const controllers: GameController[] = [];
const dispose: (() => void)[] = [];
const normalKeys = [SAVE_KEY, MIGRATION_BACKUP_KEY, MISSIONS_MIGRATION_BACKUP_KEY, HABITATS_MIGRATION_BACKUP_KEY, 'prairie-lapins.ui.v1', 'unrelated-game'];
const normalSnapshot = () => normalKeys.map(key => localStorage.getItem(key));
beforeEach(() => {
  localStorage.clear(); vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
  window.confirm = vi.fn(() => false);
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/g, '');
  normalKeys.forEach(key => localStorage.setItem(key, key === SAVE_KEY ? encodeGame(createGame(Date.now())) : `protected-${key}`));
});
afterEach(() => { dispose.splice(0).forEach(fn => fn()); controllers.splice(0).forEach(c => c.dispose()); vi.restoreAllMocks(); });
function setup() {
  const dev = developmentEnvironment(browserStorage());
  const controller = new GameController(dev.storage, dev.clock); controllers.push(controller);
  return {dev, controller};
}

describe('published laboratory isolation', () => {
  it('refuses a normal controller accidentally passed to test commands', () => {
    const {dev} = setup(), normal = new GameController(browserStorage(), Date.now); controllers.push(normal);
    const before = normalSnapshot();
    expect(dev.grant(normal, 'pattes', 1000)).toEqual({ok: false, reason: 'NOT_TEST_SESSION'});
    expect(dev.advanceTime(normal, 1440)).toEqual({ok: false, reason: 'NOT_TEST_SESSION'});
    expect(dev.loadScenario(normal, 'habitats')).toEqual({ok: false, reason: 'NOT_TEST_SESSION'});
    expect(() => dev.mount(normal)).toThrow('isolated laboratory storage');
    expect(normalSnapshot()).toEqual(before); expect(localStorage.getItem(TEST_CLOCK_KEY)).toBeNull();
  });
  it('grants every preset and advances every time step without changing ANY normal/backup key or normal clock', () => {
    const before = normalSnapshot(), {dev, controller} = setup();
    for (const minutes of [5, 20, 60, 360, 1440]) expect(dev.advanceTime(controller, minutes).ok).toBe(true);
    for (const [resource, amounts] of Object.entries({pattes: [1000,10000], grass: [100,1000], hearts: [10,100]})) for (const amount of amounts) expect(dev.grant(controller, resource as 'pattes' | 'grass' | 'hearts', amount).ok).toBe(true);
    expect(normalSnapshot()).toEqual(before); expect(Date.now()).toBe(1_000_000);
    expect(controller.getSnapshot().state!.pattes).toBe(11300);
    expect(localStorage.getItem(TEST_CLOCK_KEY)).toBe(String((5+20+60+360+1440)*60000));
    expect(dev.policy.onlineServicesAllowed).toBe(false); expect(sessionPolicy(false).kind).toBe('normal');
  });
  it('reloads each save and the test clock independently; preferences use separate keys', () => {
    const {dev, controller} = setup(); dev.grant(controller,'pattes',1000); dev.advanceTime(controller,60);
    const normalPrefs = new PreferenceStore('prairie-lapins.ui.v1'); normalPrefs.set({muted: true});
    const normalRaw = localStorage.getItem('prairie-lapins.ui.v1');
    new PreferenceStore(dev.preferenceKey).set({muted: false, tutorial: false});
    expect(localStorage.getItem('prairie-lapins.ui.v1')).toBe(normalRaw);
    const reloaded = setup(); expect(reloaded.dev.clock()).toBe(Date.now()+3600000);
    expect(reloaded.controller.getSnapshot().state!.pattes).toBe(1300);
    const normal = new GameController(browserStorage(), Date.now); controllers.push(normal);
    expect(normal.getSnapshot().state!.pattes).toBe(300); expect(normal.getSnapshot().state!.lastSimulatedAt).toBe(Date.now());
  });
  it('prefixes migration backups and never consults normal saves', () => {
    const before = normalSnapshot(), {controller} = setup();
    const prepared = controller.prepareImport(JSON.stringify(previous)); expect(prepared.ok).toBe(true);
    if (!prepared.ok) throw Error(prepared.reason);
    expect(controller.confirmImport(prepared.token,true).ok).toBe(true);
    expect(localStorage.getItem(TEST_PREFIX+HABITATS_MIGRATION_BACKUP_KEY)).toBe(JSON.stringify(previous));
    expect(normalSnapshot()).toEqual(before);
  });
  it('imports a normal copy and can reset test state without replacing the source, clock, preferences or backups', () => {
    const before = normalSnapshot(), {dev, controller} = setup();
    const prepared=controller.prepareImport(localStorage.getItem(SAVE_KEY)!); if (!prepared.ok) throw Error(prepared.reason);
    controller.confirmImport(prepared.token,true); dev.advanceTime(controller,20); dev.grant(controller,'hearts',100);
    localStorage.setItem(dev.preferenceKey,'test-prefs'); localStorage.setItem(TEST_PREFIX+MIGRATION_BACKUP_KEY,'test-backup');
    const testBefore=localStorage.getItem(TEST_PREFIX+SAVE_KEY);
    expect(controller.restart(false).ok).toBe(false); expect(localStorage.getItem(TEST_PREFIX+SAVE_KEY)).toBe(testBefore);
    expect(controller.restart(true).ok).toBe(true); expect(controller.getSnapshot().state!.hearts).toBe(12);
    expect(localStorage.getItem(TEST_CLOCK_KEY)).toBe('1200000'); expect(localStorage.getItem(dev.preferenceKey)).toBe('test-prefs');
    expect(localStorage.getItem(TEST_PREFIX+MIGRATION_BACKUP_KEY)).toBe('test-backup'); expect(normalSnapshot()).toEqual(before);
  });
  it('rejects storage failures, overflows and invalid presets without replacing the test or normal state', () => {
    const base=browserStorage(), dev=developmentEnvironment({getItem:base.getItem,setItem:(k,v)=>{if(k===TEST_CLOCK_KEY)throw Error('quota');base.setItem(k,v);}});
    const c=new GameController(dev.storage,dev.clock);controllers.push(c);const before=c.getSnapshot().state, normal=normalSnapshot();
    expect(dev.advanceTime(c,5)).toEqual({ok:false,reason:'WRITE_FAILED'}); expect(dev.clock()).toBe(Date.now());
    expect(dev.grant(c,'hearts',-1).ok).toBe(false); expect(dev.advanceTime(c,7).ok).toBe(false);expect(c.getSnapshot().state).toEqual(before);
    const full=createGame(Date.now()); full.pattes=Number.MAX_SAFE_INTEGER;const p=c.prepareImport(encodeGame(full));if(!p.ok)throw Error(p.reason);c.confirmImport(p.token,true);
    expect(dev.grant(c,'pattes',1000).ok).toBe(false);expect(c.getSnapshot().state!.pattes).toBe(Number.MAX_SAFE_INTEGER);expect(normalSnapshot()).toEqual(normal);
  });
  it('keeps the test state intact if a grant/scenario cannot be written', () => {
    const base=browserStorage();let failed=false;
    const dev=developmentEnvironment({getItem:base.getItem,setItem:(k,v)=>{if(failed)throw Error('quota');base.setItem(k,v);}});
    const c=new GameController(dev.storage,dev.clock);controllers.push(c);const before=c.getSnapshot().state, normal=normalSnapshot();failed=true;
    expect(dev.grant(c,'pattes',1000).ok).toBe(false);expect(dev.loadScenario(c,'habitats').ok).toBe(false);
    expect(c.getSnapshot().state).toEqual(before);expect(normalSnapshot()).toEqual(normal);
  });
  it('requires confirmation in the real reset/scenario controls and labels the permanent banner', () => {
    const {dev,controller}=setup();dispose.push(dev.mount(controller));dev.grant(controller,'pattes',1000);
    const confirm=vi.mocked(window.confirm).mockReturnValue(false),before=controller.getSnapshot().state;
    document.getElementById('dev-reset')!.click();document.getElementById('dev-scenario-habitats')!.click();expect(controller.getSnapshot().state).toEqual(before);
    confirm.mockReturnValue(true);document.getElementById('dev-reset')!.click();expect(controller.getSnapshot().state!.pattes).toBe(300);
    expect(document.getElementById('dev-badge')!.hidden).toBe(false);expect(document.getElementById('dev-badge')!.textContent).toContain('MODE TEST — PARTIE SÉPARÉE');
  });
  it('exposes all seven decoration/island scenarios only in the preview and requires confirmation', () => {
    const base = browserStorage(), lab = setup(); dispose.push(lab.dev.mount(lab.controller));
    const ids = ['islandStart', 'islandExpanded', 'islandFull', 'decorationStart', 'decorationDemo', 'decoratedHabitat', 'decorationDense'];
    for (const id of ids) expect(document.getElementById('dev-scenario-' + id)).toBeNull();
    dispose.pop()!();
    const preview = developmentEnvironment(base, {decorationPreview: true});
    const controller = new GameController(preview.storage, preview.clock); controllers.push(controller);
    dispose.push(preview.mount(controller)); const original = normalSnapshot();
    for (const id of ids) expect(document.getElementById('dev-scenario-' + id)).not.toBeNull();
    const before = controller.getSnapshot().state;
    document.getElementById('dev-scenario-decorationStart')!.click();
    expect(controller.getSnapshot().state).toEqual(before);
    vi.mocked(window.confirm).mockReturnValue(true);
    document.getElementById('dev-scenario-decorationStart')!.click();
    expect(controller.getSnapshot().state).toEqual(createGame(Date.now()));
    expect(normalSnapshot()).toEqual(original);
  });
  it.each(Object.keys(SCENARIOS) as ScenarioId[])('%s passes v5 validation, serializes and never touches normal data', id => {
    const before=normalSnapshot(), fixture=scenarioState(id,Date.now());expect(decodeGame(encodeGame(fixture),Date.now())).toEqual({ok:true,state:fixture});
    const {dev,controller}=setup();expect(dev.loadScenario(controller,id).ok).toBe(true);expect(normalSnapshot()).toEqual(before);
    if(id==='habitats')for(const home of fixture.buildings)expect(fixture.rabbits.filter(r=>r.enclosureId===home.id)).toHaveLength(7);
    if(id==='collection')expect(fixture.discovered).toHaveLength(15);
    if(id==='missions')expect(fixture.missions.completed).toHaveLength(8);
    if(id==='reproduction')expect(controller.perform({type:'breed',parents:['rabbit-2','rabbit-3']}).ok).toBe(true);
  });
});
