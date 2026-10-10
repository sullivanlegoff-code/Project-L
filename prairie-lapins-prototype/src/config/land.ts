import {FINE_GRID} from './decorations';
export const PARCEL_IDS = ['center', 'northwest', 'north', 'northeast', 'west', 'east', 'southwest', 'south', 'southeast'] as const;
export type ParcelId = typeof PARCEL_IDS[number];
export const PARCELS: Record<ParcelId, {name: string; x: number; y: number}> = {
 center:{name:'Centre',x:3,y:3},northwest:{name:'Nord-ouest',x:0,y:0},north:{name:'Nord',x:3,y:0},northeast:{name:'Nord-est',x:6,y:0},west:{name:'Ouest',x:0,y:3},east:{name:'Est',x:6,y:3},southwest:{name:'Sud-ouest',x:0,y:6},south:{name:'Sud',x:3,y:6},southeast:{name:'Sud-est',x:6,y:6},
};
export const MAP_SIZE = 9, PARCEL_SIZE = 3;
export type LandState = {acquiredParcels: ParcelId[]};
export function parcelAt(x:number,y:number): ParcelId | null {
 if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0||x>=9||y>=9)return null;
 return PARCEL_IDS.find(id=>{const p=PARCELS[id];return x>=p.x&&x<p.x+3&&y>=p.y&&y<p.y+3})!;
}
export function acquiredCell(s:LandState,x:number,y:number):boolean {const id=parcelAt(x,y);return id!==null&&s.acquiredParcels.includes(id)}
export const extensionPrice=(s:LandState)=>s.acquiredParcels.length*500;
export function acquiredFootprint(s:LandState,x:number,y:number,width:number,height:number):boolean {
 if(![x,y,width,height].every(Number.isInteger)||width<1||height<1||x<0||y<0||x+width>MAP_SIZE*FINE_GRID||y+height>MAP_SIZE*FINE_GRID)return false;
 for(let row=y;row<y+height;row++)for(let col=x;col<x+width;col++)if(!acquiredCell(s,Math.floor(col/FINE_GRID),Math.floor(row/FINE_GRID)))return false;
 return true;
}
