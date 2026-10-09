import {PARCELS, PARCEL_IDS, extensionPrice, type ParcelId} from '../config/land';
import type {Building} from '../state/types';
import {HABITATS, HABITAT_TYPES, habitatLevel, habitatPrice, type HabitatType, type HabitatLevel} from '../config/habitats';
import {habitatStats, habitatName, habitatEntryReason} from '../simulation/habitats';
import {MAIN_MISSION_IDS, MAIN_MISSIONS, DAILY_MISSION_IDS, DAILY_MISSIONS, DAILY_BONUS, type Reward} from '../config/missions';
import {availableMissionRewards, mainProgress, dailyCycleStart, dailyCycleEnd, cycleIndexAt} from '../simulation/missions';
import type {GameController, Snapshot} from '../application/GameController';
import {BALANCE, HEARTS, ORDERS, SPECIES, SPECIES_IDS, SHOP_SPECIES, growthDuration, type BuildingKind, type SpeciesId, type OrderId, type RabbitType} from '../config/balance';
import type {Command, DecorationLocation, GameState, PattesCommand, TimedStage} from '../state/types';
import {DECORATIONS, DECORATION_IDS, decorationResalePrice, type DecorationId} from '../config/decorations';
import {decorationPlacementReason, decorationsInCell, purchaseDecorationReason} from '../simulation/decorations';
import {decorationSvg} from '../display/decorationArt';
import {quoteComplement} from '../simulation/actions';
import {accelerationCost, quoteAcceleration} from '../simulation/hearts';
import {rabbitIncome} from '../simulation/time';
import type {MeadowScene, MeadowSelection} from '../display/MeadowScene';
import {ActionGate} from './gestures';
import {portrait} from './portraits';
import {PreferenceStore, Sounds} from './preferences';
import {BUILDING_NAMES, REFUSALS, RARITY_NAMES, TYPE_NAMES, typeNames, recipeBook, buildingReason, collectionView, incomeWhole, moneyReason, nurseryView, occupants, oddsView, placementReason, rabbitAvailability, releaseReason, timeLeft, tutorialStep, type Placement, type CollectionFilter} from './models';

type View = {kind: 'missions'; tab: 'main' | 'daily'} | {kind: 'shop'; tab: 'buildings' | 'rabbits' | 'decorations'} | {kind: 'building' | 'rabbit' | 'moveRabbit' | 'decoration'; id: string} |
  {kind: 'buyRabbit' | 'species'; species: SpeciesId} | {kind:'extension';parcelId?:ParcelId} | {kind: 'collection' | 'settings' | 'placement' | 'hearts' | 'recipes' | 'arrange' | 'decorationPlacement'} | null;
