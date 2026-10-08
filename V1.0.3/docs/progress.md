# État du développement — étape 6 : onze espèces, 7 octobre 2026

## Livraison concrète

Projet complet avec sources, configuration, tests, documentation, scénario de test et build, fourni dans `prairie-lapins-collection-11-especes.zip`. Les cinq espèces existantes sont conservées et six nouvelles espèces sont jouables. Aucune dépendance ajoutée, aucun déploiement HTTPS ni PWA. Les réglages de caméra restent ceux de l'étape 4.

## Fonctionnalités réalisées

- Six communs en boutique, chacun à 80 pattes : Paille, Neige, Terre, Feu, Bélier Gris et Volant. Accueil immédiat à l'affection 1 dans un enclos libre, découverte au premier achat. Aucun niveau de joueur ajouté.
- Cinq espèces obtenues seulement par reproduction : Brumelin, Mottelin, Lunettes, Perroquet et Feu Glacé. Les trois nouvelles recettes rares exigent une affection 4 pour chacun des deux parents et une croissance de 30 min. Brumelin/Mottelin gardent leurs seuils et durées ; les communs grandissent toujours en 5 min.
- Tables historiques paille/neige/terre strictement conservées. Avec un type feu/métal/vol : poids 40 par commun correspondant à un type présent, poids 20 par recette dont tous les types et conditions d'affection sont remplis, puis normalisation. Une reproduction reste possible dès l'affection 2, en excluant seulement les nouvelles recettes inaccessibles.
- Un même calcul de distribution alimente le tirage, le nid et le carnet. L'ordre des parents est sans effet. Les pourcentages entiers sont affichés directement ; les pourcentages périodiques sont accompagnés de leur fraction exacte.
- Garantie étendue aux cinq recettes, filtrée après l'affection : après neuf échecs admissibles, répartition uniforme entre les espèces inconnues admissibles. Compteur, réservations et découverte au premier accueil gardent leur fonctionnement précédent. Un résultat est déterminé une seule fois au lancement et sauvegardé immédiatement.
- Collection défilante, compteur découvertes/11, cinq fiches de recettes, silhouette inconnue, types, seuil d'affection, durée, paires possédées, besoin de nourriture et parents occupés. Le carnet distingue résultat possible, garantie partagée et garantie de cette recette. Il peut préparer une paire au nid sans payer ni lancer de tirage.
- Résultat masqué dans les panneaux jusqu'à la fin de croissance ; accueil manuel et annonce de découverte. Les probabilités et conditions publiques restent consultables pendant les attentes.
- Variantes pastel originales dans les portraits SVG et la prairie Phaser : orange/flamme, gris/oreilles tombantes/métal, ailes, lunettes, plumage coloré/ailes et contraste feu/glace. Taille, positions animées et zones de sélection conservées.
- Mode test existant inchangé et isolé. Un JSON de scénario facultatif permet d'exercer les recettes sans reconstruire la prairie ; il n'est jamais importé automatiquement et n'accorde rien à une partie normale.

## Architecture, compatibilité et règles conservées

`src/config/balance.ts` centralise les onze identifiants, noms, types, raretés, prix, conditions des recettes, poids et durées. Les listes boutique/recettes sont dérivées de cette configuration. `breedingPool` utilise des poids entiers pour conserver les ratios exacts ; l'affichage et le tirage partagent cette distribution. `growthDuration` est utilisé par la simulation, la validation des sauvegardes et la présentation. Toutes les commandes de jeu passent par le contrôleur et la simulation ; le carnet ne modifie pas les soldes.

**JSON v2 conservé** : aucun nouveau champ d'état n'est nécessaire. L'énumération des espèces reconnues et la validation des durées/réservations sont étendues. Les anciennes parties voient le nouveau catalogue sans migration v2 supplémentaire, sans dotation de cœurs, sans modification de leurs revenus fractionnaires, individus, coordonnées, découvertes, résultats choisis ou réservations. L'avance temporelle normale reste appliquée au chargement. La migration v1 → v2, les refus de fichiers invalides et les protections d'écriture restent en place.

