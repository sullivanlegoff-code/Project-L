# Consolidation et première passe visuelle — 8 octobre 2026

La cible réelle est `prairie-lapins-prototype`, sauvegardes **v4**. Le dossier `V1.0.4` correspond au palier précédent des missions, sauvegardes v3 et 230 tests. Les sources habitats et leur archive existaient déjà ; aucune mécanique n'a été réimplémentée depuis le brief.

Révision de départ : `e3e4b8924ce09e065ccd552bef5cd7db0c416828`, branche initiale `work`, copie de travail propre. `origin/main` porte la même révision ; aucune autre branche distante ni tag trouvé. Travail dans `visual/meadow-habitats`. Dossiers historiques, archive originale et builds versionnés conservés.

## Fonctionnalités et corrections

Onze espèces, affection, revenus fractionnaires, fermes, reproduction/garantie, nurserie, cœurs, missions et export/import sont présents. Six habitats spécialisés et universels, niveaux 1–3, capacités 3/5/7, coûts/plafonds validés, deux extensions (3×2 → 6×2 → 9×2), migrations v1/v2/v3 vers v4 : tout est conservé.

Défauts visuels constatés : cinq occupants utilisaient les cinq premiers emplacements de la disposition pour sept ; à sept, les lapins du premier plan empiétaient sur le nom de l'habitat. Aucun défaut de simulation reproductible trouvé dans cette étape.

- Dispositions équilibrées de quatre à sept occupants, premier plan remonté pour dégager le nom ; zones de toucher suivant les positions animées, priorité au premier plan à distance égale, tri des animaux par profondeur.
- Animation réduite à ±3 pixels horizontalement, ±1,5 verticalement et un bond de nourriture de 5 pixels. Taille 1,3 et rayon de sélection 27 pixels écran conservés.
- Prairie moins quadrillée : nuances et plaques végétales, fleurs déterministes, liseré et ombre légère. Plantes éloignées des bâtiments.
- Habitats aux proportions communes : sol en relief, bordures et repères de niveau. Paille : botte et épis ; neige : congères/cristaux ; terre : terrier/pierres ; feu : galets lumineux/fleurs chaudes ; métal : dallage/bornes ; vol : nuages/rubans.
- Noms sur cartouches arrondis, panneaux et boutons conservés. Dessins vectoriels originaux dans `src/display/habitatArt.ts`, sans dépendance ni asset externe.

Projection, zoom 1,05 et limites 0,8–1,65, recentrage et identité des espèces inchangés. Économie, probabilités et horloges inchangées. Le décor est indépendant des tirages de reproduction. Des ailes peuvent se recouvrir légèrement à sept ; les visages et cibles restent distincts.

## Vérifications exécutées

| Vérification | Résultat |
|---|---|
| Référence avant modifications | 361 tests / 9 fichiers, TypeScript et build réussis |
| Version finale | **369 tests / 10 fichiers réussis**, aucun échec ni test ignoré |
| Nouveaux tests | 8 : sélection cinq/sept, animation/nourriture aux extrêmes, profondeur et noms dégagés |
| TypeScript strict | Réussi, seul et dans le build |
| Build final | Réussi, 47 modules ; JS 1 364,65 ko / gzip 379,48 ko ; CSS 6,91 ko |
| Avertissement Phaser | Taille du bundle, non bloquant |
| Vite | Version visuelle démarrée sur 5175, réponses HTTP vérifiées |
| Chromium réel | Prairie rendue, six spécialisés et universel niveau 3 avec sept occupants |
| Clics canvas | Sept occupants aux zooms 0,8 / 1,05 / 1,65 : **21/21**, avant et après |
| Panneaux | Boutique et Missions ; panneau contenu dans le viewport paysage |
| Console/réseau | Aucune erreur ni requête échouée dans les parcours |
| Persistance en mode test | Nourriture par contrôleur, affection 4→5 écrite puis conservée au rechargement ; aucune sauvegarde normale créée |
| Build en navigateur | Partie initiale v4 affichée, aucune erreur ; `?dev=1` ne crée pas de mode test en production |
| Safari sur iPhone physique | Validation humaine attendue |

