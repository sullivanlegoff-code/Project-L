# Prairie de lapins — étape 5 : cœurs

**Livraison du 6 octobre 2026 : cœurs jouables, migration v1 → v2, 155 tests réussis.** Les réglages de perspective et de caméra de l'étape 4 sont conservés ; ils n'ont pas encore été validés sur iPhone. L'export/import iPhone reste aussi à tester.

Jeu solo Phaser, TypeScript et Vite, orienté collection, développement de la prairie, amélioration des lapins et découverte par reproduction, dans un univers original. Les règles et chiffres précédents sont préservés ; les cœurs suivent les valeurs nouvellement validées.

## Ce que cette étape ajoute

- 12 cœurs une seule fois à la création ou migration v1 ; cadeau manuel de 2 après 24 h, puis 24 h après chaque réclamation, sans cumul des jours manqués.
- Compteur avec icône SVG originale ouvrant le panneau Cœurs, usages expliqués et cadeau gratuit distinct des dépenses.
- Accélération confirmée de ferme, reproduction et croissance : une tranche de 5 min restantes par cœur, arrondie au supérieur. Prix recalculé à confirmation, diminution acceptée, dépassement interdit.
- Complément explicitement choisi et confirmé : jusqu'à 25 pattes manquantes par cœur. Achats, placement définitif, extension, ferme et reproduction ; aucune substitution à l'herbe ni contournement des capacités.
- Transactions atomiques, confirmations à usage unique, résultat de reproduction inchangé et masqué jusqu'à fin de croissance.
- JSON v2, import v1 migré et import v2 sans nouvelle dotation. Copie de récupération v1 avant migration ; protections existantes contre erreurs et fichiers invalides conservées.
- Outil de test supplémentaire **+1440 min** ; partie, horloge et préférences du mode développement restent séparées.

Les règles détaillées figurent dans [game-design.md](docs/game-design.md), le bilan dans [progress.md](docs/progress.md), et le parcours court dans [hearts-iphone-test.md](docs/hearts-iphone-test.md).

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
- Enclos en bois, ferme végétale, nid, nurserie et cinq silhouettes de lapins originales ; petits déplacements, oreilles animées et réaction à la nourriture.
- Pattes, herbe et cœurs toujours affichés. Panneaux latéraux avec fermeture, informations d'enclos et fiches individuelles.
- Nourriture, changement d'enclos et départ d'un doublon après confirmation. Boutons désactivés avec leurs motifs et traitement des refus de dernière seconde par le contrôleur.
- Bulles de récolte par enclos et par ferme, plafond signalé, trois commandes, barres et délais issus des horodatages.
- Choix de deux parents, disponibilité, prix/délai, résultats possibles, probabilités dépliables et état de la garantie.
- Résultat de reproduction caché jusqu'à la fin de croissance. Choix de l'enclos à l'accueil, protection des capacités et fenêtre de nouvelle découverte.
- Collection : inconnus « ??? », espèces découvertes avec types, rareté, effectifs et obtention.
- Extension unique, déplacement de bâtiments et de lapins.
- Tutoriel facultatif adapté à la partie courante ; il ne donne pas de ressources. Sons synthétiques discrets, démarrés seulement par une action utilisateur, avec option muet.
- Paramètres : sons, tutoriel, sauvegarde, date de réussite, nouvel essai, export/import et redémarrage confirmé. Toute erreur de sauvegarde reste signalée sur la prairie.

## Tester rapidement avec l'horloge de développement

Avec `npm run dev`, ouvrir `http://localhost:5173/?dev=1` (ou la même URL sur `127.0.0.1` si c'est l'hôte choisi). Un badge « Mode test · partie séparée » apparaît. Dans **Paramètres**, les boutons +5, +20, +60, +360 et +1440 minutes avancent une horloge injectée dans le contrôleur.

- Les coûts, délais et probabilités officiels ne changent pas ; aucune ressource de test n’est offerte ; la récompense normale de cœurs devient réclamable à son échéance simulée.
- L'horloge, les préférences et la sauvegarde sont isolées sous `prairie-lapins.development.*`.
- La partie normale utilise toujours `prairie-lapins.save.v1`.
- Revenir à l'URL sans `?dev=1` retrouve la partie normale.
- Le module de développement n'est pas inclus dans le bundle de production. `?dev=1` n'a aucun effet avec le build normal.
- Un export effectué en mode test est un JSON version 2 : ne l'importer dans une partie normale que volontairement.

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

