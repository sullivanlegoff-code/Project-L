# État du développement — étape 5 : cœurs, 6 octobre 2026

## Livraison concrète

Cœurs implémentés de bout en bout : configuration, état v2, simulation pure, contrôleur, persistance/migration, affichage et confirmations. Projet complet fourni en ZIP avec sources, tests, documentation et build. Aucune dépendance ajoutée, aucun déploiement HTTPS ni PWA.

### Fonctionnalités réalisées

- 12 cœurs à la création ou migration v1, une seule fois. Premier cadeau après 24 h ; +2 à réclamer manuellement, puis prochaine échéance 24 h après la réclamation. Une seule récompense en attente après plusieurs jours, horloge monotone conservée.
- Compteur avec cœur SVG original dans le HUD ; panneau expliquant solde, usages, caractère facultatif et cadeau. Cadeau gratuit vert, dépenses secondaires roses, prix et motif d'insuffisance lisibles.
- Accélération de production, reproduction et croissance au tarif validé. Le devis vise un bâtiment et une étape identifiés ; confirmation à usage unique, recalcul du prix, diminution acceptée, hausse interdite. Une étape finie n'est pas payée.
- Accélération à l'heure simulée actuelle, sans avancer l'horloge globale ni gagner de revenus supplémentaires. Récolte et accueil manuels ; la croissance suivante conserve sa durée entière. Résultat, garantie et réservation de reproduction inchangés, aucun nouveau tirage, révélation seulement après croissance.
- Selon la demande actuelle, une reproduction en cours peut être accélérée avec une nurserie occupée : la confirmation prévient de l'attente. Aucun bouton lorsque le résultat attend déjà au nid. Croissance non accélérable si les enclos sont pleins.
- Complément volontaire pour bâtiments, lapins communs, extension, fermes et reproduction : solde de pattes disponible + nombre de cœurs arrondi sur le manque exact, sans monnaie résiduelle. Les autres conditions sont vérifiées d'abord et de nouveau au paiement. Aucun remplacement de l'herbe, aucune tentative automatique après refus normal.
- Placement gratuit jusqu'au choix définitif et à la confirmation ; annulation et refus ne dépensent rien. Les confirmations sont protégées contre double pression et invalidées lors d'un remplacement de partie.
- Sauvegarde automatique/export v2 ; restauration/import v2 sans redotation. Migration/import v1 avec conservation de toute la progression et dotation nouvelle. Le résumé d'import affiche aussi les cœurs. Copie brute v1 avant écriture ; refus d'écriture/mauvais fichier gardent les protections précédentes.
- Mode de développement séparé, bouton supplémentaire +1440 min. Les préférences n'interviennent jamais dans les droits aux récompenses.

## Architecture et décisions techniques

Les valeurs validées sont dans `HEARTS` (`src/config/balance.ts`). Trois commandes nouvelles : `claimHearts`, `accelerate`, `payWithHearts`. `GameUI` affiche des devis et envoie des commandes au contrôleur ; aucun solde n'est muté par un composant visuel.

Le devis de complément réutilise la validation de l'action normale, arrêtée au point de paiement avant débit et avant RNG. L'effet et les deux débits sont appliqués à une copie dans la même transaction. Le devis d'accélération comporte une identité d'étape et un montant maximal confirmé. Le contrôle de prix est exécuté après l'avance indépendante du contrôleur ; un refus laisse cette seule avance conservée, sans dépense.

Le JSON v2 ajoute `hearts` et `nextHeartGiftAt`. Le lecteur v1 reste strict ; seuls les v2 acceptent des durées raccourcies déjà terminées pour représenter les accélérations. Les fractions de revenus, coordonnées, individus, découvertes, résultats et réservations sont conservés. Les timers voisins continuent normalement.

Clé active conservée : `prairie-lapins.save.v1` (nom historique ; contenu v2). Copie de récupération : `prairie-lapins.backup.before-v2`. Migration locale : valider v1, construire/avancer v2, copier le v1 brut, écrire v2 ; échec de copie ou d'écriture → ancien contenu actif intact, état en mémoire/export et avertissement. Import v1 : dotation/échéance fixées à la confirmation effective, écriture avant remplacement actif. L'import d'un v1 ancien remplace volontairement la partie et ne cumule pas son solde avec celui de la partie remplacée. La copie technique n'a pas de panneau de restauration dédié.

La nouvelle demande remplace deux détails de la proposition précédente : le prix d'accélération diminué est accepté sans deuxième confirmation ; l'accélération d'une reproduction encore en cours est autorisée avec une nurserie occupée. Aucun autre changement d'équilibrage.

## Vérifications exécutées

