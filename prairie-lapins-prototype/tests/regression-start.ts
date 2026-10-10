import {createGame} from '../src/simulation';
/** Existing economy/regression fixtures use the former top-left habitat, translated into the centre. New-game framing is checked separately in parcels-v6.test.ts. */
export function regressionStart(now:number=Date.now()){const s=createGame(now);s.buildings[0].x=12;s.buildings[0].y=12;return s;}
