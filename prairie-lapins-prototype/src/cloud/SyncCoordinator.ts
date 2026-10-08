import {GameController,type Operation} from '../application/GameController';
import {SAVE_KEY,type SaveStorage} from '../persistence/storage';
import {createGame,decodeGame,encodeGame} from '../simulation';
import type {GameState} from '../state/types';
import {AccountCache,accountStorage,fingerprint,type AccountMeta} from './cache';
import {CloudFailure,type CloudGateway,type RemoteSave,type Checkpoint,type HistoryPoint,type ReplacementReason} from './types';
import type {sessionPolicy} from '../config/runtime';

export type SyncPhase='guest'|'loading'|'choose'|'synced'|'pending'|'syncing'|'offline'|'conflict'|'invalid'|'local-error';
export interface SyncView {phase:SyncPhase;owner:string|null;syncedAt:string|null;local:GameState|null;remote:RemoteSave|null;message:string}
const message:Record<SyncPhase,string>={guest:'Invité — enregistré sur cet appareil uniquement.',loading:'Lecture de la sauvegarde du compte…',choose:'Choisissez la progression à utiliser. Aucune partie n’a été remplacée.',synced:'Synchronisé en ligne.',pending:'Enregistré sur cet appareil. Changements en attente de synchronisation.',syncing:'Enregistré sur cet appareil. Synchronisation en cours…',offline:'Synchronisation interrompue. Les modifications locales sont conservées ; réessayez.',conflict:'Deux versions différentes existent. Aucune fusion ni écrasement automatique.',invalid:'La sauvegarde ou ses métadonnées ne sont pas compatibles. Aucun envoi automatique.', 'local-error':'L’enregistrement local ou le point de secours a échoué. Exportez la partie et libérez de l’espace avant de continuer.'};
/** Owns exactly one identity/generation. No stale completion may touch another account. */
export class SyncCoordinator {
 private owner:string|null=null;private generation=0;private abort=new AbortController();
 private cache:AccountCache|null=null;private meta:AccountMeta|null=null;private remote:RemoteSave|null=null;
 private ready=false;private busy=false;private suppress=false;private phase:SyncPhase='guest';private timer:ReturnType<typeof setTimeout>|null=null;
 private retryTimer:ReturnType<typeof setTimeout>|null=null;private retryDelay=3000;
 private listeners=new Set<(view:SyncView)=>void>();private unsubscribe:()=>void;private disposed=false;
 constructor(private controller:GameController,private base:SaveStorage,private gateway:CloudGateway,policy:ReturnType<typeof sessionPolicy>,private replacement:()=>void=()=>{},private makeId:()=>string=()=>crypto.randomUUID(),private accountBase:SaveStorage=base){
  if(!policy.onlineServicesAllowed||controller.storageScope==='laboratory')throw new CloudFailure('unavailable');
  this.unsubscribe=controller.subscribe(()=>this.changed());
  controller.setReplacementGuard((state,reason)=>this.protect(state,reason));
 }
 view():SyncView{return {phase:this.phase,owner:this.owner,syncedAt:this.meta?.syncedAt??null,local:this.controller.getSnapshot().state,remote:this.remote,message:message[this.phase]};}
 subscribe(fn:(view:SyncView)=>void){this.listeners.add(fn);fn(this.view());return ()=>this.listeners.delete(fn);}
 private emit(phase=this.phase){this.phase=phase;for(const fn of this.listeners)fn(this.view());}
 private failure(error:unknown){this.ready=false;this.emit(error instanceof CloudFailure&&error.kind==='local'?'local-error':error instanceof CloudFailure&&error.kind==='invalid'?'invalid':'offline');
  if(this.phase==='offline'&&this.owner&&!this.disposed){const generation=this.generation,owner=this.owner;const delay=this.retryDelay;this.retryDelay=Math.min(delay*2,30000);this.retryTimer=setTimeout(()=>{this.retryTimer=null;if(this.current(generation,owner))void this.retry();},delay);}
 }
 private cancel(){if(this.retryTimer)clearTimeout(this.retryTimer);this.retryTimer=null;this.generation++;this.abort.abort();this.abort=new AbortController();if(this.timer)clearTimeout(this.timer);this.timer=null;this.busy=false;this.ready=false;}
 private current(generation:number,owner:string){return !this.disposed&&this.generation===generation&&this.owner===owner;}
 private writeMeta(meta:AccountMeta){this.cache!.write(meta);this.meta=meta;}
 private switchTo(storage:SaveStorage){this.suppress=true;try {const result=this.controller.switchStorage(storage);if(!result.ok)throw new CloudFailure('local');this.replacement();}finally{this.suppress=false;}}
 private protect(state:GameState,reason:ReplacementReason):Operation{
  if(this.suppress||!this.owner||!this.meta)return {ok:true};
  try {const point:Checkpoint={id:this.makeId(),state,reason};this.writeMeta({...this.meta,checkpoints:[...this.meta.checkpoints,point].slice(-20)});return {ok:true};}
  catch{return {ok:false,reason:'WRITE_FAILED'};}
 }
 private changed(){
  if(this.suppress||!this.owner||!this.meta||this.disposed)return;
  const s=this.controller.getSnapshot();
  if(s.status!=='saved'){this.emit('local-error');return;}
  if(!this.ready||this.meta.blocked)return;
  if(s.state&&(this.meta.outbox||this.meta.checkpoints.length||fingerprint(s.state)!==this.meta.baseline)){
   this.emit('pending');if(!this.timer&&!this.busy)this.timer=setTimeout(()=>{this.timer=null;void this.flush();},2500);
  }
 }
 async attach(owner:string|null):Promise<void>{
  if(this.disposed)return;this.cancel();this.owner=null;this.cache=null;this.meta=null;this.remote=null;
  try {this.switchTo(this.base);}catch(error){this.failure(error);return;}
  if(owner===null){this.emit('guest');return;}
  this.owner=owner;const generation=this.generation;this.emit('loading');
  try {
   this.cache=new AccountCache(this.accountBase,owner);this.meta=this.cache.read();
   if(this.meta){
    const local=accountStorage(this.accountBase,owner).getItem(SAVE_KEY);if(local===null||!decodeGame(local).ok)throw new CloudFailure('invalid');
    this.switchTo(accountStorage(this.accountBase,owner));
   }
   const remote=await this.gateway.read(owner,this.abort.signal);if(!this.current(generation,owner))return;this.remote=remote;
   if(this.meta?.blocked){this.emit('choose');return;}
   if(!this.meta){this.emit('choose');return;}
   if(this.meta.outbox&&remote?.operation_id===this.meta.outbox.operation){
    this.acceptReceipt(remote.revision,remote.saved_at,this.meta.outbox.checkpoints.map(p=>p.id));this.ready=true;this.changed();if(this.phase!=='pending')this.emit('synced');return;
   }
   if(remote===null){if(this.meta.revision===0){this.ready=true;this.changed();return;}this.emit('conflict');return;}
   if(remote.revision===this.meta.revision&&fingerprint(remote.state)===this.meta.baseline){this.ready=true;this.emit('synced');this.changed();return;}
   const local=this.controller.getSnapshot().state!;
   if(!this.meta.outbox&&fingerprint(local)===this.meta.baseline){this.selectState(remote.state,remote,false);return;}
   this.emit('conflict');
  }catch(error){if(this.current(generation,owner))this.failure(error);}
 }
 /** Explicit choice binds account cache to a VERIFIED remote read; never infer from an error. */
 choose(choice:'local'|'remote'|'new',confirmed:boolean):void{
  if(!confirmed||!this.owner||!['choose','conflict'].includes(this.phase))return;
  const state=choice==='remote'?this.remote?.state:choice==='new'?createGame():this.controller.getSnapshot().state;
  if(!state)return;
  try {this.selectState(state,this.remote,true);}catch(error){this.failure(error);}
 }
 private selectState(state:GameState,remote:RemoteSave|null,explicit:boolean){
  if(!this.owner||!this.cache)throw new CloudFailure('auth');
  const owner=this.owner,store=accountStorage(this.accountBase,owner),existing=store.getItem(SAVE_KEY);
  const points=[...(this.meta?.checkpoints??[])];
  if(existing){const old=decodeGame(existing);if(!old.ok)throw new CloudFailure('invalid');if(fingerprint(old.state)!==fingerprint(state))points.push({id:this.makeId(),state:old.state,reason:'replace'});}
  if(explicit&&remote&&fingerprint(remote.state)!==fingerprint(state))points.push({id:this.makeId(),state:remote.state,reason:'replace'});
  const m:AccountMeta={version:1,owner,revision:remote?.revision??0,baseline:remote?fingerprint(remote.state):'',syncedAt:remote?.saved_at??null,outbox:null,checkpoints:points.slice(-20),blocked:true};
  // The marker stays durable if either local write fails: reload must ask again.
  this.writeMeta(m);store.setItem(SAVE_KEY,encodeGame(state));this.switchTo(store);
  this.writeMeta({...m,blocked:false});this.ready=true;this.emit(remote&&!points.length&&fingerprint(this.controller.getSnapshot().state!)===m.baseline?'synced':'pending');this.changed();
 }
 private acceptReceipt(revision:number,savedAt:string,pointIds:string[]){
  this.retryDelay=3000;
  const outbox=this.meta!.outbox!;
  this.writeMeta({...this.meta!,revision,baseline:fingerprint(outbox.state),syncedAt:savedAt,outbox:null,checkpoints:this.meta!.checkpoints.filter(p=>!pointIds.includes(p.id))});
 }
 async flush():Promise<void>{
  if(this.disposed||this.busy||!this.ready||!this.owner||!this.meta||this.meta.blocked)return;
  const owner=this.owner,generation=this.generation;
  try {
   const snapshot=this.controller.getSnapshot();if(!snapshot.state||snapshot.status!=='saved')throw new CloudFailure('local');
   if(!this.meta.outbox&&!this.meta.checkpoints.length&&fingerprint(snapshot.state)===this.meta.baseline){this.emit('synced');return;}
   if(!this.meta.outbox){const points=structuredClone(this.meta.checkpoints);this.writeMeta({...this.meta,outbox:{owner,expected:this.meta.revision,operation:this.makeId(),state:snapshot.state,reason:this.meta.revision===0?'initial':points.at(-1)?.reason??'sync',checkpoints:points}});}
   const request=structuredClone(this.meta.outbox!);this.busy=true;this.emit('syncing');
   const result=await this.gateway.commit(request,this.abort.signal);if(!this.current(generation,owner))return;
   this.busy=false;
   if(result.status==='conflict'){this.remote=result.remote;this.ready=false;this.emit('conflict');return;}
   this.acceptReceipt(result.receipt.revision,result.receipt.saved_at,request.checkpoints.map(p=>p.id));
   this.remote={owner_id:owner,state:request.state,format:4,revision:result.receipt.revision,saved_at:result.receipt.saved_at,operation_id:request.operation};
   this.emit('synced');this.changed();
  }catch(error){if(this.current(generation,owner)){this.busy=false;this.failure(error);}}
 }
 async retry():Promise<void>{if(this.owner)await this.attach(this.owner);}
 async history():Promise<HistoryPoint[]>{
  if(!this.owner)throw new CloudFailure('auth');const owner=this.owner,generation=this.generation;
  const points=await this.gateway.history(owner,this.abort.signal);if(!this.current(generation,owner))throw new CloudFailure('auth');return points;
 }
 async restore(point:HistoryPoint,confirmed:boolean):Promise<void>{
  if(!confirmed||!this.owner||point.owner_id!==this.owner||!this.ready||this.busy)return;
  const decoded=decodeGame(JSON.stringify(point.state));if(!decoded.ok||decoded.migratedFrom)throw new CloudFailure('invalid');
  const protectedState=this.protect(this.controller.getSnapshot().state!,'restore');if(!protectedState.ok){this.emit('local-error');return;}
  const generation=this.generation,owner=this.owner;
  try {
   this.suppress=true;const prepared=this.controller.prepareImport(encodeGame(decoded.state));if(!prepared.ok)throw new CloudFailure('invalid');
   const done=this.controller.confirmImport(prepared.token,true);if(!done.ok)throw new CloudFailure('local');this.replacement();
  }finally{this.suppress=false;}
  if(this.current(generation,owner)){this.changed();await this.flush();}
 }
 dispose(){if(this.disposed)return;this.disposed=true;this.cancel();this.unsubscribe();this.controller.setReplacementGuard(null);this.listeners.clear();}
}
