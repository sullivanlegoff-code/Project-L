import {PGlite} from '@electric-sql/pglite';
import migration from '../backend/migrations/001_private_saves.sql?raw';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {createGame} from '../src/simulation';

const A='00000000-0000-4000-8000-000000000001',B='00000000-0000-4000-8000-000000000002';
let db:PGlite;
let op=0;
const id=()=>`00000000-0000-4000-9000-${String(++op).padStart(12,'0')}`;
const game=()=>createGame(1000000);
async function as(uid:string|null,fn:()=>Promise<unknown>){
 await db.exec(`set role ${uid?'authenticated':'anon'}`);
 await db.query("select set_config('request.jwt.claim.sub',$1,false)",[uid??'']);
 try{return await fn();}finally{await db.exec('reset role');}
}
async function commit(owner:string,revision:number,state=game(),operation=id(),reason='sync',points:unknown[]=[]){
 const r=await db.query<{result:Record<string,any>}>('select public.prairie_commit($1,$2,$3,$4::jsonb,$5,$6::jsonb) result',[owner,revision,operation,JSON.stringify(state),reason,JSON.stringify(points)]);return r.rows[0].result;
}
beforeAll(async()=>{
 db=new PGlite();
 await db.exec(`create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);insert into auth.users values('${A}'),('${B}');create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;`);
 await db.exec(migration);
},30000);
afterAll(async()=>{await db?.close();});
describe.sequential('real PostgreSQL engine: owner RLS and atomic save RPC (not a hosted Supabase test)',()=>{
 it('refuses anonymous calls, all direct writes, and a forged owner UUID',async()=>{
  await expect(as(null,()=>commit(A,0))).rejects.toThrow(/permission denied/);
  await expect(as(null,()=>db.query('select * from public.prairie_saves'))).rejects.toThrow(/permission denied/);
  await expect(as(A,()=>db.query('delete from public.prairie_history'))).rejects.toThrow(/permission denied/);
  await expect(as(A,()=>commit(B,0))).rejects.toThrow(/Authenticated owner/);
  await expect(as(A,()=>db.query('insert into public.prairie_saves(owner_id,state,format,revision,operation_id) values($1,$2,4,1,$3)',[A,game(),id()]))).rejects.toThrow(/permission denied/);
 });
 it('commits once with a server timestamp, retries idempotently and rejects reuse with a different payload',async()=>{
  const operation=id();const first=await as(A,()=>commit(A,0,game(),operation,'initial')) as any;
  expect(first.status).toBe('ok');expect(first.revision).toBe(1);expect(Date.parse(first.saved_at)).toBeGreaterThan(1000000);
  expect(await as(A,()=>commit(A,0,game(),operation,'initial'))).toEqual(first);
  const altered=game();altered.pattes=999;expect(await as(A,()=>commit(A,0,altered,operation,'initial'))).toEqual({status:'invalid_operation'});
 });
 it('prevents the second device from overwriting a changed revision',async()=>{
  const s=game();s.pattes=777;expect((await as(A,()=>commit(A,1,s)) as any).status).toBe('ok');
  const conflict=await as(A,()=>commit(A,1,game())) as any;expect(conflict.status).toBe('conflict');expect(conflict.remote.state.pattes).toBe(777);expect(conflict.remote.revision).toBe(2);
 });
 it('hides another account’s current state/history, including direct SQL reads',async()=>{
  expect((await as(B,()=>commit(B,0)) as any).status).toBe('ok');
  const saves=await as(B,()=>db.query('select owner_id from public.prairie_saves')) as any;expect(saves.rows).toEqual([{owner_id:B}]);
  const points=await as(B,()=>db.query('select distinct owner_id from public.prairie_history')) as any;expect(points.rows).toEqual([{owner_id:B}]);
  await expect(as(null,()=>db.query('select * from public.prairie_history'))).rejects.toThrow(/permission denied/);
 });
 it('rejects invalid/future/missing state fields without advancing revision',async()=>{
  for(const s of [{...game(),version:3},{...game(),pattes:-1},{...game(),rabbits:[{...game().rabbits[0],enclosureId:'building-999'}]},{}, {...game(),grass:null}, {...game(),missions:{}}, {...game(),missions:{...game().missions,daily:{}}}])expect(await as(A,()=>commit(A,2,s as any))).toEqual({status:'invalid'});
  expect((await db.query<any>('select revision from public.prairie_saves where owner_id=$1',[A])).rows[0].revision).toBe(2);
 });
 it('keeps pre-replacement checkpoints and limits history/receipts',async()=>{
  let revision=2;const checkpoint={id:id(),state:game(),reason:'import'};
  expect((await as(A,()=>commit(A,revision,game(),id(),'import',[checkpoint])) as any).status).toBe('ok');revision++;
  for(let i=0;i<70;i++){const state=game();state.pattes=1000+i;await as(A,()=>commit(A,revision++,state));}
  const counts=(await db.query<any>("select count(*)::int total,count(*) filter(where kind='checkpoint')::int checkpoints from public.prairie_history where owner_id=$1",[A])).rows[0];
  expect(counts.total).toBeLessThanOrEqual(47);expect(counts.checkpoints).toBe(1);
  expect((await db.query<any>('select count(*)::int n from prairie_private.operations where owner_id=$1',[A])).rows[0].n).toBe(64);
  const firstDaily=await db.query<any>("select min(revision)::int revision from public.prairie_history where owner_id=$1 and kind='revision'",[A]);expect(firstDaily.rows[0].revision).toBe(1);
 });
 it('retains exactly seven active UTC dates and at most twenty replacement checkpoints',async()=>{
  const revision=(await db.query<any>('select revision from public.prairie_saves where owner_id=$1',[A])).rows[0].revision;
  // Artificial server dates exercise pruning without changing phone clocks.
  for(let day=1;day<=10;day++)await db.query("insert into public.prairie_history(id,owner_id,revision,state,saved_at,kind,reason) values($1,$2,$3,$4::jsonb,clock_timestamp()-($5::int * interval '1 day'),'revision','sync')",[id(),A,10-day,JSON.stringify(game()),day]);
  for(let n=0;n<25;n++)await db.query("insert into public.prairie_history(id,owner_id,revision,state,saved_at,kind,reason) values($1,$2,$3,$4::jsonb,clock_timestamp(),'checkpoint','replace')",[id(),A,revision,JSON.stringify(game())]);
  expect((await as(A,()=>commit(A,revision)) as any).status).toBe('ok');
  const rows=await db.query<any>("select count(*) filter(where kind='checkpoint')::int checkpoints,count(distinct (saved_at at time zone 'UTC')::date) filter(where kind='revision')::int days,count(*)::int total from public.prairie_history where owner_id=$1",[A]);
  expect(rows.rows[0].checkpoints).toBe(20);expect(rows.rows[0].days).toBe(7);expect(rows.rows[0].total).toBeLessThanOrEqual(47);
 });
 it('rejects a checkpoint identifier reused for a different backup',async()=>{
  const revision=(await db.query<any>('select revision from public.prairie_saves where owner_id=$1',[A])).rows[0].revision;
  const backup={id:id(),state:game(),reason:'replace'};
  expect((await as(A,()=>commit(A,revision,game(),id(),'replace',[backup])) as any).status).toBe('ok');
  backup.state.pattes=999;expect(await as(A,()=>commit(A,revision+1,game(),id(),'replace',[backup]))).toEqual({status:'invalid_operation'});
 });
 it('rejects an old client when an administrator upgrades the remote format',async()=>{
  await db.query('update public.prairie_saves set format=5,state=jsonb_set(state,\'{version}\',\'5\') where owner_id=$1',[B]);
  expect(await as(B,()=>commit(B,1))).toEqual({status:'unsupported'});
 });
});
