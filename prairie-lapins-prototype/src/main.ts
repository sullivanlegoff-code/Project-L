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
import {LABORATORY_BUILD, sessionPolicy} from './config/runtime';
import {scopedStorage} from './persistence/scopedStorage';
import './display/styles.css';

async function boot(): Promise<() => void> {
  document.getElementById('game-version')!.textContent = `Version : ${RELEASE_LABEL} · build ${BUILD_REVISION.slice(0, 7)}`;
  const preview = import.meta.env.MODE === 'account-preview';
  const previewPrefix = 'prairie-lapins.preview.accounts.';
  const base = preview ? scopedStorage(browserStorage(), previewPrefix) : browserStorage();
  let storage = base, clock = Date.now, preferenceKey = (preview ? previewPrefix : '') + 'prairie-lapins.ui.v1';
  let mountDev: ((controller: GameController) => () => void) | undefined;
  const testMode = LABORATORY_BUILD || (import.meta.env.DEV && new URLSearchParams(location.search).get('dev') === '1');
  const policy = sessionPolicy(testMode);
  const environmentLink = document.getElementById('environment-link') as HTMLAnchorElement;
  environmentLink.href = import.meta.env.BASE_URL + (LABORATORY_BUILD ? '../' : import.meta.env.DEV ? (testMode ? '' : '?dev=1') : 'dev/');
  environmentLink.textContent = testMode ? 'Retour au jeu normal' : 'Ouvrir le laboratoire de test';
  if (preview) {
    environmentLink.href = '/Project-L/'; environmentLink.textContent = 'Retour au jeu normal';
    const badge = document.getElementById('preview-badge')!; badge.hidden = false; document.body.classList.add('test-session');
  }
  if (LABORATORY_BUILD || (import.meta.env.DEV && new URLSearchParams(location.search).get('dev') === '1')) {
    const {developmentEnvironment} = await import('./dev/tools');
    const dev = developmentEnvironment(base); storage = dev.storage; clock = dev.clock; preferenceKey = dev.preferenceKey; mountDev = controller => dev.mount(controller, () => ui?.onReplacement());
  }
  // Laboratory policy prevents account adapter initialization.
  if (policy.kind === 'laboratory') document.title = 'MODE TEST — Prairie de lapins';
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
  const disposePanel = mountSavePanel(controller, () => ui?.onReplacement(), {test: testMode, preview});
  const disposeDev = mountDev?.(controller);
  const lifecycle = bindLifecycle(controller, browserLifecycle()); lifecycle.start();
  let disposeCloud: (() => void) | undefined;
  if (!LABORATORY_BUILD && !(import.meta.env.DEV && new URLSearchParams(location.search).get('dev') === '1')) {
    try {
      const {mountAccountPanel} = await import('./cloud/accountPanel');
      disposeCloud = await mountAccountPanel(controller, base, policy, () => ui?.onReplacement());
    } catch {
      const host = document.getElementById('account-content')!; host.hidden = false;
      host.textContent = 'Service de comptes indisponible. Votre partie est enregistrée sur cet appareil uniquement. Gardez un export JSON.';
    }
  }
  const dismissPortrait = () => document.body.classList.add('portrait-dismissed');
  document.getElementById('continue-portrait')!.addEventListener('click', dismissPortrait);
  return () => { lifecycle.stop(); disposeCloud?.(); disposePanel(); ui?.dispose(); disposeDev?.(); controller.dispose(); game.destroy(true); document.getElementById('continue-portrait')!.removeEventListener('click', dismissPortrait); };
}
const ready = boot();
if (import.meta.hot) import.meta.hot.dispose(() => { void ready.then(dispose => dispose()); });
