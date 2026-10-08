import type {SaveStorage} from './storage';
/** Access the property lazily: even window.localStorage may throw SecurityError. */
export function browserStorage(): SaveStorage {
  return {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
  };
}