Le JSON exporté est désormais en **version 2**, avec `hearts` et `nextHeartGiftAt`. Au démarrage, un v1 valide reçoit 12 cœurs et une première récompense à 24 h de la migration, sans modifier les autres données (puis avance normale du temps). À l'import v1, l'échéance part de la confirmation effective. Un v2 conserve exactement son solde. Réimporter un vieux v1 remplace l'ancienne progression volontairement, sans addition de cœurs à la partie active.

La clé active garde son nom historique `prairie-lapins.save.v1` pour retrouver les parties existantes ; le contenu est v2. Avant migration, une copie brute v1 est écrite sous `prairie-lapins.backup.before-v2`. Échec de cette copie ou de l'écriture active : ancien contenu intact et avertissement. Cette copie technique n'a pas de panneau de restauration dédié ; garder également un export de secours. Ne pas rouvrir une ancienne version du jeu sur une sauvegarde v2 : son lecteur ne la reconnaîtra pas.

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
| `tests/` | 155 tests, dont 20 parcours via les éléments HTML dans un DOM simulé |

Les commandes visuelles utilisent exclusivement `GameController.perform`. La scène ne modifie jamais l'état. Les confirmations d'import et de redémarrage réutilisent les fonctions transactionnelles du contrôleur. Les snapshots sont des copies. Le moteur intègre les commandes de cœurs et le contrôleur fournit son horloge à la migration. Les règles précédentes et la géométrie visuelle sont conservées.

Vérifications exécutées : **155 tests réussis**, vérification TypeScript stricte et build de production réussis. Les 107 scénarios précédents sont conservés, avec adaptations des attentes liées au format v2 ; 48 tests de cœurs et parcours supplémentaires ont été ajoutés. `happy-dom` est une dépendance de développement ajoutée pour tester les boutons, panneaux, confirmations et imports sans navigateur ; elle n'entre pas dans le bundle du jeu. Le bundle Phaser déclenche encore l'avertissement de taille de Vite.

## Limites et validation restante

Le test humain précédent, effectué sur iPhone Safari en paysage via un serveur Windows 11, a validé affichage/panneaux/orientation, glissade et pincement, sélection/nourriture/affection, boutique/placement/annulation/refus, fermes, reproduction cachée/nurserie/accueil/découverte, revenus/capacités/déplacements, extension, attente au nid, enclos pleins, protection des dernières espèces, sauvegarde au rechargement et reprise après arrière-plan. Les boutons et lapins étaient faciles à toucher, les écrans compréhensibles et l'ambiance appréciée.

Ces résultats concernent **l’étape 3, avant correction visuelle et avant cœurs**. L’humain a choisi de poursuivre sans test intermédiaire de l’étape 4. Le défaut de biais n'a pas été reproduit visuellement par l'assistant : l'ancien cisaillement sur les deux axes a été identifié dans le code. Le navigateur disponible refuse toujours le serveur local (`ERR_BLOCKED_BY_CLIENT`), malgré le démarrage réussi de Vite. Aucune capture ni validation iPhone de la correction visuelle ou des cœurs n’est revendiquée. Les tests comprennent des événements/coordonnées simulés ; ils ne valident pas le rendu ni les gestes physiques.

Le compteur et les paiements en cœurs restent à vérifier sur l’appareil suivant `docs/hearts-iphone-test.md`. La comparaison de cadrage, les marges, les zones sûres, la rotation pendant un geste et **l’export/import iPhone encore non testé** sont détaillés dans `docs/manual-test.md`. En portrait, la présentation reste secondaire.
Visuels et sons provisoires, pas de musique. Aucune mission, aucun mini-jeu, vêtement, décoration avancée, espèce supplémentaire ou PWA. Le déploiement HTTPS reste une étape distincte.

Références techniques : [caméras Phaser](https://docs.phaser.io/phaser/concepts/cameras), [mise à l'échelle Phaser](https://docs.phaser.io/phaser/concepts/scale-manager), [localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).
