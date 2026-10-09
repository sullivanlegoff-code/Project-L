import {act,advance,createGame} from '../src/simulation';
import {scenarioState} from '../src/dev/scenarios';
import {quoteAcceleration} from '../src/simulation/hearts';
import {BALANCE,HOUR} from '../src/config/balance';
import type {Command,GameState} from '../src/state/types';
const run=(s:GameState,c:Command,t=s.lastSimulatedAt)=>{const r=act(s,c,t,()=>.99);if(!r.ok)throw Error(r.reason);return r.state};
export const v4=(s:GameState)=>{const {decorations:_decorations,...rest}=s;return {...rest,version:4}};
function prepared(){let s=createGame(0);s.pattes=10000;s.grass=100;s=run(s,{type:'buyBuilding',kind:'farm',x:1,y:0});s=run(s,{type:'buyBuilding',kind:'nest',x:2,y:0});s=run(s,{type:'buyBuilding',kind:'nursery',x:0,y:1});s=run(s,{type:'feed',id:'rabbit-2'});return run(s,{type:'feed',id:'rabbit-3'})}
export function representative(){
 let expanded=createGame(0);expanded.pattes=10000;expanded=run(run(expanded,{type:'expand',stage:1}),{type:'expand',stage:2});
 const production=advance(run(prepared(),{type:'startOrder',id:'building-4',recipe:'small'}),12345);
 let reproduction=prepared();reproduction.pityFailures=9;reproduction=run(reproduction,{type:'breed',parents:['rabbit-2','rabbit-3']});
 let waiting=advance(reproduction,BALANCE.breedingDuration);waiting=run(waiting,{type:'breed',parents:['rabbit-2','rabbit-3']});waiting=advance(waiting,2*BALANCE.breedingDuration);
 let hearts=run(prepared(),{type:'startOrder',id:'building-4',recipe:'small'});const q=quoteAcceleration(hearts,'building-4','order',0);if(!q.ok)throw Error(q.reason);hearts=run(hearts,{type:'accelerate',id:'building-4',stage:'order',jobKey:q.jobKey,maxHearts:q.hearts});hearts=advance(hearts,24*HOUR);
 let missions=scenarioState('missions',0);missions=run(missions,{type:'claimMainMission',id:missions.missions.completed[0]});
 return {newGame:createGame(0),twoExtensions:expanded,level3Seven:scenarioState('habitats',0),production,reproduction,nurseryAndWaitingNest:waiting,missionsAndRewards:missions,spentHeartsGiftPending:hearts,fractionalIncome:advance(createGame(0),17)};
}
