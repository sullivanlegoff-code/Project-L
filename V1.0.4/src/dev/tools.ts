import type {GameController} from '../application/GameController';
import type {SaveStorage} from '../persistence/storage';
/** This module is dynamically imported only inside import.meta.env.DEV. */
export function developmentEnvironment(base: SaveStorage) {
  const prefix = 'prairie-lapins.development.';
  let offset = 0;
  try { offset = Number(base.getItem(prefix + 'clock')) || 0; } catch { /* optional */ }
  const clock = () => Date.now() + offset;
  const storage: SaveStorage = {getItem: key => base.getItem(prefix + key), setItem: (key, value) => base.setItem(prefix + key, value)};
  return {clock, storage, preferenceKey: prefix + 'ui', mount(controller: GameController) {
    const host = document.getElementById('devtools')!;
    host.hidden = false;
    host.append(Object.assign(document.createElement('p'), {textContent: 'Mode test : horloge et sauvegarde séparées.'}));
    for (const minutes of [5, 20, 60, 360, 1440]) {
      const button = document.createElement('button'); button.textContent = `+ ${minutes} min`;
      button.onclick = () => { offset += minutes * 60_000; try { base.setItem(prefix + 'clock', String(offset)); } catch { /* keep session clock */ } controller.refresh(); };
      host.append(button);
    }
    document.getElementById('dev-badge')!.hidden = false;
    return () => { host.replaceChildren(); host.hidden = true; };
  }};
}
