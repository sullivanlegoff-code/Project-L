import {grantMissingStarterBuildings} from '../simulation/starterBuildings';
import {updateMissions} from '../simulation/missions';
import {buildingPlacementReason} from '../simulation/placement';
import {FINE_GRID} from '../config/decorations';
import {PARCEL_IDS, acquiredCell, type ParcelId} from '../config/land';
import {footprint} from '../simulation/decorations';
import {type HabitatType, HABITAT_TYPES, HABITAT_LEVELS, LAND, habitatLevel} from '../config/habitats';
import {MAIN_MISSION_IDS, DAILY_MISSION_IDS, DAILY_MISSIONS, MISSION_CYCLE_DURATION} from '../config/missions';
import {createMissions, cycleIndexAt} from '../simulation/missions';
import {z} from 'zod';
import {BALANCE, HEARTS, HOUR, ORDERS, SPECIES, SPECIES_IDS, GUARANTEE_SPECIES, growthDuration} from '../config/balance';
import type {GameState} from '../state/types';
import {DECORATION_IDS, MAX_DECORATIONS} from '../config/decorations';
import {decorationPlacementReason} from '../simulation/decorations';

const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const identity = z.string().regex(/^(building|rabbit|birth)-[1-9]\d*$/);
const species = z.enum(SPECIES_IDS);
const birth = z.object({id: identity, species, guaranteed: z.boolean(), reservedDiscovery: z.boolean()}).strict();
const building = z.object({
  id: identity, kind: z.enum(['enclosure', 'farm', 'nest', 'nursery']), x: integer, y: integer,
  incomeUnits: integer.max(BALANCE.enclosureCap * HOUR),
  order: z.object({recipe: z.enum(['small', 'medium', 'large']), startedAt: integer, endsAt: integer}).strict().nullable(),
  breeding: z.object({parents: z.tuple([identity, identity]), startedAt: integer, endsAt: integer, birth}).strict().nullable(),
  baby: z.object({birth, startedAt: integer, readyAt: integer}).strict().nullable(),
}).strict();
const base = z.object({
  version: z.union([z.literal(1), z.literal(2), z.literal(3)]), lastSimulatedAt: integer, nextId: integer.positive(),
  pattes: integer, grass: integer, expanded: z.boolean(),
  buildings: z.array(building).max(BALANCE.extendedWidth * BALANCE.height),
  rabbits: z.array(z.object({id: identity, species, affection: z.number().int().min(BALANCE.minAffection).max(BALANCE.maxAffection), enclosureId: identity}).strict()).max(36),
  discovered: z.array(species).max(SPECIES_IDS.length),
  pityFailures: integer.max(BALANCE.guaranteeAttempt - 1),
}).strict();
const v1 = base.extend({version: z.literal(1)}).strict();
const v2 = base.extend({version: z.literal(2), hearts: integer, nextHeartGiftAt: integer}).strict();
const missions = z.object({
  completed: z.array(z.enum(MAIN_MISSION_IDS)).max(MAIN_MISSION_IDS.length),
  claimed: z.array(z.enum(MAIN_MISSION_IDS)).max(MAIN_MISSION_IDS.length),
  daily: z.object({referenceAt: integer, cycleIndex: integer,
    progress: z.object({'collect-pattes': integer, 'collect-grass': integer, 'gain-affection': integer}).strict(),
    claimed: z.array(z.enum(DAILY_MISSION_IDS)).max(DAILY_MISSION_IDS.length), bonusClaimed: z.boolean(),
  }).strict(),
}).strict();
const v3 = v2.extend({version: z.literal(3), missions}).strict();
const v4 = v3.extend({version: z.literal(4), secondExpanded: z.boolean(),
  buildings: z.array(building.extend({incomeUnits: integer, habitat: z.object({type: z.enum(HABITAT_TYPES), level: z.union([z.literal(1), z.literal(2), z.literal(3)])}).strict().nullable()}).strict()).max(LAND[2].width * BALANCE.height),
  rabbits: base.shape.rabbits.max(LAND[2].width * BALANCE.height * HABITAT_LEVELS.universal[2].capacity),
}).strict();
const decoration = z.object({id: z.string().regex(/^decoration-[1-9]\d*$/), catalogId: z.enum(DECORATION_IDS),
  location: z.discriminatedUnion('kind', [
    z.object({kind: z.literal('inventory')}).strict(),
    z.object({kind: z.literal('outside'), x: integer, y: integer, rotation: z.union([z.literal(0), z.literal(1)])}).strict(),
    z.object({kind: z.literal('habitat'), habitatId: identity, slot: z.union([z.literal(0), z.literal(1), z.literal(2)])}).strict(),
  ])}).strict();
