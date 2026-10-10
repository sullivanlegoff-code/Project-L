import {nestForParent} from '../simulation/breeding';
import {RABBIT_ART, rabbitArt, type RabbitArt} from '../config/rabbitArt';
import Phaser from 'phaser';
import {VISUAL} from '../config/visual';
import type {GameController} from '../application/GameController';
import {drawBuildingArt} from './buildingArt';
import {buildingAt, buildingPlacementReason, footprintPlacementReason} from '../simulation/placement';
import {drawParcelTerrain} from './parcelArt';
import {PARCELS, PARCEL_IDS, parcelAt, type ParcelId} from '../config/land';
import {rabbitOffset, rabbitPosition, rabbitHitPoint, rabbitHit} from './rabbitLayout';
import {habitatStats, habitatName, visibleColumns} from '../simulation/habitats';
import {HOUR} from '../config/balance';
import type {Building, DecorationLocation, GameState} from '../state/types';
import {DECORATIONS, DECORATION_IDS, FINE_GRID} from '../config/decorations';
import {decorationPlacementReason, footprint} from '../simulation/decorations';
import {decorationSvg, decorationTexture, decorationScale} from './decorationArt';
import {MeadowCamera, gridCell, fineCell, finePoint, buildingCenter, gridPoint, type Point} from '../ui/gestures';
import {BUILDING_NAMES, type Placement} from '../ui/models';
import {COATS} from '../ui/portraits';
import {bindMeadowInput} from './meadowInput';

