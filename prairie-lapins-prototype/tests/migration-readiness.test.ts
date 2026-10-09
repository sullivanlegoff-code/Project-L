import {describe,expect,it,vi} from 'vitest';
import {advance,createGame,decodeGame,pendingDiscoveries} from '../src/simulation';
import {GameController} from '../src/application/GameController';
import {SAVE_KEY,DECORATIONS_MIGRATION_BACKUP_KEY,type SaveStorage} from '../src/persistence/storage';
import {MINUTE} from '../src/config/balance';
import {representative,v4} from './migration-fixtures';

function storage(raw:string){const data=new Map([[SAVE_KEY,raw]]),writes:string[]=[];const flags={fail:''};const store:SaveStorage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(k===flags.fail)throw Error('quota');data.set(k,v);writes.push(k)}};return{data,writes,flags,store}}
const sources = import.meta.glob('../docs/test-saves/migration-v4/*.json', {eager: true, query: '?raw', import: 'default'}) as Record<string, string>;
describe('representative v4 migration and recovery readiness',()=>{
 for(const [name,s]of Object.entries(representative()))it(name+': preserves every field, reloads once and separates offline time',()=>{
  const source=v4(s),raw=sources['../docs/test-saves/migration-v4/'+name+'.json'],now=s.lastSimulatedAt;
  expect(JSON.parse(raw)).toEqual(source);
  const decoded=decodeGame(raw,now);expect(decoded.ok).toBe(true);if(!decoded.ok)return;
  expect(decoded.migratedFrom).toBe(4);expect(decoded.state).toEqual({...source,version:5,decorations:[]});
  expect(pendingDiscoveries(decoded.state)).toEqual(pendingDiscoveries(s));
  const st=storage(raw),rng=vi.fn(()=>{throw Error('Migration must never redraw births')});
  const c=new GameController(st.store,()=>now,rng);expect(c.getSnapshot().state).toEqual(s);expect(st.data.get(DECORATIONS_MIGRATION_BACKUP_KEY)).toBe(raw);expect(c.migrationBackup()).toBe(raw);expect(rng).not.toHaveBeenCalled();
  const backupWrites=st.writes.filter(k=>k===DECORATIONS_MIGRATION_BACKUP_KEY).length;c.dispose();
  const next=new GameController(st.store,()=>now,rng);expect(next.getSnapshot().state).toEqual(s);expect(next.migrationBackup()).toBe(raw);expect(st.writes.filter(k=>k===DECORATIONS_MIGRATION_BACKUP_KEY)).toHaveLength(backupWrites);
  next.dispose();const later=new GameController(st.store,()=>now+MINUTE,rng);expect(later.getSnapshot().state).toEqual(advance(s,now+MINUTE));expect(later.getSnapshot().state!.hearts).toBe(s.hearts);expect(later.migrationBackup()).toBe(raw);
 });
 it.each([DECORATIONS_MIGRATION_BACKUP_KEY,SAVE_KEY])('failed write at %s preserves source and permits raw recovery',key=>{
  const raw=JSON.stringify(v4(representative().reproduction),null,3),st=storage(raw);st.flags.fail=key;
  const c=new GameController(st.store,()=>0);expect(c.getSnapshot().status).toBe('write-error');expect(st.data.get(SAVE_KEY)).toBe(raw);const before=st.writes.length;expect(c.migrationBackup()).toBe(raw);expect(st.writes).toHaveLength(before);
  st.flags.fail='';expect(c.retrySave().ok).toBe(true);expect(JSON.parse(st.data.get(SAVE_KEY)!).version).toBe(5);expect(st.data.get(DECORATIONS_MIGRATION_BACKUP_KEY)).toBe(raw);
 });
 it('blocks a v5 controller if the underlying key is changed by an older writer',()=>{
  const raw=JSON.stringify(v4(createGame(0))),st=storage(raw);new GameController(st.store,()=>0);
  const persisted=st.data.get(SAVE_KEY)!;
  expect(st.data.get(SAVE_KEY)).not.toBe(raw);expect(JSON.parse(persisted).version).toBe(5);
  const c=new GameController(st.store,()=>0);st.data.set(SAVE_KEY,raw);expect(c.perform({type:'buyDecoration',catalogId:'wildflowers'}).ok).toBe(true);expect(c.getSnapshot().status).toBe('conflict');expect(st.data.get(SAVE_KEY)).toBe(raw);
 });
 it('invalid data is never migrated or written, and remains exportable',()=>{const st=storage('{bad');const c=new GameController(st.store,()=>0);expect(st.writes).toEqual([]);expect(c.unreadableBackup()).toBe('{bad');expect(c.retrySave().ok).toBe(false)});
});