const v5 = v4.extend({version: z.literal(5), decorations: z.array(decoration).max(MAX_DECORATIONS)}).strict();
const currentDecoration = decoration.extend({location: z.discriminatedUnion('kind', [decoration.shape.location.options[0], decoration.shape.location.options[1]])}).strict();
const v6 = v5.omit({expanded: true, secondExpanded: true, decorations: true}).extend({version: z.literal(6), acquiredParcels: z.array(z.enum(PARCEL_IDS)).min(1).max(9), decorations: z.array(currentDecoration).max(MAX_DECORATIONS), buildings: v4.shape.buildings.max(81), rabbits: v4.shape.rabbits.max(567)}).strict();
const v7 = v6.extend({version: z.literal(7)}).strict();
const v8 = v7.extend({version:z.literal(8)}).strict();
const schema = z.discriminatedUnion('version', [v1, v2, v3, v4, v5, v6, v7, v8]).superRefine((s, context) => {
  const issue = (message: string) => context.addIssue({code: z.ZodIssueCode.custom, message});
  // v1 keeps its exact durations; v2/v3 also admit completed, shortened stages.
  const durationValid = (start: number, end: number, normal: number) => start <= s.lastSimulatedAt &&
    end >= start && end - start <= normal && (end - start === normal || (s.version !== 1 && end <= s.lastSimulatedAt));
  if ('missions' in s) {
    const m = s.missions, d = m.daily;
    if (new Set(m.completed).size !== m.completed.length || new Set(m.claimed).size !== m.claimed.length ||
      m.claimed.some(id => !m.completed.includes(id))) issue('Main mission claims');
    if (d.cycleIndex !== cycleIndexAt(d.referenceAt, s.lastSimulatedAt)) issue('Daily cycle');
    if (new Set(d.claimed).size !== d.claimed.length || d.claimed.some(id => d.progress[id] < DAILY_MISSIONS[id].target) ||
      (d.bonusClaimed && d.claimed.length !== DAILY_MISSION_IDS.length)) issue('Daily claims');
    // A decoded legacy state may await advance: its fresh cycle is anchored at migration time.
    if (d.referenceAt > s.lastSimulatedAt && (Object.values(d.progress).some(n => n !== 0) || d.claimed.length || d.bonusClaimed)) issue('Future cycle progress');
  }
  const ids: string[] = [];
  const cells = new Set<string>();
  if ('secondExpanded' in s && s.secondExpanded && !s.expanded) issue('Extension sequence');
  const width = s.version >= 6 ? 9 : 'secondExpanded' in s && s.secondExpanded ? LAND[2].width : 'expanded' in s && s.expanded ? BALANCE.extendedWidth : BALANCE.initialWidth;
  if ((s.version === 6 || s.version === 7 || s.version === 8) && (!s.acquiredParcels.includes('center') || new Set(s.acquiredParcels).size !== s.acquiredParcels.length)) issue('Invalid acquired parcels');
  const nursery = s.buildings.find(b => b.kind === 'nursery');
  for (const b of s.buildings) {
    ids.push(b.id);
    if ('habitat' in b) {
      if ((b.kind === 'enclosure') !== (b.habitat !== null)) issue('Habitat payload');
      if (b.habitat && b.incomeUnits > habitatLevel(b.habitat.type, b.habitat.level).cap * HOUR) issue('Habitat storage');
    }
    if (!b.id.startsWith('building-')) issue('Building identity');
    if (((s.version === 7 || s.version === 8) ? !!buildingPlacementReason(s, b.x, b.y, b.id) : s.version === 6 ? !acquiredCell(s,b.x,b.y) : b.x >= width || b.y >= BALANCE.height) || cells.has(`${b.x},${b.y}`)) issue('Invalid or occupied cell');
    cells.add(`${b.x},${b.y}`);
    if ((b.kind !== 'enclosure' && b.incomeUnits !== 0) || (b.kind !== 'farm' && b.order) ||
      (b.kind !== 'nest' && b.breeding) || (b.kind !== 'nursery' && b.baby)) issue('Building payload mismatch');
    if (b.order && (!durationValid(b.order.startedAt, b.order.endsAt, ORDERS[b.order.recipe].duration))) issue('Order timestamps');
    if (b.breeding) {
      const job = b.breeding;
      if (!nursery || !durationValid(job.startedAt, job.endsAt, BALANCE.breedingDuration) || job.parents[0] === job.parents[1]) issue('Breeding timestamps or parents');
      if (job.endsAt > s.lastSimulatedAt && job.parents.some(id => !s.rabbits.some(r => r.id === id && r.affection >= BALANCE.breedingAffection))) issue('Missing active parent');
      // Completed legacy jobs may reference parents that were moved or entrusted.
      // Preserve the birth and surviving individuals; never reconstruct an absent parent.
    }
    if (b.baby) {
      const duration = growthDuration(b.baby.birth.species);
      if (!durationValid(b.baby.startedAt, b.baby.readyAt, duration)) issue('Growth timestamps');
    }
    for (const newborn of [b.baby?.birth, b.breeding?.birth]) if (newborn) {
      ids.push(newborn.id);
      if (!newborn.id.startsWith('birth-') || (newborn.guaranteed && !newborn.reservedDiscovery) ||
        (newborn.reservedDiscovery && !GUARANTEE_SPECIES.includes(newborn.species))) issue('Birth reservation');
    }
  }
  for (const kind of ['enclosure', 'farm', 'nest', 'nursery'] as const) {
    const maximum = BALANCE.buildings[kind].maximum;
    if (maximum !== null && s.buildings.filter(b => b.kind === kind).length > maximum) issue('Building limit');
  }
  if (new Set(s.discovered).size !== s.discovered.length) issue('Duplicate discoveries');
  for (const rabbit of s.rabbits) {
    ids.push(rabbit.id);
    if (rabbit.id.startsWith('building-') || !s.discovered.includes(rabbit.species) ||
      !s.buildings.some(b => b.kind === 'enclosure' && b.id === rabbit.enclosureId)) issue('Rabbit identity or enclosure or discovery');
    const home = s.buildings.find(b => b.id === rabbit.enclosureId);
    if (home && 'habitat' in home && home.habitat) { const type=(home.habitat as {type:HabitatType}).type; if(type !== 'universal' && !SPECIES[rabbit.species].types.includes(type))issue('Incompatible rabbit'); }
  }
  for (const b of s.buildings) {
    const capacity = 'habitat' in b && b.habitat ? habitatLevel(b.habitat.type, b.habitat.level).capacity : BALANCE.enclosureCapacity;
    if (s.rabbits.filter(r => r.enclosureId === b.id).length > capacity) issue('Enclosure capacity');
  }
  if (s.version === 5 || s.version === 6 || s.version === 7 || s.version === 8) for (const d of s.decorations) {
    ids.push(d.id);
    if (s.version === 6 || s.version === 7 || s.version === 8) {if (decorationPlacementReason(s.version === 6 ? {...s, version: 8, buildings: s.buildings.map(b=>({...b,x:b.x*FINE_GRID,y:b.y*FINE_GRID}))} : {...s,version:8}, d.id, d.location as GameState['decorations'][number]['location'])) issue('Invalid decoration placement or reference');}
    else if (d.location.kind === 'habitat') {
      const loc=d.location;
      if (!['soft-cushion','ball-toys','play-tunnel','small-parasol'].includes(d.catalogId) || !s.buildings.some(b=>b.kind==='enclosure'&&b.id===loc.habitatId) || s.decorations.some(other=>other.id!==d.id&&other.location.kind==='habitat'&&other.location.habitatId===loc.habitatId&&other.location.slot===loc.slot)) issue('Invalid old habitat decoration');
    } else if (d.location.kind === 'outside') {
      const loc=d.location, rect={...loc,...footprint(d.catalogId,loc.rotation)};
      const overlaps=(x:number,y:number,w:number,h:number)=>rect.x<x+w&&rect.x+rect.width>x&&rect.y<y+h&&rect.y+rect.height>y;
      if (['soft-cushion','ball-toys','play-tunnel','small-parasol'].includes(d.catalogId) || (loc.rotation && !['wood-bench','flower-arch'].includes(d.catalogId)) || rect.x+rect.width>width*4 || rect.y+rect.height>8 || s.buildings.some(b=>overlaps(b.x*4,b.y*4,4,4)) || s.decorations.some(other=>{if(other.id===d.id||other.location.kind!=='outside')return false;const size=footprint(other.catalogId,other.location.rotation);return overlaps(other.location.x,other.location.y,size.width,size.height)})) issue('Invalid old exterior decoration');
    }
  }
  if (new Set(ids).size !== ids.length || ids.some(id => !Number.isSafeInteger(Number(id.split('-')[1])) || Number(id.split('-')[1]) >= s.nextId)) issue('Duplicate identity or invalid nextId');
});

