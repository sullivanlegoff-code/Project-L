import type {GameState} from '../src/state/types';
import {grantMissingStarterBuildings} from '../src/simulation/starterBuildings';
import {updateMissions} from '../src/simulation/missions';
/** Expected addition used by historic field-preservation regressions; dedicated v8 tests check exact grants. */
export function withStarterBuildings(old:GameState){const s=structuredClone(old);grantMissingStarterBuildings(s);updateMissions(s,s.lastSimulatedAt);return s;}
