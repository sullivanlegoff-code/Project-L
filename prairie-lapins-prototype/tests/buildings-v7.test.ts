import {withStarterBuildings} from './starter-expectation';
import {regressionStart as createGame} from './regression-start';
import {describe,it,expect} from 'vitest';
import {act,decodeGame,encodeGame} from '../src/simulation';
import {buildingPlacementReason,buildingFootprint,overlaps} from '../src/simulation/placement';
import {decorationPlacementReason} from '../src/simulation/decorations';
import {scenarioState} from '../src/dev/scenarios';
import {representative} from './migration-fixtures';
import {buildingCenter,gridPoint} from '../src/ui/gestures';
import {GameController} from '../src/application/GameController';
import {SAVE_KEY,FINE_BUILDINGS_MIGRATION_BACKUP_KEY,LAND_MIGRATION_BACKUP_KEY} from '../src/persistence/storage';
import type {Command,GameState} from '../src/state/types';
const run=(s:GameState,c:Command)=>{const r=act(s,c,s.lastSimulatedAt);if(!r.ok)throw Error(r.reason);return r.state;};
function rich(){const s=createGame(0);s.pattes=10000;s.buildings[0].x=20;s.buildings[0].y=20;return s;}
function decoration(s:GameState,x:number,y:number){s=run(s,{type:'buyDecoration',catalogId:'wildflowers'});return run(s,{type:'placeDecoration',id:s.decorations.at(-1)!.id,location:{kind:'outside',x,y,rotation:0}});}
describe('fine building footprints v7',()=>{
 it.each(['enclosure','farm','nest','nursery'] as const)('buys and moves %s by one fine square across old coarse boundaries',kind=>{
  let s=rich();const before=s.pattes;s=run(s,kind==='nest'||kind==='nursery'?{type:'placeStarterBuilding',kind,x:13,y:14}:{type:'buyBuilding',kind,x:13,y:14});const b=s.buildings.at(-1)!;
  expect(b).toMatchObject({kind,x:13,y:14});if(kind==='nest'||kind==='nursery')expect(s.pattes).toBe(before);else expect(s.pattes).toBeLessThan(before);
  const payload=structuredClone(b),rabbits=structuredClone(s.rabbits),money=s.pattes;
  s=run(s,{type:'moveBuilding',id:b.id,x:14,y:14});s=run(s,{type:'moveBuilding',id:b.id,x:14,y:15});
  expect(s.buildings.at(-1)).toEqual({...payload,x:14,y:15});expect(s.rabbits).toEqual(rabbits);expect(s.pattes).toBe(money);
  expect(decodeGame(encodeGame(s),0)).toEqual({ok:true,state:s});
 });
 it('requires every fine square to be acquired, including both sides of a parcel boundary',()=>{
  let s=rich();expect(buildingPlacementReason(s,22,13)).toBe('INVALID_CELL');
  s=run(s,{type:'expand',parcelId:'east',expectedCost:500});s=run(s,{type:'buyBuilding',kind:'farm',x:22,y:13});
  expect(s.buildings.at(-1)).toMatchObject({x:22,y:13});expect(buildingPlacementReason(s,13,10)).toBe('INVALID_CELL');
  s=run(s,{type:'expand',parcelId:'north',expectedCost:1000});expect(buildingPlacementReason(s,13,10)).toBeNull();
  expect(buildingPlacementReason(s,34,13)).toBe('INVALID_CELL');expect(buildingPlacementReason(s,13,-1)).toBe('INVALID_CELL');
 });
 it('allows edge contact and excludes only the moving building, including its old overlap',()=>{
  let s=run(rich(),{type:'buyBuilding',kind:'farm',x:12,y:12});s=run(s,{type: 'placeStarterBuilding',kind:'nest',x:16,y:12});
  const farm=s.buildings.find(b=>b.kind==='farm')!;
  expect(buildingPlacementReason(s,12,13,farm.id)).toBeNull();expect(buildingPlacementReason(s,13,12,farm.id)).toBe('CELL_OCCUPIED');
  expect(buildingPlacementReason(s,12,12)).toBe('CELL_OCCUPIED');expect(buildingPlacementReason(s,12,12,'absent')).toBe('NOT_FOUND');
  expect(overlaps(buildingFootprint({x:12,y:12}),buildingFootprint({x:16,y:12}))).toBe(false);
 });
 it('blocks reciprocal building/decoration overlaps and allows their edge contact',()=>{
  let s=decoration(rich(),16,14),id=s.decorations[0].id;expect(buildingPlacementReason(s,13,14)).toBe('DECORATION_BLOCKS_BUILDING');
  expect(buildingPlacementReason(s,12,14)).toBeNull();s=run(s,{type:'buyBuilding',kind:'farm',x:12,y:14});
  expect(decorationPlacementReason(s,id,{kind:'outside',x:15,y:14,rotation:0})).toBe('CELL_OCCUPIED');
  expect(decorationPlacementReason(s,id,{kind:'outside',x:16,y:14,rotation:0})).toBeNull();
  const before=structuredClone(s);expect(act(s,{type:'moveBuilding',id:s.buildings.at(-1)!.id,x:13,y:14},0)).toMatchObject({ok:false,reason:'DECORATION_BLOCKS_BUILDING',state:before});expect(s).toEqual(before);
 });
 it('checks destination only, without requiring a route around obstacles',()=>{
  let s=rich();s.acquiredParcels.push('east');s=run(s,{type:'buyBuilding',kind:'farm',x:24,y:12});s=run(s,{type: 'placeStarterBuilding',kind:'nest',x:20,y:12});
  const farm=s.buildings.find(b=>b.kind==='farm')!;s=run(s,{type:'moveBuilding',id:farm.id,x:13,y:12});expect(s.buildings.find(b=>b.id===farm.id)).toMatchObject({x:13,y:12});
 });
 it.each([[13.5,14],[13,14.5],[NaN,14],[Infinity,14],[-1,14],[36,14]])('refuses invalid fine destination %j without paying or moving', (x,y)=>{
  const s=rich(),before=structuredClone(s);expect(act(s,{type:'buyBuilding',kind:'farm',x,y},0)).toMatchObject({ok:false,reason:'INVALID_CELL',state:before});expect(s).toEqual(before);
 });
 it('keeps occupants, work and income when moving; the lab presents all four kinds and a border crossing',()=>{
  let s=scenarioState('fineBuildings',0);const old=structuredClone(s),farm=s.buildings.find(b=>b.kind==='farm')!;
  expect(old.rabbits.filter(r=>r.enclosureId==='building-1')).toHaveLength(7);expect(farm.order).not.toBeNull();
  s=run(s,{type:'moveBuilding',id:farm.id,x:23,y:15});expect(s.buildings.find(b=>b.id===farm.id)).toEqual({...farm,x:23,y:15});
  s=run(s,{type:'moveBuilding',id:'building-1',x:12,y:14});expect(s.rabbits).toEqual(old.rabbits);expect(s.buildings[0]).toEqual({...old.buildings[0],x:12,y:14});
 });
});
describe('v6 → v7 coordinate conversion and recovery',()=>{
 it.each(Object.entries(representative()))('converts %s without changing visual positions, resources, identities or deadlines',(_name,current)=>{
  const raw={...current,version:6,buildings:current.buildings.map(b=>({...b,x:b.x/4,y:b.y/4}))};const decoded=decodeGame(JSON.stringify(raw),current.lastSimulatedAt);
  expect(decoded).toEqual({ok:true,state:withStarterBuildings(current),migratedFrom:6});
  if(!decoded.ok)return;decoded.state.buildings.slice(0,current.buildings.length).forEach((b,i)=>expect(buildingCenter(b)).toEqual(gridPoint(raw.buildings[i].x+.5,raw.buildings[i].y+.5)));
  expect(decodeGame(encodeGame(decoded.state),current.lastSimulatedAt)).toEqual({ok:true,state:withStarterBuildings(current)});
 });
 it('does not multiply decoration coordinates or duplicate migration backups',()=>{
  const s=decoration(rich(),13,12),raw=JSON.stringify({...s,version:6,buildings:s.buildings.map(b=>({...b,x:b.x/4,y:b.y/4}))});
  const data=new Map([[SAVE_KEY,raw],[LAND_MIGRATION_BACKUP_KEY,'older-backup']]);const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  const c=new GameController(storage,()=>0);expect(c.getSnapshot().state).toEqual(withStarterBuildings(s));expect(data.get(FINE_BUILDINGS_MIGRATION_BACKUP_KEY)).toBe(raw);expect(data.get(LAND_MIGRATION_BACKUP_KEY)).toBe('older-backup');c.dispose();
  const again=new GameController(storage,()=>0);expect(again.getSnapshot().state).toEqual(withStarterBuildings(s));expect(again.migrationBackup()).toBe(raw);again.dispose();
 });
 it('retains the old save and recovery source on denied migration writes',()=>{
  const s=rich(),raw=JSON.stringify({...s,version:6,buildings:s.buildings.map(b=>({...b,x:b.x/4,y:b.y/4}))}),data=new Map([[SAVE_KEY,raw]]);
  const c=new GameController({getItem:k=>data.get(k)??null,setItem:()=>{throw Error('quota');}},()=>0);expect(c.getSnapshot().status).toBe('write-error');expect(data.get(SAVE_KEY)).toBe(raw);expect(c.migrationBackup()).toBe(raw);c.dispose();
 });
 it('rejects overlaps and unacquired extents in imported v7 saves',()=>{
  const s=rich();s.buildings.push({...s.buildings[0],id:'building-4',x:21,y:20});s.nextId=5;
  expect(decodeGame(JSON.stringify(s),0)).toEqual({ok:false,reason:'INVALID_STATE'});s.buildings[1].x=23;s.buildings[1].y=12;expect(decodeGame(JSON.stringify(s),0)).toEqual({ok:false,reason:'INVALID_STATE'});
 });
});
