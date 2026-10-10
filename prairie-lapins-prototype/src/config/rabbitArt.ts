/** Presentation assets only: stable species ID, same image in Phaser and HTML. */
export const SNOW_ART = {
  species: 'neige', texture: 'rabbit-neige-original-v1',
  url: `${import.meta.env.BASE_URL}assets/rabbits/neige/neige-v1.png`,
  width: 518, height: 473, worldWidth: 48, groundY: 12,
} as const;

export const STRAW_ART = {
  species: 'paille', texture: 'rabbit-paille-original-v1',
  url: `${import.meta.env.BASE_URL}assets/rabbits/paille/paille-v1.png`,
  width: 350, height: 495, worldWidth: 40, groundY: 12,
} as const;
export const EARTH_ART = {
  species: 'terre', texture: 'rabbit-terre-original-v1',
  url: `${import.meta.env.BASE_URL}assets/rabbits/terre/terre-v1.png`,
  width: 992, height: 907, worldWidth: 48, groundY: 12,
} as const;
export const LOP_ART = {
  species: 'belier-gris', texture: 'rabbit-belier-gris-original-v1',
  url: `${import.meta.env.BASE_URL}assets/rabbits/belier-gris/belier-gris-v1.png`,
  width: 527, height: 488, worldWidth: 48, groundY: 12,
} as const;
export const FIRE_ART = {
  species: 'feu', texture: 'rabbit-feu-original-v1',
  url: `${import.meta.env.BASE_URL}assets/rabbits/feu/feu-v1.png`,
  width: 1004, height: 827, worldWidth: 50, groundY: 12,
} as const;
export const FLIGHT_ART = {
  species: 'volant', texture: 'rabbit-volant-original-v1',
  url: `${import.meta.env.BASE_URL}assets/rabbits/volant/volant-v1.png`,
  width: 814, height: 966, worldWidth: 50, groundY: 12,
} as const;
export const RABBIT_ART = [SNOW_ART, STRAW_ART, EARTH_ART, LOP_ART, FIRE_ART, FLIGHT_ART] as const;
export type RabbitArt = typeof RABBIT_ART[number];
export function rabbitArt(species?: string): RabbitArt | undefined {
  return RABBIT_ART.find(art => art.species === species);
}
