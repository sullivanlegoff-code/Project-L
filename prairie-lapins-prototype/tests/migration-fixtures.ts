import {sendToNursery} from './manual-transfer';
import {regressionStart as createGame} from './regression-start';
import {act,advance} from '../src/simulation';
import {scenarioState} from '../src/dev/scenarios';
import {quoteAcceleration} from '../src/simulation/hearts';
import {BALANCE,HOUR} from '../src/config/balance';
import type {Command,GameState} from '../src/state/types';
const run=(s:GameState,c:Command,t=s.lastSimulatedAt)=>{const r=act(s,c,t,()=>.99);if(!r.ok)throw Error(r.reason);return r.state};
export const v4=(s:GameState)=>{const {decorations:_decorations,acquiredParcels,buildings,...rest}=s;return {...rest,version:4,expanded:acquiredParcels.length>1,secondExpanded:acquiredParcels.length>2,buildings:buildings.map((b,i)=>({...b,x:i%9,y:Math.floor(i/9)}))}};
function prepared(){let s=createGame(0);s.pattes=10000;s.grass=100;s=run(s,{type:'buyBuilding',kind:'farm',x: 16, y: 12});s=run(s,{type: 'placeStarterBuilding',kind:'nest',x: 20, y: 12});s=run(s,{type: 'placeStarterBuilding',kind:'nursery',x: 12, y: 16});s=run(s,{type:'feed',id:'rabbit-2'});return run(s,{type:'feed',id:'rabbit-3'})}
export function representative(){
 let expanded=createGame(0);expanded.pattes=10000;expanded=run(run(expanded,{type:'expand',parcelId:'east',expectedCost:500}),{type:'expand',parcelId:'west',expectedCost:1000});
 const production=advance(run(prepared(),{type:'startOrder',id:'building-4',recipe:'small'}),12345);
 let reproduction=prepared();reproduction.pityFailures=9;reproduction=run(reproduction,{type:'breed',parents:['rabbit-2','rabbit-3']});
 let waiting=sendToNursery(advance(reproduction,BALANCE.breedingDuration));waiting=run(waiting,{type:'breed',parents:['rabbit-2','rabbit-3']});waiting=advance(waiting,2*BALANCE.breedingDuration);
 let hearts=run(prepared(),{type:'startOrder',id:'building-4',recipe:'small'});const q=quoteAcceleration(hearts,'building-4','order',0);if(!q.ok)throw Error(q.reason);hearts=run(hearts,{type:'accelerate',id:'building-4',stage:'order',jobKey:q.jobKey,maxHearts:q.hearts});hearts=advance(hearts,24*HOUR);
 let missions=scenarioState('missions',0);missions=run(missions,{type:'claimMainMission',id:missions.missions.completed[0]});
 return {newGame:createGame(0),twoExtensions:expanded,level3Seven:scenarioState('habitats',0),production,reproduction,nurseryAndWaitingNest:waiting,missionsAndRewards:missions,spentHeartsGiftPending:hearts,fractionalIncome:advance(createGame(0),17)};
}
