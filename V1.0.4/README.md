# Prairie de lapins — étape 7 : missions principales et quotidiennes

**Livraison du 7 octobre 2026 : 230 tests réussis, TypeScript et build réussis.** Huit missions principales, trois quotidiennes par cycle de 24 h et un bonus de 2 cœurs à réclamer après leurs trois récompenses. Les conditions, objectifs, durées et récompenses validés sont centralisés dans `src/config/missions.ts`.

Le dernier test humain sur iPhone valide la prairie sans déformation, les lapins reconnaissables, le zoom, la glissade, le pincement et Recentrer, la collection de onze espèces, les nouveaux communs en boutique, les rares non achetables, les conditions du carnet et la lisibilité des listes/panneaux. Ces réglages sont conservés. **Nouvelles reproductions, dépenses de cœurs et export/import iPhone restent à vérifier**, ainsi que les missions de cette livraison.

## Ce que cette étape ajoute

- Missions principales toutes visibles, conditions acquises définitivement, récompenses manuelles uniques et gratuites, sans verrouiller de fonctionnalité.
- Trois quotidiennes : récolter 100 pattes, récolter 40 herbes, gagner 3 niveaux d'affection. Les récompenses et ressources importées ne sont jamais comptées comme récoltes.
- Cycles fixes de 24 h depuis création/migration, horloge monotone, expiration des récompenses non réclamées, aucun cumul des jours manqués.
- Bonus manuel de 2 cœurs après les trois réclamations. Le cadeau existant de 2 cœurs toutes les 24 h reste indépendant et inchangé.
- Bouton Missions sous les compteurs, indicateur discret, deux onglets, progression, récompenses et état, raccourcis sans dépense, courte animation. Tutoriel conservé.
- JSON **version 3**, migrations depuis v1/v2, conditions actuelles évaluées sans historique inventé. Aucun nouveau cadeau de départ depuis v2. Récompenses et marquages enregistrés ensemble.

Caméra, ergonomie des panneaux existants, onze espèces, revenus, coûts, affection et reproduction sont conservés. Aucune dépendance ajoutée.

Guides inclus : [test des missions sur iPhone](docs/missions-iphone-test.md), [règles et tableaux](docs/game-design.md), [bilan précis](docs/progress.md), [onze espèces](docs/species.md). Les anciens guides de collection, cœurs et export restent utiles pour les validations encore ouvertes.

## Lancer le projet

Installer Node.js 22.12+ ou 24 LTS, extraire l'archive puis ouvrir un terminal dans le dossier `prairie-lapins-prototype` :

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

