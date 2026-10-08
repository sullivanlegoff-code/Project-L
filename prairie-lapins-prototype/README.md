# Prairie de lapins — consolidation visuelle des habitats

Le dossier à utiliser est **`Project-L/prairie-lapins-prototype`**, issu des sources récentes de `prairie-lapins-habitats-v4.zip`. Il contient les six habitats spécialisés, leurs trois niveaux, la deuxième extension et les sauvegardes **v4** avec migrations v1/v2/v3. `Project-L/V1.0.4` est la livraison historique des missions : sauvegardes v3 et 230 tests. Le nom du dossier ne désigne donc pas le format de sauvegarde.

**Retour iPhone reçu le 8 octobre 2026 : « tout fonctionne bien pendant mon essai ».** Aucun détail de scénario n'a été communiqué ; ce retour est consigné sans élargir ce qui a été testé.

## Publication HTTPS

Le laboratoire préparé à **[https://sullivanlegoff-code.github.io/Project-L/dev/](https://sullivanlegoff-code.github.io/Project-L/dev/)** utilise la même révision que le jeu normal, avec les outils de test activés, un bandeau permanent et un stockage explicitement séparé. Le workflow publie les deux builds ensemble. **381 tests réussis**, TypeScript et deux builds validés ; [guide du laboratoire](docs/laboratory.md) et [statut de publication](docs/progress.md). Le joueur confirme que la publication normale précédente fonctionne sur iPhone avec Windows éteint.

La branche de livraison **`production`** provient de `visual/meadow-habitats` (`87862a0`), avec seulement la préparation d'hébergement et une information de version dans Paramètres. Le dépôt est déjà public et GitHub Pages fournit une formule gratuite adaptée. Aucune visibilité ni règle de jeu modifiée.

**Jouer : [https://sullivanlegoff-code.github.io/Project-L/](https://sullivanlegoff-code.github.io/Project-L/)**. Publication réussie et huit contrôles du jeu sur l'adresse HTTPS réussis le 8 octobre 2026 : rendu, menus, nourriture, export/import, refus invalide, persistance et exclusion des outils de développement. La première révision vérifiée est `520d4a4` ; la révision actuellement servie est indiquée dans Paramètres et [build-revision.txt](https://sullivanlegoff-code.github.io/Project-L/build-revision.txt). Lire [le bilan précis](docs/progress.md) et [le guide de publication](docs/deployment.md) pour le build sous `/Project-L/`, les mises à jour depuis `production`, les retours arrière et l'import depuis l'ancienne partie locale.

La progression reste locale à chaque appareil/navigateur. Une nouvelle origine HTTPS ne récupère pas automatiquement la sauvegarde de `:5175`. Exporter depuis l'ancien site, garder le JSON, puis importer avec confirmation sur le nouveau. Une ancienne partie `?dev=1` est accélérée : l'importer volontairement ou choisir une partie normale neuve. Mêmes format v4, clés et migrations, aucune fusion/redotation. Les assets sont nommés par hash ; aucun service worker ni nettoyage des données Safari requis pour une mise à jour.

La référence habitats compte **361 tests** ; cette passe ajoute **8 tests de disposition et sélection**, soit **369 tests réussis dans 10 fichiers**, avec TypeScript et build validés. Le bilan de validation final et les captures sont dans [docs/progress.md](docs/progress.md). Aucun nouveau lapin ni dépendance.

Le test humain précédent valide perspective, zoom, déplacement, pincement, Recentrer, taille des lapins, collection de onze espèces et lisibilité des panneaux. Les réglages de zoom, projection, compteurs et panneaux sont conservés. **Cette nouvelle passe et les habitats, missions, nouvelles reproductions, dépenses de cœurs et export/import restent à vérifier sur iPhone.**

## Passe visuelle

- Prairie avec ombre sous le terrain, bordure claire, taches d'herbe douces et fleurs écartées des empreintes occupées.
- Habitats avec socle, sol texturé, clôture commune et repères de niveau. Paille dorée et épis, neige et cristaux, terre et terrier, pierres chaudes du feu, dallage et rivets du métal, nuages et fanions du vol. Les dessins vectoriels originaux sont conservés dans `src/display/habitatArt.ts`.
- Dispositions équilibrées pour quatre à sept occupants : cinq en deux rangées, sept en trois rangées. Les occupants avant laissent les noms des habitats lisibles.
- Lapins dessinés selon leur profondeur et sélection suivant leur position animée. Le corps le plus proche du toucher est choisi ; à distance égale, celui au premier plan est prioritaire.
- Déplacement discret de ±3 pixels horizontalement et ±1,5 verticalement, petit bond de 5 pixels après nourriture. Taille ×1,3, rayon de sélection de 27 pixels écran, identité des onze espèces, projection et zooms 0,8 / 1,05 / 1,65 conservés.

Les changements sont visuels : mêmes règles, ressources, probabilités, clés de stockage et format v4. Aucune migration supplémentaire.

## Fonctionnalités de la livraison habitats

- Six variantes : paille, neige, terre, feu, métal et vol ; universels conservés.
- Achat, accueil et transfert contrôlent le type et la place disponible avant toute dépense. Hybrides compatibles avec chacun de leurs types.
- Amélioration immédiate avec confirmation ; même case, occupants et stock. Aucun revenu rétroactif récupéré après augmentation du plafond.
- Compléments facultatifs en cœurs pour achats spécialisés, améliorations et seconde extension, avec confirmations et transactions atomiques.
- Terrain 3 × 2 → 6 × 2 pour 500 pattes → 9 × 2 pour 1 000 pattes. Mission de première extension inchangée.
- Boutique séparée, informations détaillées des habitats, refus expliqués, rangées pour cinq/sept occupants et limites latérales adaptées sans modifier le zoom.
- Format v4 : les anciens enclos deviennent universels niveau 1 ; ressources, cœurs, missions et résultats de reproduction sont préservés.

| Famille | Niveau 1 : places / plafond / achat | Niveau 2 : places / plafond / coût | Niveau 3 : places / plafond / coût |
|---|---|---|---|
| Universel | 3 / 600 / 120 | 5 / 900 / 200 | 7 / 1 200 / 400 |
| Spécialisé | 3 / 900 / 200 | 5 / 1 500 / 300 | 7 / 2 100 / 600 |

Plafonds et coûts exprimés en pattes. Aucun multiplicateur de revenus. Les six noms et types sont dans [les règles](docs/game-design.md).

**À lire : [nouveau parcours visuel sur iPhone](docs/visual-iphone-test.md), [parcours des habitats](docs/habitats-iphone-test.md), [bilan précis](docs/progress.md), [règles et tableaux](docs/game-design.md).** Scénario facultatif : `docs/test-saves/habitats-ready-v4.json`, uniquement à importer en mode test. Il contient explicitement des ressources et neuf espèces de test, dont les trois rares, sans en offrir aux parties normales. Les anciens guides de missions, collection, cœurs et export restent utiles.

## Lancer le projet

Installer Node.js 22.12+ ou 24 LTS. Sur Windows 11, ouvrir PowerShell dans **`Project-L/prairie-lapins-prototype`**, ou utiliser le chemin réel à la place de celui ci-dessous :

```powershell
cd "C:\chemin\vers\Project-L\prairie-lapins-prototype"
npm ci
npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

Garder le terminal ouvert. Le port **5175** réserve un aperçu distinct de la version utilisée sur 5173. `--strictPort` signale un port déjà occupé au lieu de changer silencieusement d'adresse. L'iPhone et l'ordinateur doivent être sur le même réseau. Sur l'iPhone, ouvrir l'adresse **Network** affichée par Vite, avec **`?dev=1`** pour les essais isolés (exemple : `http://192.168.1.13:5175/?dev=1`, à remplacer par l'adresse réelle). Ne pas utiliser `localhost` sur l'iPhone.

Sur ordinateur, ouvrir `http://localhost:5175/?dev=1`. Cliquer pour sélectionner, glisser pour déplacer la vue et utiliser la molette pour zoomer. Sur téléphone : paysage, glisser avec un doigt et pincer avec deux doigts. En portrait, une invitation propose de tourner l'appareil ; un bouton permet néanmoins de continuer.

Si l'environnement affiche `uv_interface_addresses`, utiliser :

```bash
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Puis ouvrir `http://127.0.0.1:5175/?dev=1` dans le navigateur de cet environnement.

Les adresses locales communiquées par le joueur sont des accès au serveur de développement sur son réseau. La configuration de l'environnement cloud, l'aperçu Vite et le site GitHub Pages sont des éléments distincts. L'aperçu local ne publie pas le jeu et ne fournit pas de fonctionnement hors connexion.

```bash
npm test
npm run typecheck
npm run build -- --outDir ../build-visual
npm run preview -- --outDir ../build-visual --host 0.0.0.0 --port 4175 --strictPort
```

Le build est écrit dans `Project-L/build-visual` pour préserver le dossier `dist` livré et versionné. L'aperçu de ce build s'ouvre sur le port 4175, sans outils de développement : `?dev=1` n'y active pas de partie de test. Pour les essais isolés avec l'horloge et les scénarios, utiliser le serveur de développement sur 5175.

## Ce qui est jouable

- Prairie Phaser plein écran, vue aérienne à profondeur comprimée, fleurs et terrain à débloquer ; caméra bornée, glissade, pincement et molette.
- Boutique Bâtiments/Lapins. Choix d'une case, aperçu, validation avec prix ou annulation gratuite. Grille visible pendant le placement/déplacement, avec ✓ et × en complément des couleurs.
- Enclos en bois, ferme végétale, nid, nurserie et onze variantes de lapins originales ; petits déplacements, oreilles animées et réaction à la nourriture.
- Pattes, herbe et cœurs toujours affichés. Panneaux latéraux avec fermeture, informations d'enclos et fiches individuelles.
- Nourriture, changement d'enclos et départ d'un doublon après confirmation. Boutons désactivés avec leurs motifs et traitement des refus de dernière seconde par le contrôleur.
- Bulles de récolte par enclos et par ferme, plafond signalé, trois commandes, barres et délais issus des horodatages.
- Choix de deux parents, disponibilité, prix/délai, résultats possibles, probabilités exactes ouvertes par défaut et état de la garantie. Carnet des recettes et parents compatibles.
- Résultat de reproduction caché jusqu'à la fin de croissance. Choix de l'enclos à l'accueil, protection des capacités et fenêtre de nouvelle découverte.
- Missions principales et quotidiennes, réclamations gratuites, bonus, compte à rebours et progression persistée.
- Collection de onze entrées : inconnus « ??? », espèces découvertes avec types, rareté, effectifs et obtention ; cinq recettes dans le carnet.
- Deux extensions, habitats spécialisés, améliorations et déplacements de bâtiments et de lapins.
- Tutoriel facultatif adapté à la partie courante ; il ne donne pas de ressources. Sons synthétiques discrets, démarrés seulement par une action utilisateur, avec option muet.
- Paramètres : sons, tutoriel, sauvegarde, date de réussite, nouvel essai, export/import et redémarrage confirmé. Toute erreur de sauvegarde reste signalée sur la prairie.

## Tester rapidement avec l'horloge de développement

Avec la commande de développement ci-dessus, ouvrir `http://localhost:5175/?dev=1` (ou la même URL sur `127.0.0.1` si c'est l'hôte choisi). Un badge « Mode test · partie séparée » apparaît. Dans **Paramètres**, les boutons +5, +20, +60, +360 et +1440 minutes avancent une horloge injectée dans le contrôleur.

- Les coûts, délais et probabilités officiels ne changent pas ; aucune ressource de test n’est offerte automatiquement ; la récompense normale de cœurs devient réclamable à son échéance simulée.
- L'horloge, les préférences et la sauvegarde sont isolées sous `prairie-lapins.development.*`.
- La partie normale utilise toujours `prairie-lapins.save.v1`.
- Revenir à l'URL sans `?dev=1` retrouve la partie normale.
- Le module de développement n'est pas inclus dans le bundle de production. `?dev=1` n'a aucun effet avec le build normal.
- Un export effectué en mode test est un JSON version 4 : ne l'importer dans une partie normale que volontairement.

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

Le JSON exporté est en **version 4**. Les v1/v2/v3 sont migrées. Depuis v3, anciens enclos universels niveau 1 et deuxième extension non achetée ; tous les autres champs, missions et cœurs sont conservés sans nouvelle récompense. Depuis v2, les missions suivent la migration historique, sans nouvelle attribution de cœurs. Depuis v1, la dotation historique de 12 cœurs est appliquée une fois. Les anciens résultats de reproduction ne sont jamais retirés au hasard. L'import écrit avant activation et ne fusionne pas les droits aux récompenses.

La clé active reste `prairie-lapins.save.v1`, avec contenu v4. Copie brute v3 sous `prairie-lapins.backup.before-v4`, v2 sous `prairie-lapins.backup.before-v3`, v1 sous `prairie-lapins.backup.before-v2`. Échec de copie/écriture : ancien contenu actif intact et état en mémoire exportable avec avertissement. Les anciennes versions du jeu ne lisent pas v4. Garder un export de secours ; ces copies techniques n'ont pas de panneau dédié.

**Les sauvegardes sont liées à l'origine : protocole, domaine et port.** Changer d'adresse, de `localhost` à `127.0.0.1`, ou passer au site HTTPS nécessite un export/import. Le navigateur peut effacer ses données ; aucune permanence n'est garantie. Privilégier un seul onglet. Les préférences de sons/tutoriel sont séparées du JSON de partie et ne sont pas transférées par export.

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
| `tests/` | 361 tests existants et 8 tests de disposition/sélection ; 35 parcours HTML dans un DOM simulé |

Les commandes visuelles utilisent exclusivement `GameController.perform`. La scène ne modifie jamais l'état. Les confirmations d'import et de redémarrage réutilisent les fonctions transactionnelles du contrôleur. Les snapshots sont des copies. Le moteur intègre les commandes de cœurs et le contrôleur fournit son horloge à la migration. Les règles précédentes et la géométrie visuelle sont conservées.

**Bilan historique de la livraison habitats, avant cette passe :** 361 tests réussis dans 9 fichiers, TypeScript strict et build réussis. Les 230 tests du palier missions sont conservés ; leurs attentes de version et la confirmation d'extension sont adaptées. Ajouts historiques : 125 tests d'habitats/migrations/caméra et 6 parcours HTML. Parmi les 125, 77 cas couvrent les onze espèces dans chacun des sept types d'habitat. Une sauvegarde v3 a été générée avec le code non modifié de la livraison précédente pour vérifier la conservation exacte des champs. `happy-dom` reste réservé aux tests.

Build historique : 45 modules ; JavaScript 1 360,20 ko minifié / 377,90 ko gzip ; CSS 6,91 ko. Le navigateur de cette ancienne livraison refusait sa connexion locale (`ERR_CONNECTION_REFUSED`) ; elle ne comprenait donc aucune capture ni validation du rendu réel.

**Consolidation actuelle :** 369 tests réussis dans 10 fichiers, TypeScript strict et build validés. Les 8 nouveaux tests exercent la sélection de chaque occupant parmi cinq/sept lapins aux zooms minimum et initial, avec les mouvements réels et leurs extrema, le dégagement des étiquettes et la priorité en cas de distance égale. Build : 47 modules, JavaScript 1 364,65 ko minifié / 379,48 ko gzip, CSS 6,91 ko ; l'avertissement de taille lié à Phaser reste non bloquant.

Un navigateur réel Chromium utilise une partie de test séparée et un viewport paysage de **852 × 393**. Avant et après la passe, les 21 sélections des sept occupants aux zooms 0,8 / 1,05 / 1,65 réussissent, les panneaux Boutique et Missions s'ouvrent et aucune erreur de console ou de réseau n'est constatée. Les captures et les autres contrôles sont consignés dans [docs/progress.md](docs/progress.md). Ce viewport simulé ne constitue pas un test sur iPhone physique.

## Limites et validation restante

Le test humain précédent, effectué sur iPhone Safari en paysage via un serveur Windows 11, a validé affichage/panneaux/orientation, glissade et pincement, sélection/nourriture/affection, boutique/placement/annulation/refus, fermes, reproduction cachée/nurserie/accueil/découverte, revenus/capacités/déplacements, extension, attente au nid, enclos pleins, protection des dernières espèces, sauvegarde au rechargement et reprise après arrière-plan. Les boutons et lapins étaient faciles à toucher, les écrans compréhensibles et l'ambiance appréciée.

Le dernier test humain complète ces résultats : perspective stable, lapins grands et reconnaissables, zoom confortable, déplacement/pincement/Recentrer fonctionnels, collection de onze espèces, boutique et conditions du carnet correctes, listes et panneaux lisibles. **La caméra est désormais validée par l'humain et conservée.** Cela ne valide pas les nouvelles reproductions, dépenses de cœurs ou l'export/import sur iPhone.

Les parcours HTML utilisent un **DOM simulé** : boutons, textes, confirmations et état sont contrôlés, pas le rendu Safari ou les gestes physiques. Les essais Chromium de cette passe complètent ces contrôles. Aucun test iPhone physique de la passe visuelle, des habitats, des missions, des nouvelles reproductions, des dépenses de cœurs ou de l'export/import n'est revendiqué.

Vérifier d'abord la nouvelle disposition de cinq/sept lapins avec le [parcours visuel](docs/visual-iphone-test.md), puis les destinations compatibles, les détails des niveaux et le déplacement vers les dix-huit cases avec le [guide des habitats](docs/habitats-iphone-test.md). La caméra précédemment validée garde ses valeurs de zoom et de projection ; seules les limites latérales s'adaptent et un agencement est ajouté pour plus de trois occupants.

La version visuelle est maintenant publiée sur HTTPS, sans ajout de lapin, décoration indépendante ou mini-jeu. Prochaine étape : vérifier le site dans Safari sur iPhone, avec Windows éteint et en données mobiles, puis examiner les résultats avant d'ajouter du contenu. La PWA et le fonctionnement hors connexion restent ultérieurs.
