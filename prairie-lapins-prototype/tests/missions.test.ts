import {regressionStart as createGame} from './regression-start';
import {withoutHabitats} from './legacy';
import {describe, expect, it, vi} from 'vitest';
import {act, advance,  decodeGame, encodeGame, pendingDiscoveries} from '../src/simulation';
import {HOUR, MINUTE} from '../src/config/balance';
import {MAIN_MISSIONS, MAIN_MISSION_IDS, DAILY_MISSION_IDS, MISSION_CYCLE_DURATION as DAY} from '../src/config/missions';
import {dailyCycleEnd, emptyDailyProgress} from '../src/simulation/missions';
import {GameController} from '../src/application/GameController';
import {SAVE_KEY, MISSIONS_MIGRATION_BACKUP_KEY, type SaveStorage} from '../src/persistence/storage';
import type {Command, GameState} from '../src/state/types';
import previous from './fixtures/before-collection-v2.json';
import collection from '../docs/test-saves/collection-ready-v2.json';

const run = (s: GameState, c: Command, now = s.lastSimulatedAt) => {
  const result = act(s, c, now, () => .9); if (!result.ok) throw Error(result.reason); return result.state;
};
function prepared() {
  let s = createGame(0); s.pattes = 5000; s.grass = 1000;
  for (const [kind, x, y] of [['farm',4,3], ['nest',5,3], ['nursery',3,4]] as const) s = run(s,kind==='nest'||kind==='nursery'?{type:'placeStarterBuilding',kind,x:x*4,y:y*4}:{type:'buyBuilding',kind,x:x*4,y:y*4});
  return s;
}
function legacy(s: GameState, version: 1 | 2 = 2) {
  const {missions: _missions, hearts, nextHeartGiftAt, ...fields} = withoutHabitats(s);
  return JSON.stringify({...fields, version, ...(version === 2 ? {hearts, nextHeartGiftAt} : {})});
}
function read(raw: string, now: number) {
  const result = decodeGame(raw, now); if (!result.ok) throw Error(result.reason); return result.state;
}
function memory(raw?: string) {
  const data = new Map<string,string>(raw === undefined ? [] : [[SAVE_KEY,raw]]), flags = {fail:''};
  const storage: SaveStorage = {getItem: key => data.get(key) ?? null, setItem: (key,value) => {if (key === flags.fail) throw Error('quota');data.set(key,value);}};
  return {data,flags,storage};
}
function dailyReady() {
  let s=prepared(); s=run(s,{type:'startOrder',id:'building-4',recipe:'medium'});
  s=run(s,{type:'collectIncome',id:'building-1'},5*HOUR);
  s=run(s,{type:'collectOrder',id:'building-4'});
  for(let i=0;i<3;i++)s=run(s,{type:'feed',id:'rabbit-2'});
  return s;
}
const state=(c:GameController)=>c.getSnapshot().state!;