Sur Windows, garder le terminal ouvert. L'iPhone et l'ordinateur doivent être sur le même réseau. Sur l'iPhone, ouvrir l'adresse **Network** affichée par Vite, avec **`?dev=1`** pour les essais isolés (exemple : `http://192.168.1.20:5173/?dev=1`, à remplacer par l'adresse réelle). Ne pas utiliser `localhost` sur l'iPhone.

Sur ordinateur, ouvrir l'adresse locale affichée, normalement `http://localhost:5173/`. Sur ordinateur : cliquer pour sélectionner, glisser pour déplacer la vue et utiliser la molette pour zoomer. Sur téléphone : paysage, glisser avec un doigt et pincer avec deux doigts. En portrait, une invitation propose de tourner l'appareil ; un bouton permet néanmoins de continuer.

Si l'environnement affiche `uv_interface_addresses`, utiliser :

```bash
npm run dev -- --host 127.0.0.1
```

Puis ouvrir `http://127.0.0.1:5173/`. Ce lancement ne publie pas de lien HTTPS ; le déploiement sera une étape distincte.

```bash
npm test
npm run typecheck
npm run build
npm run preview
```

## Ce qui est jouable

- Prairie Phaser plein écran, vue aérienne inclinée, fleurs et terrain à débloquer ; caméra bornée, glissade, pincement et molette.
- Boutique Bâtiments/Lapins. Choix d'une case, aperçu, validation avec prix ou annulation gratuite. Grille visible pendant le placement/déplacement, avec ✓ et × en complément des couleurs.
- Enclos en bois, ferme végétale, nid, nurserie et onze variantes de lapins originales ; petits déplacements, oreilles animées et réaction à la nourriture.
- Pattes, herbe et cœurs toujours affichés. Panneaux latéraux avec fermeture, informations d'enclos et fiches individuelles.
- Nourriture, changement d'enclos et départ d'un doublon après confirmation. Boutons désactivés avec leurs motifs et traitement des refus de dernière seconde par le contrôleur.
- Bulles de récolte par enclos et par ferme, plafond signalé, trois commandes, barres et délais issus des horodatages.
- Choix de deux parents, disponibilité, prix/délai, résultats possibles, probabilités exactes ouvertes par défaut et état de la garantie. Carnet des recettes et parents compatibles.
- Résultat de reproduction caché jusqu'à la fin de croissance. Choix de l'enclos à l'accueil, protection des capacités et fenêtre de nouvelle découverte.
- Missions principales et quotidiennes, réclamations gratuites, bonus, compte à rebours et progression persistée.
- Collection de onze entrées : inconnus « ??? », espèces découvertes avec types, rareté, effectifs et obtention ; cinq recettes dans le carnet.
- Extension unique, déplacement de bâtiments et de lapins.
- Tutoriel facultatif adapté à la partie courante ; il ne donne pas de ressources. Sons synthétiques discrets, démarrés seulement par une action utilisateur, avec option muet.
- Paramètres : sons, tutoriel, sauvegarde, date de réussite, nouvel essai, export/import et redémarrage confirmé. Toute erreur de sauvegarde reste signalée sur la prairie.

## Tester rapidement avec l'horloge de développement

Avec `npm run dev`, ouvrir `http://localhost:5173/?dev=1` (ou la même URL sur `127.0.0.1` si c'est l'hôte choisi). Un badge « Mode test · partie séparée » apparaît. Dans **Paramètres**, les boutons +5, +20, +60, +360 et +1440 minutes avancent une horloge injectée dans le contrôleur.

- Les coûts, délais et probabilités officiels ne changent pas ; aucune ressource de test n’est offerte automatiquement ; la récompense normale de cœurs devient réclamable à son échéance simulée.
- L'horloge, les préférences et la sauvegarde sont isolées sous `prairie-lapins.development.*`.
- La partie normale utilise toujours `prairie-lapins.save.v1`.
- Revenir à l'URL sans `?dev=1` retrouve la partie normale.
- Le module de développement n'est pas inclus dans le bundle de production. `?dev=1` n'a aucun effet avec le build normal.
- Un export effectué en mode test est un JSON version 3 : ne l'importer dans une partie normale que volontairement.

Le parcours du nouveau palier est dans [collection-iphone-test.md](docs/collection-iphone-test.md). Il propose l'import volontaire de `docs/test-saves/collection-ready-v2.json` **uniquement dans la partie de test** : six communs d'affection 2, bâtiments et extension, ressources préparées et neuf échecs simulés pour exercer la garantie. Ce fichier n'est jamais chargé automatiquement ; une nouvelle partie garde 300 pattes, 10 herbes et 12 cœurs.

## Parcours manuel de la boucle complète

Effectuer ce parcours en mode test pour éviter les attentes ; le même parcours fonctionne avec les délais réels.

1. Pour une nouvelle partie, vérifier 300 pattes, 10 herbes, 12 cœurs et les deux lapins de départ. Tourner le téléphone, ouvrir/fermer un panneau, glisser et zoomer. Vérifier qu'une glissade ou un pincement ne sélectionne rien, et que le défilement d'une liste ne déplace pas la caméra.
2. Toucher chaque lapin, ou le choisir dans la liste de l'enclos. Nourrir Paille et Neige une fois : affection 2 chacun, herbe restante 6. Une double pression très rapide ne doit pas nourrir deux fois.
3. Boutique → Bâtiments → Ferme : choisir une case puis annuler. Les pattes restent identiques. Recommencer et valider sur une case libre. Essayer aussi une case occupée et une case verrouillée : validation désactivée, motif visible.
4. Construire ferme, nid et nurserie : coût total 240 pattes, portefeuille restant 60 avant d'autres dépenses ou récoltes. La grille disparaît après validation.
5. Ferme → produire 20 herbes pour 10 pattes. Avancer de 5 minutes dans les paramètres de test. Récolter par la bulle ou le panneau : +20 herbes, aucun redémarrage automatique.
6. Nid → choisir Paille comme parent A et Neige comme parent B. Consulter prix, durée, probabilités et garantie, puis lancer pour 20 pattes. Vérifier que le même individu ne peut pas occuper les deux places.
7. Avancer de 20 minutes : transfert en nurserie. Avant la fin de croissance, le nid, la nurserie et la collection ne doivent pas afficher l'espèce du résultat. Avancer de 15 minutes supplémentaires, suffisantes pour tout résultat. Toucher la nurserie : le lapereau est révélé. L'accueillir dans l'enclos initial qui possède encore une place. Une espèce inédite ouvre une fenêtre et entre alors seulement dans la collection.
8. Refaire des reproductions, dont une pendant que la nurserie est occupée. Vérifier l'attente au nid et le démarrage de la nouvelle croissance seulement après l'accueil précédent. En cas de capacité pleine, le lapereau reste en nurserie.
9. Avancer le temps puis récolter les pattes dans chaque bulle pour financer un deuxième enclos (120 pattes). Acheter un Lapin Terre (80 pattes), le nourrir à l'affection 2, puis tester Paille × Terre. Répéter les paires admissibles pour découvrir les hybrides ; les tirages restent aléatoires, avec la garantie validée.
10. Déplacer un bâtiment en choisissant une autre case, annuler une fois puis confirmer. Changer un lapin d'enclos et vérifier les capacités affichées. Pour un doublon commun, tester « Confier », annuler puis confirmer. Le dernier représentant et un parent occupé doivent rester protégés.
11. Accumuler et récolter 500 pattes (répéter les avances et récoltes si nécessaire), toucher les herbes hautes puis acheter l'extension. Vérifier les six nouvelles cases et le déplacement d'un bâtiment sur la dernière colonne. Sélection et caméra doivent rester cohérentes.
12. Paramètres → exporter. Vérifier le fichier daté, fermer la page puis rouvrir exactement la même origine. Ressources, lapins, bâtiments et délais doivent être conservés. Importer le fichier : inspecter le résumé, annuler sans perte, recommencer puis confirmer. Vérifier aussi un fichier invalide ou d'une version incompatible.

Pour un test reproductible de changement de ressources, copier un export et modifier uniquement `pattes` et `grass` en entiers positifs avant de l'importer. Garder l'export original pour revenir en arrière.

## Sauvegarde et sécurité des imports

Le contrôleur crée ou restaure la partie, avance le temps, sauvegarde immédiatement après une action et lors des reprises. Une actualisation légère intervient toutes les cinq secondes quand la page est visible. L'affichage des décomptes est actualisé chaque seconde ; les transitions de simulation arrivent au prochain rafraîchissement ou à la sélection du bâtiment.

Une sauvegarde illisible/incompatible n'est jamais écrasée automatiquement. Une lecture impossible ne provoque pas de création aveugle. En cas d'écriture refusée, la partie reste en mémoire et peut être exportée. La date de réussite change seulement après une écriture réussie.

L'import vérifie la taille (1 000 000 octets avant lecture, limite existante de 1 000 000 caractères au décodage), valide le JSON et affiche un résumé. Après confirmation, il avance puis enregistre l'état importé avant de remplacer la partie active. Échec ou annulation : partie et sauvegarde précédentes conservées. L'export utilise le partage natif de fichiers lorsqu'il est disponible, sinon un téléchargement ; les URLs temporaires sont libérées.

Le JSON exporté est en **version 3**. Les v1/v2 sont migrées : principales vérifiables proposées sans réclamation automatique, quotidiennes à zéro et premier cycle de 24 h. Les résultats de reproduction, réservations, ressources, fractions et coordonnées sont conservés. La v2 garde ses cœurs et l'échéance du cadeau ; la v1 reçoit seulement sa dotation historique de 12 cœurs, une fois. Un import v1/v2 fixe la référence des cycles à la confirmation effective. Un import v3 garde sa progression et ses réclamations, sous réserve de l'expiration normale du cycle, sans fusion avec la partie remplacée.

La clé active garde son nom historique `prairie-lapins.save.v1` ; le contenu est v3. Copie brute avant migration d'une v2 : `prairie-lapins.backup.before-v3`. La copie de migration v1 conserve la clé `prairie-lapins.backup.before-v2`. Échec de copie ou d'écriture active : ancien contenu intact, état en mémoire/export disponible avec avertissement. Ces copies techniques n'ont pas de panneau dédié ; garder un export de secours. Les anciennes versions du jeu ne reconnaissent pas la v3.

**Les sauvegardes sont liées à l'origine : protocole, domaine et port.** Changer d'adresse, de `localhost` à `127.0.0.1`, ou passer au futur site HTTPS nécessite un export/import. Le navigateur peut effacer ses données ; aucune permanence n'est garantie. Privilégier un seul onglet. Les préférences de sons/tutoriel sont séparées du JSON de partie et ne sont pas transférées par export.

## Architecture et vérifications

| Dossier | Rôle |
|---|---|
| `src/config/` | équilibrage, espèces validées et réglages visuels séparés |
| `src/state/`, `src/simulation/` | état versionné et règles indépendantes de Phaser et du navigateur |
| `src/application/` | contrôleur unique, horloge, sauvegarde et reprises |
| `src/persistence/` | validation/JSON et stockage injectable |
| `src/display/` | scène Phaser, événements du canvas, panneau de sauvegarde, export |
| `src/ui/` | panneaux de jeu, projections sans révélation prématurée, gestes, portraits, sons et préférences |
| `src/dev/` | horloge de développement isolée, exclue de la production |
| `tests/` | 230 tests, dont 29 parcours via les éléments HTML dans un DOM simulé |

Les commandes visuelles utilisent exclusivement `GameController.perform`. La scène ne modifie jamais l'état. Les confirmations d'import et de redémarrage réutilisent les fonctions transactionnelles du contrôleur. Les snapshots sont des copies. Le moteur intègre les commandes de cœurs et le contrôleur fournit son horloge à la migration. Les règles précédentes et la géométrie visuelle sont conservées.

Vérifications exécutées : **230 tests réussis**, TypeScript strict et build réussis. Les 187 tests précédents sont conservés avec les attentes de migration adaptées au format v3 ; 39 tests de missions et 4 parcours HTML ont été ajoutés. Les tests vérifient conditions durables, réclamations uniques, événements réellement comptés, frontières temporelles, longues absences, bonus, migrations et import/export. `happy-dom` reste réservé aux tests. L'avertissement de taille du bundle Phaser demeure non bloquant.

## Limites et validation restante

Le test humain précédent, effectué sur iPhone Safari en paysage via un serveur Windows 11, a validé affichage/panneaux/orientation, glissade et pincement, sélection/nourriture/affection, boutique/placement/annulation/refus, fermes, reproduction cachée/nurserie/accueil/découverte, revenus/capacités/déplacements, extension, attente au nid, enclos pleins, protection des dernières espèces, sauvegarde au rechargement et reprise après arrière-plan. Les boutons et lapins étaient faciles à toucher, les écrans compréhensibles et l'ambiance appréciée.

Le dernier test humain complète ces résultats : perspective stable, lapins grands et reconnaissables, zoom confortable, déplacement/pincement/Recentrer fonctionnels, collection de onze espèces, boutique et conditions du carnet correctes, listes et panneaux lisibles. **La caméra est désormais validée par l'humain et conservée.** Cela ne valide pas les nouvelles reproductions, dépenses de cœurs ou l'export/import sur iPhone.

Pour cette livraison, Vite démarre mais le navigateur disponible refuse la connexion au serveur local (`ERR_CONNECTION_REFUSED`). Les parcours HTML exécutés dans un DOM simulé vérifient les boutons, textes et effets, pas le rendu Safari ni les gestes physiques. Aucune validation iPhone des missions n'est revendiquée. Vérifier le nouveau bouton sous le HUD, le défilement, les récompenses/renouvellements et les reprises avec le [guide court](docs/missions-iphone-test.md).

Aucun nouveau lapin, habitat spécialisé, décoration, mini-jeu, déploiement HTTPS ou PWA. Prochaine étape recommandée : valider les missions et les opérations encore ouvertes sur iPhone, puis concevoir un palier d'aménagement avec habitats spécialisés et objectifs de collection, à chiffrer et valider avant développement.

Références techniques : [caméras Phaser](https://docs.phaser.io/phaser/concepts/cameras), [mise à l'échelle Phaser](https://docs.phaser.io/phaser/concepts/scale-manager), [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
