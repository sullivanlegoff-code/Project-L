import {z} from 'zod';
import {BALANCE, HEARTS, HOUR, ORDERS, SPECIES, SPECIES_IDS} from '../config/balance';
import type {GameState} from '../state/types';

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
  version: z.union([z.literal(1), z.literal(2)]), lastSimulatedAt: integer, nextId: integer.positive(),
  pattes: integer, grass: integer, expanded: z.boolean(),
  buildings: z.array(building).max(BALANCE.extendedWidth * BALANCE.height),
  rabbits: z.array(z.object({id: identity, species, affection: z.number().int().min(BALANCE.minAffection).max(BALANCE.maxAffection), enclosureId: identity}).strict()).max(36),
  discovered: z.array(species).max(SPECIES_IDS.length),
  pityFailures: integer.max(BALANCE.guaranteeAttempt - 1),
}).strict();
const v1 = base.extend({version: z.literal(1)}).strict();
const v2 = base.extend({version: z.literal(2), hearts: integer, nextHeartGiftAt: integer}).strict();
const schema = z.discriminatedUnion('version', [v1, v2]).superRefine((s, context) => {
  const issue = (message: string) => context.addIssue({code: z.ZodIssueCode.custom, message});
  // v1 keeps its exact durations; v2 also admits completed, shortened stages.
  const durationValid = (start: number, end: number, normal: number) => start <= s.lastSimulatedAt &&
    end >= start && end - start <= normal && (end - start === normal || (s.version === 2 && end <= s.lastSimulatedAt));
  const ids: string[] = [];
  const cells = new Set<string>();
  const width = s.expanded ? BALANCE.extendedWidth : BALANCE.initialWidth;
  const nursery = s.buildings.find(b => b.kind === 'nursery');
  for (const b of s.buildings) {
    ids.push(b.id);
    if (!b.id.startsWith('building-')) issue('Building identity');
    if (b.x >= width || b.y >= BALANCE.height || cells.has(`${b.x},${b.y}`)) issue('Invalid or occupied cell');
    cells.add(`${b.x},${b.y}`);
    if ((b.kind !== 'enclosure' && b.incomeUnits !== 0) || (b.kind !== 'farm' && b.order) ||
      (b.kind !== 'nest' && b.breeding) || (b.kind !== 'nursery' && b.baby)) issue('Building payload mismatch');
    if (b.order && (!durationValid(b.order.startedAt, b.order.endsAt, ORDERS[b.order.recipe].duration))) issue('Order timestamps');
    if (b.breeding) {
      const job = b.breeding;
      if (!nursery || !durationValid(job.startedAt, job.endsAt, BALANCE.breedingDuration) || job.parents[0] === job.parents[1]) issue('Breeding timestamps or parents');
      if (job.endsAt > s.lastSimulatedAt && job.parents.some(id => !s.rabbits.some(r => r.id === id && r.affection >= BALANCE.breedingAffection))) issue('Missing active parent');
      if (job.endsAt <= s.lastSimulatedAt && nursery && !nursery.baby) issue('Completed birth must transfer');
    }
    if (b.baby) {
      const duration = SPECIES[b.baby.birth.species].rarity === 'common' ? BALANCE.commonGrowth : BALANCE.hybridGrowth;
      if (!durationValid(b.baby.startedAt, b.baby.readyAt, duration)) issue('Growth timestamps');
    }
    for (const newborn of [b.baby?.birth, b.breeding?.birth]) if (newborn) {
      ids.push(newborn.id);
      if (!newborn.id.startsWith('birth-') || (newborn.guaranteed && !newborn.reservedDiscovery) ||
        (newborn.reservedDiscovery && SPECIES[newborn.species].rarity !== 'uncommon')) issue('Birth reservation');
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
  }
  for (const b of s.buildings) if (s.rabbits.filter(r => r.enclosureId === b.id).length > BALANCE.enclosureCapacity) issue('Enclosure capacity');
  if (new Set(ids).size !== ids.length || ids.some(id => Number(id.split('-')[1]) >= s.nextId)) issue('Duplicate identity or invalid nextId');
});

export type DecodeResult = {ok: true; state: GameState; migratedFrom?: 1} | {ok: false; reason: 'INVALID_JSON' | 'INVALID_STATE' | 'UNSUPPORTED_VERSION' | 'FILE_TOO_LARGE'};
export const MAX_JSON_LENGTH = 1_000_000;
export function decodeGame(json: string, now: number = Date.now()): DecodeResult {
  if (json.length > MAX_JSON_LENGTH) return {ok: false, reason: 'FILE_TOO_LARGE'};
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return {ok: false, reason: 'INVALID_JSON'}; }
  if (raw && typeof raw === 'object' && 'version' in raw && raw.version !== 1 && raw.version !== 2) return {ok: false, reason: 'UNSUPPORTED_VERSION'};
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return {ok: false, reason: 'INVALID_STATE'};
  if (parsed.data.version === 2) return {ok: true, state: parsed.data};
  const nextHeartGiftAt = Math.max(now, parsed.data.lastSimulatedAt) + HEARTS.giftInterval;
  if (!Number.isSafeInteger(now) || now < 0 || !Number.isSafeInteger(nextHeartGiftAt)) return {ok: false, reason: 'INVALID_STATE'};
  return {ok: true, migratedFrom: 1, state: {...parsed.data, version: 2, hearts: HEARTS.initial, nextHeartGiftAt}};
}
export function encodeGame(state: GameState): string {
  const parsed = schema.parse(v2.parse(state));
  return JSON.stringify(parsed, null, 2);
}
