// @vitest-environment happy-dom
import html from '../index.html?raw';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {GameController} from '../src/application/GameController';
import {GameUI} from '../src/ui/GameUI';
import {PreferenceStore} from '../src/ui/preferences';
import {mountSavePanel} from '../src/display/SavePanel';
import type {MeadowScene} from '../src/display/MeadowScene';
import {createGame, encodeGame, decodeGame} from '../src/simulation';
import type {GameState} from '../src/state/types';
import {developmentEnvironment} from '../src/dev/tools';
import {SAVE_KEY, type SaveStorage} from '../src/persistence/storage';
import testSave from '../docs/test-saves/collection-ready-v2.json';
import {SPECIES} from '../src/config/balance';

const cleanups: (() => void)[] = [];
beforeEach(() => {
  document.body.innerHTML = html.match(/<body>([\s\S]*)<\/body>/)![1].replace(/<script[\s\S]*?<\/script>/g, '');
  localStorage.clear();
  vi.stubGlobal('requestAnimationFrame', () => 0); vi.stubGlobal('cancelAnimationFrame', () => {});
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});
afterEach(() => { for (const cleanup of cleanups.splice(0).reverse()) cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function setup(initial = createGame(0)) {
  const data = new Map<string, string>([[SAVE_KEY, encodeGame(initial)]]);
  const storage: SaveStorage = {getItem: key => data.get(key) ?? null, setItem: (key, value) => { data.set(key, value); }};
  const clock = {now: 0}; const controller = new GameController(storage, () => clock.now, () => .9);
  const scene = {setPlacement: vi.fn(), setArrangement: vi.fn(), setPhoto: vi.fn(), reactToFeed: vi.fn(), recenter: vi.fn()} as unknown as MeadowScene;
  const prefs = new PreferenceStore('test-ui'); prefs.set({muted: true, tutorial: false});
  const ui = new GameUI(controller, scene, () => clock.now, prefs);
  const disposeSave = mountSavePanel(controller, () => ui.onReplacement());
  cleanups.push(() => { disposeSave(); ui.dispose(); controller.dispose(); });
  return {controller, ui, clock, storage, data, scene};
}
const panel = () => document.getElementById('panel-content')!;
function button(text: string, scope: ParentNode = panel()): HTMLButtonElement {
  const result = [...scope.querySelectorAll<HTMLButtonElement>('button')].find(b => b.textContent === text);
  if (!result) throw new Error(`Button missing: ${text}\n${scope.textContent}`); return result;
}
function state(controller: GameController): GameState { return controller.getSnapshot().state!; }
function place(ui: GameUI, kind: 'farm' | 'nest' | 'nursery' | 'enclosure', x: number, y: number) {
  document.getElementById('open-shop')!.click();
  const prices = {farm: 60, nest: 100, nursery: 80, enclosure: 120};
  button(`Placer · ${prices[kind]} pattes`).click(); ui.select({kind: 'cell', x, y}); button(`Acheter et placer · ${prices[kind]} pattes`).click();
}

describe('decoration UI transactions (simulated DOM; Phaser verified separately)', () => {
  const shop = () => {document.getElementById('open-shop')!.click(); button('Décorations').click();};
  const catalog = (id: string) => panel().querySelector<HTMLElement>(`[data-catalog="${id}"]`)!;
  it('confirms one purchase under double pressure and cancellation preserves the purchased exemplar', () => {
    const {controller, ui, scene} = setup(); shop(); expect(panel().querySelectorAll('[data-catalog]')).toHaveLength(12);
    button('Acheter · 20 pattes', catalog('wildflowers')).click(); expect(state(controller).decorations).toEqual([]);
    const confirm = button('Confirmer', document.getElementById('game-dialog')!); confirm.click(); confirm.click();
    expect(state(controller).pattes).toBe(280); expect(state(controller).decorations).toHaveLength(1);
    expect(scene.setArrangement).toHaveBeenLastCalledWith(true, {id: 'decoration-4', location: null});
    ui.select({kind: 'fineCell', x: 4, y: 0}); expect(state(controller).decorations[0].location).toEqual({kind: 'inventory'});
    button('Annuler le placement').click(); expect(state(controller).decorations[0].location).toEqual({kind: 'inventory'});
    document.getElementById('close-panel')!.click(); expect(document.getElementById('arrange-banner')!.hidden).toBe(true);
  });
  it('shows a neutral pending destination and keeps the placed list open across autosave refreshes', () => {
    const {controller, ui, clock} = setup(); shop();
    button('Acheter · 20 pattes', catalog('wildflowers')).click(); button('Confirmer', document.getElementById('game-dialog')!).click();
    expect(panel().querySelector('.placement-pending')?.textContent).toContain('Choisissez une destination');
    expect(button('Confirmer la pose · gratuit').disabled).toBe(true);
    ui.select({kind: 'fineCell', x: 4, y: 0}); button('Confirmer la pose · gratuit').click();
    panel().querySelector<HTMLDetailsElement>('[data-placed-list]')!.open = true;
    clock.now = 5000; controller.refresh();
    expect(panel().querySelector<HTMLDetailsElement>('[data-placed-list]')!.open).toBe(true);
    expect(state(controller).decorations[0].location).toEqual({kind: 'outside', x: 4, y: 0, rotation: 0});
  });
  it('refuses insufficient resources before confirmation and preserves every owned item', () => {
    const initial = createGame(0); initial.pattes = 19; const {controller} = setup(initial); shop();
    expect(button('Acheter · 20 pattes', catalog('wildflowers')).disabled).toBe(true); expect(catalog('wildflowers').textContent).toContain('Pas assez');
    button('Acheter · 20 pattes', catalog('wildflowers')).click(); expect((document.getElementById('game-dialog') as HTMLDialogElement).open).toBe(false); expect(state(controller)).toEqual(initial);
  });
  it('requires explicit confirmation to move; closing a panel preserves the old location and rotation', () => {
    const {controller, ui, scene} = setup(); controller.perform({type: 'buyDecoration', catalogId: 'wood-bench'});
    controller.perform({type: 'placeDecoration', id: 'decoration-4', location: {kind: 'outside', x: 4, y: 0, rotation: 0}});
    const original = state(controller); document.getElementById('open-arrange')!.click(); ui.select({kind: 'decoration', id: 'decoration-4'}); button('Tourner de 90°').click();
    ui.select({kind: 'fineCell', x: 11, y: 0}); expect(panel().textContent).toContain('✓ Emplacement valide'); expect(state(controller)).toEqual(original);
    document.getElementById('close-panel')!.click(); expect(state(controller)).toEqual(original); expect(scene.setArrangement).toHaveBeenLastCalledWith(false, null);
    document.getElementById('open-arrange')!.click(); ui.select({kind: 'decoration', id: 'decoration-4'}); button('Déplacer').click(); ui.select({kind: 'fineCell', x: 7, y: 4});
    const confirm = button('Confirmer la pose · gratuit'); confirm.click(); confirm.click();
    expect(state(controller).decorations).toHaveLength(1); expect(state(controller).decorations[0].location).toEqual({kind: 'outside', x: 7, y: 4, rotation: 0}); expect(state(controller).pattes).toBe(original.pattes);
    ui.select({kind: 'decoration', id: 'decoration-4'}); button('Ranger dans l’inventaire').click(); expect(state(controller).decorations[0].location.kind).toBe('inventory');
  });
  it('shows overlap, building and bounds refusals without modifying the object', () => {
    const {controller, ui} = setup(); controller.perform({type: 'buyDecoration', catalogId: 'wildflowers'});
    controller.perform({type: 'placeDecoration', id: 'decoration-4', location: {kind: 'outside', x: 4, y: 0, rotation: 0}}); controller.perform({type: 'buyDecoration', catalogId: 'wildflowers'});
    document.getElementById('open-arrange')!.click(); button('Placer cet exemplaire').click(); const original = state(controller);
    for (const [x, y, reason] of [[4,0,'chevauche'],[0,0,'occupée'],[12,0,'disponible']] as const) {
      ui.select({kind: 'fineCell', x, y}); expect(button('Confirmer la pose · gratuit').disabled).toBe(true); expect(panel().textContent).toContain(reason); expect(state(controller)).toEqual(original);
    }
  });
  it('offers confirmed storage of blocking objects and requires a separate building purchase', () => {
    const {controller, ui} = setup(); controller.perform({type: 'buyDecoration', catalogId: 'wildflowers'}); controller.perform({type: 'placeDecoration', id: 'decoration-4', location: {kind: 'outside', x: 4, y: 0, rotation: 0}});
    document.getElementById('open-shop')!.click(); button('Placer · 60 pattes').click(); ui.select({kind: 'cell', x: 1, y: 0}); const original = state(controller);
    expect(button('Acheter et placer · 60 pattes').disabled).toBe(true); button('Ranger les 1 décoration(s) de cette case').click();
    button('Annuler', document.getElementById('game-dialog')!).click(); expect(state(controller)).toEqual(original);
    button('Ranger les 1 décoration(s) de cette case').click(); button('Confirmer', document.getElementById('game-dialog')!).click();
    expect(state(controller).pattes).toBe(original.pattes); expect(state(controller).buildings).toHaveLength(1); expect(state(controller).decorations[0].location.kind).toBe('inventory');
    button('Acheter et placer · 60 pattes').click(); expect(state(controller).pattes).toBe(original.pattes - 60); expect(state(controller).buildings).toHaveLength(2);
  });
  it('requires storing a occupied interior slot separately before posing its replacement', () => {
    const {controller, ui} = setup(); controller.perform({type: 'buyDecoration', catalogId: 'soft-cushion'}); controller.perform({type: 'placeDecoration', id: 'decoration-4', location: {kind: 'habitat', habitatId: 'building-1', slot: 0}}); controller.perform({type: 'buyDecoration', catalogId: 'small-parasol'});
    document.getElementById('open-arrange')!.click(); button('Placer cet exemplaire').click(); expect(panel().querySelectorAll('article')).toHaveLength(1);
    ui.select({kind: 'habitatSlot', habitatId: 'building-1', slot: 0}); expect(button('Confirmer la pose · gratuit').disabled).toBe(true);
    button('Ranger l’objet de cet emplacement').click(); button('Confirmer', document.getElementById('game-dialog')!).click();
    expect(state(controller).decorations.every(d => d.location.kind === 'inventory')).toBe(true); button('Confirmer la pose · gratuit').click();
    expect(state(controller).decorations[1].location).toEqual({kind: 'habitat', habitatId: 'building-1', slot: 0}); expect(state(controller).rabbits).toHaveLength(2);
  });
  it('enters photo mode without changing the save, exits arrangement and returns controls', () => {
    const {controller, data, scene} = setup(); document.getElementById('open-arrange')!.click(); const before = data.get(SAVE_KEY), stateBefore = state(controller);
    document.getElementById('open-photo')!.click(); expect(document.body.classList.contains('photo-mode')).toBe(true); expect(scene.setPhoto).toHaveBeenLastCalledWith(true); expect(document.getElementById('arrange-banner')!.hidden).toBe(true);
    document.getElementById('photo-return')!.click(); expect(document.body.classList.contains('photo-mode')).toBe(false); expect(scene.setPhoto).toHaveBeenLastCalledWith(false); expect(data.get(SAVE_KEY)).toBe(before); expect(state(controller)).toEqual(stateBefore);
  });
});

describe('real HTML UI wired to the real controller (simulated DOM, not a browser)', () => {
  it('shows all main missions without automatic opening, offers a free shortcut and claims a reward once', () => {
    const {controller, ui, data, scene} = setup();
    expect(document.getElementById('game-panel')!.hidden).toBe(true);
    expect(document.getElementById('missions-badge')!.hidden).toBe(true);
    document.getElementById('open-missions')!.click();
    expect(panel().querySelectorAll('article')).toHaveLength(8);
    let card=panel().querySelector<HTMLElement>('[data-mission="first-farm"]')!;
    expect(card.textContent).toContain('Gratuit'); expect(button('Réclamer · + 20 herbes',card).disabled).toBe(true);
    const before=state(controller);button('Voir le bâtiment ou la boutique',card).click();
    expect(state(controller)).toEqual(before);expect(document.getElementById('panel-title')!.textContent).toBe('Boutique');
    place(ui,'farm',1,0);expect(document.getElementById('missions-badge')!.textContent).toBe('1');
    document.getElementById('open-missions')!.click();card=panel().querySelector('[data-mission="first-farm"]')!;
    const claim=button('Réclamer · + 20 herbes',card);claim.click();claim.click();
    expect(state(controller).grass).toBe(30);expect(state(controller).missions.claimed).toEqual(['first-farm']);
    expect(state(controller).missions.daily.progress['collect-grass']).toBe(0);
    expect(document.getElementById('toast')!.classList.contains('mission-reward')).toBe(true);
    expect(document.getElementById('missions-badge')!.hidden).toBe(true);expect(scene.recenter).not.toHaveBeenCalled();
    expect(decodeGame(data.get(SAVE_KEY)!)).toEqual({ok:true,state:state(controller)});
    ui.close();document.getElementById('open-missions')!.click();
    expect(button('Récompense réclamée',panel().querySelector('[data-mission="first-farm"]')!).disabled).toBe(true);
  });
  it('claims three daily rewards and the separate bonus through UI, then expires the cycle', () => {
    const initial=createGame(0);initial.grass=100;
    const {controller,ui,clock}=setup(initial);place(ui,'farm',1,0);
    controller.perform({type:'startOrder',id:'building-4',recipe:'medium'});
    clock.now=5*3600_000;controller.perform({type:'collectIncome',id:'building-1'});controller.perform({type:'collectOrder',id:'building-4'});
    for(let i=0;i<3;i++)controller.perform({type:'feed',id:'rabbit-2'});
    document.getElementById('open-missions')!.click();button('Quotidiennes').click();
    const card=(id:string)=>panel().querySelector<HTMLElement>(`[data-mission="${id}"]`)!;
    expect(panel().textContent).toContain('expirent');expect(panel().querySelector('.timer')!.textContent).toBe('19 h 0 min');
    expect(button('Réclamer · + 2 cœurs',card('daily-bonus')).disabled).toBe(true);
    for(const [id,label] of [['collect-pattes','30 pattes'],['collect-grass','10 herbes'],['gain-affection','20 pattes']])button(`Réclamer · + ${label}`,card(id)).click();
    expect(state(controller).missions.daily.progress).toEqual({'collect-pattes':120,'collect-grass':40,'gain-affection':3});
    const bonus=button('Réclamer · + 2 cœurs',card('daily-bonus'));bonus.click();bonus.click();
    expect(state(controller).hearts).toBe(14);expect(state(controller).nextHeartGiftAt).toBe(24*3600_000);
    expect(button('Récompense réclamée',card('daily-bonus')).disabled).toBe(true);
    clock.now=24*3600_000;controller.refresh();bonus.click();
    expect(state(controller).hearts).toBe(14);expect(state(controller).missions.daily.cycleIndex).toBe(1);
    expect(card('collect-pattes').textContent).toContain('Progression : 0 / 100');
    expect(button('Réclamer · + 2 cœurs',card('daily-bonus')).disabled).toBe(true);
  });
  it('invalidates a mission claim button after replacement by import',()=>{
    const initial=createGame(0);initial.missions.completed=['first-farm'];
    const {controller,ui}=setup(initial);document.getElementById('open-missions')!.click();
    const old=button('Réclamer · + 20 herbes',panel().querySelector('[data-mission="first-farm"]')!);
    const replacement=createGame(0);replacement.missions.completed=['first-farm'];replacement.grass=77;
    const p=controller.prepareImport(encodeGame(replacement));if(!p.ok)throw Error(p.reason);
    controller.confirmImport(p.token,true);ui.onReplacement();old.click();expect(state(controller)).toEqual(replacement);
  });
  it('keeps mission rewards and cycle renewals isolated in development mode',()=>{
    const normal=encodeGame(createGame(0)), values=new Map([[SAVE_KEY,normal]]);
    const base:SaveStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);}};
    const dev=developmentEnvironment(base), c=new GameController(dev.storage,dev.clock),dispose=dev.mount(c);
    expect(c.perform({type:'buyBuilding',kind:'farm',x:1,y:0}).ok).toBe(true);
    expect(c.perform({type:'claimMainMission',id:'first-farm'}).ok).toBe(true);
    expect(state(c).grass).toBe(30);button('+ 1440 min',document.getElementById('devtools')!).click();
    expect(state(c).missions.daily.cycleIndex).toBe(1);expect(state(c).missions.claimed).toEqual(['first-farm']);
    expect(values.get(SAVE_KEY)).toBe(normal);dispose();c.dispose();
  });
  it('recenters explicitly without changing the game or its placement', () => {
    const {controller, scene} = setup(); const perform = vi.spyOn(controller, 'perform');
    const before = state(controller); document.getElementById('recenter-view')!.click();
    expect(scene.recenter).toHaveBeenCalledOnce(); expect(perform).not.toHaveBeenCalled();
    expect(state(controller)).toEqual(before); expect(scene.setPlacement).not.toHaveBeenCalled();
  });
  it('cancels placement without executing a purchase or spending, then validates one purchase', () => {
    const {controller, ui, scene} = setup(); const perform = vi.spyOn(controller, 'perform');
    document.getElementById('open-shop')!.click(); button('Placer · 60 pattes').click();
    ui.select({kind: 'cell', x: 1, y: 0}); button('Annuler · aucun coût').click();
    expect(perform).not.toHaveBeenCalled(); expect(state(controller).pattes).toBe(300); expect(scene.setPlacement).toHaveBeenLastCalledWith(null);
    place(ui, 'farm', 1, 0); expect(perform).toHaveBeenCalledOnce(); expect(state(controller).pattes).toBe(240);
    expect(document.getElementById('pattes')!.textContent).toBe('240');
  });
  it('disables invalid cells and insufficient resources with a readable reason', () => {
    const {ui, controller} = setup(); document.getElementById('open-shop')!.click(); button('Placer · 60 pattes').click();
    ui.select({kind: 'cell', x: 0, y: 0}); expect(button('Acheter et placer · 60 pattes').disabled).toBe(true); expect(panel().textContent).toContain('occupée');
    ui.select({kind: 'cell', x: 3, y: 0}); expect(button('Acheter et placer · 60 pattes').disabled).toBe(true);
    expect(state(controller).pattes).toBe(300);
  });
  it('handles a stale enabled button through the controller without spending', () => {
    const {ui, controller} = setup(); document.getElementById('open-shop')!.click(); button('Placer · 60 pattes').click();
    ui.select({kind: 'cell', x: 1, y: 0}); const stale = button('Acheter et placer · 60 pattes');
    const replacement = createGame(0); replacement.pattes = 0;
    const candidate = controller.prepareImport(encodeGame(replacement)); if (!candidate.ok) throw new Error(candidate.reason);
    controller.confirmImport(candidate.token, true); stale.click();
    expect(document.getElementById('toast')!.textContent).toContain('Pas assez de pattes'); expect(state(controller).buildings).toHaveLength(1); expect(state(controller).pattes).toBe(0);
  });
  it('a double pressure on Feed performs exactly one action and updates the view', () => {
    const {ui, controller, scene} = setup(); const perform = vi.spyOn(controller, 'perform');
    ui.select({kind: 'rabbit', id: 'rabbit-2'}); button('Nourrir · 2 herbes').click(); button('Nourrir · 4 herbes').click();
    expect(perform).toHaveBeenCalledOnce(); expect(state(controller).rabbits[0].affection).toBe(2);
    expect(document.getElementById('grass')!.textContent).toBe('8'); expect(panel().textContent).toContain('Affection 2 / 20'); expect(scene.reactToFeed).toHaveBeenCalledWith('rabbit-2');
  });
  it('keeps incomplete saved species unknown in the collection', () => {
    const {ui} = setup(); ui.open({kind: 'collection'});
    expect(panel().textContent).not.toContain('Brumelin'); expect(panel().textContent).not.toContain('Mottelin');
    expect([...panel().querySelectorAll('h3')].filter(e => e.textContent === '???')).toHaveLength(9);
  });
  it.each(['feu', 'belier-gris', 'volant'] as const)('buys and welcomes %s from the six-common shop into the eleven-species collection', species => {
    const {controller, ui} = setup(); ui.open({kind: 'shop', tab: 'rabbits'});
    expect(panel().querySelectorAll('article')).toHaveLength(6);
    expect(panel().textContent).not.toMatch(/Lapin à Lunettes|Lapin Perroquet|Lapin Feu Glacé/);
    const card = [...panel().querySelectorAll('article')].find(c => c.querySelector('h3')?.textContent === SPECIES[species].name)!;
    button('Choisir un habitat · 80 pattes', card).click(); button('Enclos 1 · 2/3 · acheter 80 pattes').click();
    expect(state(controller).pattes).toBe(220); expect(state(controller).rabbits.at(-1)?.species).toBe(species);
    const dialog = document.getElementById('game-dialog')!; expect(dialog.textContent).toContain(SPECIES[species].name);
    button('Bienvenue dans la prairie', dialog).click(); ui.open({kind: 'collection'});
    expect(document.getElementById('panel-title')!.textContent).toBe('Collection · 3/11');
    expect(panel().textContent).toContain(SPECIES[species].name); expect(panel().querySelectorAll('article')).toHaveLength(11);
  });
  it('explains feeding in the notebook, previews 50/50 then 40/40/20, and prepares parents without launching', () => {
    const parsed = decodeGame(JSON.stringify(testSave), testSave.lastSimulatedAt); if (!parsed.ok) throw Error(parsed.reason);
    const initial = parsed.state; initial.pityFailures = 0;
    const {ui, controller} = setup(initial);
    const recipe = () => [...panel().querySelectorAll('article')].find(c => c.textContent?.includes('feu + neige · Rare'))!;
    ui.open({kind: 'collection'}); button('Carnet de reproduction').click();
    expect(panel().querySelectorAll('article')).toHaveLength(5); expect(panel().textContent).not.toContain('Lapin Feu Glacé');
    expect(recipe().textContent).toContain('Affection 4 minimum'); expect(recipe().textContent).toContain('À nourrir');
    expect(button('Préparer cette paire au nid', recipe()).disabled).toBe(true);
    button('Voir le parent n° 3 à nourrir', recipe()).click(); expect(panel().textContent).toContain('Affection 2 / 20');
    ui.select({kind: 'building', id: 'building-4'});
    const parentCard = (name: string) => [...panel().querySelectorAll('article')].find(c => c.querySelector('h3')?.textContent === name)!;
    button('Parent A', parentCard('Lapin Feu')).click(); button('Parent B', parentCard('Lapin Neige')).click();
    expect(panel().querySelector('details')!.open).toBe(true);
    expect(panel().querySelector('details')!.textContent).toContain('feu · Commun : 50 %');
    expect(panel().querySelector('details')!.textContent).not.toContain('feu + neige');
    for (const id of ['rabbit-3', 'rabbit-11']) for (let n = 0; n < 2; n++) expect(controller.perform({type: 'feed', id}).ok).toBe(true);
    expect(panel().querySelector('details')!.textContent).toContain('feu + neige · Rare : 20 %');
    expect(panel().querySelector('details')!.textContent).toContain('neige · Commun : 40 %');
    ui.open({kind: 'recipes'}); expect(recipe().textContent).toContain('Recette possible, résultat non garanti · 20 %');
    const before = state(controller), perform = vi.spyOn(controller, 'perform');
    button('Préparer cette paire au nid', recipe()).click(); expect(perform).not.toHaveBeenCalled(); expect(state(controller)).toEqual(before);
    expect(button('Lancer la reproduction · 20 pattes').disabled).toBe(false);
    expect(panel().textContent).toContain('Parent A : Lapin Neige · Parent B : Lapin Feu');
  });
  it('keeps a guaranteed new rare hidden through reproduction and growth, then discovers it on manual welcome', () => {
    const parsed = decodeGame(JSON.stringify(testSave), testSave.lastSimulatedAt); if (!parsed.ok) throw Error(parsed.reason);
    const initial = parsed.state;
    for (const r of initial.rabbits) r.affection = 4;
    const {ui, controller, clock, data} = setup(initial); clock.now = initial.lastSimulatedAt;
    ui.open({kind: 'recipes'});
    const recipe = [...panel().querySelectorAll('article')].find(c => c.textContent?.includes('feu + neige · Rare'))!;
    expect(recipe.textContent).toContain('Résultat garanti pour cette recette · 100 %');
    button('Préparer cette paire au nid', recipe).click(); button('Lancer la reproduction · 20 pattes').click();
    expect(panel().textContent).not.toContain('Lapin Feu Glacé'); expect(state(controller).pityFailures).toBe(0);
    const saved = decodeGame(data.get(SAVE_KEY)!); expect(saved.ok && saved.state.buildings.find(b => b.breeding)?.breeding?.birth).toMatchObject({species: 'feu-glace', guaranteed: true, reservedDiscovery: true});
    clock.now += 20 * 60_000; controller.refresh(); ui.select({kind: 'building', id: 'building-5'});
    expect(panel().textContent).not.toContain('Lapin Feu Glacé'); expect(panel().querySelector('.timer')!.textContent).toBe('30 min 0 s');
    button('Terminer · 6 cœurs').click(); const dialog = document.getElementById('game-dialog')!;
    expect(dialog.textContent).not.toContain('Lapin Feu Glacé'); button('Confirmer', dialog).click();
    expect(state(controller).hearts).toBe(6); expect(state(controller).discovered).not.toContain('feu-glace');
    expect(panel().textContent).toContain('Lapin Feu Glacé'); button('Enclos 3 · 0/3').click();
    expect(dialog.textContent).toContain('Nouvelle découverte'); expect(dialog.textContent).toContain('Lapin Feu Glacé');
    button('Bienvenue dans la prairie', dialog).click(); ui.open({kind: 'collection'});
    expect(document.getElementById('panel-title')!.textContent).toBe('Collection · 7/11');
    expect(decodeGame(data.get(SAVE_KEY)!)).toEqual({ok: true, state: state(controller)});
  });
  it('completes the farming, breeding, revealing, welcoming and movement loop through UI controls', () => {
    const initial = createGame(0); initial.pattes = 10_000; initial.grass = 500;
    const {ui, controller, clock, data} = setup(initial);
    ui.select({kind: 'rabbit', id: 'rabbit-2'}); button('Nourrir · 2 herbes').click();
    ui.select({kind: 'rabbit', id: 'rabbit-3'}); button('Nourrir · 2 herbes').click();
    place(ui, 'farm', 1, 0); place(ui, 'nest', 2, 0); place(ui, 'nursery', 0, 1); place(ui, 'enclosure', 1, 1);
    const find = (kind: string) => state(controller).buildings.find(b => b.kind === kind)!;
    ui.select({kind: 'building', id: find('farm').id}); button('Produire · 10 pattes').click();
    expect(button('Récolter 20 herbes').disabled).toBe(true); clock.now += 5 * 60_000; controller.refresh(); button('Récolter 20 herbes').click();
    expect(state(controller).grass).toBe(516);
    ui.select({kind: 'building', id: find('nest').id});
    const parentCard = (name: string) => [...panel().querySelectorAll<HTMLElement>('.card')].find(c => c.querySelector('h3')?.textContent === name)!;
    button('Parent A', parentCard('Lapin Paille')).click(); button('Parent B', parentCard('Lapin Neige')).click();
    button('Lancer la reproduction · 20 pattes').click(); expect(find('nest').breeding?.birth.species).toBe('brumelin'); expect(panel().textContent).not.toContain('Brumelin');
    clock.now += 20 * 60_000; controller.refresh(); ui.select({kind: 'building', id: find('nursery').id});
    expect(panel().textContent).toContain('secrète'); expect(panel().textContent).not.toContain('Brumelin');
    ui.open({kind: 'collection'}); expect(panel().textContent).not.toContain('Brumelin');
    clock.now += 15 * 60_000; controller.refresh(); ui.select({kind: 'building', id: find('nursery').id});
    expect(panel().textContent).toContain('Brumelin'); expect(state(controller).discovered).not.toContain('brumelin');
    button('Enclos 2 · 0/3').click(); expect(state(controller).discovered).toContain('brumelin');
    const dialog = document.getElementById('game-dialog') as HTMLDialogElement; expect(dialog.open).toBe(true); expect(dialog.textContent).toContain('Nouvelle découverte');
    button('Bienvenue dans la prairie', dialog).click();
    const newborn = state(controller).rabbits.at(-1)!;
    ui.select({kind: 'rabbit', id: newborn.id}); expect(button('Confier ce lapin').disabled).toBe(true);
    button('Changer d’habitat').click(); button('Enclos 1 · 2/3').click(); expect(state(controller).rabbits.at(-1)!.enclosureId).toBe('building-1');
    ui.select({kind: 'extension'}); button('Acheter l’extension · 500 pattes').click(); button('Confirmer', document.getElementById('game-dialog')!).click(); expect(state(controller).expanded).toBe(true);
    ui.select({kind: 'building', id: find('farm').id}); button('Déplacer ce bâtiment').click(); ui.select({kind: 'cell', x: 5, y: 1}); button('Confirmer le déplacement · gratuit').click(); expect(find('farm').x).toBe(5);
    ui.open({kind: 'shop', tab: 'rabbits'});
    const earthCard = [...panel().querySelectorAll<HTMLElement>('.card')].find(c => c.querySelector('h3')?.textContent === 'Lapin Terre')!;
    button('Choisir un habitat · 80 pattes', earthCard).click(); button('Enclos 2 · 0/3 · acheter 80 pattes').click();
    expect(dialog.open).toBe(true); expect(dialog.textContent).toContain('Lapin Terre'); button('Bienvenue dans la prairie', dialog).click();
    expect(decodeGame(data.get(SAVE_KEY)!)).toEqual({ok: true, state: state(controller)});
  });
  it('requires confirmation to release an eligible duplicate and keeps the last representative', () => {
    const initial = createGame(0); initial.pattes = 1000;
    const {ui, controller} = setup(initial); document.getElementById('open-shop')!.click(); button('Lapins').click();
    const card = [...panel().querySelectorAll<HTMLElement>('.card')].find(c => c.textContent?.includes('Lapin Paille'))!;
    button('Choisir un habitat · 80 pattes', card).click(); button('Enclos 1 · 2/3 · acheter 80 pattes').click();
    const duplicate = state(controller).rabbits.at(-1)!; ui.select({kind: 'rabbit', id: duplicate.id}); button('Confier ce lapin').click();
    const dialog = document.getElementById('game-dialog') as HTMLDialogElement; button('Annuler', dialog).click(); expect(state(controller).rabbits).toHaveLength(3);
    button('Confier ce lapin').click(); button('Confirmer', dialog).click(); expect(state(controller).rabbits).toHaveLength(2);
    ui.select({kind: 'rabbit', id: 'rabbit-2'}); expect(button('Confier ce lapin').disabled).toBe(true);
  });
  it('retains persistent save warnings and the settings import/export controls', () => {
    const {controller, ui, storage, clock} = setup(); storage.setItem = () => { throw new Error('quota'); }; clock.now = 1000; controller.refresh();
    expect(document.getElementById('save-warning')!.hidden).toBe(false); ui.open({kind: 'settings'});
    expect(document.getElementById('settings-content')!.hidden).toBe(false); expect((document.getElementById('export-game') as HTMLButtonElement).disabled).toBe(false);
    expect(document.getElementById('save-status')!.textContent).toContain('ne sont pas sauvegardées');
  });
  it('refreshes active panels on a controller resume', () => {
    const {controller, ui, clock} = setup(); place(ui, 'farm', 1, 0);
    const farm = state(controller).buildings.find(b => b.kind === 'farm')!; ui.select({kind: 'building', id: farm.id}); button('Produire · 10 pattes').click();
    expect(button('Récolter 20 herbes').disabled).toBe(true); clock.now = 3600_000; controller.refresh();
    expect(button('Récolter 20 herbes').disabled).toBe(false); expect(panel().querySelector('.timer')!.textContent).toBe('Prêt');
  });
  it('imports through the file input with preview, cancellation and confirmed replacement', async () => {
    const {ui, controller, scene} = setup(); ui.open({kind: 'settings'});
    const imported = createGame(0); imported.pattes = 777;
    const file = new File([encodeGame(imported)], 'backup.json', {type: 'application/json'});
    const input = document.getElementById('import-file') as HTMLInputElement;
    const select = () => {
      document.getElementById('import-game')!.click();
      Object.defineProperty(input, 'files', {value: [file], configurable: true});
      input.dispatchEvent(new Event('change'));
    };
    select();
    const dialog = document.getElementById('import-dialog') as HTMLDialogElement;
    await vi.waitFor(() => expect(dialog.open).toBe(true));
    expect(document.getElementById('import-summary')!.textContent).toContain('777 pattes');
    expect(state(controller).pattes).toBe(300); document.getElementById('cancel-import')!.click(); expect(state(controller).pattes).toBe(300);
    select(); await vi.waitFor(() => expect(dialog.open).toBe(true)); document.getElementById('confirm-import')!.click();
    expect(state(controller).pattes).toBe(777); expect(document.getElementById('pattes')!.textContent).toBe('777');
    expect(scene.setPlacement).toHaveBeenLastCalledWith(null); expect(dialog.open).toBe(false);
  });
  it('opens the hearts counter and claims a free gift only once after 24 hours', () => {
    const {controller, clock} = setup(); document.getElementById('open-hearts')!.click();
    expect(document.getElementById('hearts')!.textContent).toBe('12');
    expect(button('Réclamer · +2 cœurs gratuits').disabled).toBe(true);
    clock.now = 24 * 3600_000; controller.refresh();
    const claim = button('Réclamer · +2 cœurs gratuits'); claim.click(); claim.click();
    expect(state(controller).hearts).toBe(14); expect(document.getElementById('hearts')!.textContent).toBe('14');
    expect(button('Réclamer · +2 cœurs gratuits').disabled).toBe(true);
  });
  it('defers building payment to final placement, supports both cancellations and confirms only once', () => {
    const initial = createGame(0); initial.pattes = 30; const {controller, ui} = setup(initial);
    document.getElementById('open-shop')!.click(); button('Placer · 60 pattes').click();
    ui.select({kind: 'cell', x: 0, y: 0}); expect(panel().textContent).not.toContain('Compléter');
    ui.select({kind: 'cell', x: 1, y: 0}); button('Annuler · aucun coût').click();
    expect(state(controller)).toEqual(initial);
    document.getElementById('open-shop')!.click(); button('Placer · 60 pattes').click(); ui.select({kind: 'cell', x: 1, y: 0});
    button('Compléter · 30 pattes + 2 cœurs').click();
    const dialog = document.getElementById('game-dialog')!;
    expect(dialog.textContent).toContain('case 2, 1'); expect(dialog.textContent).toContain('30 pattes manquantes');
    button('Annuler', dialog).click(); expect(state(controller)).toEqual(initial);
    button('Compléter · 30 pattes + 2 cœurs').click(); const confirm = button('Confirmer', dialog); confirm.click(); confirm.click();
    expect(state(controller)).toMatchObject({pattes: 0, hearts: 10}); expect(state(controller).buildings).toHaveLength(2);
  });
  it('confirms the actual lower acceleration price and ignores a duplicate confirmation', () => {
    const {controller, ui, clock} = setup(); place(ui, 'farm', 1, 0); ui.select({kind: 'building', id: 'building-4'});
    button('Produire · 18 pattes').click(); button('Terminer · 3 cœurs').click();
    const dialog = document.getElementById('game-dialog')!; expect(dialog.textContent).toContain('solde : 12');
    clock.now = 11 * 60_000; const confirm = button('Confirmer', dialog); confirm.click(); confirm.click();
    expect(state(controller).hearts).toBe(11); expect(state(controller).grass).toBe(10);
    expect(panel().textContent).not.toContain('Terminer ·'); expect(button('Récolter 40 herbes').disabled).toBe(false);
    expect(document.getElementById('toast')!.textContent).toContain('1 cœur');
  });
  it('does not spend after acceleration cancellation or normal completion before confirmation', () => {
    const {controller, ui, clock} = setup(); place(ui, 'farm', 1, 0); ui.select({kind: 'building', id: 'building-4'});
    button('Produire · 10 pattes').click(); button('Terminer · 1 cœur').click();
    const dialog = document.getElementById('game-dialog')!; button('Annuler', dialog).click(); expect(state(controller).hearts).toBe(12);
    button('Terminer · 1 cœur').click(); clock.now = 5 * 60_000; button('Confirmer', dialog).click();
    expect(state(controller).hearts).toBe(12); expect(document.getElementById('toast')!.textContent).toContain('aucun cœur');
  });
  it('explains insufficient hearts and never offers them for feeding', () => {
    const initial = createGame(0); initial.hearts = 0; initial.pattes = 30; initial.grass = 0;
    const {ui} = setup(initial); document.getElementById('open-shop')!.click(); button('Placer · 60 pattes').click(); ui.select({kind: 'cell', x: 1, y: 0});
    expect(button('Compléter · 30 pattes + 2 cœurs').disabled).toBe(true); expect(panel().textContent).toContain('Pas assez de cœurs');
    document.getElementById('close-panel')!.click(); ui.select({kind: 'rabbit', id: 'rabbit-2'});
    expect(button('Nourrir · 2 herbes').disabled).toBe(true); expect(panel().textContent).not.toContain('Compléter');
  });
  it('offers explicit complements for rabbits, extension, farm orders and breeding', () => {
    const initial = createGame(0); initial.pattes = 0; initial.hearts = 100;
    const {ui, controller, clock} = setup(initial);
    const confirm = () => button('Confirmer', document.getElementById('game-dialog')!).click();
    ui.open({kind: 'buyRabbit', species: 'terre'}); button('Compléter · 0 pattes + 4 cœurs').click(); confirm();
    expect(state(controller).rabbits).toHaveLength(3);
    button('Bienvenue dans la prairie', document.getElementById('game-dialog')!).click();
    ui.open({kind: 'extension'}); button('Compléter · 0 pattes + 20 cœurs').click(); confirm(); expect(state(controller).expanded).toBe(true);
    const build = (kind: 'farm' | 'nest' | 'nursery', price: number, hearts: number, x: number) => {
      document.getElementById('open-shop')!.click(); button(`Placer · ${price} pattes`).click(); ui.select({kind: 'cell', x, y: 0});
      button(`Compléter · 0 pattes + ${hearts} cœurs`).click(); confirm();
      expect(state(controller).buildings.find(b => b.x === x && b.y === 0)?.kind).toBe(kind);
    };
    build('farm', 60, 3, 1); build('nest', 100, 4, 2); build('nursery', 80, 4, 3);
    const farm = state(controller).buildings.find(b => b.kind === 'farm')!;
    ui.select({kind: 'building', id: farm.id}); button('Compléter · 0 pattes + 1 cœur').click(); confirm(); expect(state(controller).buildings.find(b => b.id === farm.id)!.order).not.toBeNull();
    controller.perform({type: 'feed', id: 'rabbit-2'}); controller.perform({type: 'feed', id: 'rabbit-3'});
    const nest = state(controller).buildings.find(b => b.kind === 'nest')!; ui.select({kind: 'building', id: nest.id});
    const cards = [...panel().querySelectorAll('article')]; button('Parent A', cards[0]).click(); button('Parent B', panel().querySelectorAll('article')[1]).click();
    button('Compléter · 0 pattes + 1 cœur').click(); confirm();
    expect(state(controller).buildings.find(b => b.id === nest.id)!.breeding).not.toBeNull();
    button('Terminer · 4 cœurs').click(); confirm(); expect(panel().textContent).not.toContain('Brumelin');
    clock.now = 1; const nursery = state(controller).buildings.find(b => b.kind === 'nursery')!;
    ui.select({kind: 'building', id: nursery.id}); expect(panel().textContent).not.toContain('Brumelin');
    expect(panel().textContent).not.toContain('Terminer ·'); // all three enclosure places are occupied
    expect(panel().textContent).toContain('Libérez une place');
  });
  it('accelerates reproduction and growth separately without revealing the birth early or welcoming it', () => {
    const {ui, controller} = setup(); place(ui, 'nest', 1, 0); place(ui, 'nursery', 2, 0);
    controller.perform({type: 'feed', id: 'rabbit-2'}); controller.perform({type: 'feed', id: 'rabbit-3'});
    controller.perform({type: 'breed', parents: ['rabbit-2', 'rabbit-3']}); ui.select({kind: 'building', id: 'building-4'});
    const dialog = document.getElementById('game-dialog')!;
    button('Terminer · 4 cœurs').click(); expect(dialog.textContent).not.toContain('Brumelin'); button('Confirmer', dialog).click();
    ui.select({kind: 'building', id: 'building-5'}); expect(panel().textContent).not.toContain('Brumelin');
    expect(state(controller).hearts).toBe(8); button('Terminer · 3 cœurs').click(); button('Confirmer', dialog).click();
    expect(panel().textContent).toContain('Brumelin'); expect(state(controller).hearts).toBe(5);
    expect(state(controller).rabbits).toHaveLength(2); expect(state(controller).discovered).not.toContain('brumelin');
    button('Enclos 1 · 2/3').click(); expect(state(controller).discovered).toContain('brumelin');
  });
  it('invalidates a pending heart confirmation after a successful import', () => {
    const {controller, ui} = setup(); place(ui, 'farm', 1, 0); ui.select({kind: 'building', id: 'building-4'});
    button('Produire · 10 pattes').click(); button('Terminer · 1 cœur').click();
    const stale = button('Confirmer', document.getElementById('game-dialog')!);
    const replacement = createGame(0); replacement.hearts = 7;
    const preview = controller.prepareImport(encodeGame(replacement)); if (!preview.ok) throw new Error(preview.reason);
    controller.confirmImport(preview.token, true); ui.onReplacement(); stale.click(); expect(state(controller)).toEqual(replacement);
  });
  it('isolates the development clock and saves from the normal game', () => {
    const values = new Map<string, string>([[SAVE_KEY, encodeGame(createGame(0))]]);
    const base: SaveStorage = {getItem: k => values.get(k) ?? null, setItem: (k, v) => { values.set(k, v); }};
    const before = values.get(SAVE_KEY), dev = developmentEnvironment(base);
    const controller = new GameController(dev.storage, dev.clock); const dispose = dev.mount(controller);
    const time = state(controller).lastSimulatedAt; button('+ 60 min', document.getElementById('devtools')!).click();
    expect(state(controller).lastSimulatedAt - time).toBeGreaterThanOrEqual(3600_000);
    button('+ 1440 min', document.getElementById('devtools')!).click();
    expect(controller.perform({type: 'claimHearts'}).ok).toBe(true); expect(state(controller).hearts).toBe(14);
    expect(values.get(SAVE_KEY)).toBe(before); expect(values.has('prairie-lapins.development.' + SAVE_KEY)).toBe(true);
    dispose(); controller.dispose();
  });
});

