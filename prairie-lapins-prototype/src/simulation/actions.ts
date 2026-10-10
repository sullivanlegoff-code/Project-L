import {buildingPlacementReason} from './placement';
import {acquiredCell, PARCEL_IDS, extensionPrice} from '../config/land';
import {HABITAT_TYPES, habitatLevel, habitatPrice, type HabitatLevel} from '../config/habitats';
import {habitatEntryReason} from './habitats';
import {DAILY_MISSIONS, DAILY_MISSION_IDS, MAIN_MISSIONS, DAILY_BONUS, type Reward} from '../config/missions';
import {dailyCycleStart, recordMissionAction} from './missions';
import {BALANCE, HEARTS, HOUR, growthDuration, ORDERS, SPECIES, GUARANTEE_SPECIES, type BuildingKind, type SpeciesId} from '../config/balance';
import {emptyBuilding} from '../state/initial';
import type {ActionResult, Building, Command, GameState, PattesCommand, Refusal} from '../state/types';
import {chooseBirth, nestForParent} from './breeding';
import {advance, validTime} from './time';
import {complementCost, quoteAcceleration} from './hearts';
import {DECORATIONS, decorationResalePrice} from '../config/decorations';
import {decorationPlacementReason, decorationsInCell, purchaseDecorationReason} from './decorations';

