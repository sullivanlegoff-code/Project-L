import type {SaveStorage} from './storage';
/** Explicit origin-sharing namespace, including auth, checkpoints and migrations. */
export function scopedStorage(base:SaveStorage,prefix:string):SaveStorage {
 return {scope:base.scope,getItem:key=>base.getItem(prefix+key),setItem:(key,value)=>base.setItem(prefix+key,value)};
}
