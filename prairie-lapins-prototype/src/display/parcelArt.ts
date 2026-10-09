import type Phaser from 'phaser';
import {PARCELS, acquiredCell, type ParcelId, type LandState} from '../config/land';
import {VISUAL} from '../config/visual';

/** Bounded static tiles: shared edges have grass continuity, exposed edges a coast. */
export function drawParcelTerrain(g: Phaser.GameObjects.Graphics, id: ParcelId, state: LandState): void {
  const parcel = PARCELS[id], grid = VISUAL.grid;
  const x = grid.originX + parcel.x * grid.width, y = grid.originY + parcel.y * grid.depth;
  const width = 3 * grid.width, height = 3 * grid.depth;
  const top = !acquiredCell(state, parcel.x, parcel.y - 1);
  const right = !acquiredCell(state, parcel.x + 3, parcel.y);
  const bottom = !acquiredCell(state, parcel.x, parcel.y + 3);
  const left = !acquiredCell(state, parcel.x - 1, parcel.y);
  const corners = {tl: top && left ? 14 : 0, tr: top && right ? 14 : 0,
    br: bottom && right ? 14 : 0, bl: bottom && left ? 14 : 0};
  const segments = [
    [x + corners.tl, y, x + width - corners.tr, y, top],
    [x + width, y + corners.tr, x + width, y + height - corners.br, right],
    [x + width - corners.br, y + height, x + corners.bl, y + height, bottom],
    [x, y + height - corners.bl, x, y + corners.tl, left],
  ] as const;
  function coast(thickness: number, color: number, alpha = 1): void {
    g.lineStyle(thickness, color, alpha);
    for (const [a, b, c, d, exposed] of segments) if (exposed) g.lineBetween(a, b, c, d);
    for (const [radius, cx, cy, start] of [
      [corners.tl, x + corners.tl, y + corners.tl, Math.PI],
      [corners.tr, x + width - corners.tr, y + corners.tr, Math.PI * 1.5],
      [corners.br, x + width - corners.br, y + height - corners.br, 0],
      [corners.bl, x + corners.bl, y + height - corners.bl, Math.PI / 2],
    ]) if (radius) {g.beginPath(); g.arc(cx, cy, radius, start, start + Math.PI / 2); g.strokePath();}
  }
  coast(24, 0x6ab7b9, .24); coast(12, 0xeed5a2);
  // Short, static reflections are drawn only on exposed water edges.
  g.lineStyle(2, 0xd9f0e8, .55);
  for (const [a, b, c, d, exposed] of segments) if (exposed) {
    const dx = a === c ? (a === x ? -18 : 18) : 0;
    const dy = b === d ? (b === y ? -18 : 18) : 0;
    g.lineBetween(a + (c - a) * .3 + dx, b + (d - b) * .3 + dy, a + (c - a) * .65 + dx, b + (d - b) * .65 + dy);
  }
  g.fillStyle(0xcbd785); g.fillRoundedRect(x, y, width, height, corners);
  for (let n = 0; n < 95; n++) {
    const px = x + 20 + n * 83 % Math.floor(width - 40), py = y + 18 + n * 59 % Math.floor(height - 36);
    g.fillStyle(n % 3 ? 0xe6df95 : 0xabc779, .25); g.fillEllipse(px, py, 32 + n % 12, 10);
    if (n % 9 === 0) {g.lineStyle(1, 0x829e65, .5); g.lineBetween(px, py, px - 3, py - 5); g.lineBetween(px, py, px + 3, py - 7);}
  }
  // Decorative path remains entirely on the acquired land.
  g.lineStyle(11, 0xded09a, .33); g.lineBetween(x + width * .28, y + height * .65, x + width * .71, y + height * .65);
  coast(3, 0x9db66c, .85);
}