class Quoted extends Error { constructor(public price: number) { super(); } }
class Denied extends Error { constructor(public reason: Refusal) { super(reason); } }
function requireRule(condition: unknown, reason: Refusal): asserts condition {
  if (!condition) throw new Denied(reason);
}
/** Atomic action: even elapsed time is discarded on refusal; call advance separately to resume. */
export function act(state: GameState, command: Command, now: number = Date.now(), rng: () => number = Math.random): ActionResult {
  return runAction(state, command, now, rng);
}
function runAction(state: GameState, requested: Command, now: number, rng: () => number, quoteOnly = false): ActionResult {
  const payment = requested.type === 'payWithHearts' ? requested : null;
  const command = requested.type === 'payWithHearts' ? requested.action : requested;
  if (payment && !['buyBuilding', 'buyRabbit', 'expand', 'startOrder', 'upgradeHabitat'].includes(command.type)) return {ok: false, state, reason: 'INVALID_CHOICE'};
  if (!validTime(now)) return {ok: false, state, reason: 'INVALID_TIME'};
  const s = advance(state, now);
  const time = s.lastSimulatedAt;
  const allocation = () => requireRule(Number.isSafeInteger(s.nextId + 1), 'RESOURCE_LIMIT');
  const id = (prefix: string) => { allocation(); return `${prefix}-${s.nextId++}`; };
  const credit = (resource: 'pattes' | 'grass' | 'hearts', amount: number) => {
    requireRule(Number.isSafeInteger(s[resource] + amount), 'RESOURCE_LIMIT');
    s[resource] += amount;
  };
  const pay = (cost: number) => {
    if (quoteOnly) throw new Quoted(cost); // Every non-monetary condition has already been checked.
    if (!payment) { requireRule(s.pattes >= cost, 'NOT_ENOUGH_PATTES'); s.pattes -= cost; return; }
    const missing = Math.max(0, cost - s.pattes), hearts = complementCost(missing);
    requireRule(missing > 0, 'NO_MISSING_PATTES');
    requireRule(Number.isSafeInteger(payment.maxHearts) && payment.maxHearts >= hearts &&
      Number.isSafeInteger(payment.maxPattes) && payment.maxPattes >= s.pattes, 'PRICE_CHANGED');
    requireRule(s.hearts >= hearts, 'NOT_ENOUGH_HEARTS');
    s.pattes = 0; s.hearts -= hearts;
  };
  const building = (key: string, kind?: BuildingKind): Building => {
    const b = s.buildings.find(item => item.id === key && (!kind || item.kind === kind));
    requireRule(b, 'NOT_FOUND'); return b;
  };
  const room = (key: string, species: SpeciesId) => {
    const b = building(key, 'enclosure');
    const reason = habitatEntryReason(s, b, species); requireRule(!reason, reason ?? 'INVALID_CHOICE');
    return b;
  };
  const cell = (x: number, y: number, exclude?: string) => {
    const reason = buildingPlacementReason(s, x, y, exclude);
    requireRule(!reason, reason ?? 'INVALID_CELL');
  };
  const busy = (rabbitId: string) => !!nestForParent(s, rabbitId);
  const reward = (r: Reward) => {
    credit(r.resource, r.amount); value = r.amount;
  };
  let value: string | number | undefined;
  try {
    switch (command.type) {
      case 'buyDecoration': {
        const reason = purchaseDecorationReason(s, command.catalogId); requireRule(!reason, reason ?? 'INVALID_CHOICE');
        pay(DECORATIONS[command.catalogId].price); value = id('decoration');
        s.decorations.push({id: value, catalogId: command.catalogId, location: {kind: 'inventory'}}); break;
      }
      case 'sellDecoration': {
        const index = s.decorations.findIndex(d => d.id === command.id);
        requireRule(index >= 0, 'NOT_FOUND');
        const amount = decorationResalePrice(s.decorations[index].catalogId);
        credit('pattes', amount);
        s.decorations.splice(index, 1); value = amount; break;
      }
      case 'placeDecoration': {
        const reason = decorationPlacementReason(s, command.id, command.location); requireRule(!reason, reason ?? 'INVALID_CHOICE');
        s.decorations.find(d => d.id === command.id)!.location = structuredClone(command.location); break;
      }
      case 'storeDecorationsInCell': {
        requireRule(acquiredCell(s, command.x, command.y), 'INVALID_CELL');
        const blocking = decorationsInCell(s, command.x, command.y);
        for (const d of s.decorations) if (blocking.includes(d.id)) d.location = {kind: 'inventory'};
        value = blocking.length; break;
      }
      case 'claimMainMission': {
        requireRule(Object.hasOwn(MAIN_MISSIONS, command.id), 'INVALID_CHOICE');
        requireRule(!s.missions.claimed.includes(command.id), 'ALREADY_CLAIMED');
        requireRule(s.missions.completed.includes(command.id), 'NOT_READY');
        reward(MAIN_MISSIONS[command.id].reward); s.missions.claimed.push(command.id); break;
      }
      case 'claimDailyMission': {
        requireRule(Object.hasOwn(DAILY_MISSIONS, command.id), 'INVALID_CHOICE');
        requireRule(command.cycleStart === dailyCycleStart(s), 'CYCLE_EXPIRED');
        const daily = s.missions.daily;
        requireRule(!daily.claimed.includes(command.id), 'ALREADY_CLAIMED');
        requireRule(daily.progress[command.id] >= DAILY_MISSIONS[command.id].target, 'NOT_READY');
        reward(DAILY_MISSIONS[command.id].reward); daily.claimed.push(command.id); break;
      }
      case 'claimDailyBonus': {
        requireRule(command.cycleStart === dailyCycleStart(s), 'CYCLE_EXPIRED');
        requireRule(!s.missions.daily.bonusClaimed, 'ALREADY_CLAIMED');
        requireRule(s.missions.daily.claimed.length === DAILY_MISSION_IDS.length, 'NOT_READY');
        reward(DAILY_BONUS); s.missions.daily.bonusClaimed = true; break;
      }
      case 'claimHearts': {
        requireRule(time >= s.nextHeartGiftAt, 'NOT_READY');
        requireRule(Number.isSafeInteger(time + HEARTS.giftInterval), 'INVALID_TIME');
        credit('hearts', HEARTS.gift); s.nextHeartGiftAt = time + HEARTS.giftInterval; value = HEARTS.gift; break;
      }
      case 'accelerate': {
        const quote = quoteAcceleration(s, command.id, command.stage, time);
        requireRule(quote.ok, quote.ok ? 'INVALID_CHOICE' : quote.reason);
        requireRule(quote.jobKey === command.jobKey, 'STALE_ACTION');
        requireRule(Number.isSafeInteger(command.maxHearts) && command.maxHearts >= quote.hearts, 'PRICE_CHANGED');
        requireRule(s.hearts >= quote.hearts, 'NOT_ENOUGH_HEARTS');
        const b = building(command.id);
        if (command.stage === 'order') b.order!.endsAt = time;
        else if (command.stage === 'breeding') b.breeding!.endsAt = time;
        else b.baby!.readyAt = time;
        s.hearts -= quote.hearts; value = quote.hearts; break;
      }
      case 'buyBuilding': {
        requireRule(Object.hasOwn(BALANCE.buildings, command.kind), 'INVALID_CHOICE');
        requireRule(command.kind !== 'nest' && command.kind !== 'nursery', 'INVALID_CHOICE');
        const config = BALANCE.buildings[command.kind];
        requireRule(config.maximum === null || s.buildings.filter(b => b.kind === command.kind).length < config.maximum, 'BUILDING_LIMIT');
        const habitatType = command.habitatType ?? 'universal';
        requireRule(HABITAT_TYPES.includes(habitatType) && (command.kind === 'enclosure' || command.habitatType === undefined), 'INVALID_CHOICE');
        cell(command.x, command.y); allocation(); pay(command.kind === 'enclosure' ? habitatPrice(habitatType) : config.price);
        value = id('building'); s.buildings.push(emptyBuilding(value, command.kind, command.x, command.y, habitatType)); break;
      }
      case 'placeStarterBuilding': {
        requireRule(command.kind === 'nest' || command.kind === 'nursery', 'INVALID_CHOICE');
        requireRule(!s.buildings.some(b => b.kind === command.kind), 'BUILDING_LIMIT');
        cell(command.x, command.y); allocation(); value = id('building');
        s.buildings.push(emptyBuilding(value, command.kind, command.x, command.y)); break;
      }
      case 'transferBirth': {
        const nest = building(command.id, 'nest');
        requireRule(nest.breeding, 'NOT_READY');
        requireRule(nest.breeding.birth.id === command.birthId, 'STALE_ACTION');
        requireRule(nest.breeding.endsAt <= time, 'NOT_READY');
        const nursery = s.buildings.find(b => b.kind === 'nursery');
        requireRule(nursery, 'MISSING_BUILDING'); requireRule(!nursery.baby, 'BUSY');
        const birth = nest.breeding.birth, duration = growthDuration(birth.species);
        requireRule(Number.isSafeInteger(time + duration), 'INVALID_TIME');
        nursery.baby = {birth, startedAt: time, readyAt: time + duration};
        nest.breeding = null; value = birth.id; break;
      }
      case 'upgradeHabitat': {
        const b = building(command.id, 'enclosure');
        requireRule(b.habitat && b.habitat.level === command.fromLevel, 'STALE_ACTION');
        requireRule(b.habitat.level < 3, 'MAX_HABITAT_LEVEL');
        const next = (b.habitat.level + 1) as HabitatLevel;
        pay(habitatLevel(b.habitat.type, next).cost); b.habitat.level = next; break;
      }
      case 'moveBuilding': {
        const b = building(command.id); cell(command.x, command.y, b.id); b.x = command.x; b.y = command.y; break;
      }
      case 'buyRabbit': {
        requireRule(Object.hasOwn(SPECIES, command.species), 'INVALID_CHOICE');
        const price = SPECIES[command.species].price;
        requireRule(price !== null, 'INVALID_CHOICE'); room(command.enclosureId, command.species); allocation(); pay(price);
        value = id('rabbit');
        s.rabbits.push({id: value, species: command.species, affection: BALANCE.minAffection, enclosureId: command.enclosureId});
        if (!s.discovered.includes(command.species)) s.discovered.push(command.species);
        break;
      }
      case 'moveRabbit': {
        const rabbit = s.rabbits.find(r => r.id === command.id); requireRule(rabbit, 'NOT_FOUND');
        requireRule(!busy(rabbit.id), 'PARENT_BUSY');
        if (rabbit.enclosureId !== command.enclosureId) { room(command.enclosureId, rabbit.species); rabbit.enclosureId = command.enclosureId; }
        break;
      }
      case 'collectIncome': {
        const b = building(command.id, 'enclosure'); value = Math.floor(b.incomeUnits / HOUR);
        credit('pattes', value); b.incomeUnits -= value * HOUR; break;
      }
      case 'startOrder': {
        const b = building(command.id, 'farm'); requireRule(!b.order, 'BUSY');
        requireRule(Object.hasOwn(ORDERS, command.recipe), 'INVALID_CHOICE');
        const recipe = ORDERS[command.recipe];
        requireRule(Number.isSafeInteger(time + recipe.duration), 'INVALID_TIME'); pay(recipe.cost);
        b.order = {recipe: command.recipe, startedAt: time, endsAt: time + recipe.duration}; break;
      }
      case 'collectOrder': {
        const b = building(command.id, 'farm'); requireRule(b.order && b.order.endsAt <= time, 'NOT_READY');
        value = ORDERS[b.order.recipe].grass; credit('grass', value); b.order = null; break;
      }
      case 'feed': {
        const rabbit = s.rabbits.find(r => r.id === command.id); requireRule(rabbit, 'NOT_FOUND');
        requireRule(rabbit.affection < BALANCE.maxAffection, 'MAX_AFFECTION');
        const cost = BALANCE.foodMultiplier * rabbit.affection;
        requireRule(s.grass >= cost, 'NOT_ENOUGH_GRASS'); s.grass -= cost; rabbit.affection++; break;
      }
      case 'breed': {
        requireRule(command.parents[0] !== command.parents[1], 'SAME_PARENT');
        const parents = command.parents.map(key => s.rabbits.find(r => r.id === key));
        requireRule(parents[0] && parents[1], 'NOT_FOUND');
        requireRule(parents.every(r => r && r.affection >= BALANCE.breedingAffection), 'AFFECTION_TOO_LOW');
        const nest = s.buildings.find(b => b.kind === 'nest');
        requireRule(nest && s.buildings.some(b => b.kind === 'nursery'), 'MISSING_BUILDING');
        requireRule(!nest.breeding, 'BUSY');
        requireRule(parents.every(r => r && !busy(r.id)), 'PARENT_BUSY');
        allocation();
        const longestGrowth = Math.max(...(Object.keys(SPECIES) as SpeciesId[]).map(growthDuration));
        requireRule(Number.isSafeInteger(time + BALANCE.breedingDuration + longestGrowth), 'INVALID_TIME');
        // Free launch: no payment or heart-complement path.
        const roll = rng(); requireRule(Number.isFinite(roll) && roll >= 0 && roll < 1, 'INVALID_RANDOM');
        const result = chooseBirth(s, parents[0].species, parents[1].species, roll, parents[0].affection, parents[1].affection);
        s.pityFailures = result.pityFailures;
        value = id('birth');
        nest.breeding = {parents: [...command.parents], startedAt: time, endsAt: time + BALANCE.breedingDuration,
          birth: {id: value, species: result.species, guaranteed: result.guaranteed, reservedDiscovery: result.reservedDiscovery}};
        break;
      }
      case 'welcome': {
        const nursery = s.buildings.find(b => b.kind === 'nursery');
        requireRule(nursery?.baby && nursery.baby.readyAt <= time, 'NOT_READY'); room(command.enclosureId, nursery.baby.birth.species);
        const birth = nursery.baby.birth; value = birth.id;
        s.rabbits.push({id: birth.id, species: birth.species, affection: BALANCE.minAffection, enclosureId: command.enclosureId});
        if (!s.discovered.includes(birth.species)) {
          s.discovered.push(birth.species);
          if (GUARANTEE_SPECIES.includes(birth.species)) s.pityFailures = 0;
        }
        nursery.baby = null; break;
      }
      case 'expand': {
        requireRule(PARCEL_IDS.includes(command.parcelId), 'INVALID_CHOICE');
        requireRule(!s.acquiredParcels.includes(command.parcelId), 'ALREADY_EXPANDED');
        requireRule(command.expectedCost === extensionPrice(s), 'PRICE_CHANGED');
        pay(extensionPrice(s)); s.acquiredParcels.push(command.parcelId); break;
      }
      case 'release': {
        const rabbit = s.rabbits.find(r => r.id === command.id); requireRule(rabbit, 'NOT_FOUND');
        requireRule(!busy(rabbit.id), 'PARENT_BUSY');
        requireRule(s.rabbits.filter(r => r.species === rabbit.species).length > 1, 'LAST_OF_SPECIES'); s.rabbits = s.rabbits.filter(r => r.id !== rabbit.id); break;
      }
      default: throw new Denied('INVALID_CHOICE');
    }
    requireRule(recordMissionAction(s, command.type, command.type === 'feed' ? 1 : typeof value === 'number' ? value : 0), 'RESOURCE_LIMIT');
    // In particular, a welcome frees the nursery at this action's timestamp.
    return {ok: true, state: advance(s, time), ...(value === undefined ? {} : {value})};
  } catch (error) {
    if (error instanceof Quoted) return {ok: true, state, value: error.price};
    if (error instanceof Denied) return {ok: false, state, reason: error.reason};
    throw error;
  }
}

export function pendingDiscoveries(state: GameState): SpeciesId[] {
  return [...new Set(state.buildings.flatMap(b => [b.breeding?.birth, b.baby?.birth])
    .filter(birth => birth?.reservedDiscovery && !state.discovered.includes(birth.species))
    .map(birth => birth!.species))];
}

export type ComplementQuote = {ok: true; cost: number; pattes: number; hearts: number; missing: number} | {ok: false; reason: Refusal};
/** Reuses the exact action validation, stopping at payment before any RNG or mutation. */
export function quoteComplement(state: GameState, command: PattesCommand, now: number): ComplementQuote {
  if ((command as {type:string}).type === 'breed') return {ok:false,reason:'INVALID_CHOICE'};
  const result = runAction(state, command, now, () => { throw new Error('A quote must not draw a birth'); }, true);
  if (!result.ok) return {ok: false, reason: result.reason};
  const cost = result.value as number;
  const missing = Math.max(0, cost - state.pattes);
  if (!missing) return {ok: false, reason: 'NO_MISSING_PATTES'};
  return {ok: true, cost, pattes: state.pattes, hearts: complementCost(missing), missing};
}
