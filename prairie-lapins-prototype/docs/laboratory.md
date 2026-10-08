# Laboratoire de test publié

- Jeu normal : [https://sullivanlegoff-code.github.io/Project-L/](https://sullivanlegoff-code.github.io/Project-L/).
- Laboratoire : [https://sullivanlegoff-code.github.io/Project-L/dev/](https://sullivanlegoff-code.github.io/Project-L/dev/).
- Livraison : **`production`**, mêmes sources et même révision pour les deux builds. Le laboratoire active les outils de test ; il n'est pas une branche expérimentale publiée séparément.

Publication et vérification HTTPS réussies le 8 octobre 2026, première révision `92d6511a4b478af9df8b0c2a8f1852949303d3be`, [workflow réussi](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37809697390). Les 381 tests, TypeScript, deux builds et les parcours du site réel (huit contrôles normaux, sept groupes d’isolation) passent, sans erreur de console/réseau. La révision actuelle se lit dans Paramètres et dans `build-revision.txt` de chaque route, y compris après les mises à jour documentaires. Bilan : [progress.md](progress.md). Le joueur a confirmé que la publication normale précédente fonctionne sur son iPhone, ordinateur éteint. Aucun scénario détaillé supplémentaire n'est déduit de ce retour.

## Utilisation

Dans le jeu normal, **Paramètres → Ouvrir le laboratoire de test**, ou ouvrir directement `/dev/`. Aucun paramètre d'URL ni serveur Windows requis pour le laboratoire publié. Son bandeau permanent **MODE TEST — PARTIE SÉPARÉE** propose **Retour au jeu normal**. Le panneau est dans **Paramètres**, avec une place réservée au bandeau pour garder les commandes accessibles.

C'est un bac à sable public, sans authentification ni privilèges serveur. Un chemin, un lien discret ou `?dev=1` n'est pas un contrôle d'accès. Les outils ne sont pas inclus dans le JavaScript du jeu normal ; `?dev=1` n'y active rien.

Commandes :

- Temps de test : **+5, +20, +60, +360, +1 440 minutes**. L'offset est enregistré séparément ; l'horloge réelle du jeu normal reste `Date.now`.
- Pattes : **+1 000 / +10 000** ; herbes : **+100 / +1 000** ; cœurs : **+10 / +100**.
- **Remettre la partie de test à zéro**, après confirmation : nouvelle partie de test, seulement. L'horloge de test, ses préférences et les sauvegardes de secours restent conservées ; aucun `localStorage.clear()` ni suppression d'une autre partie.
- **Collection** : onze espèces présentes dans deux enclos universels de niveau 3.
- **Reproduction** : Paille et Neige à affection 2, avec nid/nurserie ; lancer la reproduction via les commandes ordinaires du jeu.
- **Missions** : les huit missions principales et les trois quotidiennes prêtes à réclamer, récompenses non encore encaissées.
- **Habitats** : un universel et les six spécialisés de niveau 3, sept occupants compatibles dans chacun, deux extensions (49 lapins).
- Export/import de la partie de test ; version et révision visibles dans Paramètres.

Les scénarios remplacent la partie de test après confirmation. Ils passent exactement `encodeGame`/`decodeGame` v4. Scénarios et ressources supplémentaires utilisent l'import transactionnel du contrôleur : écrire et valider avant de remplacer l'état courant, sans bonus d'import. Les actions ordinaires restent dans `GameController.perform` et la simulation. Les dépassements numériques, valeurs non prévues et erreurs de stockage sont refusés. Les outils refusent également un contrôleur marqué `normal`.

## Stockage sur une même origine

Les deux chemins partagent le même `localStorage` ; l'isolation repose sur un adaptateur qui préfixe **toutes** les lectures/écritures de sauvegarde du laboratoire, jamais sur le chemin seul. Aucune recherche de secours dans la partie normale.

| Donnée | Jeu normal, inchangé | Laboratoire |
|---|---|---|
| Partie v4 | `prairie-lapins.save.v1` | `prairie-lapins.development.prairie-lapins.save.v1` |
| Secours migration v1→v2 | `prairie-lapins.backup.before-v2` | `prairie-lapins.development.prairie-lapins.backup.before-v2` |
| Secours migration v2→v3 | `prairie-lapins.backup.before-v3` | `prairie-lapins.development.prairie-lapins.backup.before-v3` |
| Secours migration v3→v4 | `prairie-lapins.backup.before-v4` | `prairie-lapins.development.prairie-lapins.backup.before-v4` |
| Préférences | `prairie-lapins.ui.v1` | `prairie-lapins.development.ui` |
| Horloge | Heure réelle, aucun offset de test | `prairie-lapins.development.clock` |

Ce préfixe reprend celui du mode local historique `?dev=1`, avec contrôle des valeurs d'offset. Format JSON v4 et migrations inchangés. Plusieurs onglets d'une même partie gardent les protections existantes contre les écritures concurrentes ; utiliser un seul onglet par mode.

`SaveStorage.scope` et `GameController.storageScope` identifient la session. La politique `sessionPolicy(true)` expose **`onlineServicesAllowed: false`**, y compris pour le mode local de test ; tout futur client de comptes/synchronisation devra recevoir et respecter cette politique avant initialisation. Aucun compte ni adaptateur de sauvegarde en ligne n'est développé ici.

## Tester volontairement une copie

1. Dans le jeu normal, **Exporter ma partie**, conserver le JSON original.
2. Ouvrir le laboratoire et **Importer dans la partie de test**.
3. Vérifier le résumé, puis confirmer. Seule la partie de test est remplacée.

La partie source n'est pas copiée automatiquement ni modifiée par l'import. Les exports du laboratoire portent **`prairie-lapins-MODE-TEST-…json`**, y compris les exports de contenu protégé et les téléchargements de secours. Le JSON reste un v4 standard : aucun champ ajouté ni changement de format. Les préférences et l'offset ne sont pas exportés, comme pour le mode local historique. Le fichier peut contenir des ressources ajoutées et des dates simulées ; ne l'importer dans une vraie partie que volontairement. Le nom avertit, sans constituer un contrôle d'accès ou une interdiction d'import.

## Builds et publication

```bash
npm ci
npm test
npm run typecheck
VITE_BUILD_REVISION="$(git rev-parse HEAD)" npm run build:pages -- /tmp/prairie-pages
```

Racine : `prairie-lapins-prototype`. `scripts/build-pages.mjs` construit le jeu normal avec base `/Project-L/`, puis le laboratoire avec **`vite build --mode laboratory`**, base `/Project-L/dev/`. Sorties : `/tmp/prairie-pages` et `/tmp/prairie-pages/dev`. `build-revision.txt` est présent dans chaque route ; Paramètres utilise la même source unique de version et la révision injectée.

GitHub Actions utilise `$RUNNER_TEMP/prairie-pages`, vérifie les deux builds et envoie **un seul artefact Pages contenant les deux**. Le laboratoire et le jeu normal ne se déploient jamais indépendamment. Une publication conserve les deux routes ; les branches expérimentales ne remplacent pas le site. Si un build/test échoue, aucun nouveau site n'est déployé.

Le cache GitHub Pages et les assets Vite hashés restent utilisés sans service worker. Ne pas effacer les données Safari pour mettre à jour. Retour arrière : un commit de revert sur `production`, suivi du même pipeline. Le build normal précédent `2d3ba56` reste le point de retour avant le laboratoire ; revenir à cette livraison retire la route de test mais ne supprime aucune donnée stockée sur l'appareil. Pour les livraisons ultérieures, préférer un point fonctionnel comprenant les deux routes et compatible v4. Ne pas revenir au palier v3 de `main`.

## Vérification reproductible

`docs/laboratory-browser-check.cjs <URL normale> <révision>` ouvre les deux pages sur une même origine, en contexte Chromium jetable. Il teste la nourriture normale, le lien, les commandes, la comparaison octet par octet de toutes les clés hors espace de test, la copie par export/import avec annulation, le reset avec annulation/confirmation, les scénarios, les rechargements, le retour normal, les deux révisions et l'absence des outils sur `?dev=1` normal. Le parcours normal historique reste dans `docs/production-browser-check.cjs`.

Les tests unitaires couvrent aussi les backups de migration, préférences, erreurs d'écriture, overflow et contrôleur normal transmis par erreur. Le contexte de test n'utilise jamais la sauvegarde du joueur. Les essais automatisés Chromium (paysage 852×393 et portrait 390×844) ne constituent pas un essai physique Safari. Le certificat du proxy cloud est limité temporairement au certificat du site pour ce navigateur jetable ; les deux accès HTTPS réussissent également avec la validation TLS système active, sans modification du magasin de confiance.

Test iPhone en cinq étapes :

1. Ouvrir le jeu normal, noter les ressources et ouvrir le laboratoire depuis Paramètres.
2. Vérifier le bandeau ; ajouter des ressources et avancer de 60 minutes.
3. Recharger : retrouver les ressources de test et l'horloge avancée.
4. Confirmer la remise à zéro du test, puis revenir au jeu normal : retrouver la progression normale.
5. Fermer Safari, éteindre Windows, puis rouvrir les deux liens en Wi-Fi ou données mobiles.
