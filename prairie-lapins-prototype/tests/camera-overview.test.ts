import {describe,it,expect} from 'vitest';
import {MeadowCamera,gridPoint,type WorldBounds} from '../src/ui/gestures';
const full:WorldBounds={left:120,right:1704,top:120,bottom:1452};
const center:WorldBounds={left:648,right:1176,top:564,bottom:1008};
const partial:WorldBounds={left:648,right:1704,top:120,bottom:1008};
describe('overview camera, presentation only',()=>{
 for(const [width,height] of [[852,393],[390,844]]) for(const [name,rect] of [['centre',center],['partielle',partial],['complète',full]] as const){
  it(`frames ${name} with water at ${width}×${height}`,()=>{
   const c=new MeadowCamera();c.resize(width,height);c.overview(rect);
   const a=c.screen({x:rect.left-80,y:rect.top-80}),b=c.screen({x:rect.right+80,y:rect.bottom+80});
   const hud=width<height?122:62;
   expect(a.x).toBeGreaterThanOrEqual(16-1e-8);expect(a.y).toBeGreaterThanOrEqual(hud+16-1e-8);
   expect(b.x).toBeLessThanOrEqual(width-16+1e-8);expect(b.y).toBeLessThanOrEqual(height-16+1e-8);
   expect(c.zoom).toBeGreaterThanOrEqual(c.minimumZoom);expect(c.zoom).toBeLessThanOrEqual(1.65);
  });
 }
 it('retains .4 baseline on large screens; adapts minimum on compact screens',()=>{
  const c=new MeadowCamera();c.resize(2000,1200);expect(c.minimumZoom).toBe(.4);
  c.resize(852,393);expect(c.minimumZoom).toBeCloseTo(299/1492);c.scale(.001,{x:426,y:220});expect(c.zoom).toBe(c.minimumZoom);
  c.scale(1000,{x:426,y:220});expect(c.zoom).toBe(1.65);
 });
 it('fits around an open panel without changing map geometry',()=>{
  const c=new MeadowCamera();c.resize(852,393);c.setInsets({left:16,right:376,top:78,bottom:16});c.overview(full);
  expect(c.screen({x:40,y:40}).x).toBeGreaterThanOrEqual(16-1e-8);expect(c.screen({x:1784,y:1532}).x).toBeLessThanOrEqual(476+1e-8);
 });
 it('preserves world gesture anchor in progressive wheel and moving pinch',()=>{
  const c=new MeadowCamera();c.resize(852,393);c.recenter();c.scale(.8,{x:410,y:210});
  const old=c.world({x:380,y:240});c.scale(.9,{x:390,y:245},10,5);
  expect(c.world({x:390,y:245}).x).toBeCloseTo(old.x);expect(c.world({x:390,y:245}).y).toBeCloseTo(old.y);
 });
 it('has a continuous clamp when the map becomes narrower than the view',()=>{
  const c=new MeadowCamera();c.resize(852,393);
  const threshold=(852-32)/(c.bounds.right-c.bounds.left);c.x=912;c.y=786;
  c.zoom=threshold+1e-7;c.clamp();const before=c.x;c.zoom=threshold-1e-7;c.clamp();expect(Math.abs(c.x-before)).toBeLessThan(.001);
  const stable=c.x;for(let n=0;n<100;n++)c.pan(n%2?100:-100,0);expect(c.x).toBe(stable);
 });
 it('recenter restores original focus and 1.05 after overview',()=>{
  const c=new MeadowCamera();c.resize(852,393);c.recenter();const initial={x:c.x,y:c.y,zoom:c.zoom};
  c.overview(full);c.pan(100,100);c.scale(2,{x:426,y:200});c.recenter();expect({x:c.x,y:c.y,zoom:c.zoom}).toEqual(initial);
  expect(c.screen(gridPoint(4.5,4.5)).y).toBeCloseTo(393/2+62/2);
 });
 it('does not zoom in when zooming out after an orientation change',()=>{
  const c=new MeadowCamera();c.resize(852,393);c.overview(full);const old=c.zoom;
  c.resize(390,844);expect(c.minimumZoom).toBeGreaterThan(old);c.scale(.9,{x:195,y:400});expect(c.zoom).toBe(old);
 });
 it('defers orientation and framing changes until fingers lift',()=>{
  const c=new MeadowCamera();c.resize(852,393);c.recenter();c.interaction(true);const before={x:c.x,y:c.y,zoom:c.zoom,min:c.minimumZoom};
  c.setInsets({left:16,right:16,top:138,bottom:16});c.resize(390,844);expect({x:c.x,y:c.y,zoom:c.zoom,min:c.minimumZoom}).toEqual(before);
  c.interaction(false);expect(c.width).toBe(390);expect(c.zoom).toBe(before.zoom);
 });
});