describe('habitat panels and controller transactions',()=>{
  const dialog=()=>document.getElementById('game-dialog')!;
  const card=(name:string)=>[...panel().querySelectorAll<HTMLElement>('.card')].find(c=>c.querySelector('h3')?.textContent===name)!;
  it('separates the shop categories and six habitats; canceled placements/heart confirmations spend nothing',()=>{
    const initial=createGame(0);initial.pattes=30;const {controller,ui}=setup(initial);
    const choose=()=>{ui.open({kind:'shop',tab:'buildings'});button('Placer · 200 pattes',card('Jardin des airs')).click();};
    ui.open({kind:'shop',tab:'buildings'});
    expect(panel().textContent).toContain('Enclos universel');expect(panel().textContent).toContain('Habitats spécialisés');expect(panel().textContent).toContain('Production et reproduction');
    for(const name of ['Prairie de paille','Jardin enneigé','Terrier de terre','Clairière de feu','Atelier de métal','Jardin des airs']){
      expect(card(name).textContent).toContain('3 places · stocke 900 pattes');expect(button('Placer · 200 pattes',card(name)).disabled).toBe(false);
    }
    choose();ui.select({kind:'cell',x:0,y:0});expect(panel().textContent).not.toContain('Compléter');
    ui.select({kind:'cell',x:1,y:0});button('Annuler · aucun coût').click();expect(state(controller)).toEqual(initial);
    choose();ui.select({kind:'cell',x:1,y:0});button('Compléter · 30 pattes + 7 cœurs').click();
    button('Annuler',dialog()).click();expect(state(controller)).toEqual(initial);
    button('Compléter · 30 pattes + 7 cœurs').click();const confirmation=button('Confirmer',dialog());confirmation.click();confirmation.click();
    expect(state(controller)).toMatchObject({pattes:0,hearts:5});expect(state(controller).buildings[1].habitat).toEqual({type:'vol',level:1});
  });
  it('shows level, type, rate, capacities and upgrade details, with explicit cancellation and one-shot confirmation',()=>{
    const initial=createGame(0);initial.pattes=2000;const {controller,ui,scene}=setup(initial);
    const home=()=>state(controller).buildings[0];ui.select({kind:'building',id:home().id});
    expect(panel().textContent).toContain('Tous les types · niveau 1');expect(panel().textContent).toContain('24 pattes / h');
    expect(panel().textContent).toContain('2 / 3 places · 0 / 600 pattes');expect(panel().textContent).toContain('Niveau 2 : 5 places · plafond 900 pattes');
    button('Améliorer · 200 pattes').click();button('Annuler',dialog()).click();expect(state(controller)).toEqual(initial);
    button('Améliorer · 200 pattes').click();const confirm=button('Confirmer',dialog());confirm.click();confirm.click();
    expect(home().habitat!.level).toBe(2);expect(state(controller).pattes).toBe(1800);expect(panel().textContent).toContain('2 / 5 places · 0 / 900');
    button('Améliorer · 400 pattes').click();button('Confirmer',dialog()).click();
    expect(home().habitat!.level).toBe(3);expect(state(controller).pattes).toBe(1400);expect(panel().textContent).toContain('Niveau maximal atteint.');
    expect(panel().textContent).not.toContain('Améliorer ·');expect(scene.recenter).not.toHaveBeenCalled();
  });
  it('explains incompatible and full destinations for purchases and moves while allowing a compatible choice',()=>{
    const initial=createGame(0);initial.pattes=5000;const {controller,ui}=setup(initial);
    controller.perform({type:'buyBuilding',kind:'enclosure',habitatType:'feu',x:1,y:0});
    controller.perform({type:'buyBuilding',kind:'enclosure',habitatType:'neige',x:2,y:0});
    const snow=state(controller).buildings[2].id;
    for(let i=0;i<3;i++)controller.perform({type:'buyRabbit',species:'neige',enclosureId:snow});
    ui.open({kind:'buyRabbit',species:'neige'});
    expect(card('Clairière de feu 2').textContent).toContain('Feu');expect(card('Clairière de feu 2').textContent).toContain('Type incompatible.');
    expect(card('Jardin enneigé 3').textContent).toContain('Habitat plein.');
    expect(button('Clairière de feu 2 · 0/3 · acheter 80 pattes').disabled).toBe(true);expect(button('Jardin enneigé 3 · 3/3 · acheter 80 pattes').disabled).toBe(true);
    controller.perform({type:'upgradeHabitat',id:snow,fromLevel:1});
    ui.select({kind:'rabbit',id:'rabbit-3'});button('Changer d’habitat').click();
    expect(panel().textContent).toContain('Feu');expect(button('Clairière de feu 2 · 0/3').disabled).toBe(true);
    button('Jardin enneigé 3 · 3/5').click();expect(state(controller).rabbits[1].enclosureId).toBe(snow);
  });
  it('pays specialized upgrades with an explicit heart complement and invalidates old confirmations after import',()=>{
    const initial=createGame(0);initial.pattes=230;initial.hearts=50;const {controller,ui}=setup(initial);
    controller.perform({type:'buyBuilding',kind:'enclosure',habitatType:'metal',x:1,y:0});const home=state(controller).buildings[1].id;
    ui.select({kind:'building',id:home});expect(panel().textContent).toContain('Métal · niveau 1');
    button('Compléter · 30 pattes + 11 cœurs').click();expect(dialog().textContent).toContain('5 places · plafond 1500');button('Confirmer',dialog()).click();
    expect(state(controller)).toMatchObject({pattes:0,hearts:39});expect(state(controller).buildings[1].habitat!.level).toBe(2);
    button('Compléter · 0 pattes + 24 cœurs').click();const old=button('Confirmer',dialog());
    const replacement=state(controller);const p=controller.prepareImport(encodeGame(replacement));if(!p.ok)throw Error(p.reason);controller.confirmImport(p.token,true);ui.onReplacement();old.click();
    expect(state(controller)).toEqual(replacement);
  });
  it('confirms the second expansion, supports cancellation and keeps the first-extension mission claimed',()=>{
    const initial=createGame(0);initial.pattes=3000;const {controller,ui,scene}=setup(initial);
    controller.perform({type:'expand'});controller.perform({type:'claimMainMission',id:'bigger-meadow'});const before=state(controller);
    ui.open({kind:'extension'});expect(panel().textContent).toContain('terrain 9 × 2');
    button('Acheter l’extension · 1000 pattes').click();button('Annuler',dialog()).click();expect(state(controller)).toEqual(before);
    button('Acheter l’extension · 1000 pattes').click();const confirm=button('Confirmer',dialog());confirm.click();confirm.click();
    expect(state(controller).secondExpanded).toBe(true);expect(state(controller).pattes).toBe(before.pattes-1000);expect(state(controller).missions).toEqual(before.missions);
    expect(scene.recenter).not.toHaveBeenCalled();ui.open({kind:'extension'});expect(panel().textContent).toContain('Les deux extensions sont achetées');
  });
  it('uses the development storage and clock for new habitat actions without changing normal progression',()=>{
    const normal=encodeGame(createGame(0)),values=new Map([[SAVE_KEY,normal]]),base:SaveStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v);}};
    const dev=developmentEnvironment(base),c=new GameController(dev.storage,()=>0);cleanups.push(()=>c.dispose());
    expect(c.perform({type:'buyBuilding',kind:'enclosure',habitatType:'paille',x:1,y:0}).ok).toBe(true);
    expect(c.perform({type:'payWithHearts',action:{type:'upgradeHabitat',id:'building-4',fromLevel:1},maxPattes:100,maxHearts:8}).ok).toBe(true);
    expect(state(c).buildings[1].habitat).toEqual({type:'paille',level:2});expect(values.get(SAVE_KEY)).toBe(normal);
    expect(JSON.parse(values.get('prairie-lapins.development.'+SAVE_KEY)!).version).toBe(5);
  });
});
