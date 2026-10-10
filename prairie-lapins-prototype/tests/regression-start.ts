import {createGame} from '../src/simulation';
import {createMissions} from '../src/simulation/missions';
/** Legacy layout for existing placement/economy regressions; new starts are checked separately. */
export function regressionStart(now:number=Date.now()){const s=createGame(now);s.buildings=s.buildings.filter(b=>b.kind==='enclosure');s.buildings[0].x=12;s.buildings[0].y=12;s.nextId=4;s.missions=createMissions(s,now);return s;}
