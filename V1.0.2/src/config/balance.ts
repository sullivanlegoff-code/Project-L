export const HOUR = 3_600_000;
export const MINUTE = 60_000;
export const HEARTS = {
  initial: 12, gift: 2, giftInterval: 24 * HOUR,
  accelerationStep: 5 * MINUTE, pattesPerHeart: 25,
};
export const SPECIES_IDS = ['paille', 'neige', 'terre', 'brumelin', 'mottelin'] as const;
export type SpeciesId = typeof SPECIES_IDS[number];
export type RabbitType = 'paille' | 'neige' | 'terre' | 'feu' | 'metal' | 'vol' | 'arc-en-ciel';
export type BuildingKind = 'enclosure' | 'farm' | 'nest' | 'nursery';
export const SPECIES: Record<SpeciesId, {name: string; types: RabbitType[]; rarity: 'common' | 'uncommon'; price: number | null}> = {
  paille: {name: 'Lapin Paille', types: ['paille'], rarity: 'common', price: 80},
  neige: {name: 'Lapin Neige', types: ['neige'], rarity: 'common', price: 80},
  terre: {name: 'Lapin Terre', types: ['terre'], rarity: 'common', price: 80},
  brumelin: {name: 'Brumelin', types: ['paille', 'neige'], rarity: 'uncommon', price: null},
  mottelin: {name: 'Mottelin', types: ['paille', 'terre'], rarity: 'uncommon', price: null},
};
export const BALANCE = {
  initialPattes: 300, initialGrass: 10, initialWidth: 3, height: 2, extendedWidth: 6,
  extensionCost: 500, enclosureCapacity: 3, enclosureCap: 600,
  minAffection: 1, maxAffection: 20, breedingAffection: 2,
  incomeBase: 12, incomePerLevel: 2, foodMultiplier: 2,
  breedingCost: 20, breedingDuration: 20 * MINUTE,
  commonGrowth: 5 * MINUTE, hybridGrowth: 15 * MINUTE, guaranteeAttempt: 10,
  buildings: {
    enclosure: {price: 120, maximum: null}, farm: {price: 60, maximum: 2},
    nest: {price: 100, maximum: 1}, nursery: {price: 80, maximum: 1},
  } satisfies Record<BuildingKind, {price: number; maximum: number | null}>,
};
export const ORDERS = {
  small: {cost: 10, grass: 20, duration: 5 * MINUTE},
  medium: {cost: 18, grass: 40, duration: 15 * MINUTE},
  large: {cost: 40, grass: 100, duration: 60 * MINUTE},
};
export type OrderId = keyof typeof ORDERS;
export type Odds = Partial<Record<SpeciesId, number>>;
// Sorted type unions; weights are percentages.
export const BREEDING_ODDS: Record<string, Odds> = {
  paille: {paille: 100}, neige: {neige: 100}, terre: {terre: 100},
  'neige,paille': {paille: 40, neige: 40, brumelin: 20},
  'paille,terre': {paille: 40, terre: 40, mottelin: 20},
  'neige,terre': {neige: 50, terre: 50},
  'neige,paille,terre': {paille: 20, neige: 20, terre: 20, brumelin: 20, mottelin: 20},
};
