import type Phaser from 'phaser';
import {HABITATS, type HabitatType, type HabitatLevel} from '../config/habitats';

/** Original vector artwork. Presentation only: no game state, random draws or assets. */
export function drawHabitat(g: Phaser.GameObjects.Graphics, x: number, y: number, type: HabitatType, level: HabitatLevel): void {
  const palette = HABITATS[type];
  // A low raised bed, shared proportions and a pale rim tie the seven variants together.
  g.fillStyle(0x50684b, .12); g.fillEllipse(x + 6, y + 29, 176, 92);
  g.fillStyle(palette.fence, .8); g.fillRoundedRect(x - 82, y - 36, 164, 104, 20);
  g.fillStyle(palette.ground); g.fillRoundedRect(x - 80, y - 44, 160, 103, 19);
  g.fillStyle(0xfffcdf, .16); g.fillEllipse(x - 21, y - 10, 112, 55);
  g.lineStyle(2, 0xfff6dd, .6); g.strokeRoundedRect(x - 77, y - 41, 154, 97, 17);
  // Ground textures sit below the residents; large motifs stay along the edges.
  for (let i = 0; i < 13; i++) {
    const dx = -65 + (i * 37) % 131, dy = -30 + (i * 23) % 75;
    g.fillStyle(type === 'neige' ? 0xffffff : palette.fence, type === 'neige' ? .45 : .13);
    g.fillEllipse(x + dx, y + dy, 9 + i % 3 * 3, 3);
  }
  if (type === 'neige') {
    for (const [dx, dy, width] of [[-51, -34, 53], [49, 40, 45], [60, -25, 29]]) {
      g.fillStyle(0xfcffff, .9); g.fillEllipse(x + dx, y + dy, width, 14);
    }
  } else if (type === 'terre') {
    for (const dx of [-66, 62]) {
      g.fillStyle(0xb09b7e); g.fillEllipse(x + dx, y + 31, 22, 10);
      g.fillStyle(0xd9c7a3); g.fillEllipse(x + dx - 2, y + 28, 14, 6);
    }
  } else if (type === 'metal') {
    g.lineStyle(1, 0x8d9e9d, .25);
    for (const dy of [-23, 4, 31]) g.lineBetween(x - 65, y + dy, x + 65, y + dy);
    for (const dx of [-38, 0, 38]) g.lineBetween(x + dx, y - 29, x + dx, y + 40);
  }
  // Back rail and posts. The centre remains open and the approved rabbit scale is kept.
  g.lineStyle(6, palette.fence); g.beginPath(); g.moveTo(x - 79, y + 47);
  g.lineTo(x - 79, y - 27); g.arc(x - 63, y - 27, 16, Math.PI, Math.PI * 1.5);
  g.lineTo(x + 63, y - 43); g.arc(x + 63, y - 27, 16, -Math.PI * .5, 0);
  g.lineTo(x + 79, y + 47); g.strokePath();
  g.lineStyle(2, 0xfff2d5, .75); g.lineBetween(x - 61, y - 45, x + 61, y - 45);

  switch (type) {
    case 'universal':
      shrub(g, x - 67, y - 38, 0x86aa70); flower(g, x - 63, y - 43, 0xe7abb7);
      shrub(g, x + 68, y + 39, 0x8aad73); flower(g, x + 71, y + 32, 0xffe7ae);
      break;
    case 'paille':
      g.fillStyle(0xc5a25e); g.fillRoundedRect(x - 75, y - 54, 39, 23, 6);
      g.fillStyle(0xf1d28a); g.fillRoundedRect(x - 74, y - 57, 37, 20, 5);
      g.lineStyle(2, 0xbb9255); for (const dx of [-64, -48]) g.lineBetween(x + dx, y - 56, x + dx, y - 36);
      g.lineStyle(1, 0xffedbb); g.lineBetween(x - 69, y - 50, x - 42, y - 50);
      wheat(g, x + 64, y - 39); wheat(g, x + 73, y + 43);
      break;
    case 'neige':
      g.fillStyle(0xa4cbdc); g.fillTriangle(x + 43, y - 33, x + 56, y - 66, x + 71, y - 33);
      g.fillStyle(0xd9f1f7); g.fillTriangle(x + 43, y - 33, x + 56, y - 66, x + 58, y - 33);
      g.fillStyle(0xeaf9fc); g.fillTriangle(x + 58, y - 34, x + 70, y - 54, x + 77, y - 34);
      g.lineStyle(2, 0xffffff); g.lineBetween(x - 63, y - 50, x - 63, y - 37);
      g.lineBetween(x - 69, y - 43, x - 57, y - 43); g.lineBetween(x - 67, y - 48, x - 59, y - 39);
      break;
    case 'terre':
      g.fillStyle(0x9a836a); g.fillEllipse(x - 57, y - 39, 43, 28);
      g.fillStyle(0xb29a76); g.fillEllipse(x - 59, y - 44, 38, 18);
      g.fillStyle(0x645b4e); g.fillEllipse(x - 57, y - 36, 22, 15);
      g.lineStyle(2, 0xd6c198); g.beginPath(); g.arc(x - 57, y - 37, 12, Math.PI, Math.PI * 2); g.strokePath();
      shrub(g, x + 66, y - 37, 0x829666);
      g.fillStyle(0xbeb5a1); g.fillEllipse(x + 63, y - 35, 20, 12);
      g.fillStyle(0xe0d3b8); g.fillEllipse(x + 61, y - 38, 13, 5);
      break;
    case 'feu':
      for (const dx of [-61, 61]) {
        g.fillStyle(0xa48378); g.fillEllipse(x + dx, y - 37, 30, 16);
        g.fillStyle(0xc09a87); g.fillEllipse(x + dx, y - 40, 26, 12);
        g.fillStyle(0xf7d69b); g.fillEllipse(x + dx, y - 47, 17, 17);
        g.fillStyle(0xeaa178); g.fillEllipse(x + dx, y - 49, 10, 11);
        g.fillStyle(0xffe8b8); g.fillCircle(x + dx - 2, y - 52, 3);
      }
      shrub(g, x - 67, y + 40, 0xb09b72); flower(g, x - 69, y + 31, 0xe3a086);
      break;
    case 'metal':
      for (const dx of [-70, 70]) {
        g.fillStyle(0x8696a4); g.fillRoundedRect(x + dx - 9, y - 54, 18, 22, 4);
        g.fillStyle(0xd9e3e6); g.fillRoundedRect(x + dx - 8, y - 57, 16, 19, 4);
        g.fillStyle(0x97a7b2); g.fillCircle(x + dx, y - 47, 4);
        g.fillStyle(0xf5f8eb); g.fillCircle(x + dx - 2, y - 50, 2);
      }
      g.fillStyle(0xabb9c0); g.fillRoundedRect(x + 49, y + 39, 23, 10, 3);
      g.lineStyle(2, 0xeaf1e9); g.lineBetween(x + 53, y + 39, x + 67, y + 39);
      break;
    case 'vol':
      g.lineStyle(3, 0x9aafbd); g.lineBetween(x - 64, y - 36, x - 64, y - 68);
      g.fillStyle(0xe6b4c5); g.fillTriangle(x - 63, y - 66, x - 39, y - 60, x - 63, y - 53);
      g.fillStyle(0xf7e4b8); g.fillTriangle(x - 63, y - 55, x - 46, y - 48, x - 63, y - 44);
      cloud(g, x + 61, y - 41); cloud(g, x - 65, y + 41);
      break;
  }
  // Low front rail leaves faces visible; tiny medallions indicate the level.
  g.lineStyle(5, palette.fence); g.lineBetween(x - 78, y + 54, x + 78, y + 54);
  g.lineStyle(2, 0xfff0d1, .75); g.lineBetween(x - 77, y + 51, x + 77, y + 51);
  for (const dx of [-79, 79]) {
    g.fillStyle(palette.fence); g.fillRoundedRect(x + dx - 4, y + 38, 8, 25, 3);
    g.fillStyle(0xf7e4bf); g.fillEllipse(x + dx, y + 38, 9, 4);
  }
  g.fillStyle(palette.fence); g.fillRoundedRect(x - 20, y + 49, 40, 12, 5);
  for (let n = 0; n < level; n++) { g.fillStyle(0xffe7a5); g.fillCircle(x + (n - (level - 1) / 2) * 10, y + 55, 3); }
}

