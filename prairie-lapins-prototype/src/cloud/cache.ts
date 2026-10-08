import {decodeGame,encodeGame} from '../simulation';
import type {SaveStorage} from '../persistence/storage';
import type {Checkpoint,SaveRequest} from './types';
import {CloudFailure} from './types';
export const ACCOUNT_PREFIX = 'prairie-lapins.account.';
export const AUTH_KEY = 'prairie-lapins.normal-auth.v1';
export const accountPrefix=(owner:string)=>{
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(owner))throw new CloudFailure('invalid');
 return ACCOUNT_PREFIX+owner+'.';
};
export function accountStorage(base:SaveStorage,owner:string):SaveStorage {
 const prefix=accountPrefix(owner);return {scope:'normal',getItem:key=>base.getItem(prefix+key),setItem:(key,value)=>base.setItem(prefix+key,value)};
}
export interface AccountMeta {
 version:1; owner:string; revision:number; baseline:string; syncedAt:string|null;
 blocked:boolean;
 outbox:SaveRequest|null; checkpoints:Checkpoint[];
}
export function fingerprint(state:import('../state/types').GameState):string {
 const {lastSimulatedAt: _time,buildings,...rest}=state;
 return JSON.stringify({...rest,buildings:buildings.map(({incomeUnits: _income,...building})=>building)});
}
export class AccountCache {
 private key:string;
 constructor(private base:SaveStorage,private owner:string){this.key=accountPrefix(owner)+'sync.v1';}
 read():AccountMeta|null {
  let raw:string|null;
  try {raw=this.base.getItem(this.key);} catch {throw new CloudFailure('local');}
  if(raw===null)return null;
  try {
   const m=JSON.parse(raw) as AccountMeta;
   if(m.version!==1||m.owner!==this.owner||!Number.isSafeInteger(m.revision)||m.revision<0||typeof m.baseline!=='string'||typeof m.blocked!=='boolean'||(m.syncedAt!==null&&!Number.isFinite(Date.parse(m.syncedAt)))||!Array.isArray(m.checkpoints)||m.checkpoints.length>20)throw new Error();
   for(const point of m.checkpoints) if(!decodeGame(encodeGame(point.state)).ok)throw new Error();
   if(m.outbox && (m.outbox.owner!==this.owner||!Number.isSafeInteger(m.outbox.expected)||m.outbox.expected<0||!Array.isArray(m.outbox.checkpoints)||m.outbox.checkpoints.length>20||!decodeGame(encodeGame(m.outbox.state)).ok))throw new Error();
   return m;
  } catch {throw new CloudFailure('invalid');}
 }
 write(meta:AccountMeta):void {
  try {this.base.setItem(this.key,JSON.stringify(meta));}catch {throw new CloudFailure('local');}
 }
}
