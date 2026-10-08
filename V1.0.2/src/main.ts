import Phaser from 'phaser';
import {MeadowScene} from './display/MeadowScene';
import {GameController} from './application/GameController';
import {bindLifecycle} from './application/lifecycle';
import {browserStorage} from './persistence/browserStorage';
import {browserLifecycle} from './display/browserLifecycle';
import {mountSavePanel} from './display/SavePanel';
import {GameUI} from './ui/GameUI';
import {PreferenceStore} from './ui/preferences';
import './display/styles.css';

async function boot(): Promise<() => void> {
  const base = browserStorage();
  let storage = base, clock = Date.now, preferenceKey = 'prairie-lapins.ui.v1';
  let mountDev: ((controller: GameController) => () => void) | undefined;
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('dev') === '1') {
    const {developmentEnvironment} = await import('./dev/tools');
    const dev = developmentEnvironment(base); storage = dev.storage; clock = dev.clock; preferenceKey = dev.preferenceKey; mountDev = dev.mount;
  }
  const controller = new GameController(storage, clock);
  let ui: GameUI | null = null;
  const scene = new MeadowScene(controller, selection => ui?.select(selection), () =>
    !!document.querySelector('dialog[open]') || getComputedStyle(document.getElementById('portrait-notice')!).display !== 'none');
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', backgroundColor: '#d4e6b9',
    scale: {mode: Phaser.Scale.RESIZE, width: '100%', height: '100%'}, scene: [scene],
    render: {antialias: true}, input: {activePointers: 3},
  });
  ui = new GameUI(controller, scene, clock, new PreferenceStore(preferenceKey));
  const disposePanel = mountSavePanel(controller, () => ui?.onReplacement());
  const disposeDev = mountDev?.(controller);
  const lifecycle = bindLifecycle(controller, browserLifecycle()); lifecycle.start();
  const dismissPortrait = () => document.body.classList.add('portrait-dismissed');
  document.getElementById('continue-portrait')!.addEventListener('click', dismissPortrait);
  return () => { lifecycle.stop(); disposePanel(); ui?.dispose(); disposeDev?.(); controller.dispose(); game.destroy(true); document.getElementById('continue-portrait')!.removeEventListener('click', dismissPortrait); };
}
const ready = boot();
if (import.meta.hot) import.meta.hot.dispose(() => { void ready.then(dispose => dispose()); });
