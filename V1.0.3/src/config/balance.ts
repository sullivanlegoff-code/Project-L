export const HOUR = 3_600_000;
export const MINUTE = 60_000;
export const HEARTS = {
  initial: 12, gift: 2, giftInterval: 24 * HOUR,
  accelerationStep: 5 * MINUTE, pattesPerHeart: 25,
};
export const LEGACY_SPECIES_IDS = ['paille', 'neige', 'terre', 'brumelin', 'mottelin'] as const;
export const SPECIES_IDS = [...LEGACY_SPECIES_IDS, 'feu', 'belier-gris', 'volant', 'lunettes', 'perroquet', 'feu-glace'] as const;
export type SpeciesId = typeof SPECIES_IDS[number];
export type RabbitType = 'paille' | 'neige' | 'terre' | 'feu' | 'metal' | 'vol' | 'arc-en-ciel';
export type BuildingKind = 'enclosure' | 'farm' | 'nest' | 'nursery';
export type Rarity = 'common' | 'uncommon' | 'rare';
export const BREEDING_WEIGHTS = {common: 40, recipe: 20};
export const SPECIES: Record<SpeciesId, {name: string; types: RabbitType[]; rarity: Rarity; price: number | null; recipe: {minAffection: number} | null}> = {
  paille: {name: 'Lapin Paille', types: ['paille'], rarity: 'common', price: 80, recipe: null},
  neige: {name: 'Lapin Neige', types: ['neige'], rarity: 'common', price: 80, recipe: null},
  terre: {name: 'Lapin Terre', types: ['terre'], rarity: 'common', price: 80, recipe: null},
  brumelin: {name: 'Brumelin', types: ['paille', 'neige'], rarity: 'uncommon', price: null, recipe: {minAffection: 2}},
  mottelin: {name: 'Mottelin', types: ['paille', 'terre'], rarity: 'uncommon', price: null, recipe: {minAffection: 2}},
  feu: {name: 'Lapin Feu', types: ['feu'], rarity: 'common', price: 80, recipe: null},
  'belier-gris': {name: 'Lapin Bélier Gris', types: ['metal'], rarity: 'common', price: 80, recipe: null},
  volant: {name: 'Lapin Volant', types: ['vol'], rarity: 'common', price: 80, recipe: null},
  lunettes: {name: 'Lapin à Lunettes', types: ['metal', 'paille'], rarity: 'rare', price: null, recipe: {minAffection: 4}},
  perroquet: {name: 'Lapin Perroquet', types: ['vol', 'feu'], rarity: 'rare', price: null, recipe: {minAffection: 4}},
  'feu-glace': {name: 'Lapin Feu Glacé', types: ['feu', 'neige'], rarity: 'rare', price: null, recipe: {minAffection: 4}},
};
export const SHOP_SPECIES = SPECIES_IDS.filter(id => SPECIES[id].price !== null);
export const RECIPE_SPECIES = SPECIES_IDS.filter(id => SPECIES[id].recipe !== null);
export const BALANCE = {
  initialPattes: 300, initialGrass: 10, initialWidth: 3, height: 2, extendedWidth: 6,
  extensionCost: 500, enclosureCapacity: 3, enclosureCap: 600,
  minAffection: 1, maxAffection: 20, breedingAffection: 2,
  incomeBase: 12, incomePerLevel: 2, foodMultiplier: 2,
  breedingCost: 20, breedingDuration: 20 * MINUTE,
  commonGrowth: 5 * MINUTE, hybridGrowth: 15 * MINUTE, rareGrowth: 30 * MINUTE, guaranteeAttempt: 10,
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

export function growthDuration(species: SpeciesId): number {
  return {common: BALANCE.commonGrowth, uncommon: BALANCE.hybridGrowth, rare: BALANCE.rareGrowth}[SPECIES[species].rarity];
}
