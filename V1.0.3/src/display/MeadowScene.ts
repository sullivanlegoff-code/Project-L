import Phaser from 'phaser';
import {VISUAL} from '../config/visual';
import type {GameController} from '../application/GameController';
import {BALANCE, HOUR} from '../config/balance';
import type {GameState} from '../state/types';
import {MeadowCamera, gridCell, gridPoint, type Point} from '../ui/gestures';
import {BUILDING_NAMES, type Placement} from '../ui/models';
import {COATS} from '../ui/portraits';
import {bindMeadowInput} from './meadowInput';

export type MeadowSelection = {kind: 'building' | 'rabbit' | 'income' | 'grass'; id: string} | {kind: 'cell'; x: number; y: number} | {kind: 'extension'} | {kind: 'empty'};
interface VisualRabbit {id: string; object: Phaser.GameObjects.Container; ears: Phaser.GameObjects.Ellipse[]; base: Point; phase: number; fedUntil: number}
export class MeadowScene extends Phaser.Scene {
  private current: GameState | null = null;
  private placement: Placement | null = null;
  private ground!: Phaser.GameObjects.Container;
  private animals!: Phaser.GameObjects.Container;
  private bubbles!: Phaser.GameObjects.Container;
  private grid!: Phaser.GameObjects.Graphics;
  private rabbitViews: VisualRabbit[] = [];
  private bubbleHits: {point: Point; selection: MeadowSelection}[] = [];
  private layoutKey = '';
  private unsubscribe: (() => void) | null = null;
  readonly view = new MeadowCamera();
  constructor(private controller: GameController, private select: (selection: MeadowSelection) => void, private blocked: () => boolean) { super('Meadow'); }
  create(): void {
    this.cameras.main.setBackgroundColor('#d4e6b9');
    this.ground = this.add.container(0, 0); this.animals = this.add.container(0, 0);
    this.grid = this.add.graphics().setDepth(1); this.bubbles = this.add.container(0, 0).setDepth(3);
    this.resize(); this.recenter();
    this.unsubscribe = this.controller.subscribe(snapshot => { this.current = snapshot.state; this.renderState(); });
    this.scale.on('resize', this.resize, this);
    const disposeInput = bindMeadowInput(this.game.canvas, this.view, point => this.tap(point), this.blocked, () => this.applyCamera());
    this.events.once('shutdown', () => { this.unsubscribe?.(); disposeInput(); this.scale.off('resize', this.resize, this); });
  }
  recenter(): void { if (!this.cameras?.main) return; this.view.recenter(); this.applyCamera(); }
  private resize(): void { this.view.resize(this.scale.width, this.scale.height); this.applyCamera(); }
  private applyCamera(): void { this.cameras.main.setZoom(this.view.zoom).centerOn(this.view.x, this.view.y); }
  setPlacement(placement: Placement | null): void { this.placement = placement; if (this.grid) this.drawGrid(); }
  reactToFeed(id: string): void {
    const rabbit = this.rabbitViews.find(r => r.id === id); if (!rabbit) return;
    rabbit.fedUntil = this.time.now + 900;
    const heart = this.add.text(rabbit.object.x, rabbit.object.y - 40, '♥', {fontSize: '28px', color: '#d9788d'}).setDepth(5).setOrigin(.5);
    this.tweens.add({targets: heart, y: heart.y - 45, alpha: 0, duration: 1000, onComplete: () => heart.destroy()});
  }
  private polygon(g: Phaser.GameObjects.Graphics, x: number, y: number, color: number, inset = 0): void {
    const points = [gridPoint(x, y), gridPoint(x + 1, y), gridPoint(x + 1, y + 1), gridPoint(x, y + 1)];
    const center = gridPoint(x + .5, y + .5);
    g.fillStyle(color, .96); g.fillPoints(points.map(p => ({x: p.x + (center.x - p.x) * inset, y: p.y + (center.y - p.y) * inset})), true);
  }
  private renderState(): void {
    const s = this.current;
    const key = JSON.stringify([s?.expanded, s?.buildings.map(b => [b.id, b.kind, b.x, b.y]), s?.rabbits.map(r => [r.id, r.species, r.enclosureId])]);
    if (key !== this.layoutKey) { this.layoutKey = key; this.drawGround(); this.drawAnimals(); }
    this.drawBubbles(); this.drawGrid();
  }
  private drawGround(): void {
    this.ground.removeAll(true);
    const g = this.add.graphics(); this.ground.add(g);
    const corners = [gridPoint(0, 0), gridPoint(6, 0), gridPoint(6, 2), gridPoint(0, 2)];
    g.fillStyle(0x97ad73); g.fillPoints(corners.map(p => ({x: p.x, y: p.y + 18})), true);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 6; x++) this.polygon(g, x, y, (x + y) % 2 ? 0xb3d690 : 0xb0d18b);
    // Deterministic decorative flowers; never use the gameplay random generator.
    for (let i = 0; i < 150; i++) {
      const p = gridPoint(((i * 71) % 587) / 100, ((i * 37) % 193) / 100);
      g.fillStyle(i % 3 === 0 ? 0xf2dc9c : i % 3 === 1 ? 0xe6a5b3 : 0xfff8dc); g.fillCircle(p.x, p.y, 2.3);
      g.lineStyle(1, 0x80a065); g.lineBetween(p.x, p.y + 2, p.x - 2, p.y + 6);
    }
    if (!this.current?.expanded) {
      for (let y = 0; y < 2; y++) for (let x = 3; x < 6; x++) {
        this.polygon(g, x, y, 0x95b579);
        for (let n = 0; n < 17; n++) {
          const p = gridPoint(x + ((n * 31) % 91) / 100 + .04, y + ((n * 43) % 89) / 100 + .05);
          g.lineStyle(3, n % 2 ? 0x789b60 : 0xa7c181); g.lineBetween(p.x, p.y, p.x - 4, p.y - 17); g.lineBetween(p.x, p.y, p.x + 6, p.y - 12);
        }
      }
      const p = gridPoint(4.4, .8);
      this.ground.add(this.add.text(p.x, p.y, 'Une prairie à explorer\nAgrandir · 500 pattes', {fontFamily: 'Arial', fontSize: '19px', align: 'center', color: '#354c32', backgroundColor: '#edf0d6', padding: {x: 14, y: 10}}).setOrigin(.5));
    }
    for (const b of this.current?.buildings ?? []) {
      const p = gridPoint(b.x + .5, b.y + .5), x = p.x, y = p.y;
      g.fillStyle(0x506b42, .13); g.fillEllipse(x + 5, y + 30, 150, 65);
      if (b.kind === 'enclosure') {
        g.fillStyle(0xc2dc9f); g.fillEllipse(x, y + 8, 145, 82);
        g.lineStyle(7, 0xb68b60); g.strokeRoundedRect(x - 72, y - 35, 144, 88, 16);
        g.lineStyle(3, 0xedd2a6); g.strokeRoundedRect(x - 72, y - 41, 144, 88, 16);
        for (const dx of [-70, -25, 25, 70]) { g.fillStyle(0x97724d); g.fillRoundedRect(x + dx - 4, y + 30, 8, 31, 2); }
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
        this.ground.add(this.add.text(x, y - 9, '♥', {fontSize: '27px', color: '#bc7681'}).setOrigin(.5));
      } else {
        g.lineStyle(7, 0xd9b98d); g.beginPath(); g.arc(x, y - 4, 52, Math.PI, Math.PI * 2); g.strokePath();
        g.fillStyle(0xbb926a); g.fillRoundedRect(x - 54, y, 108, 45, 18);
        g.fillStyle(0xf5debc); g.fillEllipse(x, y, 109, 41); g.fillStyle(0xacc8cf); g.fillEllipse(x + 3, y - 3, 85, 28);
        g.lineStyle(2, 0xe7c69d); for (let i = 0; i < 5; i++) g.lineBetween(x - 40 + i * 19, y + 13, x - 34 + i * 17, y + 35);
        this.ground.add(this.add.text(x + 30, y - 54, '✦', {fontSize: '24px', color: '#f4df93'}).setOrigin(.5));
      }
      this.ground.add(this.add.text(x, y + 67, BUILDING_NAMES[b.kind], {fontFamily: 'Arial', fontSize: '14px', color: '#435b38', backgroundColor: '#e4ebce', padding: {x: 6, y: 3}}).setOrigin(.5));
    }
  }
  private drawAnimals(): void {
    this.animals.removeAll(true); this.rabbitViews = [];
    for (const enclosure of this.current?.buildings.filter(b => b.kind === 'enclosure') ?? []) {
      const residents = this.current!.rabbits.filter(r => r.enclosureId === enclosure.id);
      const center = gridPoint(enclosure.x + .5, enclosure.y + .5);
      residents.forEach((rabbit, index) => {
        const offset = VISUAL.rabbit.offsets[index];
        const base = {x: center.x + offset.x, y: center.y + offset.y};
        const object = this.add.container(base.x, base.y).setScale(VISUAL.rabbit.scale);
        const coat = COATS[rabbit.species], color = Phaser.Display.Color.HexStringToColor(coat.body).color, patch = Phaser.Display.Color.HexStringToColor(coat.patch).color;
        const ears = coat.lop ? [this.add.ellipse(-19, -6, 10, 29, color), this.add.ellipse(19, -6, 10, 29, color)] :
          [this.add.ellipse(-7, -24, 8, 26, color), this.add.ellipse(7, -25, 8, 26, coat.frost ? patch : color)];
        if (coat.wings) {
          const wings = this.add.graphics(); wings.fillStyle(coat.plumage ? 0x86b9d0 : 0xfff9ee); wings.lineStyle(1.4, 0x8b9cb4);
          for (const side of [-1, 1]) {
            const points = [{x: 12, y: 0}, {x: 26, y: -17}, {x: 32, y: -11}, {x: 27, y: 6}, {x: 17, y: 9}].map(p => ({x: p.x * side, y: p.y}));
            wings.fillPoints(points, true); wings.strokePoints(points, true);
          }
          object.add(wings);
        }
        object.add([this.add.ellipse(0, 10, 35, 12, 0x6b7755, .16), ...ears,
          this.add.ellipse(0, 0, rabbit.species === 'neige' ? 36 : 33, 27, color), this.add.ellipse(8, 2, 13, 18, patch),
          this.add.circle(-6, -7, 2, 0x3e332b), this.add.circle(6, -7, 2, 0x3e332b), this.add.circle(0, 0, 2, 0xbc8990), this.add.circle(17, 5, 6, color)]);
        if (rabbit.species === 'brumelin') object.add(this.add.text(9, -24, '✦', {fontSize: '17px', color: '#ffffff'}));
        if (rabbit.species === 'mottelin') object.add(this.add.ellipse(15, -17, 10, 5, 0x819559));
        const details = this.add.graphics(); object.add(details);
        if (coat.flame) {
          details.fillStyle(0xda8469); details.fillPoints([{x: -6, y: -14}, {x: -7, y: -23}, {x: 0, y: -31}, {x: 1, y: -22}, {x: 6, y: -26}, {x: 7, y: -16}], true);
          details.fillStyle(0xffe1a3); details.fillTriangle(-3, -15, 0, -24, 4, -15);
        }
        if (coat.glasses) { details.lineStyle(2, 0x555b70); details.strokeCircle(-6, -7, 5); details.strokeCircle(6, -7, 5); details.lineBetween(-1, -7, 1, -7); details.lineBetween(-11, -8, -15, -10); details.lineBetween(11, -8, 15, -10); }
        if (coat.metal) { details.fillStyle(0xeef3f8); details.fillPoints([{x: 8, y: 7}, {x: 12, y: 3}, {x: 16, y: 7}, {x: 12, y: 11}], true); details.lineStyle(1, 0x6e7a91); details.lineBetween(8, 7, 12, 11); }
        if (coat.plumage) { details.fillStyle(0xedc87d); details.fillEllipse(-3, -17, 5, 14); details.fillStyle(0xd98e81); details.fillEllipse(3, -15, 5, 12); }
        if (coat.frost) { details.lineStyle(1.5, 0xeafdff); details.lineBetween(10, -19, 18, -19); details.lineBetween(14, -23, 14, -15); }
        this.animals.add(object); this.rabbitViews.push({id: rabbit.id, object, ears, base, phase: index * 2 + Number(rabbit.id.split('-')[1]), fedUntil: 0});
      });
    }
  }
  private drawBubbles(): void {
    this.bubbles.removeAll(true); this.bubbleHits = [];
    for (const b of this.current?.buildings ?? []) {
      const now = this.current!.lastSimulatedAt;
      const amount = Math.floor(b.incomeUnits / HOUR);
      let text = '', kind: 'income' | 'grass' | 'building' = 'building';
      if (b.kind === 'enclosure' && amount >= 1) { text = `${amount} p`; kind = 'income'; }
      if (b.kind === 'farm' && b.order && b.order.endsAt <= now) { text = 'Herbe ✓'; kind = 'grass'; }
      if (b.kind === 'nursery' && b.baby && b.baby.readyAt <= now) text = 'Prêt !';
      if (!text) continue;
      const p = gridPoint(b.x + .5, b.y + .5); p.y -= 72;
      const bubble = this.add.text(p.x, p.y, text, {fontFamily: 'Arial', fontSize: '17px', color: '#3b4d2d', backgroundColor: amount >= BALANCE.enclosureCap ? '#f0c889' : '#fff7dc', padding: {x: 13, y: 10}}).setOrigin(.5);
      this.bubbles.add(bubble); this.bubbleHits.push({point: p, selection: {kind, id: b.id}});
    }
  }
  private drawGrid(): void {
    this.grid.clear(); if (!this.placement) return;
    for (let y = 0; y < 2; y++) for (let x = 0; x < 6; x++) {
      const locked = !this.current?.expanded && x >= 3;
      const occupied = this.current?.buildings.some(b => b.id !== this.placement!.movingId && b.x === x && b.y === y);
      const valid = !locked && !occupied;
      const center = gridPoint(x + .5, y + .5), points = [gridPoint(x, y), gridPoint(x + 1, y), gridPoint(x + 1, y + 1), gridPoint(x, y + 1)];
      this.grid.lineStyle(3, valid ? 0x487b5c : 0xa66e61, .9); this.grid.strokePoints(points, true);
      this.grid.lineStyle(4, valid ? 0x396447 : 0x8d4f45);
      if (valid) { this.grid.lineBetween(center.x - 10, center.y, center.x - 2, center.y + 9); this.grid.lineBetween(center.x - 2, center.y + 9, center.x + 13, center.y - 10); }
      else { this.grid.lineBetween(center.x - 8, center.y - 8, center.x + 8, center.y + 8); this.grid.lineBetween(center.x + 8, center.y - 8, center.x - 8, center.y + 8); }
      if (this.placement.cell?.x === x && this.placement.cell.y === y) {
        this.grid.fillStyle(valid ? 0xefffd4 : 0xf4b9ac, .55); this.grid.fillPoints(points, true);
        this.grid.lineStyle(5, 0xfffcde); this.grid.strokePoints(points, true);
        // A compact silhouette is the provisional footprint preview.
        this.grid.fillStyle(valid ? 0x769b69 : 0xad7e73, .65); this.grid.fillRoundedRect(center.x - 35, center.y - 30, 70, 45, 12);
      }
    }
  }
  private tap(screen: Point): void {
    const world = this.view.world(screen), cell = gridCell(world);
    if (this.placement) { this.select({kind: 'cell', ...cell}); return; }
    for (const bubble of this.bubbleHits) { const p = this.view.screen(bubble.point); if (Math.abs(p.x - screen.x) < 39 && Math.abs(p.y - screen.y) < 25) { this.select(bubble.selection); return; } }
    const closest = this.rabbitViews.map(r => ({r, p: this.view.screen({x: r.object.x, y: r.object.y - 7 * VISUAL.rabbit.scale})})).sort((a, b) => Math.hypot(a.p.x - screen.x, a.p.y - screen.y) - Math.hypot(b.p.x - screen.x, b.p.y - screen.y))[0];
    if (closest && Math.hypot(closest.p.x - screen.x, closest.p.y - screen.y) < VISUAL.rabbit.hitRadius) { this.select({kind: 'rabbit', id: closest.r.id}); return; }
    if (!this.current?.expanded && cell.x >= 3 && cell.x < 6 && cell.y >= 0 && cell.y < 2) { this.select({kind: 'extension'}); return; }
    const building = this.current?.buildings.find(b => b.x === cell.x && b.y === cell.y);
    this.select(building ? {kind: 'building', id: building.id} : {kind: 'empty'});
  }
  update(time: number): void {
    for (const rabbit of this.rabbitViews) {
      const t = time / 1000 + rabbit.phase;
      rabbit.object.x = rabbit.base.x + Math.sin(t * .5) * 7;
      rabbit.object.y = rabbit.base.y + Math.sin(t * .65) * 3 - (rabbit.fedUntil > time ? Math.abs(Math.sin(t * 14)) * 7 : 0);
      rabbit.ears.forEach((ear, index) => { ear.rotation = Math.sin(t * 1.4 + index) * .13; });
    }
  }
}
