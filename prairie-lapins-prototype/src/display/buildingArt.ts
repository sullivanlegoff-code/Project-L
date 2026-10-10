import type Phaser from 'phaser';
import type {Building} from '../state/types';
import {drawHabitat} from './habitatArt';
/** Existing artwork, cached independently from parcel terrain; no crop at borders. */
export function drawBuildingArt(g: Phaser.GameObjects.Graphics, x: number, y: number, b: Pick<Building, 'kind' | 'habitat'>): void {
      g.fillStyle(0x506b42, .13); g.fillEllipse(x + 5, y + 30, 150, 65);
      if (b.kind === 'enclosure') {
        drawHabitat(g, x, y, b.habitat?.type ?? 'universal', b.habitat?.level ?? 1);
      } else if (b.kind === 'farm') {
        g.fillStyle(0xb88d68); g.fillRoundedRect(x - 62, y - 27, 124, 77, 10);
        for (let row = 0; row < 3; row++) for (let col = 0; col < 5; col++) {
          const px = x - 45 + col * 23, py = y - 13 + row * 23;
          g.lineStyle(2, 0x89634e); g.lineBetween(px - 7, py + 10, px + 8, py + 10);
          g.fillStyle(0x60994f); g.fillEllipse(px - 3, py, 10, 18); g.fillEllipse(px + 5, py + 2, 15, 8);
        }
        g.fillStyle(0xe8c7a0); g.fillRect(x + 49, y - 51, 5, 38); g.fillRoundedRect(x + 30, y - 62, 45, 21, 4);
      } else if (b.kind === 'nest') {
        g.fillStyle(0xc7a574); g.fillEllipse(x, y + 10, 132, 82); g.fillStyle(0xe7cf98); g.fillEllipse(x, y, 122, 74);
        g.fillStyle(0xe4adad); g.fillEllipse(x, y - 1, 82, 48);
        g.lineStyle(3, 0xb79260); for (let i = 0; i < 12; i++) { const angle = i / 12 * Math.PI * 2; const px = x + Math.cos(angle) * 51, py = y + Math.sin(angle) * 29; g.lineBetween(px - 6, py - 3, px + 9, py + 5); }
      } else {
        g.lineStyle(7, 0xd9b98d); g.beginPath(); g.arc(x, y - 4, 52, Math.PI, Math.PI * 2); g.strokePath();
        g.fillStyle(0xbb926a); g.fillRoundedRect(x - 54, y, 108, 45, 18);
        g.fillStyle(0xf5debc); g.fillEllipse(x, y, 109, 41); g.fillStyle(0xacc8cf); g.fillEllipse(x + 3, y - 3, 85, 28);
        g.lineStyle(2, 0xe7c69d); for (let i = 0; i < 5; i++) g.lineBetween(x - 40 + i * 19, y + 13, x - 34 + i * 17, y + 35);
      }
}
