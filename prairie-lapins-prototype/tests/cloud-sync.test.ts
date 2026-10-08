import {afterEach,beforeEach,describe,it,expect,vi} from 'vitest';
import {GameController} from '../src/application/GameController';
import {SyncCoordinator} from '../src/cloud/SyncCoordinator';
import {accountStorage,AccountCache} from '../src/cloud/cache';
import {sessionPolicy} from '../src/config/runtime';
import {SAVE_KEY,type SaveStorage} from '../src/persistence/storage';
import {createGame,encodeGame} from '../src/simulation';
import {CloudFailure,type CloudGateway,type RemoteSave,type CommitResult} from '../src/cloud/types';
const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002';
const cleanups:(()=>void)[]=[];
beforeEach(()=>{vi.useFakeTimers();vi.setSystemTime(1000000);});afterEach(()=>{cleanups.splice(0).forEach(fn=>fn());vi.useRealTimers();});
function setup(){
 const data=new Map<string,string>(),base:SaveStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{data.set(k,v);}};
 const controller=new GameController(base);let id=0;
 const saves=new Map<string,RemoteSave>(),receipts=new Map<string,CommitResult>();let network=true;let auth=true;let responseLost=false;
 const gateway:CloudGateway={
  async read(owner){if(!network)throw new CloudFailure('network');if(!auth)throw new CloudFailure('auth');return structuredClone(saves.get(owner)??null);},
  async commit(request){if(!network)throw new CloudFailure('network');if(!auth)throw new CloudFailure('auth');if(receipts.has(request.operation))return structuredClone(receipts.get(request.operation)!);
   const old=saves.get(request.owner);if((old?.revision??0)!==request.expected)return {status:'conflict',remote:structuredClone(old??null)};
   const remote:RemoteSave={owner_id:request.owner,state:structuredClone(request.state),revision:request.expected+1,format:4,saved_at:new Date().toISOString(),operation_id:request.operation};saves.set(request.owner,remote);
   const result:CommitResult={status:'ok',receipt:remote};receipts.set(request.operation,result);if(responseLost){responseLost=false;throw new CloudFailure('network');}return result;
  },async history(owner){const current=saves.get(owner);return current?[{...current,id:'point',kind:'revision',reason:'sync'}]:[];},
 };
 const sync=new SyncCoordinator(controller,base,gateway,sessionPolicy(false),()=>{},()=>`00000000-0000-4000-9000-${String(++id).padStart(12,'0')}`);
 cleanups.push(()=>{sync.dispose();controller.dispose();});
 return {data,base,controller,saves,gateway,sync,flags:{network:(v:boolean)=>{network=v;},auth:(v:boolean)=>{auth=v;},lose:()=>{responseLost=true;}}};
}
async function join(s:ReturnType<typeof setup>,owner=A){await s.sync.attach(owner);s.sync.choose('local',true);await s.sync.flush();}
describe('account synchronization state machine',()=>{
 it('does not replace or upload the guest before an explicit first-account choice',async()=>{
  const s=setup();s.controller.perform({type:'feed',id:'rabbit-2'});const guest=s.data.get(SAVE_KEY);await s.sync.attach(A);
  expect(s.sync.view().phase).toBe('choose');await s.sync.flush();expect(s.saves.size).toBe(0);expect(s.data.get(SAVE_KEY)).toBe(guest);
  s.sync.choose('local',true);await s.sync.flush();expect(s.saves.get(A)!.state.grass).toBe(8);expect(s.data.get(SAVE_KEY)).toBe(guest);
 });
 it('lets the user start a new account state while retaining an advanced guest',async()=>{
  const s=setup();s.controller.perform({type:'feed',id:'rabbit-2'});const guest=s.data.get(SAVE_KEY);await s.sync.attach(A);s.sync.choose('new',true);await s.sync.flush();
  expect(s.saves.get(A)!.state.grass).toBe(10);expect(s.data.get(SAVE_KEY)).toBe(guest);
 });
 it('shows a validated advanced remote and local initial state, without automatically overwriting either',async()=>{
  const s=setup(),state=createGame();state.pattes=9000;s.saves.set(A,{owner_id:A,state,revision:7,format:4,saved_at:new Date().toISOString(),operation_id:'remote'});
  await s.sync.attach(A);expect(s.sync.view().phase).toBe('choose');expect(s.saves.get(A)!.state.pattes).toBe(9000);expect(s.controller.getSnapshot().state!.pattes).toBe(300);
  s.sync.choose('remote',true);expect(s.controller.getSnapshot().state!.pattes).toBe(9000);expect(JSON.parse(s.data.get(SAVE_KEY)!).pattes).toBe(300);
 });
 it('saves actions locally immediately then groups remote writes with a short delay',async()=>{
  const s=setup();await join(s);s.controller.perform({type:'feed',id:'rabbit-2'});s.controller.perform({type:'feed',id:'rabbit-3'});
  expect(JSON.parse(accountStorage(s.base,A).getItem(SAVE_KEY)!).grass).toBe(6);expect(s.saves.get(A)!.state.grass).toBe(10);
  await vi.advanceTimersByTimeAsync(2500);expect(s.saves.get(A)!.state.grass).toBe(6);expect(s.saves.get(A)!.revision).toBe(2);
 });
 it('keeps offline actions and retries a lost response without a duplicate operation',async()=>{
  const s=setup();await join(s);s.flags.network(false);s.controller.perform({type:'feed',id:'rabbit-2'});await s.sync.flush();expect(s.sync.view().phase).toBe('offline');
  s.flags.network(true);s.flags.lose();await s.sync.retry();await s.sync.flush();expect(s.saves.get(A)!.revision).toBe(2);expect(s.sync.view().phase).toBe('offline');
  await s.sync.retry();await s.sync.flush();expect(s.saves.get(A)!.revision).toBe(2);expect(s.sync.view().phase).toBe('synced');expect(s.controller.getSnapshot().state!.grass).toBe(8);
 });
 it('preserves newer local actions while an earlier request is in flight',async()=>{
  const s=setup();await join(s);const actual=s.gateway.commit;let release!:()=>void;const hold=new Promise<void>(r=>{release=r;});s.gateway.commit=async(r,a)=>{await hold;return actual(r,a);};
  s.controller.perform({type:'feed',id:'rabbit-2'});const pending=s.sync.flush();s.controller.perform({type:'feed',id:'rabbit-3'});release();await pending;
  expect(s.saves.get(A)!.state.grass).toBe(8);s.gateway.commit=actual;await s.sync.flush();expect(s.saves.get(A)!.state.grass).toBe(6);
 });
 it('detects two-device conflict, preserves both versions and requires a confirmed overwrite',async()=>{
  const s=setup();await join(s);s.controller.perform({type:'feed',id:'rabbit-2'});const other=structuredClone(s.saves.get(A)!);other.revision++;other.state.pattes=777;other.operation_id='other';s.saves.set(A,other);
  await s.sync.flush();expect(s.sync.view().phase).toBe('conflict');expect(s.saves.get(A)!.state.pattes).toBe(777);expect(s.controller.getSnapshot().state!.grass).toBe(8);
  s.sync.choose('local',false);expect(s.saves.get(A)!.revision).toBe(2);s.sync.choose('local',true);await s.sync.flush();expect(s.saves.get(A)!.revision).toBe(3);expect(s.saves.get(A)!.state.grass).toBe(8);
  expect(new AccountCache(s.base,A).read()!.outbox).toBeNull();
 });
 it('retains the local version before choosing the conflicting remote',async()=>{
  const s=setup();await join(s);s.controller.perform({type:'feed',id:'rabbit-2'});const other=structuredClone(s.saves.get(A)!);other.revision++;other.state.pattes=777;s.saves.set(A,other);
  await s.sync.flush();s.sync.choose('remote',true);expect(s.controller.getSnapshot().state!.pattes).toBe(777);expect(new AccountCache(s.base,A).read()!.checkpoints.some(p=>p.state.grass===8)).toBe(true);
 });
 it('does not initialize a replacement cloud game on errors or a missing formerly-known remote',async()=>{
  const s=setup();await join(s);s.saves.delete(A);await s.sync.retry();expect(s.sync.view().phase).toBe('conflict');await s.sync.flush();expect(s.saves.has(A)).toBe(false);
  s.flags.network(false);await s.sync.retry();expect(s.sync.view().phase).toBe('offline');await s.sync.flush();expect(s.saves.has(A)).toBe(false);
 });
 it('preserves expired-session changes until the authenticated session returns',async()=>{
  const s=setup();await join(s);s.flags.auth(false);s.controller.perform({type:'feed',id:'rabbit-2'});await s.sync.flush();expect(s.sync.view().phase).toBe('offline');
  s.flags.auth(true);await s.sync.retry();await s.sync.flush();expect(s.saves.get(A)!.state.grass).toBe(8);
 });
 it('invalidates stale account requests and isolates account caches on signout/change',async()=>{
  const s=setup();await join(s);s.controller.perform({type:'feed',id:'rabbit-2'});const actual=s.gateway.commit;let release!:()=>void;const hold=new Promise<void>(r=>{release=r;});s.gateway.commit=async(r,a)=>{await hold;return actual(r,a);};
  const old=s.sync.flush();await s.sync.attach(B);s.sync.choose('new',true);s.gateway.commit=actual;await s.sync.flush();release();await old;
  expect(s.sync.view().owner).toBe(B);expect(s.controller.getSnapshot().state!.grass).toBe(10);expect(s.saves.get(B)!.state.grass).toBe(10);expect(JSON.parse(accountStorage(s.base,A).getItem(SAVE_KEY)!).grass).toBe(8);
  await s.sync.attach(null);expect(s.sync.view().phase).toBe('guest');expect(s.controller.getSnapshot().state!.grass).toBe(10);
 });
 it('preserves checkpoints before connected import/restart, and restores without re-granting hearts',async()=>{
  const s=setup();await join(s);s.controller.perform({type:'feed',id:'rabbit-2'});await s.sync.flush();const point=(await s.sync.history())[0];
  const altered=createGame();altered.hearts=2;altered.pattes=1234;const p=s.controller.prepareImport(encodeGame(altered));if(!p.ok)throw Error(p.reason);s.controller.confirmImport(p.token,true);
  expect(new AccountCache(s.base,A).read()!.checkpoints.some(p=>p.state.grass===8)).toBe(true);await s.sync.flush();expect(s.saves.get(A)!.state.hearts).toBe(2);
  await s.sync.restore(point,true);expect(s.saves.get(A)!.revision).toBe(4);expect(s.controller.getSnapshot().state!.grass).toBe(8);expect(s.controller.getSnapshot().state!.hearts).toBe(12);
 });
 it('blocks controller replacement if a checkpoint cannot be stored',async()=>{
  const s=setup();await join(s);const set=s.base.setItem;s.base.setItem=(k,v)=>{if(k.endsWith('sync.v1'))throw Error('quota');set(k,v);};
  const before=s.controller.getSnapshot().state;expect(s.controller.restart(true)).toEqual({ok:false,reason:'WRITE_FAILED'});expect(s.controller.getSnapshot().state).toEqual(before);
 });
 it('refuses initialization of any account adapter in the laboratory',()=>{
  const s=setup();expect(()=>new SyncCoordinator(s.controller,s.base,s.gateway,sessionPolicy(true))).toThrow();
 });
});
