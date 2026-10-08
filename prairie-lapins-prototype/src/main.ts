import Phaser from 'phaser';
import {MeadowScene} from './display/MeadowScene';
import {GameController} from './application/GameController';
import {bindLifecycle} from './application/lifecycle';
import {browserStorage} from './persistence/browserStorage';
import {browserLifecycle} from './display/browserLifecycle';
import {mountSavePanel} from './display/SavePanel';
import {GameUI} from './ui/GameUI';
import {PreferenceStore} from './ui/preferences';
import {BUILD_REVISION, RELEASE_LABEL} from './config/release';
import {DECORATIONS_PREVIEW_BUILD, LABORATORY_BUILD, sessionPolicy} from './config/runtime';
import './display/styles.css';

async function boot(): Promise<() => void> {
  document.getElementById('game-version')!.textContent = `Version : ${RELEASE_LABEL} · build ${BUILD_REVISION.slice(0, 7)}`;
  const base = browserStorage();
  let storage = base, clock = Date.now, preferenceKey = 'prairie-lapins.ui.v1';
  let mountDev: ((controller: GameController) => () => void) | undefined;
  const testMode = DECORATIONS_PREVIEW_BUILD || LABORATORY_BUILD || (import.meta.env.DEV && new URLSearchParams(location.search).get('dev') === '1');
  const policy = sessionPolicy(testMode);
  const environmentLink = document.getElementById('environment-link') as HTMLAnchorElement;
  environmentLink.href = import.meta.env.BASE_URL + (DECORATIONS_PREVIEW_BUILD ? '../../' : LABORATORY_BUILD ? '../' : import.meta.env.DEV ? (testMode ? '' : '?dev=1') : 'dev/');
  environmentLink.textContent = testMode ? 'Retour au jeu normal' : 'Ouvrir le laboratoire de test';
  if (DECORATIONS_PREVIEW_BUILD || LABORATORY_BUILD || (import.meta.env.DEV && new URLSearchParams(location.search).get('dev') === '1')) {
    const {developmentEnvironment} = await import('./dev/tools');
    const dev = developmentEnvironment(base, {decorationPreview: DECORATIONS_PREVIEW_BUILD}); storage = dev.storage; clock = dev.clock; preferenceKey = dev.preferenceKey; mountDev = controller => dev.mount(controller, () => ui?.onReplacement());
  }
  // No online adapter exists yet. This policy is the boundary for future clients.
  if (policy.kind === 'laboratory') document.title = 'MODE TEST — Prairie de lapins';
  const controller = new GameController(storage, clock);
  let ui: GameUI | null = null;
  const scene = new MeadowScene(controller, selection => ui?.select(selection), () =>
    !!document.querySelector('dialog[open]') || getComputedStyle(document.getElementById('portrait-notice')!).display !== 'none');
  const game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', backgroundColor: '#d4e6b9', transparent: true,
    scale: {mode: Phaser.Scale.RESIZE, width: '100%', height: '100%'}, scene: [scene],
    render: {antialias: true}, input: {activePointers: 3},
  });
  ui = new GameUI(controller, scene, clock, new PreferenceStore(preferenceKey));
  const disposePanel = mountSavePanel(controller, () => ui?.onReplacement(), {test: testMode, decorationPreview: DECORATIONS_PREVIEW_BUILD});
  const disposeDev = mountDev?.(controller);
  const lifecycle = bindLifecycle(controller, browserLifecycle()); lifecycle.start();
  const dismissPortrait = () => document.body.classList.add('portrait-dismissed');
  document.getElementById('continue-portrait')!.addEventListener('click', dismissPortrait);
  return () => { lifecycle.stop(); disposePanel(); ui?.dispose(); disposeDev?.(); controller.dispose(); game.destroy(true); document.getElementById('continue-portrait')!.removeEventListener('click', dismissPortrait); };
}
const ready = boot();
if (import.meta.hot) import.meta.hot.dispose(() => { void ready.then(dispose => dispose()); });