function node<K extends keyof HTMLElementTagNameMap>(tag: K, text = '', className = ''): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag); element.textContent = text; element.className = className; return element;
}
const rewardLabel = (r: Reward) => `${r.amount} ${{pattes: 'pattes', grass: 'herbes', hearts: r.amount === 1 ? 'cœur' : 'cœurs'}[r.resource]}`;
const heartAmount = (n: number) => `${n} ${n === 1 ? 'cœur' : 'cœurs'}`;
function avatar(species?: SpeciesId, large = false): HTMLElement {
  const element = node('span', '', large ? 'portrait large' : 'portrait'); element.innerHTML = portrait(species); return element;
}
export class GameUI {
  private view: View = null;
  private placement: Placement | null = null;
  private parents: [string | null, string | null] = [null, null];
  private snapshot: Snapshot;
  private unsubscribe: () => void;
  private panel = document.getElementById('game-panel')!;
  private content = document.getElementById('panel-content')!;
  private title = document.getElementById('panel-title')!;
  private settings = document.getElementById('settings-content')!;
  private toast = document.getElementById('toast')!;
  private tutorial = document.getElementById('tutorial')!;
  private dialog = document.getElementById('game-dialog') as HTMLDialogElement;
  private gate = new ActionGate();
  private sounds: Sounds;
  private toastTimer = 0;
  private frame = 0;
  private abort = new AbortController();
  private oddsOpen = true;
  private collectionFilter: CollectionFilter = {};
  private recipeDetails = new Set<SpeciesId>();
  private lastSecond = -1;
  private confirmationGeneration = 0;
  private arranging = false;
  private decorationDraft: {id: string; location: DecorationLocation | null; rotation: 0 | 1;} | null = null;
  private photo = false;
  constructor(private controller: GameController, private scene: MeadowScene, private clock: () => number, private preferences: PreferenceStore) {
    this.snapshot = controller.getSnapshot(); this.sounds = new Sounds(preferences);
    const options = {signal: this.abort.signal};
    document.getElementById('open-expand')!.addEventListener('click', () => this.open({kind:'extension'}), options);
    document.getElementById('open-arrange')!.addEventListener('click', () => this.open({kind: 'arrange'}), options);
    document.getElementById('exit-arrange')!.addEventListener('click', () => this.close(), options);
    document.getElementById('open-photo')!.addEventListener('click', () => this.setPhoto(true), options);
    document.getElementById('photo-return')!.addEventListener('click', () => this.setPhoto(false), options);
    document.getElementById('open-missions')!.addEventListener('click', () => this.open({kind: 'missions', tab: 'main'}), options);
    document.getElementById('recenter-view')!.addEventListener('click', () => this.scene.recenter(), options);
    document.getElementById('open-hearts')!.addEventListener('click', () => this.open({kind: 'hearts'}), options);
    document.getElementById('open-shop')!.addEventListener('click', () => this.open({kind: 'shop', tab: 'buildings'}), options);
    document.getElementById('open-collection')!.addEventListener('click', () => this.open({kind: 'collection'}), options);
    document.getElementById('open-settings')!.addEventListener('click', () => this.open({kind: 'settings'}), options);
    document.getElementById('save-warning')!.addEventListener('click', () => this.open({kind: 'settings'}), options);
    document.getElementById('close-panel')!.addEventListener('click', () => this.close(), options);
    document.getElementById('sound-toggle')!.addEventListener('click', () => { preferences.set({muted: !preferences.value.muted}); this.renderPreferences(); }, options);
    document.getElementById('tutorial-toggle')!.addEventListener('click', () => { preferences.set({tutorial: !preferences.value.tutorial, tutorialDone: false}); this.renderPreferences(); this.renderTutorial(); }, options);
    this.dialog.addEventListener('cancel', () => { this.dialog.replaceChildren(); }, options);
    this.unsubscribe = controller.subscribe(snapshot => {
      const replaced = this.snapshot && snapshot.generation !== this.snapshot.generation;
      this.snapshot = snapshot;
      if (replaced) this.onReplacement();
      if (!snapshot.state) this.view = {kind: 'settings'};
      const warning = document.getElementById('save-warning')!;
      warning.hidden = snapshot.status === 'saved';
      warning.textContent = snapshot.state ? 'Sauvegarde non enregistrée · Paramètres' : 'Partie non chargée · Paramètres';
      this.render(); this.renderTutorial();
    });
    this.renderPreferences();
    // Countdown text is a projection of timestamps; the controller alone advances the simulation.
    const animate = () => {
      const second = Math.floor(this.clock() / 1000);
      if (second !== this.lastSecond && !document.hidden) { this.lastSecond = second; this.updateTimers(); }
      this.frame = requestAnimationFrame(animate);
    };
    this.frame = requestAnimationFrame(animate);
  }
  private now(): number { return Math.max(this.clock(), this.snapshot.state?.lastSimulatedAt ?? 0); }
  private renderPreferences(): void {
    document.getElementById('sound-toggle')!.textContent = this.preferences.value.muted ? 'Sons : coupés' : 'Sons : activés';
    document.getElementById('tutorial-toggle')!.textContent = this.preferences.value.tutorial ? 'Désactiver le tutoriel' : 'Activer le tutoriel';
  }
  private notice(message: string): void {
    this.toast.classList.remove('mission-reward');
    this.toast.textContent = message; this.toast.hidden = false; window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => { this.toast.hidden = true; }, 4300);
  }
  private button(parent: HTMLElement, label: string, action: () => void, reason: string | null = null, secondary = false): HTMLButtonElement {
    const button = node('button', label, secondary ? 'secondary' : ''); button.type = 'button'; button.disabled = !!reason;
    button.onclick = action; parent.append(button);
    if (reason) parent.append(node('p', reason, 'reason'));
    return button;
  }
  private execute(command: Command, success: string | ((value?: string | number) => string), after?: () => void): void {
    this.gate.run(JSON.stringify(command), () => {
      const result = this.controller.perform(command);
      if (!result.ok) { this.notice(REFUSALS[result.reason]); this.render(); return; }
      this.sounds.ping(); this.notice(typeof success === 'function' ? success(result.value) : success); after?.(); this.render();
    });
  }
  private card(title: string, description = '', species?: SpeciesId): HTMLElement {
    const card = node('article', '', 'card');
    const heading = node('div', '', 'card-heading'); if (species) heading.append(avatar(species));
    const text = node('div'); text.append(node('h3', title)); if (description) text.append(node('p', description)); heading.append(text); card.append(heading);
    return card;
  }
  open(view: NonNullable<View>): void {
    if (this.dialog.open || (document.getElementById('import-dialog') as HTMLDialogElement).open) return;
    if (this.placement && view.kind !== 'placement') { this.placement = null; this.scene.setPlacement(null); }
    const decorationView = ['arrange', 'decorationPlacement', 'decoration'].includes(view.kind);
    if (!decorationView) { this.arranging = false; this.decorationDraft = null; }
    else if (view.kind !== 'decoration') this.arranging = true;
    if (view.kind !== 'decorationPlacement') this.decorationDraft = null;
    this.content.scrollTop = 0;
    this.view = view; this.scene.setExpansion(view.kind==='extension',view.kind==='extension'?view.parcelId:undefined); this.syncArrangement(); this.controller.refresh(); this.render();
  }
  close(): void {
    if (this.dialog.open || (document.getElementById('import-dialog') as HTMLDialogElement).open) return;
    this.scene.setExpansion(false); this.view = null; this.placement = null; this.arranging = false; this.decorationDraft = null; this.scene.setPlacement(null); this.syncArrangement(); this.render();
  }
  onReplacement(): void {
    this.scene.setExpansion(false);
    this.confirmationGeneration++;
    this.arranging = false; this.decorationDraft = null; this.setPhoto(false); this.syncArrangement();
    this.parents = [null, null]; this.placement = null; this.scene.setPlacement(null);
    if (this.dialog.open) this.dialog.close(); this.dialog.replaceChildren();
    this.view = {kind: 'settings'}; this.syncArrangement(); this.render();
  }
  select(selection: MeadowSelection): void {
    if (this.photo) return;
    if (this.dialog.open || (document.getElementById('import-dialog') as HTMLDialogElement).open) return;
    if (selection.kind === 'income') { this.execute({type: 'collectIncome', id: selection.id}, value => `+ ${value} pattes`); return; }
    if (selection.kind === 'grass') { this.execute({type: 'collectOrder', id: selection.id}, value => `+ ${value} herbes`); return; }
    // A ready nursery bubble opens its ordinary actions, including during arrangement.
    if (this.arranging && selection.kind === 'building' && this.snapshot.state?.buildings.find(b => b.id === selection.id)?.kind !== 'enclosure') {
      this.open({kind: 'building', id: selection.id}); return;
    }
    if (this.arranging) { this.selectDecoration(selection); return; }
    if (selection.kind === 'decoration') { this.open({kind: 'decoration', id: selection.id}); return; }
    if (selection.kind === 'fineCell') return;
    if (selection.kind === 'cell') {
      if (this.placement) { this.placement.cell = {x: selection.x, y: selection.y}; this.scene.setPlacement(this.placement); this.render(); }
      return;
    }
    if (selection.kind === 'empty') { this.close(); return; }
    if (selection.kind === 'extension') this.open({kind: 'extension',parcelId:selection.parcelId});
    else if (selection.kind === 'building' || selection.kind === 'rabbit') this.open({kind: selection.kind, id: selection.id});
  }
  private render(): void {
    this.renderTutorial();
    const available = this.snapshot.state ? availableMissionRewards(this.snapshot.state) : 0;
    const badge = document.getElementById('missions-badge')!;
    badge.hidden = !available; badge.textContent = String(available);
    document.getElementById('open-missions')!.setAttribute('aria-label', available ? `Missions · ${available} récompense(s) disponible(s)` : 'Missions');
    const scroll = this.content.scrollTop;
    const placedListOpen = this.content.querySelector<HTMLDetailsElement>('[data-placed-list]')?.open ?? false;
    const focusId = (document.activeElement as HTMLElement | null)?.dataset.focus;
    this.panel.hidden = !this.view;
    this.settings.hidden = this.view?.kind !== 'settings'; this.content.hidden = this.view?.kind === 'settings';
    this.content.replaceChildren(); if (!this.view) return;
    if (this.view.kind === 'settings') { this.title.textContent = 'Paramètres'; return; }
    const s = this.snapshot.state; if (!s) { this.title.textContent = 'Partie indisponible'; return; }
    switch (this.view.kind) {
      case 'missions': this.renderMissions(s, this.view.tab); break;
      case 'hearts': this.renderHearts(s); break;
      case 'shop': this.renderShop(s, this.view.tab); break;
      case 'building': this.renderBuilding(s, this.view.id); break;
      case 'rabbit': this.renderRabbit(s, this.view.id); break;
      case 'moveRabbit': this.renderDestinations(s, this.view.id); break;
      case 'buyRabbit': this.renderBuyRabbit(s, this.view.species); break;
      case 'recipes': this.renderRecipes(s); break;
      case 'collection': this.renderCollection(s); break;
      case 'species': this.renderSpecies(s, this.view.species); break;
      case 'extension': this.renderExtension(s); break;
      case 'placement': this.renderPlacement(s); break;
      case 'arrange': this.renderInventory(s); break;
      case 'decoration': this.renderDecoration(s, this.view.id); break;
      case 'decorationPlacement': this.renderDecorationPlacement(s); break;
    }
    const placedList = this.content.querySelector<HTMLDetailsElement>('[data-placed-list]');
    if (placedList) placedList.open = placedListOpen;
    this.content.scrollTop = scroll;
    if (focusId) for (const el of this.content.querySelectorAll<HTMLElement>('[data-focus]')) if (el.dataset.focus === focusId) el.focus({preventScroll: true});
    this.updateTimers();
  }
  private renderShop(s: GameState, tab: 'buildings' | 'rabbits' | 'decorations'): void {
    this.title.textContent = 'Boutique';
    const tabs = node('div', '', 'tabs');
    this.button(tabs, 'Bâtiments', () => this.open({kind: 'shop', tab: 'buildings'}), null, tab !== 'buildings');
    this.button(tabs, 'Lapins', () => this.open({kind: 'shop', tab: 'rabbits'}), null, tab !== 'rabbits'); this.content.append(tabs);
    this.button(tabs, 'Décorations', () => this.open({kind: 'shop', tab: 'decorations'}), null, tab !== 'decorations');
    if (tab === 'decorations') { this.renderDecorationShop(s); return; }
    if (tab === 'buildings') {
      const basic = habitatLevel('universal', 1);
      const utility: Record<BuildingKind, string> = {enclosure: `${basic.capacity} places · tous les types · stocke ${basic.cap} pattes`, farm: 'Produit l’herbe · maximum 2', nest: 'Deux parents · maximum 1', nursery: 'Une place pour grandir · maximum 1'};
      this.content.append(node('h3', 'Enclos universel'));
      const universal = this.card(HABITATS.universal.name, utility.enclosure);
      this.button(universal, `Placer · ${habitatPrice('universal')} pattes`, () => this.beginPlacement('enclosure'), buildingReason(s, 'enclosure', true)); this.content.append(universal);
      this.content.append(node('h3', 'Habitats spécialisés'));
      for (const type of HABITAT_TYPES.filter(type => type !== 'universal')) {
        const stats = habitatLevel(type, 1), card = this.card(HABITATS[type].name, `${HABITATS[type].accepted} · ${stats.capacity} places · stocke ${stats.cap} pattes`);
        this.button(card, `Placer · ${stats.cost} pattes`, () => this.beginPlacement('enclosure', undefined, type), buildingReason(s, 'enclosure', true, type)); this.content.append(card);
      }
      this.content.append(node('h3', 'Production et reproduction'));
      for (const kind of ['farm', 'nest', 'nursery'] as const) {
        const card = this.card(BUILDING_NAMES[kind], utility[kind]);
        this.button(card, `Placer · ${BALANCE.buildings[kind].price} pattes`, () => this.beginPlacement(kind), buildingReason(s, kind, true)); this.content.append(card);
      }
    } else for (const species of SHOP_SPECIES) {
      const card = this.card(SPECIES[species].name, 'Commun · affection 1 · 12 pattes / h', species);
      const full = !s.buildings.some(b => b.kind === 'enclosure' && !habitatEntryReason(s, b, species));
      this.button(card, `Choisir un habitat · ${SPECIES[species].price} pattes`, () => this.open({kind: 'buyRabbit', species}), full ? 'Aucun habitat compatible avec une place libre.' : null); this.content.append(card);
    }
  }
  private beginPlacement(kind: BuildingKind, movingId?: string, habitatType?: HabitatType): void {
    this.placement = {kind, movingId, habitatType, cell: null}; this.view = {kind: 'placement'}; this.scene.setPlacement(this.placement); this.render();
  }
  private renderPlacement(s: GameState): void {
    const p = this.placement; if (!p) { this.close(); return; }
    const price = p.kind === 'enclosure' ? habitatPrice(p.habitatType ?? 'universal') : BALANCE.buildings[p.kind].price;
    const name = p.kind === 'enclosure' ? HABITATS[p.habitatType ?? s.buildings.find(b => b.id === p.movingId)?.habitat?.type ?? 'universal'].name : BUILDING_NAMES[p.kind];
    this.title.textContent = `${p.movingId ? 'Déplacer' : 'Placer'} : ${name}`;
    this.content.append(node('p', 'Touchez une case. ✓ indique une place libre ; × une case occupée ou verrouillée. Glissez pour déplacer la vue.'));
    this.content.append(node('p', p.cell ? `Case ${p.cell.x + 1} · ${p.cell.y + 1}` : 'Aucune case sélectionnée.', 'badge'));
    this.button(this.content, p.movingId ? 'Confirmer le déplacement · gratuit' : `Acheter et placer · ${price} pattes`, () => {
      if (!p.cell) return;
      const cmd: Command = p.movingId ? {type: 'moveBuilding', id: p.movingId, ...p.cell} : {type: 'buyBuilding', kind: p.kind, habitatType: p.habitatType, ...p.cell};
      this.execute(cmd, p.movingId ? 'Bâtiment déplacé.' : `${name} construit.`, () => { this.placement = null; this.scene.setPlacement(null); this.view = null; });
    }, placementReason(s, p));
    if (p.cell && decorationsInCell(s, p.cell.x, p.cell.y).length) {
      const cell = {...p.cell}, count = decorationsInCell(s, cell.x, cell.y).length;
      this.button(this.content, `Ranger les ${count} décoration(s) de cette case`, () => this.confirm('Libérer cette case ?', 'Les objets seront conservés dans votre inventaire. Aucun bâtiment ne sera acheté ni déplacé ; confirmez ensuite sa pose séparément.', () => this.execute({type: 'storeDecorationsInCell', ...cell}, 'Objets rangés. Vous pouvez confirmer le bâtiment.')), null, true);
    }
    if (!p.movingId && p.cell) this.complement(this.content, s, {type: 'buyBuilding', kind: p.kind, habitatType: p.habitatType, ...p.cell},
      `Acheter et placer : ${name} (case ${p.cell.x + 1}, ${p.cell.y + 1})`, `${name} construit.`,
      () => { this.placement = null; this.scene.setPlacement(null); this.view = null; });
    this.button(this.content, 'Annuler · aucun coût', () => this.close(), null, true);
  }
  private syncArrangement(): void {
    document.getElementById('arrange-banner')!.hidden = !this.arranging;
    document.body.classList.toggle('arranging', this.arranging);
    this.scene.setArrangement(this.arranging, this.decorationDraft ? {id: this.decorationDraft.id, location: this.decorationDraft.location} : null);
    this.scene.setDecorationSelection(this.view?.kind === 'decoration' ? this.view.id : this.view?.kind === 'decorationPlacement' ? this.decorationDraft?.id ?? null : null);
  }
  private setPhoto(active: boolean): void {
    if (this.photo === active) return;
    if (active && document.querySelector('dialog[open]')) return;
    if (active) this.close();
    this.photo = active; document.body.classList.toggle('photo-mode', active);
    document.getElementById('photo-return')!.hidden = !active; this.scene.setPhoto(active);
  }
  private decorationCard(id: DecorationId, description = ''): HTMLElement {
    const card = this.card(DECORATIONS[id].name, description), icon = node('span', '', 'decoration-icon');
    icon.innerHTML = decorationSvg(id); card.querySelector('.card-heading')!.prepend(icon); return card;
  }
  private renderDecorationShop(s: GameState): void {
    this.content.append(node('p', 'Objets esthétiques, sans bonus. Chaque achat rejoint l’inventaire ; annuler sa pose ne fait pas perdre l’objet. Paiement uniquement en pattes.', 'small'));
    this.content.append(node('h3', 'Décorations extérieures'));
      for (const id of DECORATION_IDS) {
        const d = DECORATIONS[id], count = s.decorations.filter(owned => owned.catalogId === id).length;
        const card = this.decorationCard(id, `${d.width} × ${d.height} cases fines${d.rotates ? ' · peut tourner' : ''} · ${count} possédé(s)`);
        card.dataset.catalog = id;
        const reason = purchaseDecorationReason(s, id);
        this.button(card, `Acheter · ${d.price} pattes`, () => this.confirm(`Acheter : ${d.name} ?`, `${d.price} pattes. Cet exemplaire restera dans l’inventaire si vous annulez le placement.`, () => this.execute({type: 'buyDecoration', catalogId: id}, 'Objet acheté et conservé dans votre inventaire.', () => {
          const owned = this.controller.getSnapshot().state!.decorations.at(-1)!;
          this.beginDecorationPlacement(owned.id);
        })), reason ? REFUSALS[reason] : null);
        this.content.append(card);
      }
    this.button(this.content, 'Ouvrir mon inventaire', () => this.open({kind: 'arrange'}), null, true);
  }
  private renderInventory(s: GameState): void {
    this.title.textContent = 'Aménager · inventaire';
    this.content.append(node('p', 'Touchez directement un objet posé pour le déplacer, le ranger ou le vendre. Glissez pour explorer, pincez pour zoomer. Toute pose demande une validation.', 'small'));
    this.button(this.content, 'Acheter des décorations', () => this.open({kind: 'shop', tab: 'decorations'}));
    const inventory = s.decorations.filter(d => d.location.kind === 'inventory');
    this.content.append(node('h3', `En réserve · ${inventory.length}`));
    if (!inventory.length) this.content.append(node('p', 'Votre inventaire est vide. Les objets rangés réapparaissent ici.', 'small'));
    for (const d of inventory) {
      const card = this.decorationCard(d.catalogId, `Exemplaire ${d.id.split('-')[1]} · pose gratuite`); card.dataset.decoration = d.id;
      this.button(card, 'Placer cet exemplaire', () => this.beginDecorationPlacement(d.id));
      this.button(card, 'Actions de cet exemplaire', () => this.open({kind: 'decoration', id: d.id}), null, true); this.content.append(card);
    }
    const placed = s.decorations.filter(d => d.location.kind !== 'inventory');
    const details = node('details'); details.dataset.placedList = ''; details.append(node('summary', `Objets posés · ${placed.length}`));
    for (const d of placed) this.button(details, `${DECORATIONS[d.catalogId].name} · #${d.id.split('-')[1]}`, () => {this.scene.focusDecoration(d.id);this.open({kind: 'decoration', id: d.id});}, null, true);
    this.content.append(details);
    this.button(this.content, 'Quitter le mode Aménagement', () => this.close(), null, true);
  }
  private renderDecoration(s: GameState, id: string): void {
    const d = s.decorations.find(d => d.id === id); if (!d) { this.finishDecorationAction(); return; }
    this.title.textContent = DECORATIONS[d.catalogId].name;
    this.content.append(this.decorationCard(d.catalogId, `Exemplaire ${id.split('-')[1]} · déplacements gratuits`));
    this.button(this.content, 'Déplacer', () => this.beginDecorationPlacement(id));
    if (DECORATIONS[d.catalogId].rotates && d.location.kind === 'outside') this.button(this.content, 'Tourner de 90°', () => { this.beginDecorationPlacement(id); this.rotateDecoration(); }, null, true);
    this.button(this.content, 'Ranger dans l’inventaire', () => this.execute({type: 'placeDecoration', id, location: {kind: 'inventory'}}, 'Objet rangé, toujours possédé.', () => this.finishDecorationAction()), d.location.kind === 'inventory' ? 'Cet objet est déjà dans l’inventaire.' : null, true);
    const resale = decorationResalePrice(d.catalogId);
    this.button(this.content, `Vendre · ${resale} pattes`, () => this.confirm(
      `Vendre ${DECORATIONS[d.catalogId].name} pour ${resale} pattes ?`,
      'Cet exemplaire sera retiré définitivement. Aucun remboursement en cœurs.',
      () => this.execute({type: 'sellDecoration', id}, value => `Objet vendu · + ${value} pattes.`, () => this.finishDecorationAction())
    ), Number.isSafeInteger(s.pattes + resale) ? null : REFUSALS.RESOURCE_LIMIT, true);
    this.button(this.content, 'Mon inventaire', () => this.open({kind: 'arrange'}), null, true);
  }
  private finishDecorationAction(): void {
    if (this.arranging) this.open({kind: 'arrange'}); else this.close();
  }
  private beginDecorationPlacement(id: string): void {
    const d = this.controller.getSnapshot().state?.decorations.find(d => d.id === id); if (!d) return;
    this.arranging = true; this.placement = null; this.scene.setPlacement(null);
    this.decorationDraft = {id, location: d.location.kind === 'inventory' ? null : structuredClone(d.location), rotation: d.location.kind === 'outside' ? d.location.rotation : 0};
    this.content.scrollTop = 0;
    this.view = {kind: 'decorationPlacement'}; this.syncArrangement(); this.render();
  }
  private rotateDecoration(): void {
    const draft = this.decorationDraft, d = this.snapshot.state?.decorations.find(d => d.id === draft?.id);
    if (!draft || !d || !DECORATIONS[d.catalogId].rotates) return;
    draft.rotation = draft.rotation === 0 ? 1 : 0;
    if (draft.location?.kind === 'outside') draft.location.rotation = draft.rotation;
    this.syncArrangement(); this.render();
  }
  private selectDecoration(selection: MeadowSelection): void {
    const draft = this.decorationDraft;
    if (draft) {
      if (selection.kind === 'fineCell') draft.location = {kind: 'outside', x: selection.x, y: selection.y, rotation: draft.rotation};
      this.syncArrangement(); this.render(); return;
    }
    if (selection.kind === 'decoration') this.open({kind: 'decoration', id: selection.id});
    else if (selection.kind === 'building') this.open({kind: 'building', id: selection.id});
    else if (selection.kind === 'empty') { this.view = null; this.syncArrangement(); this.render(); }
  }
  private renderDecorationPlacement(s: GameState): void {
    const draft = this.decorationDraft, d = s.decorations.find(d => d.id === draft?.id);
    if (!draft || !d) { this.open({kind: 'arrange'}); return; }
    this.title.textContent = `Placer : ${DECORATIONS[d.catalogId].name}`;
    this.content.append(node('p', 'Touchez une destination, puis confirmez. Glissez ou pincez pour explorer sans poser.', 'small'));
    this.content.append(node('p', d.location.kind === 'inventory' ? 'En cas d’annulation, l’objet reste dans votre inventaire.' : 'En cas d’annulation, l’objet reste à son emplacement actuel.', 'small'));
    if (DECORATIONS[d.catalogId].rotates) this.button(this.content, `Tourner de 90° · orientation ${draft.rotation ? 'verticale' : 'horizontale'}`, () => this.rotateDecoration(), null, true);
    const reason = draft.location ? decorationPlacementReason(s, d.id, draft.location) : null;
    const actions = node('div', '', 'decoration-placement-actions');
    const status = node('p', !draft.location ? 'Choisissez une destination · aucun objet posé' : reason ? `× ${REFUSALS[reason]}` : '✓ Emplacement valide · pose gratuite', !draft.location ? 'placement-pending' : reason ? 'placement-invalid' : 'placement-valid');
    status.setAttribute('role', 'status'); actions.append(status);
    const choices = node('div', '', 'placement-choices'); actions.append(choices);
    const confirm = this.button(choices, 'Confirmer la pose · gratuit', () => {
      if (!draft.location) return;
      this.execute({type: 'placeDecoration', id: d.id, location: structuredClone(draft.location)}, 'Décoration installée.', () => this.open({kind: 'arrange'}));
    });
    confirm.disabled = !draft.location || !!reason;
    this.button(choices, 'Annuler le placement', () => this.open({kind: 'arrange'}), null, true);
    this.content.append(actions);
  }
  private enclosureName(s: GameState, id: string): string {
    const b = s.buildings.find(b => b.id === id)!;
    return `${b.habitat?.type === 'universal' ? 'Enclos' : habitatName(b)} ${s.buildings.filter(b => b.kind === 'enclosure').findIndex(b => b.id === id) + 1}`;
  }
  private entryReason(s: GameState, b: Building, species: SpeciesId): string | null {
    const reason = habitatEntryReason(s, b, species); return reason ? REFUSALS[reason] : null;
  }
  private rabbitCard(s: GameState, id: string): HTMLElement {
    const r = s.rabbits.find(r => r.id === id)!;
    return this.card(SPECIES[r.species].name, `Affection ${r.affection} · ${rabbitIncome(r.affection)} pattes / h`, r.species);
  }
  private renderBuilding(s: GameState, id: string): void {
    const b = s.buildings.find(b => b.id === id); if (!b) { this.close(); return; }
    this.title.textContent = b.kind === 'enclosure' ? this.enclosureName(s, id) : BUILDING_NAMES[b.kind];
    if (b.kind === 'enclosure') {
      const residents = occupants(s, id), income = incomeWhole(b.incomeUnits), stats = habitatStats(b);
      this.content.append(node('p', `${habitatName(b)} · ${HABITATS[b.habitat!.type].accepted} · niveau ${b.habitat!.level}`, 'badge'), node('p', `${residents.reduce((sum, r) => sum + rabbitIncome(r.affection), 0)} pattes / h`));
      this.content.append(node('p', `${residents.length} / ${stats.capacity} places · ${income} / ${stats.cap} pattes stockées`));
      if (income >= stats.cap) this.content.append(node('p', 'Habitat plein de pattes : récoltez pour relancer les revenus.', 'reason'));
      this.button(this.content, `Récolter ${income} pattes`, () => this.execute({type: 'collectIncome', id}, value => `+ ${value} pattes`), income < 1 ? 'Il faut au moins une patte entière.' : null);
      for (const r of residents) { const card = this.rabbitCard(s, r.id); this.button(card, 'Voir ce lapin', () => this.open({kind: 'rabbit', id: r.id}), null, true); this.content.append(card); }
      if (residents.length < stats.capacity) this.button(this.content, 'Acheter un lapin', () => this.open({kind: 'shop', tab: 'rabbits'}), null, true);
      if (b.habitat!.level < 3) {
        const level = b.habitat!.level, next = habitatLevel(b.habitat!.type, (level + 1) as HabitatLevel);
        const command: PattesCommand = {type: 'upgradeHabitat', id, fromLevel: level};
        const description = `Niveau ${level + 1} : ${next.capacity} places · plafond ${next.cap} pattes. Occupants, emplacement et stockage conservés.`;
        this.content.append(node('p', description));
        this.button(this.content, `Améliorer · ${next.cost} pattes`, () => this.confirm('Améliorer cet habitat ?', `${description} Paiement : ${next.cost} pattes.`, () => this.execute(command, 'Habitat amélioré.')), moneyReason(s, next.cost));
        this.complement(this.content, s, command, `Améliorer : ${description}`, 'Habitat amélioré.');
      } else this.content.append(node('p', 'Niveau maximal atteint.', 'badge'));
    } else if (b.kind === 'farm') {
      if (b.order) {
        const recipe = ORDERS[b.order.recipe]; this.content.append(node('p', `${recipe.grass} herbes en production.`)); this.timer(b.order.startedAt, b.order.endsAt);
        this.acceleration(s, id, 'order');
        this.button(this.content, `Récolter ${recipe.grass} herbes`, () => this.execute({type: 'collectOrder', id}, value => `+ ${value} herbes`), b.order.endsAt > this.now() ? 'Production en cours.' : null);
      } else for (const recipe of Object.keys(ORDERS) as OrderId[]) {
        const order = ORDERS[recipe], card = this.card(`${order.grass} herbes`, `${order.duration / 60_000} minutes · une seule récolte`);
        this.button(card, `Produire · ${order.cost} pattes`, () => this.execute({type: 'startOrder', id, recipe}, 'Production d’herbe lancée.'), moneyReason(s, order.cost));
        this.complement(card, s, {type: 'startOrder', id, recipe}, `Produire ${order.grass} herbes`, 'Production d’herbe lancée.'); this.content.append(card);
      }
    } else if (b.kind === 'nest') this.renderNest(s, id);
    else this.renderNursery(s);
    this.button(this.content, 'Déplacer ce bâtiment', () => this.beginPlacement(b.kind, id), null, true);
  }
  private renderRabbit(s: GameState, id: string): void {
    const r = s.rabbits.find(r => r.id === id); if (!r) { this.close(); return; }
    const species = SPECIES[r.species]; this.title.textContent = species.name;
    this.content.append(avatar(r.species, true), node('p', `${typeNames(species.types)} · ${RARITY_NAMES[species.rarity]}`, 'badge'),
      node('p', `Affection ${r.affection} / 20 · ${rabbitIncome(r.affection)} pattes / h`), node('p', this.enclosureName(s, r.enclosureId)));
    const cost = BALANCE.foodMultiplier * r.affection;
    if (r.affection < 20) this.content.append(node('p', `Après une nourriture : affection ${r.affection + 1}, revenu ${rabbitIncome(r.affection + 1)} pattes / h.`, 'small'));
    this.button(this.content, `Nourrir · ${cost} herbes`, () => this.execute({type: 'feed', id}, `Affection ${r.affection + 1} !`, () => this.scene.reactToFeed(id)), r.affection >= 20 ? REFUSALS.MAX_AFFECTION : s.grass < cost ? REFUSALS.NOT_ENOUGH_GRASS : null).dataset.focus = 'feed';
    const hasDestination = s.buildings.some(b => b.kind === 'enclosure' && b.id !== r.enclosureId && !habitatEntryReason(s, b, r.species));
    this.button(this.content, 'Changer d’habitat', () => this.open({kind: 'moveRabbit', id}), hasDestination ? null : 'Aucun autre habitat compatible avec une place libre.', true);
    this.button(this.content, 'Confier ce lapin', () => this.confirm('Confier ce lapin ?', 'Ce lapin quittera définitivement votre prairie, sans gain de pattes.', () => this.execute({type: 'release', id}, 'Lapin confié.', () => { this.view = {kind: 'building', id: r.enclosureId}; })), releaseReason(s, id, this.now()), true);
  }
  private destinations(s: GameState, choose: (id: string) => void, species: SpeciesId, currentId?: string, price?: number): void {
    for (const b of s.buildings.filter(b => b.kind === 'enclosure')) {
      const count = occupants(s, b.id).length;
      this.content.append(node('p', HABITATS[b.habitat!.type].accepted, 'small'));
      this.button(this.content, `${this.enclosureName(s, b.id)} · ${count}/${habitatStats(b).capacity}${price !== undefined ? ` · acheter ${price} pattes` : ''}`, () => choose(b.id),
        b.id === currentId ? 'Habitat actuel.' : this.entryReason(s, b, species) ?? (price !== undefined ? moneyReason(s, price) : null), true);
    }
  }
  private renderDestinations(s: GameState, id: string): void {
    const r = s.rabbits.find(r => r.id === id); if (!r) { this.close(); return; }
    this.title.textContent = 'Changer d’habitat';
    this.destinations(s, enclosureId => this.execute({type: 'moveRabbit', id, enclosureId}, 'Lapin déplacé.', () => { this.view = {kind: 'rabbit', id}; }), r.species, r.enclosureId);
  }
  private renderBuyRabbit(s: GameState, species: SpeciesId): void {
    this.title.textContent = `Accueillir : ${SPECIES[species].name}`; this.content.append(avatar(species, true));
    for (const enclosure of s.buildings.filter(b => b.kind === 'enclosure')) {
      const enclosureId = enclosure.id, command: PattesCommand = {type: 'buyRabbit', species, enclosureId};
      const after = () => { this.view = {kind: 'building' as const, id: enclosureId}; if (!s.discovered.includes(species)) this.discovery(species); };
      const card = this.card(this.enclosureName(s, enclosureId), `${occupants(s, enclosureId).length}/${habitatStats(enclosure).capacity} places · ${HABITATS[enclosure.habitat!.type].accepted}`);
      this.button(card, `${this.enclosureName(s, enclosureId)} · ${occupants(s, enclosureId).length}/${habitatStats(enclosure).capacity} · acheter ${SPECIES[species].price} pattes`, () => this.execute(command, 'Lapin acheté et accueilli.', after),
        this.entryReason(s, enclosure, species) ?? moneyReason(s, SPECIES[species].price ?? 80));
      this.complement(card, s, command, `${SPECIES[species].name} → ${this.enclosureName(s, enclosureId)}`, 'Lapin acheté et accueilli.', after);
      this.content.append(card);
    }
  }
  private renderNest(s: GameState, id: string): void {
    const nest = s.buildings.find(b => b.id === id)!;
    if (nest.breeding) {
      this.content.append(node('p', 'Les parents préparent l’arrivée d’un lapereau. Son espèce sera révélée après sa croissance.'));
      this.timer(nest.breeding.startedAt, nest.breeding.endsAt);
      this.acceleration(s, id, 'breeding');
      if (nest.breeding.endsAt <= this.now()) this.content.append(node('p', 'Le lapereau attend au nid : la nurserie est occupée. Accueillez son occupant pour libérer la place.', 'reason'));
      return;
    }
    if (!s.buildings.some(b => b.kind === 'nursery')) { this.content.append(node('p', 'Construisez une nurserie avant de lancer une reproduction.')); this.button(this.content, 'Ouvrir la boutique', () => this.open({kind: 'shop', tab: 'buildings'})); return; }
    for (let i = 0; i < 2; i++) if (this.parents[i] && !s.rabbits.some(r => r.id === this.parents[i])) this.parents[i] = null;
    const selected = this.parents.map(id => s.rabbits.find(r => r.id === id));
    this.content.append(node('p', `Parent A : ${selected[0] ? SPECIES[selected[0].species].name : 'à choisir'} · Parent B : ${selected[1] ? SPECIES[selected[1].species].name : 'à choisir'}`));
    this.content.append(node('p', '20 pattes · 20 minutes de reproduction, puis croissance en nurserie.'));
    this.content.append(node('p', 'Recettes rares : affection 4 ; épiques : 6 ; Dragon : 10 chez chacun des deux parents, avec Perroquet et Feu obligatoires. Les résultats inadmissibles sont exclus ; la reproduction ordinaire reste possible dès 2.', 'small'));
    this.button(this.content, 'Carnet de reproduction', () => this.open({kind: 'recipes'}), null, true);
    if (selected[0] && selected[1]) {
      const odds = oddsView(s, selected[0].species, selected[1].species, selected[0].affection, selected[1].affection);
      this.content.append(node('p', `Résultats possibles : ${[...new Set(odds.entries.map(e => e.name))].join(', ')}.`));
      const details = node('details'); details.open = this.oddsOpen; details.append(node('summary', 'Probabilités de cette reproduction'));
      for (const entry of odds.entries) details.append(node('p', `${entry.name} · ${entry.description} : ${entry.probability}`));
      details.addEventListener('toggle', () => { if (details.isConnected) this.oddsOpen = details.open; }); this.content.append(details);
      this.content.append(node('p', odds.guaranteed ? 'Cette tentative garantit une espèce de reproduction encore inconnue, à parts égales entre les recettes admissibles.' : odds.eligible ? 'Cette paire est admissible à la garantie.' : 'Cette paire ne fait pas avancer la garantie.', 'badge'));
    }
    this.content.append(node('p', `Garantie : ${s.pityFailures}/9 échecs admissibles. Après neuf échecs, la tentative admissible suivante garantit une des six recettes ordinaires inconnues admissibles, à parts égales s’il y en a plusieurs. Un résultat ordinaire inédit réservé remet le compteur à zéro ; la découverte n’est enregistrée qu’à l’accueil.`, 'small'));
    let reason: string | null = selected[0] && selected[1] ? (rabbitAvailability(s, selected[0].id, this.now()) ?? rabbitAvailability(s, selected[1].id, this.now()) ?? moneyReason(s, 20)) : 'Choisissez deux parents différents.';
    if (this.parents[0] && this.parents[0] === this.parents[1]) reason = REFUSALS.SAME_PARENT;
    this.button(this.content, 'Lancer la reproduction · 20 pattes', () => {
      if (this.parents[0] && this.parents[1]) this.execute({type: 'breed', parents: [this.parents[0], this.parents[1]]}, 'Reproduction lancée. Le résultat reste une surprise !');
    }, reason);
    if (this.parents[0] && this.parents[1]) this.complement(this.content, s, {type: 'breed', parents: [this.parents[0], this.parents[1]]}, 'Lancer la reproduction', 'Reproduction lancée. Le résultat reste une surprise !');
    if (s.buildings.some(b => b.baby)) this.content.append(node('p', 'La nurserie est occupée : le prochain lapereau attendra au nid si nécessaire.', 'small'));
    this.content.append(node('h3', 'Choisir les parents'));
    for (const r of s.rabbits) {
      const card = this.rabbitCard(s, r.id); card.append(node('p', `${this.enclosureName(s, r.enclosureId)} · ${rabbitAvailability(s, r.id, this.now()) ?? 'Disponible'}`, 'small'));
      const actions = node('div', '', 'tabs');
      for (const slot of [0, 1] as const) this.button(actions, `${this.parents[slot] === r.id ? '✓ ' : ''}Parent ${slot === 0 ? 'A' : 'B'}`, () => { this.parents[slot] = r.id; this.render(); }, rabbitAvailability(s, r.id, this.now()) ?? (this.parents[1 - slot] === r.id ? 'Déjà choisi.' : null), true);
      card.append(actions); this.content.append(card);
    }
  }
  private renderNursery(s: GameState): void {
    const view = nurseryView(s, this.now()), baby = s.buildings.find(b => b.kind === 'nursery')?.baby;
    if (view.stage === 'empty') { this.content.append(node('p', 'La nurserie est libre. Lancez une reproduction dans le nid.')); return; }
    if (view.stage === 'growing') {
      this.content.append(avatar(undefined, true), node('p', 'Un petit lapin grandit au chaud… Son espèce reste secrète.'));
      this.timer(baby!.startedAt, baby!.readyAt);
      this.acceleration(s, s.buildings.find(b => b.kind === 'nursery')!.id, 'growth'); return;
    }
    this.content.append(avatar(view.species, true), node('h3', SPECIES[view.species].name), node('p', 'Votre lapereau est prêt. Choisissez son habitat.'));
    if (!s.buildings.some(b => b.kind === 'enclosure' && !habitatEntryReason(s, b, view.species))) this.content.append(node('p', 'Aucun habitat compatible avec une place libre. Construisez-en un, améliorez-le ou confiez un doublon. Le lapereau reste en sécurité ici.', 'reason'));
    this.destinations(s, enclosureId => {
      const discovery = !s.discovered.includes(view.species);
      this.execute({type: 'welcome', enclosureId}, 'Lapereau accueilli !', () => { this.view = {kind: 'building', id: enclosureId}; if (discovery) this.discovery(view.species); });
    }, view.species);
  }
  private renderCollection(s: GameState): void {
    this.title.textContent = `Collection · ${s.discovered.length}/${SPECIES_IDS.length}`;
    this.button(this.content, 'Carnet de reproduction', () => this.open({kind: 'recipes'}), null, true);
    const controls = node('div', '', 'collection-filters');
    const select = (label: string, key: keyof CollectionFilter, choices: Record<string, string>) => {
      const field = node('label', label), input = node('select'); input.setAttribute('aria-label', label); input.dataset.focus = `collection-filter-${key}`;
      for (const [value, text] of Object.entries(choices)) { const option = node('option', text); option.value = value; input.append(option); }
      input.value = this.collectionFilter[key] ?? '';
      input.addEventListener('change', () => { this.collectionFilter = {...this.collectionFilter, [key]: input.value || undefined}; this.render(); });
      field.append(input); controls.append(field);
    };
    select('Type', 'type', {'': 'Tous les types', ...Object.fromEntries(Object.entries(TYPE_NAMES).filter(([type]) => SPECIES_IDS.some(id => SPECIES[id].types.includes(type as RabbitType))))});
    select('Rareté', 'rarity', {'': 'Toutes les raretés', ...RARITY_NAMES});
    select('Découverte', 'discovery', {'': 'Toutes', known: 'Découvertes', unknown: 'À découvrir'});
    this.content.append(controls);
    const entries = collectionView(s, this.collectionFilter);
    this.content.append(node('p', `${entries.length} espèce(s) affichée(s)`, 'small'));
    if (!entries.length) this.content.append(node('p', 'Aucune espèce ne correspond à ces filtres.'));
    if (Object.values(this.collectionFilter).some(Boolean)) this.button(this.content, 'Réinitialiser les filtres', () => { this.collectionFilter = {}; this.render(); }, null, true);
    for (const entry of entries) {
      const card = this.card(entry.name); card.prepend(avatar(entry.known ? entry.species : undefined));
      if (entry.known) this.button(card, 'Consulter l’espèce', () => this.open({kind: 'species', species: entry.species}), null, true);
      else card.append(node('p', 'À découvrir', 'small'));
      this.content.append(card);
    }
  }
  private renderRecipes(s: GameState): void {
    this.title.textContent = 'Carnet de reproduction';
    this.content.append(node('p', 'Les types nécessaires doivent être réunis par deux individus distincts. Une recette possible reste un tirage aléatoire. Les probabilités ci-dessous incluent la garantie actuelle.'),
      node('p', 'La garantie choisit à parts égales parmi les six recettes ordinaires inconnues admissibles. Géant, Magicien et Dragon en sont exclus. Une recette déjà découverte peut donc être temporairement exclue de ce tirage.', 'small'));
    this.button(this.content, 'Retour à la collection', () => this.open({kind: 'collection'}), null, true);
    const nest = s.buildings.find(b => b.kind === 'nest'), nursery = s.buildings.find(b => b.kind === 'nursery');
    const setupReason = !nest || !nursery ? 'Construisez un nid et une nurserie.' : nest.breeding ? 'Le nid est occupé.' : null;
    if (setupReason) this.content.append(node('p', setupReason, 'reason'));
    for (const recipe of recipeBook(s, this.now())) {
      const info = SPECIES[recipe.species];
      const card = this.card(recipe.known ? info.name : 'Espèce à découvrir', `${typeNames(recipe.types)} · ${RARITY_NAMES[info.rarity]}`);
      card.prepend(avatar(recipe.known ? recipe.species : undefined));
      card.append(node('p', `Affection ${recipe.minAffection} minimum pour chacun des deux parents. Croissance : ${growthDuration(recipe.species) / 60_000} min.`));
      if (info.recipe?.parents) card.append(node('p', `Parents requis : ${info.recipe.parents.map(id => SPECIES[id].name).join(' × ')}. Les types seuls ne suffisent pas.`));
      card.append(node('p', info.recipe?.probability !== undefined ? `Hors garantie ordinaire : ${info.recipe.probability} %. Cette espèce ne bénéficie pas de la garantie de découverte.` : 'Cette espèce bénéficie de la garantie ordinaire si elle est encore inconnue et admissible.', 'small'));
      if (!recipe.pairs.length) card.append(node('p', info.recipe?.parents ? 'Possédez les deux espèces requises pour préparer cette paire.' : 'Aucune paire possédée ne réunit encore ces types. Les communs sont disponibles en boutique.', 'small'));
      else {
        const details = node('details'); details.open = recipe.pairs.length <= 3 || this.recipeDetails.has(recipe.species);
        details.append(node('summary', `${recipe.pairs.length} paire(s) possédée(s) compatible(s) avec la recette`));
        details.addEventListener('toggle', () => { if (details.isConnected) {
          if (details.open) this.recipeDetails.add(recipe.species); else this.recipeDetails.delete(recipe.species);
        } });
        for (const pair of recipe.pairs) {
          const names = pair.parents.map(id => {
            const r = s.rabbits.find(r => r.id === id)!;
            return `${SPECIES[r.species].name} (${this.enclosureName(s, r.enclosureId)}, affection ${r.affection}, n° ${id.split('-')[1]})`;
          });
          const block = node('div', '', 'recipe-pair'); block.append(node('p', names.join(' × ')));
          if (pair.feeding.length) {
            block.append(node('p', `À nourrir : affection ${recipe.minAffection} nécessaire chez les deux parents. Recette exclue actuellement.`, 'reason'));
            for (const id of pair.feeding) this.button(block, `Voir le parent n° ${id.split('-')[1]} à nourrir`, () => this.open({kind: 'rabbit', id}), null, true);
          } else {
            const label = pair.certain ? 'Résultat garanti pour cette recette' : pair.guaranteed ? 'Garantie partagée entre recettes inconnues' : pair.probability === '0 %' ? 'La garantie actuelle privilégie une autre recette inconnue' : 'Recette possible, résultat non garanti';
            block.append(node('p', `${label} · ${pair.probability}`, 'badge'));
            if (pair.busy) block.append(node('p', 'Un parent est occupé ; attendez sa disponibilité.', 'reason'));
          }
          this.button(block, 'Préparer cette paire au nid', () => {
            if (!nest) return;
            this.parents = [...pair.parents]; this.open({kind: 'building', id: nest.id});
          }, pair.feeding.length ? 'Nourrissez les parents requis.' : pair.busy ? 'Parent occupé.' : setupReason ?? (!pair.possible ? 'Cette recette n’est pas dans le tirage actuel.' : null), true);
          details.append(block);
        }
        card.append(details);
      }
      this.content.append(card);
    }
  }
  private renderSpecies(s: GameState, species: SpeciesId): void {
    if (!s.discovered.includes(species)) { this.view = {kind: 'collection'}; this.renderCollection(s); return; }
    const info = SPECIES[species]; this.title.textContent = info.name;
    this.content.append(avatar(species, true), node('p', `${typeNames(info.types)} · ${RARITY_NAMES[info.rarity]}`),
      node('p', `${s.rabbits.filter(r => r.species === species).length} individu(s) dans la prairie.`), node('p', info.price === null ? 'Obtention : reproduction.' : 'Obtention : boutique ou reproduction.'), node('p', `Croissance : ${growthDuration(species) / 60_000} minutes.`));
    if (info.recipe) this.button(this.content, 'Consulter la recette', () => this.open({kind: 'recipes'}), null, true);
    this.button(this.content, 'Retour à la collection', () => this.open({kind: 'collection'}), null, true);
  }
  private renderExtension(s: GameState): void {
    this.title.textContent='Agrandir l’île';
    if(s.acquiredParcels.length===9){this.content.append(node('p','L’île est entièrement agrandie : 81 cases.'));return;}
    const cost=extensionPrice(s),selected=this.view?.kind==='extension'?this.view.parcelId:undefined;
    this.content.append(node('p','Choisissez librement une parcelle sur l’eau ou dans la liste. Chaque achat ajoute neuf cases sans déplacer vos objets.'));
    for(const id of PARCEL_IDS.filter(id=>!s.acquiredParcels.includes(id)))this.button(this.content,`Voir ${PARCELS[id].name}`,()=>this.open({kind:'extension',parcelId:id}),null,true);
    if(!selected||s.acquiredParcels.includes(selected))return;
    const command:PattesCommand={type:'expand',parcelId:selected,expectedCost:cost},description=`${PARCELS[selected].name} · + 9 cases · ${cost} pattes.`;
    this.content.append(node('p',description,'parcel-preview'));
    this.button(this.content,`Acheter ${PARCELS[selected].name} · ${cost} pattes`,()=>this.confirm(`Acheter la parcelle ${PARCELS[selected].name} ?`,description,()=>this.execute(command,'Parcelle acquise.',()=>this.close())),moneyReason(s,cost));
    this.complement(this.content,s,command,`Acheter ${PARCELS[selected].name}`,'Parcelle acquise.',()=>this.close());
    this.button(this.content,'Annuler l’agrandissement',()=>this.close(),null,true);
  }
  private renderMissions(s: GameState, tab: 'main' | 'daily'): void {
    this.title.textContent = 'Missions';
    const tabs = node('div', '', 'tabs');
    for (const [key, label] of [['main', 'Principales'], ['daily', 'Quotidiennes']] as const) {
      const b = this.button(tabs, label, () => this.open({kind: 'missions', tab: key}), null, tab !== key);
      b.setAttribute('aria-pressed', String(tab === key));
    }
    this.content.append(tabs);
    const claim = (card: HTMLElement, command: Command, reward: Reward, ready: boolean, claimed: boolean) => {
      const stage = claimed ? 'Réclamée' : ready ? 'À réclamer' : 'En cours';
      card.append(node('p', `Gratuit · Récompense : + ${rewardLabel(reward)}`, 'small'), node('p', stage, 'badge'));
      const generation = this.confirmationGeneration;
      const button = this.button(card, claimed ? 'Récompense réclamée' : `Réclamer · + ${rewardLabel(reward)}`, () => {
        if (!button.isConnected || generation !== this.confirmationGeneration) return;
        this.execute(command, `Récompense reçue · + ${rewardLabel(reward)}`, () => {
          void this.toast.offsetWidth; this.toast.classList.add('mission-reward');
        });
      }, claimed ? 'Déjà réclamée.' : !ready ? 'Objectif à compléter.' : null);
      button.classList.add('mission-claim');
    };
    const progress = (card: HTMLElement, value: number, target: number) => {
      const bar = node('progress'); bar.max = target; bar.value = Math.min(value, target); bar.setAttribute('aria-label', `Progression : ${value} sur ${target}`);
      card.append(node('p', `Progression : ${value} / ${target}`), bar);
    };
    const shortcut = (card: HTMLElement, kind: BuildingKind | 'collection' | 'affection' | 'extension') => {
      this.button(card, kind === 'collection' ? 'Voir la collection' : kind === 'affection' ? 'Voir un lapin' : kind === 'extension' ? 'Voir l’extension' : 'Voir le bâtiment ou la boutique', () => {
        if (kind === 'collection' || kind === 'extension') this.open({kind});
        else if (kind === 'affection') {
          const rabbit = [...s.rabbits].filter(r => r.affection < BALANCE.maxAffection).sort((a, b) => b.affection - a.affection)[0] ?? s.rabbits[0];
          if (rabbit) this.open({kind: 'rabbit', id: rabbit.id});
        } else {
          const b = s.buildings.find(b => b.kind === kind);
          this.open(b ? {kind: 'building', id: b.id} : {kind: 'shop', tab: 'buildings'});
        }
      }, null, true);
    };
    if (tab === 'main') {
      this.content.append(node('p', 'Ces objectifs sont visibles dès le départ. Une condition acquise le reste et chaque récompense est unique. Aucune dépense de cœurs.'));
      for (const id of MAIN_MISSION_IDS) {
        const mission = MAIN_MISSIONS[id], acquired = s.missions.completed.includes(id), claimed = s.missions.claimed.includes(id);
        const p = mainProgress(s, id), card = this.card(mission.title, mission.description); card.dataset.mission = id;
        progress(card, acquired ? p.target : Math.min(p.value, p.target), p.target);
        if (acquired) card.append(node('p', 'Condition acquise', 'small'));
        claim(card, {type: 'claimMainMission', id}, mission.reward, acquired, claimed);
        if (!acquired) shortcut(card, mission.condition.kind === 'building' ? mission.condition.building : mission.condition.kind === 'discoveries' || mission.condition.kind === 'rare' ? 'collection' : mission.condition.kind);
        this.content.append(card);
      }
    } else {
      const daily = s.missions.daily, cycleStart = dailyCycleStart(s);
      this.content.append(node('p', 'Renouvellement dans :'));
      const timer = node('p', '', 'timer'); timer.dataset.end = String(dailyCycleEnd(s)); this.content.append(timer);
      this.content.append(node('p', 'À la fin des 24 heures, la progression et toutes les récompenses non réclamées, bonus compris, expirent. Les cycles manqués ne se cumulent pas.', 'small'));
      for (const id of DAILY_MISSION_IDS) {
        const mission = DAILY_MISSIONS[id], card = this.card(mission.title, mission.description); card.dataset.mission = id;
        progress(card, daily.progress[id], mission.target);
        claim(card, {type: 'claimDailyMission', id, cycleStart}, mission.reward, daily.progress[id] >= mission.target, daily.claimed.includes(id));
        if (daily.progress[id] < mission.target) shortcut(card, id === 'collect-pattes' ? 'enclosure' : id === 'collect-grass' ? 'farm' : 'affection');
        this.content.append(card);
      }
      const bonus = this.card('Bonus du cycle', 'Réclamez les trois récompenses quotidiennes, puis ce bonus. Il est distinct du cadeau de cœurs disponible toutes les 24 heures.'); bonus.dataset.mission = 'daily-bonus';
      progress(bonus, daily.claimed.length, DAILY_MISSION_IDS.length);
      claim(bonus, {type: 'claimDailyBonus', cycleStart}, DAILY_BONUS, daily.claimed.length === DAILY_MISSION_IDS.length, daily.bonusClaimed);
      this.content.append(bonus);
    }
  }
  private renderHearts(s: GameState): void {
    this.title.textContent = 'Les cœurs';
    this.content.append(node('p', `${s.hearts} cœurs disponibles`, 'badge'),
      node('p', 'Terminez un délai ou complétez les pattes manquantes. Chaque dépense demande votre confirmation. Les cœurs ne remplacent pas l’herbe.'),
      node('p', 'Vous pouvez développer votre prairie sans cœurs. Aucun achat réel ni publicité.'),
      node('h3', 'Votre cadeau gratuit'), node('p', `${HEARTS.gift} cœurs à réclamer toutes les ${HEARTS.giftInterval / 3_600_000} heures. Une seule récompense attend, même après plusieurs jours.`));
    const gift = this.button(this.content, `Réclamer · +${HEARTS.gift} cœurs gratuits`, () => this.execute({type: 'claimHearts'}, `+ ${HEARTS.gift} cœurs gratuits`));
    gift.className = 'heart-gift'; gift.dataset.giftAt = String(s.nextHeartGiftAt);
    const wait = node('p', '', 'timer'); wait.dataset.end = String(s.nextHeartGiftAt); this.content.append(wait);
  }
  private complement(host: HTMLElement, s: GameState, action: PattesCommand, title: string, success: string, after?: () => void): void {
    const quote = quoteComplement(s, action, this.now()); if (!quote.ok) return;
    this.button(host, `Compléter · ${quote.pattes} pattes + ${heartAmount(quote.hearts)}`, () => {
      this.controller.refresh(); const current = this.controller.getSnapshot().state; if (!current) return;
      const fresh = quoteComplement(current, action, this.now());
      if (!fresh.ok) { this.notice(REFUSALS[fresh.reason]); return; }
      if (current.hearts < fresh.hearts) { this.notice(REFUSALS.NOT_ENOUGH_HEARTS); return; }
      const parents = action.type === 'breed' ? action.parents.map(id => current.rabbits.find(r => r.id === id)!) : null;
      const chances = parents ? ' Probabilités : ' + oddsView(current, parents[0].species, parents[1].species, parents[0].affection, parents[1].affection).entries.map(e => `${e.name} (${e.description}) : ${e.probability}`).join(' ; ') + '.' : '';
      this.confirm(title, `Paiement : ${fresh.pattes} pattes + ${heartAmount(fresh.hearts)} pour couvrir ${fresh.missing} pattes manquantes, sans monnaie supplémentaire. Solde disponible : ${current.pattes} pattes et ${current.hearts} cœurs.${chances}`,
        () => this.execute({type: 'payWithHearts', action, maxHearts: fresh.hearts, maxPattes: fresh.pattes}, success, after));
    }, s.hearts < quote.hearts ? REFUSALS.NOT_ENOUGH_HEARTS : null, true).classList.add('heart-spend');
  }
  private acceleration(s: GameState, id: string, stage: TimedStage): void {
    const quote = quoteAcceleration(s, id, stage, this.now());
    if (!quote.ok) {
      if (quote.reason === 'CAPACITY_FULL') this.content.append(node('p', 'Libérez une place dans un habitat pour proposer une accélération de croissance.', 'reason'));
      return;
    }
    const host = node('div'); host.dataset.accelerateEnd = String(quote.endsAt); this.content.append(host);
    this.button(host, `Terminer · ${heartAmount(quote.hearts)}`, () => {
      this.controller.refresh(); const current = this.controller.getSnapshot().state; if (!current) return;
      const fresh = quoteAcceleration(current, id, stage, this.now());
      if (!fresh.ok) { this.notice(REFUSALS[fresh.reason]); return; }
      if (fresh.jobKey !== quote.jobKey) { this.notice(REFUSALS.STALE_ACTION); return; }
      if (current.hearts < fresh.hearts) { this.notice(REFUSALS.NOT_ENOUGH_HEARTS); return; }
      const names = {order: 'cette production', breeding: 'cette reproduction', growth: 'cette croissance'};
      const effect = stage === 'order' ? 'La récolte reste manuelle.' : stage === 'growth' ? 'L’accueil reste manuel.' :
        current.buildings.some(b => b.baby) ? 'La nurserie est occupée : le résultat attendra au nid.' : 'La croissance commencera ensuite en nurserie.';
      this.confirm(`Terminer ${names[stage]} ?`, `${heartAmount(fresh.hearts)} maximum · solde : ${current.hearts} cœurs. Le prix sera recalculé à la confirmation et pourra diminuer, jamais augmenter. ${effect}`,
        () => this.execute({type: 'accelerate', id, stage, jobKey: fresh.jobKey, maxHearts: fresh.hearts}, value => `Étape terminée · ${heartAmount(Number(value))} dépensé(s).`));
    }, s.hearts < quote.hearts ? REFUSALS.NOT_ENOUGH_HEARTS : null, true).classList.add('heart-spend');
  }
  private timer(start: number, end: number): void {
    const progress = node('progress'); progress.max = 1; progress.dataset.start = String(start); progress.dataset.end = String(end);
    const label = node('p', '', 'timer'); label.dataset.end = String(end); this.content.append(progress, label);
  }
  private updateTimers(): void {
    const state = this.snapshot.state;
    if (state && cycleIndexAt(state.missions.daily.referenceAt, this.now()) > state.missions.daily.cycleIndex) {
      this.controller.refresh(); return;
    }
    for (const gift of this.content.querySelectorAll<HTMLButtonElement>('[data-gift-at]')) gift.disabled = this.now() < Number(gift.dataset.giftAt);
    for (const host of this.content.querySelectorAll<HTMLElement>('[data-accelerate-end]')) {
      const remaining = Number(host.dataset.accelerateEnd) - this.now(); host.hidden = remaining <= 0;
      const button = host.querySelector('button')!;
      button.textContent = `Terminer · ${heartAmount(accelerationCost(remaining))}`;
      button.disabled = (this.snapshot.state?.hearts ?? 0) < accelerationCost(remaining);
      const reason = host.querySelector<HTMLElement>('.reason'); if (reason) reason.hidden = !button.disabled;
    }
    for (const label of this.content.querySelectorAll<HTMLElement>('.timer')) label.textContent = timeLeft(Number(label.dataset.end), this.now());
    for (const progress of this.content.querySelectorAll<HTMLProgressElement>('progress[data-start][data-end]')) progress.value = this.now() >= Number(progress.dataset.end) ? 1 : Math.max(0, Math.min(1, (this.now() - Number(progress.dataset.start)) / Math.max(1, Number(progress.dataset.end) - Number(progress.dataset.start))));
  }
  private confirm(title: string, message: string, action: () => void): void {
    if (this.dialog.open) return;
    const generation = ++this.confirmationGeneration; let used = false;
    this.dialog.replaceChildren(node('h2', title), node('p', message));
    this.button(this.dialog, 'Confirmer', () => {
      if (used || !this.dialog.open || generation !== this.confirmationGeneration) return;
      used = true; this.dialog.close(); action();
    }); this.button(this.dialog, 'Annuler', () => this.dialog.close(), null, true); this.dialog.showModal();
  }
  private discovery(species: SpeciesId): void {
    const info = SPECIES[species]; this.dialog.replaceChildren(node('h2', 'Nouvelle découverte !'), avatar(species, true), node('h3', info.name), node('p', `${typeNames(info.types)} · ${RARITY_NAMES[info.rarity]}`));
    this.button(this.dialog, 'Bienvenue dans la prairie', () => this.dialog.close()); this.dialog.showModal();
  }
  private renderTutorial(): void {
    const s = this.snapshot.state, preferences = this.preferences.value;
    this.tutorial.replaceChildren(); this.tutorial.hidden = !s || !!this.view || !preferences.tutorial || preferences.tutorialDone;
    if (this.tutorial.hidden || !s) return;
    const step = tutorialStep(s, preferences.intro);
    this.tutorial.append(node('p', step.text));
    this.button(this.tutorial, step.done ? 'Terminer' : !preferences.intro ? 'Commencer' : 'Me guider', () => {
      if (step.done) { this.preferences.set({tutorialDone: true}); this.renderTutorial(); }
      else if (!preferences.intro) { this.preferences.set({intro: true}); this.renderTutorial(); }
      else if (step.rabbitId) this.open({kind: 'rabbit', id: step.rabbitId});
      else if (step.building) {
        const existing = s.buildings.find(b => b.kind === step.building);
        this.open(existing ? {kind: 'building', id: existing.id} : {kind: 'shop', tab: 'buildings'});
      }
    });
    this.button(this.tutorial, 'Masquer', () => { this.preferences.set({tutorial: false}); this.renderPreferences(); this.renderTutorial(); }, null, true);
  }
  dispose(): void { this.confirmationGeneration++; if (this.dialog.open) this.dialog.close(); this.dialog.replaceChildren(); this.unsubscribe(); this.abort.abort(); cancelAnimationFrame(this.frame); clearTimeout(this.toastTimer); this.sounds.dispose(); }
}
