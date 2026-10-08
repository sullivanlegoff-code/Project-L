import {HOUR, type BuildingKind} from './balance';

export type Reward = {resource: 'pattes' | 'grass' | 'hearts'; amount: number};
export type MainCondition = {kind: 'building'; building: BuildingKind} | {kind: 'discoveries' | 'affection'; target: number} | {kind: 'extension' | 'rare'};
type MainDefinition = {title: string; description: string; condition: MainCondition; reward: Reward};
export const MAIN_MISSION_IDS = ['first-farm', 'cozy-nest', 'welcome-babies', 'varied-family', 'strong-bonds', 'growing-collection', 'bigger-meadow', 'first-rare'] as const;
export type MainMissionId = typeof MAIN_MISSION_IDS[number];
export const MAIN_MISSIONS: Record<MainMissionId, MainDefinition> = {
  'first-farm': {title: 'Première ferme', description: 'Posséder une ferme.', condition: {kind: 'building', building: 'farm'}, reward: {resource: 'grass', amount: 20}},
  'cozy-nest': {title: 'Un nid douillet', description: 'Posséder un nid.', condition: {kind: 'building', building: 'nest'}, reward: {resource: 'pattes', amount: 30}},
  'welcome-babies': {title: 'Bienvenue aux lapereaux', description: 'Posséder une nurserie.', condition: {kind: 'building', building: 'nursery'}, reward: {resource: 'grass', amount: 20}},
  'varied-family': {title: 'Une famille variée', description: 'Avoir découvert 3 espèces.', condition: {kind: 'discoveries', target: 3}, reward: {resource: 'pattes', amount: 50}},
  'strong-bonds': {title: 'Des liens plus forts', description: 'Avoir un lapin d’affection 5.', condition: {kind: 'affection', target: 5}, reward: {resource: 'hearts', amount: 1}},
  'growing-collection': {title: 'Collection naissante', description: 'Avoir découvert 5 espèces.', condition: {kind: 'discoveries', target: 5}, reward: {resource: 'hearts', amount: 2}},
  'bigger-meadow': {title: 'Une prairie plus grande', description: 'Avoir acheté l’extension.', condition: {kind: 'extension'}, reward: {resource: 'pattes', amount: 100}},
  'first-rare': {title: 'Première espèce rare', description: 'Découvrir Lunettes, Perroquet ou Feu Glacé.', condition: {kind: 'rare'}, reward: {resource: 'hearts', amount: 3}},
};
export const DAILY_MISSION_IDS = ['collect-pattes', 'collect-grass', 'gain-affection'] as const;
export type DailyMissionId = typeof DAILY_MISSION_IDS[number];
export type MissionEvent = 'collectIncome' | 'collectOrder' | 'feed';
export const DAILY_MISSIONS: Record<DailyMissionId, {title: string; description: string; event: MissionEvent; target: number; reward: Reward}> = {
  'collect-pattes': {title: 'Récolte de pattes', description: 'Récolter 100 pattes dans les enclos.', event: 'collectIncome', target: 100, reward: {resource: 'pattes', amount: 30}},
  'collect-grass': {title: 'Une réserve d’herbe', description: 'Récolter 40 herbes dans les fermes.', event: 'collectOrder', target: 40, reward: {resource: 'grass', amount: 10}},
  'gain-affection': {title: 'Des lapins choyés', description: 'Gagner 3 niveaux d’affection au total.', event: 'feed', target: 3, reward: {resource: 'pattes', amount: 20}},
};
export const MISSION_CYCLE_DURATION = 24 * HOUR;
export const DAILY_BONUS: Reward = {resource: 'hearts', amount: 2};
