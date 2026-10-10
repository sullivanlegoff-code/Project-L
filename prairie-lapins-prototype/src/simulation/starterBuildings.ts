import {emptyBuilding} from '../state/initial';
import type {GameState} from '../state/types';
import {buildingPlacementReason} from './placement';
/** One-time legacy conversion, deterministic and free. No existing object is moved. */
export function grantMissingStarterBuildings(state: GameState): void {
  for (const [kind, x, y] of [['nest',12,12],['nursery',20,12]] as const) {
    if (state.buildings.some(b => b.kind === kind)) continue;
    const preferred = {x,y};
    let destination: {x:number;y:number} | null = !buildingPlacementReason(state,x,y) ? preferred : null;
    for (let py=0;py<=32 && !destination;py++) for(let px=0;px<=32 && !destination;px++)
      if (!buildingPlacementReason(state,px,py)) destination={x:px,y:py};
    if (!destination || !Number.isSafeInteger(state.nextId+1)) continue;
    state.buildings.push(emptyBuilding(`building-${state.nextId++}`,kind,destination.x,destination.y));
  }
}