export type MeadowSelection = {kind: 'building' | 'rabbit' | 'income' | 'grass' | 'decoration'; id: string} | {kind: 'cell' | 'fineCell'; x: number; y: number} | {kind: 'extension'; parcelId?: ParcelId} | {kind: 'empty'};
export interface DecorationGhost {id: string; location: DecorationLocation | null}
interface VisualRabbit {id: string; object: Phaser.GameObjects.Container; ears: Phaser.GameObjects.Ellipse[]; sprite?: Phaser.GameObjects.Image; art?: RabbitArt; base: Point; phase: number; fedUntil: number}
export class MeadowScene extends Phaser.Scene {
  private current: GameState | null = null;
  private placement: Placement | null = null;
  private ground!: Phaser.GameObjects.Container;
  private animals!: Phaser.GameObjects.Container;
  private bubbles!: Phaser.GameObjects.Container;
  private labels!: Phaser.GameObjects.Container;
  private buildingNames: Phaser.GameObjects.Container | null = null;
  private grid!: Phaser.GameObjects.Graphics;
  private rabbitViews: VisualRabbit[] = [];
  private bubbleHits: {point: Point; width: number; height: number; selection: MeadowSelection}[] = [];
  private layoutKey = '';
  private buildingsLayer!: Phaser.GameObjects.Container;
  private buildingViews = new Map<string, Phaser.GameObjects.Image>();
  private buildingTextures = new Set<string>();
  private buildingGhost: Phaser.GameObjects.Image | null = null;
  private readonly groundTexture = 'meadow-static-ground';
  private arrangement = false;
  private ghost: DecorationGhost | null = null;
  private photo = false;
  private expanding = false;
  private expansionParcelId: ParcelId | undefined;
  private groundTextures: string[] = [];
  private groundSignatures = new Map<string,string>();
  private decorationViews = new Map<string, Phaser.GameObjects.Image>();
  private ghostView: Phaser.GameObjects.Image | null = null;
  private decorationsLayer!: Phaser.GameObjects.Container;
  private selectedDecorationId: string | null = null;
  private decorationSelection!: Phaser.GameObjects.Graphics;
  private decorationPixels = new Map<string, Uint8ClampedArray>();
  private unsubscribe: (() => void) | null = null;
  readonly view = new MeadowCamera();
  constructor(private controller: GameController, private select: (selection: MeadowSelection) => void, private blocked: () => boolean) { super('Meadow'); }
  preload(): void {
    for (const art of RABBIT_ART) if (!this.textures.exists(art.texture)) this.load.image(art.texture, art.url);
    for (const id of DECORATION_IDS) for (const rotation of (DECORATIONS[id].rotates ? [0, 1] : [0]) as (0 | 1)[]) {
      const key = decorationTexture(id, rotation);
      if (!this.textures.exists(key)) this.load.svg(key, 'data:image/svg+xml;base64,' + btoa(decorationSvg(id, rotation)), {width: 120, height: 120});
    }
  }
  create(): void {
    this.cameras.main.setBackgroundColor('#91d3ce');
    this.ground = this.add.container(0, 0); this.buildingsLayer = this.add.container(0, 0).setDepth(.1); this.animals = this.add.container(0, 0).setDepth(2);
    this.decorationsLayer = this.add.container(0, 0).setDepth(.5);
    this.decorationSelection = this.add.graphics().setDepth(.9);
    this.labels = this.add.container(0, 0).setDepth(2.5);
    this.grid = this.add.graphics().setDepth(1); this.bubbles = this.add.container(0, 0).setDepth(3);
    this.resize(); this.recenter();
    this.unsubscribe = this.controller.subscribe(snapshot => { this.current = snapshot.state; this.renderState(); });
    this.scale.on('resize', this.resize, this);
    const disposeInput = bindMeadowInput(this.game.canvas, this.view, point => this.tap(point), this.blocked, () => this.applyCamera());
    this.events.once('shutdown', () => { this.unsubscribe?.(); disposeInput(); this.scale.off('resize', this.resize, this); this.groundTextures.forEach(key => this.textures.remove(key)); this.buildingTextures.forEach(key=>this.textures.remove(key)); });
  }
  recenter(): void { if (!this.cameras?.main) return; this.view.setInsets(null); this.view.recenter(); this.applyCamera(); }
  private framingInsets() {
    const pad=VISUAL.camera.overviewPadding, panel=document.getElementById('game-panel'), hud=document.getElementById('hud');
    const rect=panel && !panel.hidden ? panel.getBoundingClientRect() : null;
    const footer=document.getElementById('dev-badge');
    const bottom=footer && getComputedStyle(footer).display!=='none' ? this.scale.height-footer.getBoundingClientRect().top+pad : pad;
    return {left:pad,right:rect ? this.scale.width-rect.left+pad : pad,top:(hud?.getBoundingClientRect().bottom ?? 0)+pad,bottom};
  }
  overview(): void {
    if (!this.current || !this.cameras?.main) return;
    const ids=this.expanding ? PARCEL_IDS : this.current.acquiredParcels;
    const parcels=ids.map(id=>PARCELS[id]);
    this.view.setInsets(this.framingInsets());
    this.view.overview({left:gridPoint(Math.min(...parcels.map(p=>p.x)),0).x,right:gridPoint(Math.max(...parcels.map(p=>p.x+3)),0).x,
      top:gridPoint(0,Math.min(...parcels.map(p=>p.y))).y,bottom:gridPoint(0,Math.max(...parcels.map(p=>p.y+3))).y});
    this.applyCamera();
  }
  private updateDetails(): void {
    const fade=(low:number,high:number)=>Phaser.Math.Clamp((this.view.zoom-low)/(high-low),0,1);
    this.buildingNames?.setAlpha(fade(.55,.85));
    this.bubbles?.setAlpha(fade(.45,.7)).setVisible(!this.photo && this.view.zoom>.45);
  }
  private resize(): void { this.view.setInsets(this.framingInsets()); this.view.resize(this.scale.width, this.scale.height); this.applyCamera(); }
  private applyCamera(): void { this.cameras.main.setZoom(this.view.zoom).centerOn(this.view.x, this.view.y); this.drawDecorationSelection(); this.updateDetails(); }
  setExpansion(active:boolean, parcelId?:ParcelId):void {
    const was=this.expanding;this.expanding=active;this.expansionParcelId=active?parcelId:undefined;
    if(active&&!was)this.overview();
    else if(parcelId){const p=PARCELS[parcelId],point=gridPoint(p.x+1.5,p.y+1.5);this.view.x=point.x;this.view.y=point.y;this.view.clamp();this.applyCamera();}
    else if(was&&!active)this.recenter();
    if(this.grid)this.drawGrid();
  }
  setPlacement(placement: Placement | null): void { this.placement = placement; if (this.grid) this.drawGrid(); }
  setArrangement(active: boolean, ghost: DecorationGhost | null = null): void {
    this.arrangement = active; this.ghost = ghost;
    if (this.grid) { this.drawDecorations(); this.drawGrid(); this.drawGhost(); }
  }
  focusDecoration(id: string): void {
    const d=this.current?.decorations.find(d=>d.id===id);if(!d)return;
    const p=this.decorationPoint(d.location,d.catalogId);if(!p)return;
    this.view.x=p.x+this.view.width*.15/this.view.zoom;this.view.y=p.y;this.view.clamp();this.applyCamera();
  }
  setDecorationSelection(id: string | null): void {
    this.selectedDecorationId = id; this.drawDecorationSelection();
  }
  private drawDecorationSelection(): void {
    if (!this.decorationSelection) return;
    this.decorationSelection.clear();
    const image = this.selectedDecorationId ? this.decorationViews.get(this.selectedDecorationId) : null;
    this.decorationSelection.setVisible(!!image && !this.photo);
    if (!image) return;
    const r = image.getBounds(), pad = 5 / this.view.zoom;
    this.decorationSelection.lineStyle(3 / this.view.zoom, 0xd19b39, 1);
    this.decorationSelection.strokeRoundedRect(r.x - pad, r.y - pad, r.width + 2 * pad, r.height + 2 * pad, 8);
  }
  /** Hit the drawn silhouette, including tall portions above the logical footprint.
   * Raster masks are cached per texture; only a tap samples pixels, never each frame. */
  private decorationAt(screen: Point): string | null {
    const world = this.view.world(screen), pad = Math.min(4 / this.view.zoom, 5);
    const images = [...this.decorationViews.entries()].reverse().sort((a, b) => b[1].depth - a[1].depth);
    for (const [id, image] of images) {
      const bounds = image.getBounds();
      if (world.x < bounds.left - pad || world.x > bounds.right + pad || world.y < bounds.top - pad || world.y > bounds.bottom + pad) continue;
      let pixels = this.decorationPixels.get(image.texture.key);
      const width = image.frame.realWidth, height = image.frame.realHeight;
      if (!pixels) {
        const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
        const context = canvas.getContext('2d', {willReadFrequently: true});
        if (!context) continue;
        context.drawImage(image.texture.getSourceImage() as CanvasImageSource, 0, 0, width, height);
        pixels = context.getImageData(0, 0, width, height).data;
        this.decorationPixels.set(image.texture.key, pixels);
      }
      const matrix = image.getWorldTransformMatrix();
      for (const [dx, dy] of [[0, 0], [-pad, 0], [pad, 0], [0, -pad], [0, pad], [-pad, -pad], [-pad, pad], [pad, -pad], [pad, pad]]) {
        const local = matrix.applyInverse(world.x + dx, world.y + dy);
        const x = Math.floor(local.x + image.displayOriginX), y = Math.floor(local.y + image.displayOriginY);
        // Transparent margins and faint ground shadows do not capture empty-space taps.
        if (x >= 0 && y >= 0 && x < width && y < height && pixels[(y * width + x) * 4 + 3] > 48) return id;
      }
    }
    return null;
  }
  setPhoto(active: boolean): void {
    this.photo = active;
    this.drawDecorationSelection();
    this.bubbles?.setVisible(!active); this.grid?.setVisible(!active); this.ghostView?.setVisible(!active); this.buildingGhost?.setVisible(!active && !!this.placement?.cell); this.updateDetails();
  }
  reactToFeed(id: string): void {
    const rabbit = this.rabbitViews.find(r => r.id === id); if (!rabbit) return;
    rabbit.fedUntil = this.time.now + 900;
    const heart = this.add.text(rabbit.object.x, rabbit.object.y - 40, '♥', {fontSize: '28px', color: '#d9788d'}).setDepth(5).setOrigin(.5);
    this.tweens.add({targets: heart, y: heart.y - 45, alpha: 0, duration: 1000, onComplete: () => heart.destroy()});
  }
  private renderState(): void {
    const s = this.current;
    if (s) { this.view.setColumns(visibleColumns(s)); this.applyCamera(); }
    const key = JSON.stringify([s?.acquiredParcels, s?.buildings.map(b => [b.id, b.kind, b.x, b.y, b.habitat, b.breeding?.parents]), s?.rabbits.map(r => [r.id, r.species, r.enclosureId])]);
    if (key !== this.layoutKey) { this.layoutKey = key; this.drawGround(); this.drawBuildings(); this.drawAnimals(); }
    this.drawDecorations(); this.drawBubbles(); this.drawGrid(); this.drawGhost(); this.updateDetails();
  }
  private decorationPoint(location: DecorationLocation, catalogId: typeof DECORATION_IDS[number]): Point | null {
    if (location.kind === 'inventory') return null;
    if (location.kind === 'outside') {
      const size = footprint(catalogId, location.rotation);
      return gridPoint((location.x + size.width / 2) / FINE_GRID, (location.y + size.height / 2) / FINE_GRID);
    }
    return null;
  }
  private drawDecorations(): void {
    const visible = new Set<string>();
    for (const d of this.current?.decorations ?? []) {
      const point = this.decorationPoint(d.location, d.catalogId); if (!point) continue;
      visible.add(d.id);
      let image = this.decorationViews.get(d.id);
      if (!image) { image = this.add.image(0, 0, decorationTexture(d.catalogId)); this.decorationsLayer.add(image); this.decorationViews.set(d.id, image); }
      image.setTexture(decorationTexture(d.catalogId, d.location.kind === 'outside' ? d.location.rotation : 0));
      const scale = decorationScale(d.catalogId);
      image.setPosition(point.x, point.y).setOrigin(.5, .87).setScale(scale).setDepth(point.y)
        .setAlpha(this.ghost?.id === d.id ? .35 : 1);
    }
    for (const [id, image] of this.decorationViews) if (!visible.has(id)) { image.destroy(); this.decorationViews.delete(id); }
    this.decorationsLayer.sort('depth'); this.drawDecorationSelection();
  }
  private drawGhost(): void {
    const d = this.current?.decorations.find(d => d.id === this.ghost?.id);
    const point = d && this.ghost?.location ? this.decorationPoint(this.ghost.location, d.catalogId) : null;
    if (!d || !point || !this.ghost?.location) { this.ghostView?.setVisible(false); return; }
    if (!this.ghostView) this.ghostView = this.add.image(0, 0, decorationTexture(d.catalogId)).setDepth(1.5).setAlpha(.65).setOrigin(.5, .87);
    const rotation = this.ghost.location.kind === 'outside' ? this.ghost.location.rotation : 0;
    this.ghostView.setTexture(decorationTexture(d.catalogId, rotation)).setPosition(point.x, point.y)
      .setScale(decorationScale(d.catalogId))
      .setTint(decorationPlacementReason(this.current!, d.id, this.ghost.location) ? 0xf3a6a1 : 0xe4ffb5).setVisible(!this.photo);
  }
  private drawGround(): void {
    this.ground.removeAll(true);
    for (const key of [...this.groundTextures]) if (!this.current?.acquiredParcels.some(id => key === this.groundTexture+':'+id)) { this.textures.remove(key); this.groundSignatures.delete(key); this.groundTextures=this.groundTextures.filter(k=>k!==key); }
    if (!this.current) return;
    for (const id of this.current.acquiredParcels) {
    const parcel=PARCELS[id], px=VISUAL.grid.originX+parcel.x*VISUAL.grid.width, py=VISUAL.grid.originY+parcel.y*VISUAL.grid.depth, pad=90;
    const g=this.add.graphics();
    const w=3*VISUAL.grid.width+2*pad,h=3*VISUAL.grid.depth+2*pad;
    const renderer=this.game.renderer;
    const limit=renderer instanceof Phaser.Renderer.WebGL.WebGLRenderer ? renderer.gl.getParameter(renderer.gl.MAX_TEXTURE_SIZE) as number : 4096;
    const resolution=Math.min(2,limit/Math.max(w,h));
    g.scaleCanvas(resolution,resolution);g.translateCanvas(pad-px,pad-py);
    const key=this.groundTexture+':'+id;
    const signature=JSON.stringify([this.current.acquiredParcels.filter(other=>{const q=PARCELS[other];return Math.abs(q.x-parcel.x)+Math.abs(q.y-parcel.y)<=3;})]);
    const changed=this.groundSignatures.get(key)!==signature;
    if(changed) drawParcelTerrain(g,id,this.current);
    if(changed){if(this.textures.exists(key))this.textures.remove(key);g.generateTexture(key, Math.ceil(w * resolution), Math.ceil(h * resolution));this.groundSignatures.set(key,signature);if(!this.groundTextures.includes(key))this.groundTextures.push(key);}
    this.ground.addAt(this.add.image(px-pad,py-pad,key).setOrigin(0).setScale(1/resolution),0);g.destroy();
    }
  }
  private buildingTexture(b: Pick<Building, 'kind' | 'habitat'>): string {
    const key = `meadow-building-${b.kind}-${b.habitat?.type ?? 'none'}-${b.habitat?.level ?? 0}`;
    if (!this.textures.exists(key)) {
      const g = this.add.graphics();g.scaleCanvas(2,2);drawBuildingArt(g,128,128,b);
      g.generateTexture(key,512,512);g.destroy();this.buildingTextures.add(key);
    }
    return key;
  }
  private drawBuildings(): void {
    this.labels.removeAll(true);
    this.buildingNames=this.add.container(0,0);this.labels.add(this.buildingNames);
    const present = new Set<string>();
    for (const b of this.current?.buildings ?? []) {
      present.add(b.id);const p=buildingCenter(b),x=p.x,y=p.y;
      let image=this.buildingViews.get(b.id);
      if(!image){image=this.add.image(x,y,this.buildingTexture(b));this.buildingsLayer.add(image);this.buildingViews.set(b.id,image);}
      image.setTexture(this.buildingTexture(b)).setPosition(x,y).setScale(.5).setDepth(y);
      if(b.kind==='nest')this.labels.add(this.add.text(x,y-9,'♥',{fontSize:'27px',color:'#bc7681'}).setOrigin(.5));
      if(b.kind==='nursery')this.labels.add(this.add.text(x+30,y-54,'✦',{fontSize:'24px',color:'#f4df93'}).setOrigin(.5));
      const label=this.add.text(x,y+70,b.kind==='enclosure'?habitatName(b):BUILDING_NAMES[b.kind],{fontFamily:'Arial',fontSize:'13px',color:'#435b38',padding:{x:7,y:3}}).setOrigin(.5);
      const background=this.add.graphics();background.fillStyle(0xf8f4de,.96);background.fillRoundedRect(x-label.width/2,y+70-label.height/2,label.width,label.height,7);
      this.buildingNames.add([background,label]);
    }
    for(const [id,image] of this.buildingViews)if(!present.has(id)){image.destroy();this.buildingViews.delete(id);}
    this.buildingsLayer.sort('depth');
  }
  private drawAnimals(): void {
    this.animals.removeAll(true); this.rabbitViews = [];
    for (const enclosure of this.current?.buildings.filter(b => b.kind === 'enclosure' || b.kind==='nest' && b.breeding) ?? []) {
      const residents = enclosure.kind==='nest' ? enclosure.breeding!.parents.flatMap(id=>this.current!.rabbits.filter(r=>r.id===id)) : this.current!.rabbits.filter(r => r.enclosureId === enclosure.id);
      const center = buildingCenter(enclosure);
      residents.forEach((rabbit, index) => {
        if(enclosure.kind==='enclosure' && nestForParent(this.current!,rabbit.id)) return;
        const offset = rabbitOffset(index, residents.length);
        const base = {x: center.x + offset.x, y: center.y + offset.y};
        const object = this.add.container(base.x, base.y).setScale(VISUAL.rabbit.scale).setDepth(base.y);
        const art = rabbitArt(rabbit.species);
        if (art) {
          const sprite = this.add.image(0, art.groundY, art.texture).setOrigin(.5, 1);
          sprite.setScale(art.worldWidth / art.width); // Uniform scale preserves the original proportions.
          object.add([this.add.ellipse(0, 10, 35, 12, 0x6b7755, .16), sprite]);
          this.animals.add(object);
          this.rabbitViews.push({id: rabbit.id, object, ears: [], sprite, art, base,
            phase: index * 2 + Number(rabbit.id.split('-')[1]), fedUntil: 0});
          return;
        }
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
          this.add.ellipse(0, 0, 33, 27, color), this.add.ellipse(8, 2, 13, 18, patch),
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
      if (b.kind==='nest' && b.breeding && b.breeding.endsAt<=now) text='Envoyer';
      if (b.kind === 'nursery' && b.baby && b.baby.readyAt <= now) text = 'Prêt !';
      if (!text) continue;
      const p = buildingCenter(b); p.y -= 72;
      const bubble = this.add.text(p.x, p.y, text, {fontFamily: 'Arial', fontSize: '17px', color: '#3b4d2d', backgroundColor: b.kind === 'enclosure' && amount >= habitatStats(b).cap ? '#f0c889' : '#fff7dc', padding: {x: 13, y: 10}}).setOrigin(.5);
      this.bubbles.add(bubble); this.bubbleHits.push({point: p, width:bubble.width, height:bubble.height, selection: {kind, id: b.id}});
    }
  }
  private drawGrid(): void {
    this.grid.clear(); this.buildingGhost?.setVisible(false);
    if (this.expanding && this.current) {
      for (const id of PARCEL_IDS.filter(id => !this.current!.acquiredParcels.includes(id))) {
        const parcel = PARCELS[id], point = gridPoint(parcel.x, parcel.y);
        const width = 3 * VISUAL.grid.width, height = 3 * VISUAL.grid.depth;
        const selected = this.expansionParcelId === id;
        if (selected) {this.grid.fillStyle(0xd8df96, .35); this.grid.fillRoundedRect(point.x + 3, point.y + 3, width - 6, height - 6, 10);}
        this.grid.lineStyle(selected ? 4 : 2, selected ? 0xf4d58b : 0xe5f3df, .8);
        this.grid.strokeRoundedRect(point.x + 3, point.y + 3, width - 6, height - 6, 10);
        const x = point.x + width / 2, y = point.y + height / 2;
        this.grid.fillStyle(0xeef5d3, .85); this.grid.fillCircle(x, y, 17);
        this.grid.lineStyle(2, 0x577951); this.grid.lineBetween(x - 7, y, x + 7, y); this.grid.lineBetween(x, y - 7, x, y + 7);
      }
      return;
    }
    if(this.placement){this.drawBuildingGrid();return;}
    if(this.arrangement)this.drawDecorationGrid();
  }
  private drawBuildingGrid(): void {
    if(!this.current || !this.placement)return;
    const p=this.placement;
    for(let y=0;y<36;y++)for(let x=0;x<36;x++){
      const point=finePoint(x,y),reason=buildingPlacementReason(this.current,x,y,p.movingId);
      this.grid.lineStyle(1,reason?0xa37872:0x5b8864,.45);this.grid.strokeRect(point.x,point.y,VISUAL.grid.width/FINE_GRID,VISUAL.grid.depth/FINE_GRID);
    }
    if(!p.cell)return;
    const valid=!buildingPlacementReason(this.current,p.cell.x,p.cell.y,p.movingId),corner=finePoint(p.cell.x,p.cell.y),center=buildingCenter(p.cell);
    this.grid.fillStyle(valid?0xe5ffd2:0xf5b7b1,.3);this.grid.fillRect(corner.x,corner.y,VISUAL.grid.width,VISUAL.grid.depth);
    this.grid.lineStyle(3,valid?0x396447:0xa54242);this.grid.strokeRect(corner.x,corner.y,VISUAL.grid.width,VISUAL.grid.depth);
    const moving=this.current.buildings.find(b=>b.id===p.movingId);
    const habitat=p.kind==='enclosure'?(moving?.habitat??{type:p.habitatType??'universal',level:1 as const}):null;
    if(!this.buildingGhost)this.buildingGhost=this.add.image(0,0,this.buildingTexture({kind:p.kind,habitat})).setDepth(1.5).setAlpha(.55).setScale(.5);
    this.buildingGhost.setTexture(this.buildingTexture({kind:p.kind,habitat})).setPosition(center.x,center.y).setTint(valid?0xe4ffb5:0xf3a6a1).setVisible(!this.photo);
  }
  private drawDecorationGrid(): void {
    if (!this.current) return;
    const owned = this.current.decorations.find(d => d.id === this.ghost?.id);
    {
      for (let y = 0; y < 36; y++) for (let x = 0; x < 36; x++) {
        const location = {kind: 'outside' as const, x, y, rotation: this.ghost?.location?.kind === 'outside' ? this.ghost.location.rotation : 0 as const};
        const reason = owned ? decorationPlacementReason(this.current, owned.id, location) :
          footprintPlacementReason(this.current,{x,y,width:1,height:1});
        const p = gridPoint(x / 4, y / 4);
        this.grid.lineStyle(1, reason ? 0xa37872 : 0x5b8864, .45); this.grid.strokeRect(p.x, p.y, VISUAL.grid.width / 4, VISUAL.grid.depth / 4);
      }
    }
    if (!this.ghost?.location || !owned || this.ghost.location.kind === 'inventory') return;
    const valid = !decorationPlacementReason(this.current, owned.id, this.ghost.location);
    const p = this.decorationPoint(this.ghost.location, owned.catalogId)!;
    this.grid.lineStyle(3, valid ? 0x396447 : 0xa54242);
    if (this.ghost.location.kind === 'outside') {
      const loc = this.ghost.location, size = footprint(owned.catalogId, loc.rotation), corner = gridPoint(loc.x / 4, loc.y / 4);
      this.grid.fillStyle(valid ? 0xe5ffd2 : 0xf5b7b1, .6); this.grid.fillRect(corner.x, corner.y, size.width * VISUAL.grid.width / 4, size.height * VISUAL.grid.depth / 4);
      this.grid.strokeRect(corner.x, corner.y, size.width * VISUAL.grid.width / 4, size.height * VISUAL.grid.depth / 4);
    }
    if (valid) { this.grid.lineBetween(p.x - 8, p.y + 5, p.x - 2, p.y + 11); this.grid.lineBetween(p.x - 2, p.y + 11, p.x + 10, p.y - 3); }
    else { this.grid.lineBetween(p.x - 8, p.y - 8, p.x + 8, p.y + 8); this.grid.lineBetween(p.x - 8, p.y + 8, p.x + 8, p.y - 8); }
  }
  private tap(screen: Point): void {
    const world = this.view.world(screen), cell = gridCell(world);
    if (this.photo) return;
    for (const bubble of this.bubbles.visible && this.bubbles.alpha>=.65 ? this.bubbleHits : []) { const p = this.view.screen(bubble.point); if (Math.abs(p.x - screen.x) < Math.min(39,bubble.width*this.view.zoom/2+3) && Math.abs(p.y - screen.y) < Math.min(25,bubble.height*this.view.zoom/2+3)) { this.select(bubble.selection); return; } }
    if (this.expanding) {const id=parcelAt(cell.x,cell.y);if(id && !this.current?.acquiredParcels.includes(id))this.select({kind:'extension',parcelId:id});return;}
    if (this.placement) {this.select({kind:'fineCell',...fineCell(world)});return;}
    if (this.arrangement) {
      const chosen = this.current?.decorations.find(d => d.id === this.ghost?.id);
      if (!chosen) {
        const decorationId = this.decorationAt(screen);
        if (decorationId) { this.select({kind: 'decoration', id: decorationId}); return; }
      }
      if (chosen) {
        this.select({kind: 'fineCell', ...fineCell(world)}); return;
      }
      const decorationId = this.decorationAt(screen);
      if (decorationId) { this.select({kind: 'decoration', id: decorationId}); return; }
      const home=this.current?buildingAt(this.current,fineCell(world)):null;
      this.select(home ? {kind: 'building', id: home.id} : {kind: 'empty'}); return;
    }
    const closest = rabbitHit(screen, this.rabbitViews.flatMap(r => {
      if (r.sprite && r.art) {
        // Reference images use their own alpha silhouette, avoiding rectangular hits on adjacent residents.
        const world = this.view.world(screen);
        const local = r.sprite.getWorldTransformMatrix().applyInverse(world.x, world.y);
        const x = Math.floor(local.x + r.art.width / 2), y = Math.floor(local.y + r.art.height);
        if (x < 0 || y < 0 || x >= r.art.width || y >= r.art.height ||
            this.textures.getPixelAlpha(x, y, r.art.texture) < 32) return [];
      }
      return [{id: r.id, point: this.view.screen(rabbitHitPoint(r.object)), depth: r.object.y,
        radius: r.sprite ? Infinity : VISUAL.rabbit.hitRadius * Math.min(1,this.view.zoom/.8)}];
    }));
    if (closest) { this.select({kind: 'rabbit', id: closest.id}); return; }
    const decorationId = this.decorationAt(screen);
    if (decorationId) { this.select({kind: 'decoration', id: decorationId}); return; }

    const building=this.current?buildingAt(this.current,fineCell(world)):null;
    this.select(building ? {kind: 'building', id: building.id} : {kind: 'empty'});
  }
  update(time: number): void {
    for (const rabbit of this.rabbitViews) {
      const t = time / 1000 + rabbit.phase;
      const position = rabbitPosition(rabbit.base, time, rabbit.phase, rabbit.fedUntil);
      rabbit.object.setPosition(position.x, position.y).setDepth(position.y);
      rabbit.ears.forEach((ear, index) => { ear.rotation = Math.sin(t * 1.4 + index) * .13; });
    }
    this.animals?.sort('depth');
  }
}