Le jeu utilise toujours `prairie-lapins.save.v1` comme clé historique, avec contenu version 2. Les imports sont validés et écrits avant activation ; annulation ou échec conserve la partie précédente. Les anciens clients v1 ne lisent pas le v2, et les anciennes livraisons v2 à cinq espèces ne reconnaissent pas les six nouveaux identifiants. Garder un export avant de changer de livraison, puis continuer avec cette version ou une version ultérieure.

Comparaison avec `prairie-lapins-coeurs-v2.zip` : **tous les paramètres historiques de `BALANCE` et toutes les tables `BREEDING_ODDS` sont identiques**. Seul `rareGrowth` est ajouté à `BALANCE`. Onze fichiers sont strictement identiques : configuration visuelle, gestes/caméra, événements du canvas, démarrage, contrôleur, logique des cœurs, types d'état, création de partie, outils de développement, package et lockfile. Dans `MeadowScene`, seule la méthode de dessin des lapins change ; cadrage, zoom, déplacement, placement et sélection restent inchangés. Le CSS ajouté concerne seulement les paires du carnet.

## Vérifications exécutées

Exécution finale le 7 octobre 2026, Node.js 24.19.0 :

| Ensemble | Résultat |
|---|---:|
| Simulation initiale | 38 réussis |
| Contrôleur et cycle de vie | 32 réussis |
| Adaptateurs/export | 6 réussis |
| Gestes/caméra/modèles de présentation | 19 réussis |
| Cœurs, migration, import/export | 40 réussis |
| Nouveau palier de collection | 27 réussis |
| Parcours HTML dans happy-dom | 25 réussis |
| `npm test` | **187 réussis, 7 fichiers** |
| `npm run typecheck` | **réussi** |
| `npm run build` | **réussi** |
| Démarrage Vite sur 127.0.0.1:5173 | réussi |
| Ouverture du jeu dans le navigateur disponible | impossible : **ERR_CONNECTION_REFUSED** |

Les 155 tests précédents restent présents ; leurs attentes de taille de collection et de métadonnées de probabilités sont adaptées. Les 32 nouveaux tests comprennent :

- Achat/accueil des trois communs et refus des rares sans dépense.
- Tables historiques, symétrie et somme des probabilités sur les **66 paires d'espèces**, avec quatre combinaisons d'affection ; vérification déterministe d'un tirage dans chaque intervalle admissible.
- Exclusion des recettes rares à affection 2/2 ou 4/3, admission à 4/4, combinaisons à quatre types, fractions exactes.
- Neuf échecs suivis d'une garantie pour chacune des trois nouvelles recettes ; compteur inadmissible inchangé, réservations sauvegardées, absence de nouveau tirage après restauration, répartition égale d'un ensemble de plusieurs recettes inconnues.
- Croissance rare de 30 min, attente avec nurserie occupée, accélération pour 6 cœurs, identité/réservation intactes et découverte à l'accueil manuel.
- Collection/carnet sans lecture du résultat secret, alimentation requise, disponibilité des parents et possible/garanti.
- Chargement et import d'un export **généré par la précédente livraison**, contenant 7 cœurs et un Brumelin garanti réservé ; aucune redotation et résultat inchangé. Migration v1 toujours disponible.
- Import/export/rechargement d'une collection v2 complète de onze espèces ; nouveaux identifiants et solde de cœurs conservés. Identifiant inconnu refusé.
- Scénario JSON de développement valide ; isolation de la sauvegarde et de l'horloge maintenue par les tests existants.
- Cinq parcours HTML supplémentaires : les trois achats, carnet avec alimentation et chances 50/50 puis 40/40/20, reproduction garantie et rare caché jusqu'à croissance/accueil.