function shrub(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
  g.fillStyle(color); g.fillEllipse(x, y, 25, 11); g.fillCircle(x - 6, y - 3, 7); g.fillCircle(x + 4, y - 5, 8);
  g.fillStyle(0xd0df9c, .4); g.fillEllipse(x - 5, y - 7, 10, 4);
}
function flower(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number): void {
  g.fillStyle(color); for (const [dx, dy] of [[-3, 0], [3, 0], [0, -3], [0, 3]]) g.fillCircle(x + dx, y + dy, 2.5);
  g.fillStyle(0xfff1c0); g.fillCircle(x, y, 2);
}
function wheat(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.lineStyle(2, 0xab985d); g.lineBetween(x, y + 4, x + 3, y - 16);
  g.fillStyle(0xf2d38b); for (let n = 0; n < 3; n++) { g.fillEllipse(x - 1 + n, y - 7 - n * 4, 6, 4); g.fillEllipse(x + 6 + n, y - 9 - n * 4, 6, 4); }
}
function cloud(g: Phaser.GameObjects.Graphics, x: number, y: number): void {
  g.fillStyle(0x9fbdc0, .25); g.fillEllipse(x + 2, y + 4, 34, 12);
  g.fillStyle(0xf5f8eb); g.fillEllipse(x, y, 34, 13); g.fillCircle(x - 7, y - 4, 8); g.fillCircle(x + 4, y - 6, 9);
}