describe('main missions and unique rewards',()=>{
  it('starts eight unclaimed visible objectives and a fresh 24-hour cycle without changing initial resources',()=>{
    const s=createGame(123);
    expect(MAIN_MISSION_IDS).toHaveLength(8);expect(s).toMatchObject({version:8,pattes:300,grass:10,hearts:12});
    expect(s.missions).toEqual({completed:[],claimed:[],daily:{referenceAt:123,cycleIndex:0,progress:emptyDailyProgress(),claimed:[],bonusClaimed:false}});
    expect(dailyCycleEnd(s)).toBe(123+DAY);
  });
  it('retroactively acquires exactly the conditions visible in a migrated collection, without claiming or inventing affection history',()=>{
    const s=read(JSON.stringify(collection),collection.lastSimulatedAt+HOUR);
    expect(s.missions.completed).toEqual(['first-farm','cozy-nest','welcome-babies','varied-family','growing-collection','bigger-meadow']);
    expect(s.missions.claimed).toEqual([]);expect(s.missions.daily.progress).toEqual(emptyDailyProgress());
    expect(s).toMatchObject({hearts:12,pattes:collection.pattes,grass:collection.grass,nextHeartGiftAt:collection.nextHeartGiftAt});
    expect(s.missions.daily.referenceAt).toBe(collection.lastSimulatedAt+HOUR);
  });
  it('recognizes affection and rare discovery from current state, never from a pending birth',()=>{
    let s=prepared();s.rabbits[0].affection=5;s.discovered.push('lunettes');
    s=read(legacy(s),HOUR);
    expect(s.missions.completed).toContain('strong-bonds');expect(s.missions.completed).toContain('first-rare');
    const waiting=read(JSON.stringify(previous),previous.lastSimulatedAt);
    expect(waiting.missions.completed).not.toContain('first-rare');expect(waiting.discovered).toEqual(previous.discovered);
  });
  it('keeps an acquired affection condition after its only high-level rabbit is released',()=>{
    let s=createGame(0);s.grass=100;
    s=run(s,{type:'buyRabbit',species:'paille',enclosureId:'building-1'});
    for(let i=0;i<4;i++)s=run(s,{type:'feed',id:'rabbit-2'});
    s=run(s,{type:'release',id:'rabbit-2'});
    expect(s.rabbits.every(r=>r.affection<5)).toBe(true);expect(s.missions.completed).toContain('strong-bonds');
    const restored=read(encodeGame(s),DAY);expect(run(restored,{type:'claimMainMission',id:'strong-bonds'}).hearts).toBe(13);
  });
  it.each(MAIN_MISSION_IDS)('claims %s once, credits its exact reward, and never counts the reward as daily work',id=>{
    const before=prepared(); before.missions.completed=[id];
    const s=run(before,{type:'claimMainMission',id}), reward=MAIN_MISSIONS[id].reward;
    expect(s[reward.resource]).toBe(before[reward.resource]+reward.amount);expect(s.missions.claimed).toEqual([id]);
    expect(s.missions.daily).toEqual(before.missions.daily);
    const result=act(s,{type:'claimMainMission',id},s.lastSimulatedAt);
    expect(result).toEqual({ok:false,state:s,reason:'ALREADY_CLAIMED'});
    expect(read(encodeGame(s),0)).toEqual(s);
  });
  it('refuses unmet, invalid and overflowing rewards without any partial claim or resource change',()=>{
    const s=createGame(0);
    expect(act(s,{type:'claimMainMission',id:'first-farm'},0)).toEqual({ok:false,state:s,reason:'NOT_READY'});
    expect(act(s,{type:'claimMainMission',id:'invented'} as unknown as Command,0)).toMatchObject({ok:false,state:s,reason:'INVALID_CHOICE'});
    s.missions.completed=['cozy-nest'];s.pattes=Number.MAX_SAFE_INTEGER;
    expect(act(s,{type:'claimMainMission',id:'cozy-nest'},0)).toEqual({ok:false,state:s,reason:'RESOURCE_LIMIT'});
  });
  it('acquires a building mission when bought with hearts but counts no daily action',()=>{
    const s=createGame(0);s.pattes=0;
    const bought=run(s,{type:'payWithHearts',action:{type:'buyBuilding',kind:'farm',x: 16, y: 12},maxHearts:3,maxPattes:0});
    expect(bought.missions.completed).toEqual(['first-farm']);expect(bought.missions.daily.progress).toEqual(emptyDailyProgress());
  });
});