| Ensemble | Résultat final |
|---|---:|
| Simulation initiale | 38 réussis |
| Contrôleur et cycle de vie | 32 réussis |
| Adaptateurs/export | 6 réussis |
| Gestes/caméra/présentation | 19 réussis |
| Cœurs, migration, import/export | 40 réussis |
| Parcours HTML dans happy-dom | 20 réussis |
| `npm test` | **155 réussis, 6 fichiers** |
| `npm run typecheck` | **réussi** |
| `npm run build` | **réussi** |
| Démarrage Vite sur 127.0.0.1:5173 | réussi |
| Ouverture navigateur de `?dev=1` | refusée : `ERR_BLOCKED_BY_CLIENT` |

Les 107 scénarios précédents sont conservés, avec les attentes de version/résumé adaptées au v2. Les 48 nouveaux cas couvrent : création/migration/dotation unique, cadeaux aux limites et après absence, horloge reculée, arrondis, manque de monnaies, refus de conditions, annulations, double pression, baisse du prix à confirmation, fin naturelle avant paiement, absence de revenus supplémentaires, timers voisins, naissance garantie/réservation inchangées, nurserie occupée, croissance/accueil distincts, migration locale et import avec erreur d'écriture, import/export v2, import v1 et mode test isolé.

Les parcours HTML passent réellement par les boutons et le contrôleur, mais restent exécutés dans un DOM simulé. Ils vérifient les textes et effets, pas la mise en page Safari, les zones sûres ou le toucher physique. Deux attentes de boutons ont été ajustées pendant l'intégration, puis le libellé normal de destination a été conservé ; une horloge implicite dans un nouveau test a été remplacée par l'horloge contrôlée attendue. Toutes les vérifications finales passent.

Comparaison binaire avec l'archive de l'étape 4 : **9 fichiers inchangés** — configuration visuelle, scène prairie, événements du canvas, gestes/caméra, démarrage, simulation du temps, probabilités de reproduction, package et lockfile. Seul le HUD reçoit les ajustements de largeur nécessaires au troisième compteur ; projection, zoom et cadrage sont conservés.

Inspection du bundle : aucun marqueur du module d'horloge de développement. Bundle JavaScript environ **1 334,15 ko minifié / 369,37 ko gzip** ; avertissement Vite de taille Phaser toujours présent, sans échec du build.

## Retour humain et points non validés

L'humain a testé **l'étape 3**, sur iPhone Safari paysage, via le serveur Windows 11. Il a validé : affichage/panneaux/orientation/panoramique/zoom ; sélection/nourriture/affection ; boutique/placement/annulation/refus ; ferme/délais/récoltes ; reproduction cachée/nurserie/accueil/découverte ; revenus/capacités/déplacements ; extension ; attente au nid, enclos pleins et protection des dernières espèces ; sauvegarde au rechargement et reprise après arrière-plan. Les cibles étaient faciles à toucher, les écrans compréhensibles et l'ambiance conforme.

L'humain a choisi de poursuivre sans essai intermédiaire. **Les corrections de perspective et de caméra de l'étape 4 restent donc non validées sur iPhone. L'export/import iPhone reste non testé. Les cœurs de cette livraison attendent aussi leur essai sur appareil.** Aucun essai réel iPhone n'est attribué à l'assistant, aucune capture navigateur n'est fournie puisque l'accès local est bloqué.

À vérifier : lisibilité du troisième compteur en paysage, boutons et confirmations de cœurs, annulation/reprise, cadeau après avance de 24 h, migration d'une vraie partie v1, export vers Fichiers et import v1/v2, ainsi que le cadrage et la rotation restants. Parcours court : `docs/hearts-iphone-test.md` ; caméra/export détaillés : `docs/manual-test.md`.

## Limites et prochaine étape recommandée

Stockage local sans permanence garantie et sans synchronisation entre onglets/appareils ; avancer volontairement l'heure ou réimporter un export reste possible sans serveur anti-triche. Les anciens clients v1 ne lisent pas les exports v2. Les sauvegardes sont liées au protocole, domaine et port : passage du serveur Windows au site HTTPS → export/import nécessaire.

Sur Windows : `npm ci`, puis `npm run dev -- --host 0.0.0.0`. Sur iPhone du même réseau : adresse **Network** affichée par Vite + **`?dev=1`**, et vérifier le badge de partie séparée.

Prochaine étape : valider cette livraison sur iPhone, puis concevoir un premier palier supplémentaire de collection (petit ensemble d'hybrides, recettes et prérequis chiffrés). Cela renforcerait le développement de la prairie et la découverte d'espèces dans la direction souhaitée, avec des règles à valider avant implémentation. Aucun nouveau lapin, mission, mini-jeu, habitat spécialisé, décoration, déploiement ou PWA n'est développé ici.

## Historique

| Étape | Livré | Tests |
|---|---|---:|
| 1 | Socle et simulation | 38 |
| 2 | Sauvegarde locale et export/import | 76 |
| 3 | Interface jouable et outils de test | 100 |
| 4 | Perspective, cadrage et recentrage | 107 |
| 5 — actuelle | Cœurs, transactions et migration v2 | 155 |
