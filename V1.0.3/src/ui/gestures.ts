import {VISUAL} from '../config/visual';
export interface Point {x: number; y: number}
export type Gesture = {type: 'pan'; dx: number; dy: number} | {type: 'zoom'; factor: number; at: Point; dx: number; dy: number} | {type: 'tap'; at: Point};
/** Coordinates and threshold are CSS pixels. No selection after any drag or multi-touch. */
export class Gestures {
  private points = new Map<number, Point>();
  private start: Point | null = null;
  private suppressed = false;
  get active(): boolean { return this.points.size > 0; }
  down(id: number, point: Point): void {
    if (!this.points.size) { this.start = point; this.suppressed = false; }
    this.points.set(id, point);
    if (this.points.size > 1) this.suppressed = true;
  }
  move(id: number, point: Point): Gesture | null {
    const old = this.points.get(id); if (!old) return null;
    const before = [...this.points.values()]; this.points.set(id, point);
    if (this.points.size >= 2) {
      const after = [...this.points.values()];
      const distance = (p: Point[]) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const middle = (p: Point[]) => ({x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2});
      const a = middle(before), b = middle(after);
      return {type: 'zoom', factor: distance(after) / Math.max(1, distance(before)), at: b, dx: b.x - a.x, dy: b.y - a.y};
    }
    if (this.start && Math.hypot(point.x - this.start.x, point.y - this.start.y) > 8) this.suppressed = true;
    return this.suppressed ? {type: 'pan', dx: point.x - old.x, dy: point.y - old.y} : null;
  }
  up(id: number, point: Point): Gesture | null {
    if (!this.points.has(id)) return null;
    const tap = !this.suppressed && this.points.size === 1 && this.start && Math.hypot(point.x - this.start.x, point.y - this.start.y) <= 8;
    this.points.delete(id); if (!this.points.size) this.start = null;
    return tap ? {type: 'tap', at: point} : null;
  }
  cancel(): void { this.points.clear(); this.start = null; this.suppressed = true; }
}
const grid = VISUAL.grid, camera = VISUAL.camera;
/** Regular aerial projection: horizontal columns, compressed depth, no shear or roll. */
export const gridPoint = (x: number, y: number): Point => ({x: grid.originX + x * grid.width, y: grid.originY + y * grid.depth});
export function gridCell(point: Point): Point {
  return {x: Math.floor((point.x - grid.originX) / grid.width), y: Math.floor((point.y - grid.originY) / grid.depth)};
}
export class MeadowCamera {
  x: number = gridPoint(camera.focusX, camera.focusY).x;
  y: number = gridPoint(camera.focusX, camera.focusY).y;
  zoom: number = camera.initialZoom;
  width = 900; height = 500;
  private interacting = false;
  private pendingSize: Point | null = null;
  get resizing(): boolean { return this.pendingSize !== null; }
  readonly bounds = {left: grid.originX - camera.marginX, right: grid.originX + grid.columns * grid.width + camera.marginX,
    top: grid.originY - camera.marginY, bottom: grid.originY + grid.rows * grid.depth + camera.marginY};
  interaction(active: boolean): void {
    this.interacting = active;
    if (!active && this.pendingSize) { const size = this.pendingSize; this.pendingSize = null; this.resize(size.x, size.y); }
  }
  resize(width: number, height: number): void {
    if (this.interacting) { this.pendingSize = {x: width, y: height}; return; }
    this.width = width; this.height = height; this.clamp();
  }
  recenter(): void {
    if (this.interacting) return;
    this.zoom = camera.initialZoom;
    const hud = this.width < this.height && this.width <= 980 ? camera.portraitHudHeight : this.height <= 450 ? camera.compactHudHeight : camera.hudHeight;
    const focus = gridPoint(camera.focusX, camera.focusY);
    this.x = focus.x; this.y = focus.y - hud / (2 * this.zoom); this.clamp();
  }
  world(point: Point): Point { return {x: this.x + (point.x - this.width / 2) / this.zoom, y: this.y + (point.y - this.height / 2) / this.zoom}; }
  screen(point: Point): Point { return {x: (point.x - this.x) * this.zoom + this.width / 2, y: (point.y - this.y) * this.zoom + this.height / 2}; }
  pan(dx: number, dy: number): void { this.x -= dx / this.zoom; this.y -= dy / this.zoom; this.clamp(); }
  scale(factor: number, at: Point, dx = 0, dy = 0): void {
    // One clamp for the entire pinch: the old midpoint follows the moving fingers.
    const anchor = this.world({x: at.x - dx, y: at.y - dy});
    this.zoom = Math.max(camera.minZoom, Math.min(camera.maxZoom, this.zoom * factor));
    const after = this.world(at); this.x += anchor.x - after.x; this.y += anchor.y - after.y; this.clamp();
  }
  clamp(): void {
    const clamp = (value: number, low: number, high: number, half: number) => high - low < half * 2 ? (high + low) / 2 : Math.max(low + half, Math.min(high - half, value));
    this.x = clamp(this.x, this.bounds.left, this.bounds.right, this.width / this.zoom / 2);
    this.y = clamp(this.y, this.bounds.top, this.bounds.bottom, this.height / this.zoom / 2);
  }
}
/** A click-only command gate guards re-entrancy and accidental double clicks/taps. */
export class ActionGate {
  private last = new Map<string, number>();
  private running = false;
  constructor(private clock: () => number = () => performance.now()) {}
  run(key: string, action: () => void): boolean {
    const now = this.clock();
    if (this.running || now - (this.last.get(key) ?? -Infinity) < 350) return false;
    this.running = true; this.last.set(key, now);
    try { action(); } finally { this.running = false; }
    return true;
  }
}