describe('daily event accounting and fixed cycles',()=>{
  it('counts actual collected integer pattes, collected grass and gained levels exactly, once',()=>{
    const ready=dailyReady();expect(ready.missions.daily.progress).toEqual({'collect-pattes':120,'collect-grass':40,'gain-affection':3});
    const again=run(ready,{type:'collectIncome',id:'building-1'});
    expect(again.missions.daily.progress).toEqual(ready.missions.daily.progress);
    expect(act(again,{type:'collectOrder',id:'building-4'},again.lastSimulatedAt)).toMatchObject({ok:false,state:again});
  });
  it('does not count stored income, ready production, initial resources, quotes or refused actions',()=>{
    let s=prepared();s=run(s,{type:'startOrder',id:'building-4',recipe:'medium'});s=advance(s,5*HOUR);
    expect(s.buildings[0].incomeUnits).toBe(120*HOUR);expect(s.missions.daily.progress).toEqual(emptyDailyProgress());
    s.grass=0; expect(act(s,{type:'feed',id:'rabbit-2'},s.lastSimulatedAt)).toMatchObject({ok:false,state:s});
    expect(act(s,{type:'buyBuilding',kind:'farm',x: 12, y: 12},s.lastSimulatedAt)).toMatchObject({ok:false,state:s});
  });
  it('counts a production started and ready before renewal only when harvested in the new cycle',()=>{
    let s=prepared();s=run(s,{type:'startOrder',id:'building-4',recipe:'small'},DAY-20*MINUTE);
    s=advance(s,DAY);expect(s.missions.daily.progress).toEqual(emptyDailyProgress());
    s=run(s,{type:'collectOrder',id:'building-4'},DAY+1);
    expect(s.missions.daily.cycleIndex).toBe(1);expect(s.missions.daily.progress['collect-grass']).toBe(20);
  });
  it('assigns actions to the new cycle at the exact 24-hour boundary, not midnight',()=>{
    let s=createGame(12345);s.grass=100;
    s=run(s,{type:'feed',id:'rabbit-2'},12345+DAY-1);expect(s.missions.daily.progress['gain-affection']).toBe(1);
    s=run(s,{type:'feed',id:'rabbit-2'},12345+DAY);expect(s.missions.daily.progress['gain-affection']).toBe(1);
    expect(s.missions.daily).toMatchObject({referenceAt:12345,cycleIndex:1});expect(dailyCycleEnd(s)).toBe(12345+2*DAY);
  });
  it('expires unclaimed rewards and the unclaimed bonus and rejects a stale-cycle claim',()=>{
    let s=dailyReady();const claim:Command={type:'claimDailyMission',id:'collect-grass',cycleStart:0};
    const before=structuredClone(s);
    expect(act(s,claim,DAY)).toEqual({ok:false,state:before,reason:'CYCLE_EXPIRED'});
    for(const id of DAILY_MISSION_IDS)s=run(s,{type:'claimDailyMission',id,cycleStart:0});
    expect(s.missions.daily.bonusClaimed).toBe(false);const next=advance(s,DAY);
    expect(next.missions.daily).toMatchObject({cycleIndex:1,progress:emptyDailyProgress(),claimed:[],bonusClaimed:false});
    expect(next.hearts).toBe(12);expect(act(next,{type:'claimDailyBonus',cycleStart:0},DAY)).toMatchObject({ok:false,reason:'CYCLE_EXPIRED'});
  });
  it('skips absent cycles without reward stacking and matches repeated shorter resumes',()=>{
    const s=dailyReady();const long=advance(s,9*DAY+HOUR);
    let short=s;for(let n=1;n<=9;n++)short=advance(short,n*DAY);short=advance(short,9*DAY+HOUR);
    expect(short).toEqual(long);expect(long.missions.daily).toMatchObject({referenceAt:0,cycleIndex:9,progress:emptyDailyProgress()});
    expect(long.hearts).toBe(s.hearts);expect(long.pattes).toBe(s.pattes);expect(dailyCycleEnd(long)).toBe(10*DAY);
  });
  it('never reopens an old cycle when the clock moves backwards',()=>{
    const s=run(advance(prepared(),DAY),{type:'feed',id:'rabbit-2'},DAY);
    expect(advance(s,0)).toEqual(s);expect(run(s,{type:'feed',id:'rabbit-3'},0).missions.daily).toMatchObject({cycleIndex:1,progress:{'gain-affection':2}});
    expect(act(s,{type:'claimDailyBonus',cycleStart:0},0)).toMatchObject({ok:false,reason:'CYCLE_EXPIRED'});
  });
  it('requires all three rewards claimed before a single bonus, without counting any rewards',()=>{
    let s=dailyReady();const progress=structuredClone(s.missions.daily.progress);
    expect(act(s,{type:'claimDailyBonus',cycleStart:0},s.lastSimulatedAt)).toMatchObject({ok:false,reason:'NOT_READY'});
    for(const id of DAILY_MISSION_IDS){s=run(s,{type:'claimDailyMission',id,cycleStart:0});expect(act(s,{type:'claimDailyMission',id,cycleStart:0},s.lastSimulatedAt)).toMatchObject({ok:false,reason:'ALREADY_CLAIMED'});}
    expect(s.missions.daily.progress).toEqual(progress);expect(s.hearts).toBe(12);
    s=run(s,{type:'claimDailyBonus',cycleStart:0});expect(s.hearts).toBe(14);expect(s.nextHeartGiftAt).toBe(DAY);
    expect(act(s,{type:'claimDailyBonus',cycleStart:0},s.lastSimulatedAt)).toMatchObject({ok:false,state:s,reason:'ALREADY_CLAIMED'});
    expect(run(s,{type:'claimHearts'},DAY).hearts).toBe(16);
  });
});