Le build transforme 41 modules. JavaScript : **1 342,72 ko minifié / 372,43 ko gzip** ; CSS 6,20 ko. L'avertissement Vite pour un bundle supérieur à 500 ko reste présent, principalement lié à Phaser ; le build réussit. L'avertissement npm sur la configuration `http-proxy` de l'environnement n'empêche aucune commande.

Les tests HTML passent par les boutons et le contrôleur, dans **un DOM simulé**. Ils ne vérifient pas le rendu Phaser, la disposition Safari, les gestes physiques ou le sélecteur de fichiers iOS. Le serveur démarre, mais le navigateur disponible ne peut pas le joindre ; aucune capture de jeu ni validation navigateur réelle n'est fournie. La planche `species-preview.svg` reprend les portraits de l'interface et son XML a été vérifié ; ce n'est pas une capture Phaser ni une validation visuelle iPhone.

## Retour humain antérieur et validations encore ouvertes

Le test humain a porté sur **l'étape 3**, sur iPhone Safari paysage via le serveur Windows 11. Il a validé affichage/panneaux/orientation/panoramique/zoom, sélection/nourriture/affection, boutique/placement/annulation/refus, ferme/délais/récoltes, reproduction cachée/nurserie/accueil/découverte, revenus/capacités/déplacements, extension, attente au nid, enclos pleins, protection des dernières espèces, sauvegarde au rechargement et reprise après arrière-plan. Les boutons et lapins étaient faciles à toucher, les écrans compréhensibles et l'ambiance conforme.

L'humain a choisi de poursuivre sans essai intermédiaire. Restent donc **non validés sur iPhone** :

1. Corrections de perspective/caméra, cadrage, limites de glissade/zoom, recentrage et rotation de l'étape 4.
2. Cœurs, cadeau, compléments, accélérations, confirmations et lisibilité du troisième compteur de l'étape 5.
3. Export/import via Fichiers ou Téléchargements Safari, annulation/remplacement, formats v1/v2 et passage entre origines.
4. Ce nouveau palier : apparence et sélection des variantes, collection/carnet défilants, parents et affection, probabilités, garantie, croissance rare et découverte.

Aucun essai iPhone de l'assistant n'est revendiqué. Guides : `docs/collection-iphone-test.md`, `docs/hearts-iphone-test.md`, `docs/manual-test.md`. Le scénario `docs/test-saves/collection-ready-v2.json` contient des ressources et neuf échecs préparés volontairement ; l'utiliser seulement en mode test après export de toute progression à conserver.

## Lancement, limites et prochaine étape

Sur Windows :

```bash
npm ci
npm run dev -- --host 0.0.0.0
```

Sur l'iPhone du même réseau : adresse **Network** affichée + **`?dev=1`**, vérifier le badge de partie séparée. Pour lancer les vérifications : `npm test`, `npm run typecheck`, `npm run build`.

Les sauvegardes sont liées au protocole, domaine et port : changer d'origine, notamment passer du serveur Windows au futur site HTTPS, nécessite un export/import. Stockage local sans permanence garantie, sans synchronisation entre onglets/appareils. Avancer l'horloge ou restaurer un export reste possible dans ce jeu solo sans serveur.

Prochaine étape recommandée : valider ce palier et les points en attente sur iPhone, puis observer le rythme d'achat, de nourriture et de découverte avant de concevoir le palier suivant. Aucun légendaire, mythique, mission, mini-jeu, habitat spécialisé, décoration, déploiement ou PWA n'est ajouté ici.

## Historique

| Étape | Livré | Tests |
|---|---|---:|
| 1 | Socle et simulation | 38 |
| 2 | Sauvegarde locale et export/import | 76 |
| 3 | Interface jouable et outils de test | 100 |
| 4 | Perspective, cadrage et recentrage | 107 |
| 5 | Cœurs, transactions et migration v2 | 155 |
| 6 — actuelle | Onze espèces, règles étendues et carnet | 187 |
