import {createClient,type SupabaseClient} from '@supabase/supabase-js';
import type {GameController} from '../application/GameController';
import type {SaveStorage} from '../persistence/storage';
import type {sessionPolicy} from '../config/runtime';
import {SPECIES} from '../config/balance';
import type {GameState} from '../state/types';
import {AUTH_KEY} from './cache';
import {SupabaseGateway} from './gateway';
import {SyncCoordinator,type SyncView} from './SyncCoordinator';
import {scopedStorage} from '../persistence/scopedStorage';

const summary=(state:GameState)=>`${state.pattes} pattes · ${state.grass} herbes · ${state.hearts} cœurs · ${state.rabbits.length} lapins. Espèces : ${state.discovered.map(id=>SPECIES[id].name).join(', ')||'aucune'}.`;
export function authMessage(error:{status?:number;code?:string}):string {
 if(error.status===429||['over_email_send_rate_limit','over_request_rate_limit'].includes(error.code??''))return 'Trop de demandes. Attendez avant de demander un nouveau code.';
 if(['otp_expired','otp_disabled','invalid_credentials'].includes(error.code??''))return 'Code incorrect ou expiré. Vérifiez-le ou demandez un nouveau code.';
 if(error.code==='email_address_not_authorized')return 'Cette adresse n’est pas encore autorisée à recevoir un code. Contactez le responsable du jeu.';
 if(error.code==='email_address_invalid')return 'Vérifiez votre adresse email.';
 return 'Connexion interrompue ou service indisponible. Votre progression locale est conservée ; réessayez.';
}
export function cloudConfiguration(){
 const url=import.meta.env.VITE_SUPABASE_URL?.trim()??'',key=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim()??'';
 if(!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url)||!key.startsWith('sb_publishable_'))return null;
 return {url,key};
}
export async function mountAccountPanel(controller:GameController,storage:SaveStorage,policy:ReturnType<typeof sessionPolicy>,replacement:()=>void,configuration=cloudConfiguration()):Promise<()=>void>{
 if(!policy.onlineServicesAllowed||controller.storageScope==='laboratory')return ()=>{};
 const host=document.getElementById('account-content')!;host.hidden=false;host.replaceChildren();
 const title=document.createElement('h3');title.textContent='Compte et sauvegarde';host.append(title);
 if(!configuration){const info=document.createElement('p');info.id='account-status';info.textContent='Invité — enregistré sur cet appareil uniquement. La connexion et la sauvegarde en ligne ne sont pas disponibles dans cette version. Gardez un export JSON de secours.';host.append(info);return ()=>host.replaceChildren();}
 const project = new URL(configuration.url).hostname.split('.')[0];
 const authKey = AUTH_KEY + '.' + project;
 let suppressAuth = false;
 const authStorage = {getItem:(key:string)=>suppressAuth?null:storage.getItem(key)||null,setItem:(key:string,value:string)=>{if(!suppressAuth)storage.setItem(key,value);},removeItem:(key:string)=>storage.setItem(key,'')};
 const client:SupabaseClient=createClient(configuration.url,configuration.key,{auth:{storage:authStorage,storageKey:authKey,persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 const sync=new SyncCoordinator(controller,storage,new SupabaseGateway(client),policy,replacement,()=>crypto.randomUUID(),scopedStorage(storage,'prairie-lapins.backend.'+project+'.'));
 const abort=new AbortController();let alive=true;let authBusy=false;let emailSent:string|null=null;let epoch=0;
 const identity=document.createElement('p');identity.id='account-identity';host.append(identity);
 const status=document.createElement('p');status.id='account-status';status.setAttribute('role','status');host.append(status);
 const saved=document.createElement('p');saved.id='account-synced-at';saved.className='small';host.append(saved);
 const authNotice=document.createElement('p');authNotice.id='account-notice';authNotice.setAttribute('role','status');host.append(authNotice);
 const login=document.createElement('form');login.innerHTML='<label>Email <input id="account-email" type="email" autocomplete="email" required></label><button id="account-send" type="submit">Recevoir un e-mail de connexion</button><label>Code, si présent dans l’e-mail <input id="account-code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6,10}" maxlength="10"></label><button id="account-verify" type="button">Valider le code</button>';host.append(login);
 const email=login.querySelector<HTMLInputElement>('#account-email')!,code=login.querySelector<HTMLInputElement>('#account-code')!;
 const send=login.querySelector<HTMLButtonElement>('#account-send')!,verify=login.querySelector<HTMLButtonElement>('#account-verify')!;
 const choices=document.createElement('div');choices.id='account-choices';host.append(choices);
 const controls=document.createElement('div');host.append(controls);
 const history=document.createElement('div');history.id='account-history';host.append(history);
 function button(parent:HTMLElement,text:string,id:string,fn:()=>void){const b=document.createElement('button');b.type='button';b.textContent=text;b.id=id;b.onclick=fn;parent.append(b);return b;}
 button(controls,'Réessayer la synchronisation','account-retry',()=>{void sync.retry();});
 const historyButton=button(controls,'Restaurer une sauvegarde','account-history-open',()=>{void (async()=>{
  const generation=epoch;history.replaceChildren();
  try {
   const points=await sync.history();if(!alive||generation!==epoch)return;
   if(!points.length)history.textContent='Aucun point de restauration en ligne disponible.';
   for(const point of points){const row=document.createElement('article');row.className='card';const text=document.createElement('p');text.textContent=`${new Date(point.saved_at).toLocaleString('fr-FR')} · révision ${point.revision} · ${summary(point.state)}`;row.append(text);
    button(row,'Restaurer ce point','restore-'+point.id,()=>{if(!window.confirm('Restaurer cette progression ? L’état actuel sera conservé comme point de secours. Cette restauration créera une nouvelle révision en ligne après confirmation du serveur.'))return;void sync.restore(point,true).catch(()=>{if(alive&&generation===epoch)authNotice.textContent='La restauration n’a pas pu être synchronisée. Vérifiez le statut et gardez un export.';});});history.append(row);}
  }catch {if(alive&&generation===epoch)history.textContent='Impossible de lire l’historique. Votre partie reste conservée.';}
 })();});
 const logout=button(controls,'Déconnexion','account-signout',()=>{void (async()=>{
  if(authBusy)return;authBusy=true;suppressAuth=true;client.auth.stopAutoRefresh();epoch++;history.replaceChildren();
  await sync.attach(null);
  let error:unknown=null;try {error=(await client.auth.signOut({scope:'local'})).error;}catch(e){error=e;}
  let cleared=true;
  try {authStorage.removeItem(authKey);}catch {cleared=false;}
  if(alive){authBusy=false;authNotice.textContent=!cleared?'La session ne peut pas être effacée de cet appareil. Réessayez la déconnexion avant de le partager.':error?'Déconnecté sur cet appareil. Le service n’a pas confirmé la révocation ; les données locales des comptes restent conservées.':'Déconnecté. Vos modifications restent conservées sur cet appareil, séparément pour chaque compte.';}
 })();});
 const foot=document.createElement('p');foot.className='small';foot.textContent='L’historique en ligne dépend du même service. Gardez un export JSON dans Fichiers comme secours indépendant. Les parties ne sont jamais fusionnées.';host.append(foot);
 function draw(view:SyncView){
  identity.textContent=view.owner?(['choose','loading'].includes(view.phase)?'Compte connecté — choisissez votre progression avant de jouer avec ce compte.':'Compte connecté — consultez le statut de sauvegarde ci-dessous.'):'Mode invité';status.textContent=view.message;status.dataset.phase=view.phase;
  saved.textContent=view.syncedAt?`Dernière confirmation du serveur : ${new Date(view.syncedAt).toLocaleString('fr-FR')}.`:'Aucune synchronisation confirmée par le serveur.';
  login.hidden=!!view.owner;logout.hidden=!view.owner;historyButton.hidden=!view.owner;choices.replaceChildren();
  if(['choose','conflict'].includes(view.phase)){
   for(const [name,state] of [['Partie sur cet appareil',view.local],['Partie en ligne',view.remote?.state]] as const){if(state){const p=document.createElement('p');p.textContent=`${name} : ${summary(state)}`;choices.append(p);}}
   if(view.local)button(choices,'Conserver et transférer la partie locale','account-choose-local',()=>sync.choose('local',window.confirm('Utiliser cette progression locale pour ce compte ? Une version distante existante sera conservée dans l’historique avant remplacement.')));
   if(view.remote)button(choices,'Charger la partie en ligne','account-choose-remote',()=>sync.choose('remote',window.confirm('Charger la partie en ligne ? La progression locale existante sera conservée avant remplacement.')));
   if(!view.remote)button(choices,'Commencer une nouvelle partie pour ce compte','account-choose-new',()=>sync.choose('new',window.confirm('Créer une nouvelle partie pour ce compte ? La partie invitée reste conservée séparément.')));
  }
 }
 const unsubscribe=sync.subscribe(draw);
 const options={signal:abort.signal};
 login.addEventListener('submit',event=>{event.preventDefault();void (async()=>{
  if(authBusy||!email.validity.valid)return;authBusy=true;send.disabled=true;verify.disabled=true;email.disabled=true;
  const address=email.value.trim();const generation=epoch;
  let error:{status?:number;code?:string}|null=null;try {error=(await client.auth.signInWithOtp({email:address,options:{shouldCreateUser:true,emailRedirectTo:location.origin+location.pathname}})).error;}catch{error={};}
  if(alive){authBusy=false;send.disabled=false;verify.disabled=false;email.disabled=false;}
  if(alive&&generation===epoch){authBusy=false;send.disabled=false;verify.disabled=false;email.disabled=false;emailSent=error?null:address;authNotice.textContent=error?authMessage(error):'E-mail demandé. Ouvrez son lien de connexion dans ce navigateur. Si le message contient un code, vous pouvez aussi le saisir ici. Vérifiez également les indésirables.';}
 })();},options);
 verify.addEventListener('click',()=>{void (async()=>{
  if(authBusy||!emailSent||!/^[0-9]{6,10}$/.test(code.value.trim())){authNotice.textContent='Demandez un code puis saisissez les chiffres reçus.';return;}
  authBusy=true;send.disabled=true;verify.disabled=true;email.disabled=true;const generation=epoch;
  suppressAuth=false;
  let error:{status?:number;code?:string}|null=null;try {error=(await client.auth.verifyOtp({email:emailSent,token:code.value.trim(),type:'email'})).error;}catch{error={};}
  if(alive){authBusy=false;send.disabled=false;verify.disabled=false;email.disabled=false;if(error&&generation===epoch)authNotice.textContent=authMessage(error);if(!error)code.value='';}
 })();},options);
 const authSubscription=client.auth.onAuthStateChange((_event,session)=>{
  // Never await SDK calls inside its auth lock. Work begins after callback returns.
  const owner=session?.user.id??null;queueMicrotask(()=>{if(!alive||(suppressAuth&&owner))return;if(owner===sync.view().owner&&_event==='TOKEN_REFRESHED'){if(sync.view().phase==='offline')void sync.retry();return;}epoch++;history.replaceChildren();void sync.attach(owner);});
 });
 const resume=()=>{if(alive&&document.visibilityState!=='hidden')void sync.retry();};
 window.addEventListener('online',resume,options);window.addEventListener('pageshow',resume,options);document.addEventListener('visibilitychange',resume,options);
 const renew=()=>{if(suppressAuth||document.visibilityState==='hidden')client.auth.stopAutoRefresh();else client.auth.startAutoRefresh();};document.addEventListener('visibilitychange',renew,options);renew();
 return ()=>{alive=false;epoch++;abort.abort();unsubscribe();authSubscription.data.subscription.unsubscribe();sync.dispose();client.auth.stopAutoRefresh();host.replaceChildren();};
}
