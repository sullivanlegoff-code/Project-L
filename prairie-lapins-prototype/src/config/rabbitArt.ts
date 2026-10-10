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
export const RABBIT_ART = [SNOW_ART, STRAW_ART, EARTH_ART] as const;
export type RabbitArt = typeof RABBIT_ART[number];
export function rabbitArt(species?: string): RabbitArt | undefined {
  return RABBIT_ART.find(art => art.species === species);
}
