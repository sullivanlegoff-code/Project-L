import type {SupabaseClient} from '@supabase/supabase-js';
import {decodeGame} from '../simulation';
import {CloudFailure,type CloudGateway,type RemoteSave,type SaveRequest,type CommitResult,type HistoryPoint} from './types';

function failure(error:{status?:number;code?:string;message?:string}):never {
 const auth=error.status===401||error.status===403||error.code==='PGRST301'||error.code==='42501';
 throw new CloudFailure(auth?'auth':'network');
}
export function validateRemote(value:unknown,owner:string):RemoteSave {
 if(!value || typeof value!=='object')throw new CloudFailure('invalid');
 const r=value as RemoteSave;
 if(r.owner_id!==owner||r.format!==4||!Number.isSafeInteger(r.revision)||r.revision<1||!Number.isFinite(Date.parse(r.saved_at))||typeof r.operation_id!=='string')throw new CloudFailure('invalid');
 const decoded=decodeGame(JSON.stringify(r.state));if(!decoded.ok||decoded.migratedFrom)throw new CloudFailure('invalid');
 return {...r,state:decoded.state};
}
/** RPC carries the intended UUID too: a token/account change cannot write old data into a new account. */
export class SupabaseGateway implements CloudGateway {
 constructor(private client:SupabaseClient){}
 private async identity(owner:string){
  const {data,error}=await this.client.auth.getSession();if(error)failure(error);
  if(!data.session||data.session.user.id!==owner)throw new CloudFailure('auth');
 }
 async read(owner:string,signal:AbortSignal):Promise<RemoteSave|null>{
  await this.identity(owner);
  const {data,error}=await this.client.from('prairie_saves').select('*').eq('owner_id',owner).abortSignal(signal).maybeSingle();
  if(error)failure(error);return data===null?null:validateRemote(data,owner);
 }
 async commit(r:SaveRequest,signal:AbortSignal):Promise<CommitResult>{
  await this.identity(r.owner);
  const {data,error}=await this.client.rpc('prairie_commit',{p_owner:r.owner,p_expected:r.expected,p_operation:r.operation,p_state:r.state,p_reason:r.reason,p_checkpoints:r.checkpoints}).abortSignal(signal);
  if(error)failure(error);
  if(data?.status==='conflict')return {status:'conflict',remote:data.remote===null?null:validateRemote(data.remote,r.owner)};
  if(data?.status!=='ok'||data.owner_id!==r.owner||data.operation_id!==r.operation||data.revision!==r.expected+1||!Number.isFinite(Date.parse(data.saved_at)))throw new CloudFailure('invalid');
  return {status:'ok',receipt:{owner_id:data.owner_id,operation_id:data.operation_id,revision:data.revision,saved_at:data.saved_at}};
 }
 async history(owner:string,signal:AbortSignal):Promise<HistoryPoint[]>{
  await this.identity(owner);
  const {data,error}=await this.client.from('prairie_history').select('*').eq('owner_id',owner).order('saved_at',{ascending:false}).order('sequence',{ascending:false}).limit(150).abortSignal(signal);
  if(error)failure(error);if(!Array.isArray(data))throw new CloudFailure('invalid');
  return data.map(point=>{
   const decoded=decodeGame(JSON.stringify(point.state));
   if(point.owner_id!==owner||typeof point.id!=='string'||!Number.isFinite(Date.parse(point.saved_at))||!decoded.ok||decoded.migratedFrom)throw new CloudFailure('invalid');
   return {...point,state:decoded.state} as HistoryPoint;
  });
 }
}
