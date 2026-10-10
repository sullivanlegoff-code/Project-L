import {buildingPlacementReason} from '../simulation/placement';
import {habitatPrice, type HabitatType} from '../config/habitats';
import {BALANCE, HOUR, SPECIES, SPECIES_IDS, RECIPE_SPECIES, type BuildingKind, type SpeciesId, type RabbitType, type Rarity} from '../config/balance';
import {breedingPool, recipeMatches} from '../simulation/breeding';
import type {GameState, Refusal} from '../state/types';

export const BUILDING_NAMES: Record<BuildingKind, string> = {enclosure: 'Enclos', farm: 'Ferme', nest: 'Nid', nursery: 'Nurserie'};
export const REFUSALS: Record<Refusal | 'NO_GAME' | 'DISPOSED' | 'SALE_NOT_SAVED' | 'STORAGE_CHANGED', string> = {
  STORAGE_CHANGED: 'Une autre fenêtre a modifié cette partie. Exportez la copie en mémoire puis rechargez la page pour continuer.',
  SALE_NOT_SAVED: 'La vente n’a pas pu être sauvegardée. Objet et pattes conservés. Réessayez après avoir résolu le problème de sauvegarde.',
  DECORATION_LIMIT: 'Inventaire limité à 512 exemplaires pour préserver les performances.',
  DECORATION_OVERLAP: 'Cette empreinte chevauche une autre décoration.',
  DECORATION_BLOCKS_BUILDING: 'Cette empreinte chevauche une décoration. Déplacez ou rangez cet objet avant de poser le bâtiment.',
  TYPE_INCOMPATIBLE: 'Type incompatible.', MAX_HABITAT_LEVEL: 'Niveau maximal atteint.',
  ALREADY_CLAIMED: 'Cette récompense a déjà été réclamée.', CYCLE_EXPIRED: 'Ce cycle a expiré. Consultez les nouvelles missions.', RESOURCE_LIMIT: 'Le solde est trop élevé pour recevoir cette récompense.',
  NOT_ENOUGH_HEARTS: 'Pas assez de cœurs. Vous pouvez continuer en attendant ou en récoltant des pattes.',
  ACTION_FINISHED: 'Cette étape est déjà terminée : aucun cœur dépensé.', STALE_ACTION: 'Cette action a changé. Ouvrez à nouveau son panneau.',
  PRICE_CHANGED: 'Le paiement a changé. Vérifiez le nouveau prix avant de confirmer.', NO_MISSING_PATTES: 'Les pattes suffisent maintenant. Utilisez le paiement normal.',
  INVALID_TIME: 'L’heure de l’appareil est invalide.', INVALID_RANDOM: 'Le tirage n’a pas pu aboutir. Réessayez.', INVALID_CHOICE: 'Ce choix n’est pas disponible.',
  NOT_FOUND: 'Cet élément n’est plus présent.', NOT_ENOUGH_PATTES: 'Pas assez de pattes.', NOT_ENOUGH_GRASS: 'Pas assez d’herbe.',
  INVALID_CELL: 'Cette case n’est pas encore disponible.', CELL_OCCUPIED: 'Cette case est occupée.', BUILDING_LIMIT: 'Limite de bâtiments atteinte.',
  CAPACITY_FULL: 'Habitat plein.', BUSY: 'Ce bâtiment est occupé.', NOT_READY: 'Ce n’est pas encore prêt.', MAX_AFFECTION: 'Affection maximale atteinte.',
  SAME_PARENT: 'Choisissez deux lapins différents.', AFFECTION_TOO_LOW: 'Chaque parent doit avoir au moins 2 d’affection.',
  MISSING_BUILDING: 'Il faut un nid et une nurserie.', ALREADY_EXPANDED: 'L’extension est déjà achetée.', LAST_OF_SPECIES: 'Gardez au moins un lapin de chaque espèce possédée.',
  PARENT_BUSY: 'Ce parent participe à une reproduction.', NO_GAME: 'Chargez une partie dans les paramètres.', DISPOSED: 'Rechargez la page.',
};
export const moneyReason = (s: GameState, price: number) => s.pattes < price ? 'Pas assez de pattes.' : null;
export const occupants = (s: GameState, id: string) => s.rabbits.filter(r => r.enclosureId === id);
export const parentBusy = (s: GameState, id: string, now: number) => s.buildings.some(b => b.breeding && b.breeding.endsAt > now && b.breeding.parents.includes(id));
export function rabbitAvailability(s: GameState, id: string, now: number): string | null {
  const r = s.rabbits.find(r => r.id === id);
  return !r ? 'Lapin absent.' : r.affection < BALANCE.breedingAffection ? 'Affection 2 nécessaire.' : parentBusy(s, id, now) ? 'Parent occupé.' : null;
}
export function releaseReason(s: GameState, id: string, now: number): string | null {
  const r = s.rabbits.find(r => r.id === id);
  return !r ? 'Lapin absent.' : s.rabbits.filter(other => other.species === r.species).length <= 1 ? REFUSALS.LAST_OF_SPECIES : parentBusy(s, id, now) ? REFUSALS.PARENT_BUSY : null;
}
export function buildingReason(s: GameState, kind: BuildingKind, ignorePrice = false, habitatType: HabitatType = 'universal'): string | null {
  const config = BALANCE.buildings[kind];
  if (config.maximum !== null && s.buildings.filter(b => b.kind === kind).length >= config.maximum) return REFUSALS.BUILDING_LIMIT;
  if (s.buildings.length >= s.acquiredParcels.length * 9) return 'Aucune case libre. Agrandissez la prairie.';
  return ignorePrice ? null : moneyReason(s, kind === 'enclosure' ? habitatPrice(habitatType) : config.price);
}
export type Placement = {kind: BuildingKind; movingId?: string; habitatType?: HabitatType; cell: {x: number; y: number} | null};
export function placementReason(s: GameState, placement: Placement): string | null {
  const cell = placement.cell;
  if (!cell) return 'Touchez un petit carré de la prairie.';
  const reason = buildingPlacementReason(s, cell.x, cell.y, placement.movingId);
  if (reason) return REFUSALS[reason];
  if (placement.movingId) return null;
  return buildingReason(s, placement.kind, false, placement.habitatType);
}
export function nurseryView(s: GameState, now: number): {stage: 'empty'} | {stage: 'growing'; readyAt: number} | {stage: 'ready'; species: SpeciesId; birthId: string} {
  const baby = s.buildings.find(b => b.kind === 'nursery')?.baby;
  if (!baby) return {stage: 'empty'};
  if (baby.readyAt > now) return {stage: 'growing', readyAt: baby.readyAt};
  return {stage: 'ready', species: baby.birth.species, birthId: baby.birth.id};
}
export type CollectionFilter = {type?: RabbitType; rarity?: Rarity; discovery?: 'known' | 'unknown'};
export function collectionView(s: GameState, filter: CollectionFilter = {}) {
  return SPECIES_IDS.filter(id => (!filter.type || SPECIES[id].types.includes(filter.type)) &&
    (!filter.rarity || SPECIES[id].rarity === filter.rarity) &&
    (!filter.discovery || s.discovered.includes(id) === (filter.discovery === 'known'))).map(id => s.discovered.includes(id) ? {known: true as const, species: id, name: SPECIES[id].name} : {known: false as const, name: '???'});
}
export const TYPE_NAMES: Record<RabbitType, string> = {paille: 'paille', neige: 'neige', terre: 'terre', feu: 'feu', metal: 'métal', vol: 'vol', 'arc-en-ciel': 'arc-en-ciel'};
export const RARITY_NAMES: Record<Rarity, string> = {common: 'Commun', uncommon: 'Peu commun', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire'};
export const typeNames = (types: RabbitType[]) => types.map(type => TYPE_NAMES[type]).join(' + ');
/** A repeating decimal is shown alongside its exact fraction, never as an exact rounded percent. */
export function probabilityLabel(weight: number, total: number): string {
  if (weight * 100 % total === 0) return `${weight * 100 / total} %`;
  if (weight * 10000 % total === 0) return `${String(weight * 100 / total).replace('.', ',')} %`;
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const divisor = gcd(weight, total);
  return `${weight / divisor}/${total / divisor} (≈ ${(weight * 100 / total).toFixed(2).replace('.', ',')} %)`;
}
export function oddsView(s: GameState, a: SpeciesId, b: SpeciesId, affectionA = 2, affectionB = 2) {
  const pool = breedingPool(s, a, b, affectionA, affectionB);
  return {eligible: pool.eligible, guaranteed: pool.guaranteed, entries: (Object.keys(pool.weights) as SpeciesId[]).map(id => ({
    name: s.discovered.includes(id) ? SPECIES[id].name : 'Espèce inconnue',
    description: `${typeNames(SPECIES[id].types)} · ${RARITY_NAMES[SPECIES[id].rarity]}`,
    weight: pool.weights[id]! * 100 / pool.total,
    probability: probabilityLabel(pool.weights[id]!, pool.total),
  }))};
}
/** Looks at owned parents, recipes and discoveries only; never at a pending birth's identity/species. */
export function recipeBook(s: GameState, now: number) {
  return RECIPE_SPECIES.map(species => {
    const config = SPECIES[species], minAffection = config.recipe!.minAffection;
    const pairs = [];
    for (let i = 0; i < s.rabbits.length; i++) for (let j = i + 1; j < s.rabbits.length; j++) {
      const a = s.rabbits[i], b = s.rabbits[j];
      if (!recipeMatches(species, a.species, b.species)) continue;
      const feeding = [a, b].filter(r => r.affection < minAffection).map(r => r.id);
      const busy = parentBusy(s, a.id, now) || parentBusy(s, b.id, now);
      const pool = breedingPool(s, a.species, b.species, a.affection, b.affection);
      const weight = feeding.length ? 0 : pool.weights[species] ?? 0;
      pairs.push({parents: [a.id, b.id] as [string, string], feeding, busy,
        probability: probabilityLabel(weight, pool.total),
        guaranteed: !feeding.length && pool.guaranteed && weight > 0,
        certain: !feeding.length && pool.guaranteed && weight === pool.total,
        possible: !feeding.length && !busy && weight > 0});
    }
    return {species, known: s.discovered.includes(species), minAffection, types: config.types, pairs};
  });
}
export function timeLeft(end: number, now: number): string {
  const seconds = Math.max(0, Math.ceil((end - now) / 1000));
  if (!seconds) return 'Prêt';
  const hours = Math.floor(seconds / 3600), minutes = Math.floor(seconds % 3600 / 60);
  return hours ? `${hours} h ${minutes} min` : `${minutes} min ${seconds % 60} s`;
}
export const incomeWhole = (units: number) => Math.floor(units / HOUR);
export function tutorialStep(s: GameState, intro: boolean): {text: string; rabbitId?: string; building?: BuildingKind; done?: boolean} {
  if (!intro) return {text: 'Les pattes financent la prairie. L’herbe augmente l’affection et les revenus. Aucune faim à gérer.'};
  const candidate = ['paille', 'neige'].map(species => s.rabbits.find(r => r.species === species)).find(r => r && r.affection < 2);
  if (candidate) return {text: 'Nourrissez les deux lapins de départ jusqu’à l’affection 2.', rabbitId: candidate.id};
  for (const building of ['farm', 'nest', 'nursery'] as const) if (!s.buildings.some(b => b.kind === building)) return {text: `Achetez et placez votre ${BUILDING_NAMES[building].toLowerCase()}.`, building};
  if (s.buildings.some(b => b.breeding || b.baby) || s.discovered.some(id => SPECIES[id].recipe !== null)) return {text: 'Votre prairie prend vie ! Revenez accueillir le lapereau après sa croissance.', done: true};
  return {text: 'Choisissez vos deux parents dans le nid et lancez une reproduction. Vous pouvez jouer pendant l’attente.', building: 'nest'};
}