export type DecodeResult = {ok: true; state: GameState; migratedFrom?: 1 | 2 | 3 | 4 | 5 | 6 | 7; storedDecorations?: number} | {ok: false; reason: 'INVALID_JSON' | 'INVALID_STATE' | 'UNSUPPORTED_VERSION' | 'FILE_TOO_LARGE'};
export const MAX_JSON_LENGTH = 1_000_000;
export function decodeGame(json: string, now: number = Date.now()): DecodeResult {
  if (json.length > MAX_JSON_LENGTH) return {ok: false, reason: 'FILE_TOO_LARGE'};
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return {ok: false, reason: 'INVALID_JSON'}; }
  if (raw && typeof raw === 'object' && 'version' in raw && raw.version !== 1 && raw.version !== 2 && raw.version !== 3 && raw.version !== 4 && raw.version !== 5 && raw.version !== 6 && raw.version !== 7 && raw.version !== 8) return {ok: false, reason: 'UNSUPPORTED_VERSION'};
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return {ok: false, reason: 'INVALID_STATE'};
  if (parsed.data.version === 8) return {ok: true, state: parsed.data};
  if (parsed.data.version === 7) return finishMigration(parsed.data,7);
  if (parsed.data.version === 6) {
    const state = {...parsed.data, version: 7 as const, buildings: parsed.data.buildings.map(b=>({...b,x:b.x*FINE_GRID,y:b.y*FINE_GRID}))};
    const checked = schema.safeParse(state);
    return checked.success ? finishMigration(state,6) : {ok:false,reason:'INVALID_STATE'};
  }
  if (parsed.data.version === 5) return convertLand(parsed.data, 5);
  // v4 keeps every field, timer and claimed reward exactly as recorded.
  if (parsed.data.version === 4) return convertLand({...parsed.data, version: 5, decorations: []}, 4);
  const referenceAt = Math.max(now, parsed.data.lastSimulatedAt);
  if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(referenceAt + MISSION_CYCLE_DURATION)) return {ok: false, reason: 'INVALID_STATE'};
  const hearts = parsed.data.version === 1 ? {hearts: HEARTS.initial, nextHeartGiftAt: referenceAt + HEARTS.giftInterval} :
    {hearts: parsed.data.hearts, nextHeartGiftAt: parsed.data.nextHeartGiftAt};
  return convertLand({...parsed.data, ...hearts, version: 5, decorations: [], secondExpanded: false,
    buildings: parsed.data.buildings.map(b => ({...b, habitat: b.kind === 'enclosure' ? {type: 'universal' as const, level: 1 as const} : null})),
    missions: parsed.data.version === 3 ? parsed.data.missions : createMissions(parsed.data, referenceAt)}, parsed.data.version);
}
/** Single deterministic migration: no simulation advance, purchases or resource changes. */
function convertLand(old: z.infer<typeof v5>, migratedFrom: 1|2|3|4|5): DecodeResult {
  const {expanded,secondExpanded,...rest}=old;
  const column=(x:number)=>x<6?x+3:x-6;
  const acquiredParcels:ParcelId[]=['center',...(expanded?['east' as const]:[]),...(secondExpanded?['west' as const]:[])];
  let storedDecorations=0;
  const state:z.infer<typeof v7>={...rest,version:7,acquiredParcels,buildings:old.buildings.map(b=>({...b,x:column(b.x)*FINE_GRID,y:(b.y+3)*FINE_GRID})),decorations:old.decorations.map(d=>{
    if(d.location.kind==='inventory')return {...d,location:{kind:'inventory'}};
    if(d.location.kind==='habitat'){storedDecorations++;return {...d,location:{kind:'inventory'}};}
    const loc=d.location,size=footprint(d.catalogId,loc.rotation),segment=Math.floor(loc.x/12);
    // The Centre/Est join is continuous; Est/Ouest is no longer adjacent.
    if(segment===1&&loc.x+size.width>24){storedDecorations++;return {...d,location:{kind:'inventory'}};}
    return {...d,location:{...loc,x:segment<2?loc.x+12:loc.x-24,y:loc.y+12}};
  })};
  for(const d of state.decorations)if(d.location.kind==='outside'&&decorationPlacementReason({...state,version:8},d.id,d.location)){d.location={kind:'inventory'};storedDecorations++;}
  const checked=schema.safeParse(state);
  return checked.success?finishMigration(state,migratedFrom,storedDecorations):{ok:false,reason:'INVALID_STATE'};
}
export function encodeGame(state: GameState): string {
  const parsed = schema.parse(v8.parse(state));
  return JSON.stringify(parsed, null, 2);
}

/** v8 changes reproduction semantics only; fine coordinates and existing jobs stay exact. */
function finishMigration(old:z.infer<typeof v7>,migratedFrom:1|2|3|4|5|6|7,storedDecorations=0):DecodeResult {
  const state:GameState={...old,version:8};
  grantMissingStarterBuildings(state);
  updateMissions(state,state.lastSimulatedAt);
  const checked=schema.safeParse(state);
  return checked.success ? {ok:true,state:checked.data as GameState,migratedFrom,...(storedDecorations?{storedDecorations}:{})} : {ok:false,reason:'INVALID_STATE'};
}