Contextes navigateur jetables, sauvegarde de développement uniquement. Captures ordinateur **1500×700** et paysage mobile **852×393**. Les scènes sont figées pour les captures/clics comparables ; les cibles pendant l'animation sont couvertes par les tests. Ces résultats ne valident pas Safari ni les gestes physiques.

Helper reproductible : `docs/visual-browser-check.cjs`, avec Playwright et Chromium disponibles dans le cloud sans modification du lockfile. Il exécute également une nourriture via le contrôleur, vérifie la sauvegarde de développement écrite, puis la retrouve après rechargement ; aucune clé de partie normale créée.

```bash
PRAIRIE_TEST_URL='http://127.0.0.1:5175/?dev=1' node docs/visual-browser-check.cjs after
```

Captures et rapports sous `/workspace/artifacts/prairie-visual/` : `before-desktop.png`, `after-desktop.png`, `before-mobile-seven.png`, `after-mobile-seven.png`, variantes habitats/boutique et rapports JSON. La référence avant provient d'une copie temporaire de la révision Git originale ; les modifications en cours n'ont pas été effacées. Sortie configurable par `PRAIRIE_CAPTURE_DIR`.

## Version accessible et lancement

L'adresse fournie, `http://192.168.1.13:5173/?dev=1`, est un **serveur Vite sur le réseau local du joueur**, en mode de test séparé. Elle ne révèle pas le dossier lancé sur Windows. Aucun hébergeur, workflow de déploiement ou URL publique n'est configuré dans le dépôt. Les builds statiques ne constituent pas une publication du jeu. La publication de l'environnement Codex prépare les tâches futures ; elle ne publie pas le site. Aucun site public remplacé, aucun aperçu cloud partageable disponible ici. Pas de PWA ni de promesse de fonctionnement hors connexion.

Sous Windows, ouvrir un terminal dans **`prairie-lapins-prototype`** :

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

Sur l'iPhone du même Wi-Fi : adresse **Network** avec `?dev=1`. Si Windows conserve `192.168.1.13`, la nouvelle version utilise **5175**. La session actuelle sur 5173 reste distincte. Scénario facultatif : `docs/test-saves/visual-ready-v4.json`, à importer seulement après vérification du badge Mode test. Guide : [parcours iPhone](visual-iphone-test.md).

Compilation sans écraser le dist versionné :

```bash
npm run build -- --outDir ../build-visual
```

Build cloud vérifié sous `/workspace/project-l-build/habitats-visual`. Un aperçu de production n'active pas `?dev=1` ; les outils de développement sont exclus du bundle.

Archive de cette passe : `/workspace/artifacts/prairie-lapins-visuel-v4.zip`, avec sources, tests, documents, scénario, build final et captures dans `validation/`. L'archive historique du dépôt n'a pas été remplacée. Les champs cloud `install_script` et `start_skill` ont été enregistrés dans un nouveau brouillon pour cibler le bon dossier et le port 5175 ; ce brouillon ne publie ni l'environnement ni le jeu. Sa revue/enregistrement/publication se fait dans les paramètres de l'environnement.

## Sauvegardes et suite

JSON **v4** et clés inchangés, aucune migration supplémentaire ni redotation. Les v4 restent compatibles ; l'ancienne version v3 ne lit pas les v4. Changer de protocole, domaine ou port impose un export/import volontaire : garder l'export original. Aucun scénario chargé automatiquement dans une partie normale.

Prochaine étape : essai iPhone de cette passe (habitats, sept sélections, gestes/recentrage, panneaux, améliorations et extension), puis export/import et reprise. Recueillir le retour avant d'élargir l'illustration ou d'ajouter du contenu. Missions, nouvelles rares et dépenses de cœurs restent aussi à valider sur appareil.

Bilans historiques : [habitats, 361 tests](history/progress-habitats-v4.md) et [missions, 230 tests](history/progress-missions-v3.md).
