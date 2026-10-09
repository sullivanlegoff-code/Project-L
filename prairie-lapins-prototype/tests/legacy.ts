import type {GameState} from '../src/state/types';
/** Reconstruct the old format for migration tests; never used by the game. */
export function withoutHabitats(s: GameState) {
  const {decorations: _decorations, secondExpanded: _second, buildings, ...fields} = s;
  return {...fields, buildings: buildings.map(({habitat: _habitat, ...b}) => b)};
}
export function withUniversalHabitats<T extends {buildings: {kind: string}[]}>(s: T) {
  return {...s, version: 5, decorations: [], secondExpanded: false, buildings: s.buildings.map(b => ({...b, habitat: b.kind === 'enclosure' ? {type: 'universal', level: 1} : null}))};
}