describe('v3 persistence, migrations and controller',()=>{
  it.each([1,2] as const)('migrates v%i at monotone time with no invented action history or automatic claims',version=>{
    const old=prepared();old.hearts=7;old.nextHeartGiftAt=123456789;old.lastSimulatedAt=HOUR;
    const migrated=read(legacy(old,version),0);
    expect(migrated.missions).toMatchObject({claimed:[],daily:{referenceAt:HOUR,cycleIndex:0,progress:emptyDailyProgress()}});
    expect(migrated.hearts).toBe(version===1?12:7);expect(migrated.nextHeartGiftAt).toBe(version===1?HOUR+DAY:123456789);
    const {missions: _missions,version: _v,...fields}=migrated;
    const {missions: _m,version: _old,...oldFields}=old;
    expect(fields).toEqual({...oldFields,hearts:version===1?12:7,nextHeartGiftAt:version===1?HOUR+DAY:123456789});
    expect(read(encodeGame(migrated),10*DAY)).toEqual(migrated);
  });
  it('restores a migrated export with an older physical clock without accepting work before the migration reference',()=>{
    const migrated=read(legacy(prepared()),HOUR),m=memory(encodeGame(migrated));
    const c=new GameController(m.storage,()=>0);
    expect(state(c).lastSimulatedAt).toBe(HOUR);
    expect(c.perform({type:'feed',id:'rabbit-2'}).ok).toBe(true);
    expect(c.getSnapshot().status).toBe('saved');
    expect(read(m.data.get(SAVE_KEY)!,0)).toEqual(state(c));
  });
  it('preserves an actual v2 reserved breeding result, fractions and heart gift while migrating',()=>{
    const s=read(JSON.stringify(previous),previous.lastSimulatedAt), {missions,version,...fields}=withoutHabitats(s);
    expect({...fields,version:2}).toEqual(previous);expect(pendingDiscoveries(s)).toEqual(['brumelin']);
    expect(missions.daily.referenceAt).toBe(previous.lastSimulatedAt);expect(missions.claimed).toEqual([]);
  });
  it('backs up v2 before migration and does not reset claims, cycles or hearts on reload',()=>{
    const raw=legacy(prepared()), m=memory(raw);let now=HOUR;
    const c=new GameController(m.storage,()=>now);expect(m.data.get(MISSIONS_MIGRATION_BACKUP_KEY)).toBe(raw);
    expect(c.perform({type:'claimMainMission',id:'first-farm'}).ok).toBe(true);
    const saved=state(c);now=2*HOUR;const loaded=new GameController(m.storage,()=>now);
    expect(state(loaded)).toEqual(advance(saved,now));expect(loaded.perform({type:'claimMainMission',id:'first-farm'})).toMatchObject({ok:false,reason:'ALREADY_CLAIMED'});
  });
  it.each([MISSIONS_MIGRATION_BACKUP_KEY,SAVE_KEY])('preserves original v2 when writing %s fails',key=>{
    const raw=legacy(prepared()),m=memory(raw);m.flags.fail=key;
    const c=new GameController(m.storage,()=>HOUR);
    expect(c.getSnapshot().status).toBe('write-error');expect(m.data.get(SAVE_KEY)).toBe(raw);expect(state(c).hearts).toBe(12);
    m.flags.fail='';expect(c.retrySave().ok).toBe(true);expect(JSON.parse(m.data.get(SAVE_KEY)!).version).toBe(8);
  });
  it('saves a claim and its reward together; write failure preserves them in memory and retry never grants twice',()=>{
    const m=memory(encodeGame(prepared())),c=new GameController(m.storage,()=>0);const raw=m.data.get(SAVE_KEY),before=state(c);
    m.flags.fail=SAVE_KEY;expect(c.perform({type:'claimMainMission',id:'first-farm'}).ok).toBe(true);
    expect(state(c).grass).toBe(before.grass+20);expect(state(c).missions.claimed).toEqual(['first-farm']);expect(m.data.get(SAVE_KEY)).toBe(raw);
    expect(c.exportGame().ok).toBe(true);expect(c.perform({type:'claimMainMission',id:'first-farm'})).toMatchObject({ok:false,reason:'ALREADY_CLAIMED'});
    m.flags.fail='';c.retrySave();const loaded=new GameController(m.storage,()=>0);expect(state(loaded)).toEqual(state(c));
  });
  it('retains controller time rollover after a refused action',()=>{
    const m=memory(encodeGame(dailyReady()));let now=5*HOUR;const c=new GameController(m.storage,()=>now);
    now=DAY;expect(c.perform({type:'claimDailyMission',id:'collect-pattes',cycleStart:0})).toMatchObject({ok:false,reason:'CYCLE_EXPIRED'});
    expect(state(c).missions.daily.cycleIndex).toBe(1);expect(read(m.data.get(SAVE_KEY)!,now)).toEqual(state(c));
  });
  it('replaces rather than merging imported rewards and resources, with cancellation and write failure protection',()=>{
    const original=run(dailyReady(),{type:'claimDailyMission',id:'collect-pattes',cycleStart:0});
    const m=memory(encodeGame(original)),c=new GameController(m.storage,()=>5*HOUR);
    const incoming=createGame(5*HOUR);incoming.pattes=9000;incoming.grass=9000;incoming.hearts=7;
    let p=c.prepareImport(encodeGame(incoming));if(!p.ok)throw Error(p.reason);c.confirmImport(p.token,false);expect(state(c)).toEqual(original);
    p=c.prepareImport(encodeGame(incoming));if(!p.ok)throw Error(p.reason);m.flags.fail=SAVE_KEY;
    expect(c.confirmImport(p.token,true)).toMatchObject({ok:false,reason:'WRITE_FAILED'});expect(state(c)).toEqual(original);
    m.flags.fail='';expect(c.confirmImport(p.token,true).ok).toBe(true);expect(state(c)).toEqual(incoming);expect(state(c).missions.daily.progress).toEqual(emptyDailyProgress());
    const exported=c.exportGame();if(!exported.ok)throw Error(exported.reason);expect(read(exported.json,5*HOUR)).toEqual(incoming);
  });
  it('anchors a legacy import at confirmation time and does not reroll a saved birth',()=>{
    const m=memory();let now=previous.lastSimulatedAt;const rng=vi.fn(()=>0),c=new GameController(m.storage,()=>now,rng);
    const p=c.prepareImport(JSON.stringify(previous));if(!p.ok)throw Error(p.reason);now+=HOUR;
    expect(c.confirmImport(p.token,true).ok).toBe(true);expect(state(c).missions.daily.referenceAt).toBe(now);
    expect(state(c).hearts).toBe(7);expect(state(c).buildings.find(b=>b.breeding)?.breeding?.birth).toEqual(previous.buildings.find(b=>b.breeding)?.breeding?.birth);
    expect(rng).not.toHaveBeenCalled();expect(state(c).missions.daily.progress).toEqual(emptyDailyProgress());
  });
  it.each(['unknown','duplicate','unearned','bonus','cycle','future'] as const)('rejects inconsistent mission state: %s',kind=>{
    const s=createGame(0), raw=JSON.parse(encodeGame(s));
    if(kind==='unknown')raw.missions.completed=['invented'];
    if(kind==='duplicate')raw.missions.completed=['first-farm','first-farm'];
    if(kind==='unearned')raw.missions.daily.claimed=['collect-pattes'];
    if(kind==='bonus')raw.missions.daily.bonusClaimed=true;
    if(kind==='cycle')raw.missions.daily.cycleIndex=1;
    if(kind==='future'){raw.missions.daily.referenceAt=DAY;raw.missions.daily.progress['gain-affection']=1;}
    expect(decodeGame(JSON.stringify(raw),0)).toEqual({ok:false,reason:'INVALID_STATE'});
  });
});
