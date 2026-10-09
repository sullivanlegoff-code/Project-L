# Référence du prototype — habitats et aménagement

Cette référence reprend les règles et chiffres approuvés par le joueur. Une modification d'équilibrage doit être précédée d'une explication de sa raison. Les paramètres exécutables se trouvent dans `src/config/balance.ts`, `src/config/missions.ts` et `src/config/habitats.ts`.

La version de travail est `Project-L/prairie-lapins-prototype`. `production` conserve les sauvegardes **v4** et les règles stables ; `feature/meadow-decoration` ajoute les sauvegardes **v5** dans une prévisualisation isolée. La référence habitats antérieure comptait 361 tests. Le dossier historique `V1.0.4` correspond au palier missions à sauvegarde **v3**, avec 230 tests. La consolidation visuelle ajoute huit tests de disposition/sélection ; elle conserve intégralement les règles ci-dessous. Le bilan courant est dans [progress.md](progress.md).

## Concept et périmètre

Jeu mobile solo de collection et de gestion d'une prairie de lapins. Boucle : récolter des pattes, produire de l'herbe, nourrir, reproduire, accueillir, construire et agrandir. Univers, noms, interface et visuels originaux. Les pattes financent les achats et productions ; l'herbe augmente l'affection. Aucun entretien obligatoire, faim, maladie, perte d'affection ou lapin perdu pendant l'absence.

Application web Phaser + TypeScript, utilisation tactile sur iPhone Safari. Le jeu normal est publié sur https://sullivanlegoff-code.github.io/Project-L/ et fonctionne ordinateur éteint. Laboratoire `/dev/`, comptes expérimentaux `/preview/accounts/` (en pause), décorations `/preview/decorations/` (v5 locale séparée). Progression locale avec export/import de secours ; PWA et mode hors connexion restent ultérieurs. Aucun achat réel ni publicité.

Prototype : onze espèces, collection, carnet de reproduction, missions principales et quotidiennes, enclos, ferme, nid, nurserie, achats, placement, déplacement, récolte, nourriture, reproduction, accueil, deux extensions, habitats spécialisés et améliorations, et sauvegarde. Les espèces ont des types fixes et une rareté distincte. Les six types de base sont paille, neige, terre, feu, métal et vol. Arc-en-ciel reste réservé à une étape future.

Le chantier Aménagement ajoute douze décorations esthétiques, achetées uniquement en pattes. Inventaire d’exemplaires uniques, grille fine 4 × 4 par case de bâtiment, rotations du banc et de l’arche, trois slots intérieurs indépendants des lapins, déplacements/rangement gratuits et mode photo. Aucun bonus ni modification des règles de reproduction. À la demande du joueur du 9 octobre 2026, les décorations seules deviennent revendables : 50 % du prix d’achat en pattes, arrondi inférieur, aucun cœur remboursé, confirmation explicite par exemplaire et écriture atomique avant activation. La sélection directe suit le dessin visible, avec priorité lapins en jeu normal et décorations en Aménagement ; photo sans panneau d’objet. Catalogue, collisions, propriété, migrations et prix : [decorations.md](decorations.md).

Reportés : mini-jeux, énergie, vêtements, événements, catalogue complet et recettes dépendant d’espèces précises.

## Partie initiale et terrain

Dans la prévisualisation Décorations seulement, le fond est une île arrondie vert-doré avec relief léger, chemin périphérique et petite côte turquoise décorative. Cela ne change ni les cases, ni les collisions, ni les ressources. Projection et caméra conservées ; format v5 inchangé. [Conception et validation visuelle](island.md).

- 300 pattes, 10 herbes et 12 cœurs.
- Un enclos en case `(0, 0)`, un Lapin Paille et un Lapin Neige d'affection 1.
- Prairie initiale de 3 colonnes × 2 lignes : six cases constructibles.
- Première extension vers 6 × 2 pour 500 pattes ; deuxième vers 9 × 2 pour 1 000 pattes, après la première. Six cases supplémentaires à chaque étape.
- Chaque bâtiment occupe une case libre. Placement à l'achat et déplacement gratuit.
- Construction immédiate ; pas de démolition dans le prototype.
- Enclos universel initial de niveau 1 : trois places, sans contrainte de type. Tous les habitats peuvent atteindre les niveaux 2 et 3, avec cinq puis sept places.
- Deux fermes au maximum ; un nid et une nurserie au maximum.
- Nurserie d'une place. Au niveau 1, onze individus demandent quatre habitats ; les améliorations permettent désormais de concentrer davantage de lapins sur les mêmes cases. Les deux extensions offrent plus de possibilités d'aménagement.

## Espèces

| Identifiant stable | Nom | Types | Rareté | Obtention | Affection minimale des deux parents | Croissance |
|---|---|---|---|---|---:|---:|
| paille | Lapin Paille | paille | commun | boutique : 80 pattes, ou reproduction | 2 | 5 min |
| neige | Lapin Neige | neige | commun | boutique : 80 pattes, ou reproduction | 2 | 5 min |
| terre | Lapin Terre | terre | commun | boutique : 80 pattes, ou reproduction | 2 | 5 min |
| brumelin | Brumelin | paille + neige | peu commun | reproduction uniquement | 2 | 15 min |
| mottelin | Mottelin | paille + terre | peu commun | reproduction uniquement | 2 | 15 min |
| feu | Lapin Feu | feu | commun | boutique : 80 pattes, ou reproduction | 2 | 5 min |
| belier-gris | Lapin Bélier Gris | métal | commun | boutique : 80 pattes, ou reproduction | 2 | 5 min |
| volant | Lapin Volant | vol | commun | boutique : 80 pattes, ou reproduction | 2 | 5 min |
| lunettes | Lapin à Lunettes | métal + paille | rare | reproduction uniquement | 4 | 30 min |
| perroquet | Lapin Perroquet | vol + feu | rare | reproduction uniquement | 4 | 30 min |
| feu-glace | Lapin Feu Glacé | feu + neige | rare | reproduction uniquement | 4 | 30 min |

L'achat d'un commun l'accueille immédiatement à l'affection 1 ; aucune croissance ni condition de niveau de joueur. Le minimum d'affection du tableau concerne uniquement la reproduction. Les types de la recette doivent tous être présents dans l'union des deux parents ; leurs espèces précises ne sont pas imposées. Les cinq espèces de reproduction ne sont jamais achetables, y compris avec un complément de cœurs.

Brumelin et Mottelin restent des noms provisoires validés pour ce prototype. Une espèce est découverte au premier accueil dans un enclos, achat compris. La découverte reste enregistrée indépendamment des individus possédés.

## Économie

| Achat ou action | Coût | Délai ou effet |
|---|---:|---|
| Lapin commun | 80 pattes | immédiat, affection 1 |
| Enclos supplémentaire | 120 pattes | immédiat, trois places |
| Ferme | 60 pattes | immédiat |
| Nid | 100 pattes | immédiat |
| Nurserie | 80 pattes | immédiat |
| Première extension | 500 pattes | immédiat, 6 × 2 cases |
| Deuxième extension | 1 000 pattes | après la première, 9 × 2 cases |
| Reproduction | 20 pattes | 20 minutes |
| Croissance d'un commun | gratuit | 5 minutes |
| Croissance de Brumelin ou Mottelin | gratuit | 15 minutes |
| Croissance d'un nouveau rare | gratuit | 30 minutes |

| Commande de ferme | Coût | Herbe | Délai |
|---|---:|---:|---:|
| Petite | 10 pattes | 20 | 5 minutes |
| Moyenne | 18 pattes | 40 | 15 minutes |
| Grande | 40 pattes | 100 | 60 minutes |

Une ferme réalise une commande à la fois. Le produit attend une récolte manuelle ; pas de répétition automatique ni de péremption.

Revenu d'un lapin : `12 + 2 × (affection − 1)` pattes par heure.

| Affection | Pattes / heure |
|---:|---:|
| 1 | 12 |
| 5 | 20 |
| 10 | 30 |
| 20 | 50 |

Chaque habitat cesse d'accumuler lorsqu'il atteint son plafond. L'enclos universel de niveau 1 conserve son plafond de 600 ; les autres plafonds figurent ci-dessous. Récolte manuelle des pattes entières, conservation des fractions restantes. La rareté n'ajoute aucun multiplicateur dans ce prototype.

Affection : de 1 à 20. Passer de A à A + 1 coûte `2 × A` herbes, immédiatement. Coût total de 1 à 20 : 380 herbes. Aucune autre dépense, attente ou perte d'affection.

## Reproduction

Deux individus distincts d'affection minimale 2. Pas de sexes à gérer. Toutes les paires d'espèces sont autorisées. Les parents sont conservés, peuvent être nourris et continuent à produire leurs revenus. Ils sont indisponibles pour une autre reproduction pendant les 20 minutes ; ils sont libérés à la fin, même si le résultat attend encore au nid.

L'ordre des parents ne change pas le tirage. Les tables historiques suivantes restent exactement inchangées lorsque l'union contient uniquement paille, neige et/ou terre, quelle que soit l'affection autorisée :

| Types réunis | Paille | Neige | Terre | Brumelin | Mottelin |
|---|---:|---:|---:|---:|---:|
| Paille | 100 % | 0 % | 0 % | 0 % | 0 % |
| Neige | 0 % | 100 % | 0 % | 0 % | 0 % |
| Terre | 0 % | 0 % | 100 % | 0 % | 0 % |
| Paille + neige | 40 % | 40 % | 0 % | 20 % | 0 % |
| Paille + terre | 40 % | 0 % | 40 % | 0 % | 20 % |
| Neige + terre | 0 % | 50 % | 50 % | 0 % | 0 % |
| Paille + neige + terre | 20 % | 20 % | 20 % | 20 % | 20 % |

### Paires comprenant feu, métal ou vol

1. Réunir les types des deux parents, sans doublon.
2. Chaque commun correspondant à un type présent reçoit un poids de **40**.
3. Chaque espèce de reproduction dont tous les types sont présents reçoit un poids de **20**, si ses conditions d'affection sont remplies. Brumelin et Mottelin demandent 2 ; Lunettes, Perroquet et Feu Glacé demandent **4 chez chacun des deux parents**.
4. Retirer les recettes inaccessibles puis normaliser : `probabilité = poids / somme des poids`. Il n'y a pas de tirage suivi d'un refus ou d'une substitution.
5. Appliquer, le cas échéant, la garantie décrite ci-dessous.

Feu × Neige, hors garantie : aux affections 4/4, Feu 40 %, Neige 40 %, Feu Glacé 20 %. Aux affections 2/2 ou 4/3, Feu et Neige ont chacun 50 % ; Feu Glacé est exclu et cette paire ne fait pas avancer la malchance. Une reproduction reste autorisée dès 2 pour les deux parents.

Exemple à quatre types, Lunettes × Feu Glacé, affections 4/4 et hors garantie : Paille, Neige, Feu et Bélier Gris reçoivent 40 chacun ; Brumelin, Lunettes et Feu Glacé reçoivent 20 chacun. Somme 220 : chaque commun a exactement `2/11` (≈ 18,18 %) et chaque recette `1/11` (≈ 9,09 %). Les poids ne sont donc pas toujours des pourcentages. L'affichage conserve la fraction exacte quand le pourcentage est périodique.

Le résultat est choisi une seule fois, au lancement, puis enregistré avec son identité. Recharger ne le retire jamais au hasard. Chaque lapereau accueilli commence à l'affection 1.

### Protection contre la malchance

La protection concerne **Brumelin, Mottelin, Lunettes, Perroquet et Feu Glacé**. Une tentative est admissible si, après filtrage des types et de l'affection, sa table comprend au moins une de ces espèces non découverte. Les autres tentatives laissent le compteur inchangé. Chaque échec admissible incrémente le compteur. Après neuf échecs, la dixième tentative admissible garantit une espèce inconnue admissible ; si plusieurs sont possibles, chacune a exactement `1 / nombre de recettes inconnues admissibles` de chances. Les communs n'entrent jamais dans la garantie.

Précision pour les découvertes en attente : un résultat inédit d'une de ces cinq espèces tiré au lancement interrompt provisoirement la série d'échecs et ramène le compteur à zéro. Il porte une réservation de découverte persistée, sans ajouter son espèce aux découvertes. L'accueil effectif d'une nouvelle espèce de reproduction remet également le compteur à zéro. Ainsi, un résultat garanti en attente n'est pas laissé avec un compteur de neuf échecs et ne peut pas être annulé par un rechargement. Les tentatives admissibles suivantes comptent depuis cette réservation ; aucun résultat en attente n'est supprimable. Une réservation n'est pas une découverte : les règles antérieures d'admissibilité sont conservées.

### Nid et nurserie

À la fin de la reproduction, transfert automatique si la nurserie est libre. La croissance commence à la date réelle de fin, même en l'absence du joueur. Si elle est occupée, le résultat attend au nid. La croissance commence seulement à la libération effective de la nurserie. Un lapereau prêt attend son accueil manuel ; il ne disparaît jamais. Le nid ne peut pas lancer une autre reproduction tant qu'il contient un résultat.

### Collection et carnet

La collection est une liste défilante de onze espèces, compteur découvertes/11. Les espèces inconnues restent des silhouettes. Le carnet, accessible depuis la collection ou un nid libre équipé d'une nurserie, montre les cinq recettes, leurs types, leur affection minimale et leur durée de croissance. Il propose les paires d'individus possédés compatibles par types et signale les parents à nourrir ou occupés.

Les chances du carnet et du nid utilisent le même calcul que la simulation, garantie incluse. « Recette possible » ne promet pas une découverte ; une garantie partagée indique son exacte probabilité. Préparer une paire depuis le carnet sélectionne seulement les parents dans le nid, sans paiement ni tirage. Un nid occupé ou des parents insuffisamment nourris empêchent cette préparation. Le résultat déjà déterminé reste masqué jusqu'à la fin de croissance ; consulter les recettes ne le révèle pas. Les types, conditions et probabilités publiques restent consultables.

Les variantes provisoires conservent la silhouette de lapin : orange/flamme, gris/oreilles tombantes/métal, ailes, lunettes, plumage pastel/ailes, orange/bleu glacé. Les réglages de projection, caméra et zones de sélection de l'étape 4 sont conservés.

## Temps, sauvegarde et protections

- Les revenus et délais progressent pendant l'absence. Les récoltes et accueils restent manuels.
- Avant achat, accueil, déplacement, nourriture ou départ d'un lapin, les revenus sont calculés avec les anciens occupants et niveaux.
- Les fractions de pattes sont conservées sans arrondir à chaque reprise.
- Le temps simulé ne recule jamais : une horloge en arrière ne retire rien et ne recompte aucun revenu.
- Une avance de l'horloge peut accélérer ce jeu local ; aucun contrôle serveur n'est prévu.
- Toute action refusée restitue l'état original sans dépense ni autre mutation.
- Confier un doublon est gratuit et irréversible après confirmation dans l’interface. Le dernier individu possédé de chaque espèce est protégé, ainsi qu'un parent en reproduction active.
- Un lapereau sans place attend dans la nurserie. Aucun résultat ne peut être écrasé.
- JSON versionné, identifiants stables, dates de fin persistées, validation avant remplacement d'une partie.
- Sauvegarde automatique, restauration et export/import sont implémentés. Format exporté version 4 ; import des versions 1, 2, 3 et 4.


## Cœurs — équilibrage validé le 6 octobre 2026

Monnaie facultative pour terminer un délai ou compléter les pattes manquantes. Aucun achat réel, publicité, paiement automatique ou besoin de cœurs pour progresser. Les tarifs sont centralisés dans `HEARTS`, dans `src/config/balance.ts`. Aucune règle existante de collection, revenus, affection ou reproduction n'est modifiée.

| Paramètre | Valeur validée |
|---|---:|
| Dotation d'une nouvelle partie | 12 cœurs, une fois |
| Dotation lors de la migration v1 → v2 | 12 cœurs, une fois |
| Récompense à réclamer manuellement | 2 cœurs |
| Première disponibilité | 24 heures après création ou migration |
| Disponibilité suivante | 24 heures après chaque réclamation |
| Récompenses cumulées pendant l'absence | Une seule récompense disponible |
| Accélération | `ceil(temps restant / 5 minutes)` cœurs |
| Complément de pattes | `ceil(pattes manquantes / 25)` cœurs |

L'heure de référence est `max(heure fournie, lastSimulatedAt)`. Une horloge qui recule ne rouvre pas une récompense déjà réclamée. Les droits sont dans l'état de partie, jamais dans les préférences visuelles. Il s'agit d'un cadeau renouvelable, pas d'un système de missions.

### Accélération

Concerne une production de ferme, une reproduction ou une croissance **en cours**. À la confirmation, le contrôleur avance le temps normalement, puis la simulation recalcule le prix pour le même délai identifié. Un prix diminué est appliqué ; un prix supérieur au montant confirmé est refusé. Une étape terminée, absente ou remplacée ne peut pas être payée. Exemples : 1 min → 1 cœur ; 5 min → 1 ; 6 min → 2 ; 20 min → 4.

La fin de l'étape choisie est fixée à l'heure simulée actuelle. Cela n'avance ni l'horloge globale, ni les revenus, ni les délais voisins. Ferme : produit prêt, récolte manuelle. Reproduction : résultat identique, transfert normal en nurserie libre et croissance complète à partir de maintenant ; si elle est occupée, attente au nid. Croissance : résultat révélé et prêt, accueil manuel. Identité, espèce, garantie et réservation sont conservées, sans nouveau tirage ; la découverte reste enregistrée à l'accueil.

Une reproduction toujours en cours peut donc être accélérée malgré une nurserie occupée, avec avertissement explicite dans la confirmation. Cette règle de la demande actuelle remplace la restriction de la proposition initiale. Une reproduction déjà terminée qui attend au nid ne propose aucun paiement. Une croissance dans une prairie dont tous les enclos sont pleins ne propose pas d'accélération ; libérer une place reste nécessaire. Aucun cœur ne contourne une capacité.

### Complément

Actions : achats de bâtiments/habitats/lapins communs, améliorations d'habitat, première ou deuxième extension, commande de ferme, lancement d'une reproduction. Les autres conditions (case, capacité, disponibilité, affection, limites) sont vérifiées avant toute proposition ou dépense. L'herbe n'est jamais substituable.

Pour coût C et pattes P insuffisantes : manque `C − P`, prix `ceil((C − P) / 25)` cœurs. La réussite consomme P pattes et ce nombre de cœurs, sans crédit supplémentaire. Exemple : un lapin à 80 pattes, solde 30 → 30 pattes + 2 cœurs ; après achat, 0 patte, sans monnaie rendue sur l'arrondi.

Le joueur choisit explicitement « Compléter », puis confirme le détail. Le paiement normal reste disponible selon ses règles et n'utilise jamais automatiquement les cœurs. Le prix en pattes et en cœurs ne peut dépasser les montants confirmés. Si une modification du portefeuille imposerait plus de pattes ou plus de cœurs, il faut un nouveau devis ; si les pattes suffisent maintenant, revenir au paiement normal. Un bâtiment n'est payé qu'après choix définitif de sa case et confirmation ; toute annulation reste gratuite.

### Transactions et sauvegarde v2

Commandes explicites `claimHearts`, `accelerate`, `payWithHearts`. Toutes passent par `GameController.perform` puis `act`, sans mutation de ressources par l'affichage. Refus : état de la transaction inchangé ; l'avance temporelle séparée du contrôleur est conservée. Une confirmation n'est utilisable qu'une fois ; la protection contre les doubles pressions reste active.

JSON v2 ajoute `hearts` et `nextHeartGiftAt`. La migration valide d'abord le v1 strictement, copie tous ses champs de progression, puis ajoute la dotation et l'échéance. Les v2 gardent leur solde à chaque lecture/import. Un import v1 calcule la première échéance à la confirmation effective (et non au simple aperçu). Réimporter un vieux v1 remplace volontairement la partie par cette ancienne progression migrée : aucun cumul de soldes entre parties.

Le palier de onze espèces de l’étape 6 **conservait la version 2** : aucun champ supplémentaire ni changement de structure. Le catalogue est une configuration, pas une liste copiée dans chaque sauvegarde. Le lecteur reconnaît les nouveaux identifiants et les durées de croissance correspondantes. Une ancienne partie voit onze entrées sans modifier ses ressources, individus, bâtiments, découvertes, fractions, résultats ou réservations ; aucune nouvelle dotation de cœurs. Les horodatages avancent ensuite normalement. Les imports v1 restent migrés selon la règle existante. Une ancienne livraison limitée à cinq espèces ne reconnaît pas les nouveaux identifiants : après avoir accueilli un nouveau lapin, continuer avec cette livraison ou une version ultérieure.

Le stockage conserve la clé historique `prairie-lapins.save.v1` pour retrouver les anciennes parties ; le champ JSON `version` est l'autorité. Avant écriture d'une migration, le v1 brut est copié sous `prairie-lapins.backup.before-v2`. Un échec de copie ou d'écriture préserve la sauvegarde active antérieure. L'import n'active le candidat qu'après écriture réussie. En cas d'échec de sauvegarde d'une action jouée, la mémoire reste disponible et exportable avec avertissement. Les lecteurs v1 stricts ne savent pas charger un export v2.

Les durées v1 restent vérifiées exactement. En v2, un délai raccourci est admissible seulement s'il est déjà terminé, commence avant sa fin et ne dépasse pas la durée normale. Aucune date future raccourcie incohérente n'est acceptée.

Le jeu demeure local sans anti-triche serveur : une avance volontaire de l'horloge ou une restauration d'export est possible. La caméra, les proportions et le zoom sont conservés ; le dernier test humain les valide sur iPhone. Ce retour ne valide pas les nouvelles reproductions, les dépenses de cœurs ou l'export/import.


## Missions — équilibrage validé et implémenté à l'étape 7

Les missions soutiennent achats, collection, nourriture et récoltes ; aucune fonctionnalité existante n'est verrouillée derrière elles. Elles ne modifient pas les prix, revenus, probabilités, délais ou le cadeau indépendant de 2 cœurs toutes les 24 heures. Configuration : `src/config/missions.ts`.

### Principales, visibles dès le départ

| Identifiant stable | Mission | Condition | Récompense unique |
|---|---|---|---|
| first-farm | Première ferme | Posséder une ferme | 20 herbes |
| cozy-nest | Un nid douillet | Posséder un nid | 30 pattes |
| welcome-babies | Bienvenue aux lapereaux | Posséder une nurserie | 20 herbes |
| varied-family | Une famille variée | Avoir découvert 3 espèces | 50 pattes |
| strong-bonds | Des liens plus forts | Avoir un lapin d'affection 5 | 1 cœur |
| growing-collection | Collection naissante | Avoir découvert 5 espèces | 2 cœurs |
| bigger-meadow | Une prairie plus grande | Avoir acheté la première extension | 100 pattes |
| first-rare | Première espèce rare | Avoir découvert Lunettes, Perroquet ou Feu Glacé | 3 cœurs |

Une condition acquise est persistée et ne redevient jamais incomplète. Une récompense nécessite une réclamation manuelle gratuite, une seule fois ; la récompense et son marquage sont appliqués dans la même transaction. Aucun paiement de cœurs. Une espèce en attente au nid ou en croissance n'est pas découverte et ne complète pas une mission de collection.

À la migration, évaluer uniquement l'état vérifiable : bâtiments possédés, découvertes persistées, extension et affection des lapins actuels. Ne pas attribuer un ancien niveau d'affection hypothétique à un lapin disparu. Ne réclamer aucune récompense automatiquement.

### Quotidiennes et bonus

| Identifiant stable | Objectif par cycle | Récompense |
|---|---|---|
| collect-pattes | Récolter 100 pattes dans les enclos | 30 pattes |
| collect-grass | Récolter 40 herbes dans les fermes | 10 herbes |
| gain-affection | Augmenter l'affection de 3 niveaux au total | 20 pattes |
| bonus du cycle | Avoir réclamé les trois récompenses ci-dessus | 2 cœurs |

Le premier cycle commence à la création ou à la migration. Durée fixe : **24 heures**. Référence persistée `referenceAt` ; cycle courant `floor((heure monotone − referenceAt) / 24 h)`. À la frontière exacte, le nouveau cycle commence avant l'action. Les cycles restent alignés sur cette référence, sans minuit local et sans décalage lors d'une réclamation. Après absence, sauter directement au cycle courant ; ne cumuler aucun cycle manqué.

À chaque renouvellement, les trois compteurs, leurs réclamations et le bonus sont réinitialisés. Les anciennes récompenses non réclamées expirent, bonus compris. Le panneau l'annonce explicitement et affiche le temps restant. Les principales ne sont pas affectées par le renouvellement.

Seuls les événements d'actions réussies sont comptés : pattes entières effectivement retirées des enclos, herbes effectivement récoltées, niveaux effectivement gagnés par nourriture. Les quantités sont conservées même au-delà de l'objectif. Ne comptent pas les récompenses, ressources de départ/importées, compléments en cœurs, revenus en attente, commandes non récoltées, refus ou annulations. Une production commencée avant le cycle compte lors de sa récolte dans le cycle actuel. Il n'y a aucun rattrapage d'actions antérieures à la migration.

Le bonus demande les trois **réclamations**, pas seulement les objectifs terminés. Une seule réclamation du bonus par cycle. Il s'ajoute au cadeau de cœurs existant sans en modifier le solde autrement ni l'échéance. Les cœurs restent facultatifs et sans achat réel/publicité.

### Interface et transactions

Bouton Missions sous les compteurs, indicateur discret de récompenses disponibles, onglets Principales et Quotidiennes. Chaque carte affiche titre, condition, progression, récompense, coût gratuit et état En cours / À réclamer / Réclamée. Réclamation explicite et brève animation respectant la préférence de réduction des mouvements. Aucun affichage automatique imposé ; tutoriel court conservé. Les raccourcis ouvrent un panneau, sans achat ni action de jeu.

Commandes `claimMainMission`, `claimDailyMission`, `claimDailyBonus`, traitées par la simulation et le contrôleur. Les réclamations quotidiennes portent l'identité temporelle du cycle : un ancien bouton ne peut réclamer une récompense d'un cycle suivant. Les boutons de mission devenus obsolètes après import sont inactifs. L'état conserve le droit acquis et le paiement ensemble ; double pression ou rechargement ne redonne pas une récompense déjà enregistrée. Un refus ne change aucune ressource. L'avancement du temps séparé par le contrôleur reste conservé, comme avant.

### Sauvegarde version 3 — historique du palier missions

La v3 ajoute `missions` : principales acquises/réclamées, référence et indice du cycle, compteurs/réclamations courants et bonus réclamé. Cette structure persistante justifie le changement de version. Les v1 et v2 sont validées selon leur format, puis converties ; l'import v3 conserve son état de missions et avance normalement le temps, sans réinitialisation ni fusion.

- Depuis v2 : tous les champs précédents conservés, y compris cœurs, cadeau, fractions, résultats et réservations. Aucune redotation. Principales évaluées, quotidiennes à zéro, référence `max(heure de migration, dernière heure simulée)`.
- Depuis v1 : mêmes règles, avec la dotation historique de 12 cœurs et le premier cadeau 24 heures après migration. Pas d'historique d'actions inventé.
- À l'import v1/v2, la référence est fixée à la confirmation effective. La partie importée est écrite avant activation, sans fusion des récompenses avec la partie remplacée.
- La clé active reste `prairie-lapins.save.v1` pour retrouver la progression. Copie brute avant migration v2 sous `prairie-lapins.backup.before-v3` ; la copie v1 historique sous `prairie-lapins.backup.before-v2` est conservée. Échec de copie/écriture : ancien contenu actif intact.
- La validation refuse identifiants de missions inconnus, doublons, principales réclamées sans acquisition, quotidiennes réclamées sans objectif, bonus prématuré et cycle incohérent. Un état ancien décodé peut attendre son avance normale : son cycle nouvellement ancré n'a alors aucune action comptée. L'avance ne peut reculer avant cette référence.
- Un ancien client v1/v2 ne lit pas la v3. Continuer avec cette livraison après migration. Une restauration volontaire d'un ancien export restaure aussi ses anciennes récompenses, sans fusion ; ce jeu local n'est pas un serveur anti-triche.

Les sauvegardes restent liées à l'origine du site. Le mode développement conserve sa sauvegarde, son horloge et ses préférences séparées. Les préférences d'interface ne donnent aucun droit aux missions.


## Habitats et aménagement — règles validées de l'étape 8

Les chiffres suivants sont ceux approuvés dans la demande de cette étape ; aucune proposition d'équilibrage supplémentaire n'est appliquée. Les règles de reproduction, revenus par lapin, affection, missions et cadeaux de cœurs sont conservées.

| Identifiant | Habitat | Types acceptés | Achat | Identité visuelle actuelle |
|---|---|---|---:|---|
| universal | Enclos universel | tous | 120 pattes | bois, herbe, buissons et fleurs pastel |
| paille | Prairie de paille | paille | 200 pattes | sol doré, botte de paille et épis |
| neige | Jardin enneigé | neige | 200 pattes | sol glacé, neige douce et cristaux bleus |
| terre | Terrier de terre | terre | 200 pattes | terre brune texturée, rochers, buisson et terrier |
| feu | Clairière de feu | feu | 200 pattes | sol pêche, pierres chaudes et fleurs orange |
| metal | Atelier de métal | métal | 200 pattes | sol dallé, clôture grise et poteaux à rivets |
| vol | Jardin des airs | vol | 200 pattes | sol vert pâle, nuages et fanions pastel |

| Famille | Niveau | Places | Plafond de pattes | Coût pour atteindre le niveau |
|---|---:|---:|---:|---:|
| Universel | 1 | 3 | 600 | achat 120 |
| Universel | 2 | 5 | 900 | 200 |
| Universel | 3 | 7 | 1 200 | 400 |
| Spécialisé | 1 | 3 | 900 | achat 200 |
| Spécialisé | 2 | 5 | 1 500 | 300 |
| Spécialisé | 3 | 7 | 2 100 | 600 |

Une case par habitat, quel que soit son niveau. Construction et amélioration immédiates, niveau par niveau ; pas de démolition, revente ou conversion. Le détail de niveau est un à trois repères sur la clôture. Les occupants supplémentaires utilisent des rangées dédiées, sans changer la taille des lapins ni le rayon de sélection.

La compatibilité demande au moins le type de l'habitat parmi les types du lapin : Perroquet → feu/vol/universel, Feu Glacé → feu/neige/universel, Lunettes → métal/paille/universel. Achat, accueil en provenance de la nurserie et transfert vérifient compatibilité et places avant paiement ou mutation. Aucun déménagement automatique des anciens lapins. Une incompatibilité n'est jamais contournée par un complément en cœurs.

Les revenus utilisent exactement la même formule, sans bonus de type ou rareté. Les parents en reproduction continuent de produire dans leur habitat. Avant transfert, nourriture ou amélioration, l'avance temporelle calcule les revenus avec l'ancien état. Améliorer conserve les fractions et le stock atteint avec l'ancien plafond ; les revenus perdus à plein ne sont jamais récupérés. Déplacer un habitat conserve occupants, type, niveau et stock.

Les destinations affichent type, effectif/capacité et refus explicites. Boutique en trois sections ; panneau d'habitat avec revenus horaires, stock/plafond et coût/effet du niveau suivant. L'amélioration et les deux extensions demandent une confirmation. Achat spécialisé, amélioration et deuxième extension acceptent le complément facultatif de pattes par cœurs aux tarifs existants, après validation des autres conditions. Annuler un placement ou une confirmation ne dépense rien.

Commandes : `buyBuilding` conserve `kind: enclosure` et accepte `habitatType` (universel par défaut) ; `upgradeHabitat` porte `id` et `fromLevel` ; `expand` porte `stage` 1 ou 2 (1 par défaut pour les anciens appels). Le niveau attendu et l'étape d'extension refusent les confirmations périmées et doubles dépenses. Toutes passent par le contrôleur et la même simulation transactionnelle.

Terrain initial 3 × 2 ; première extension 6 × 2 ; deuxième 9 × 2. Le second achat exige le premier. La mission `bigger-meadow` reste liée au premier et ne redonne pas sa récompense. Les coordonnées existantes ne changent pas. Le rendu montre la prochaine bande d'herbes hautes et adapte les limites latérales. Zoom initial 1,05, minimum 0,8 et maximum 1,65 conservés ; le recentrage garde son point de référence. Aucun ajustement de bornes ou d'orientation n'est appliqué au milieu d'un geste tactile.

### Sauvegarde version 4

Chaque bâtiment reçoit `habitat` : `{type, level}` pour les enclos/habitats, `null` pour les autres bâtiments. `expanded` conserve le droit à la première extension ; `secondExpanded` ajoute celui de la seconde. Ces données persistantes imposent v4.

- Depuis v3 : anciens enclos → universels niveau 1 ; deuxième extension non acquise. Tous les autres champs sont copiés, notamment missions acquises/réclamées, référence et compteurs quotidiens, cœurs/cadeau, occupants, identifiants, coordonnées, fractions, délais, découvertes et réservations. Aucun nouveau cadeau ni récompense automatique. Le temps avance ensuite normalement, avec les expirations quotidiennes habituelles.
- Depuis v2 : migration des missions selon les règles historiques, sans redotation de cœurs, puis ajout des habitats.
- Depuis v1 : règles historiques des cœurs et missions, puis ajout des habitats. Les 12 cœurs ne sont attribués qu'à cette migration historique.
- Export v4 ; import v1/v2/v3/v4 avec validation avant activation, annulation et échec d'écriture sans remplacement de la partie active. Aucune fusion des sauvegardes.
- Validation des types, niveaux entiers 1–3, plafonds, effectifs, compatibilité de chaque occupant, cases et ordre des extensions. Un habitat non valide ne peut pas être importé.
- Clé active inchangée `prairie-lapins.save.v1`. Copie brute v3 avant migration sous `prairie-lapins.backup.before-v4`. Les copies historiques v1 et v2 gardent leurs clés. Un échec de copie/écriture conserve l'ancien contenu actif et signale l'erreur. Les anciennes versions du jeu ne lisent pas v4.

Le mode test garde stockage et horloge séparés. Aucune ressource de test n'est attribuée automatiquement ; le scénario facultatif du guide ne remplace la partie de test qu'après un import explicite. Les sauvegardes restent locales, liées à l'origine et sans garantie de permanence.

## Consolidation visuelle — prairie, habitats et occupants

La prairie reçoit une ombre légère sous sa bordure, des nuances végétales douces et des fleurs déterministes. Le décor végétal reste à l'écart des empreintes des bâtiments. Il n'utilise jamais le générateur aléatoire de la reproduction.

Les sept variantes d'habitat partagent un socle bas, un sol texturé, une bordure claire et une clôture avec un à trois repères de niveau. Les six spécialisés utilisent les couleurs et motifs de la table précédente. Les motifs les plus grands restent sur les bords pour laisser les visages et les bulles lisibles. Les sources des dessins vectoriels originaux sont `src/display/habitatArt.ts` ; aucun asset externe ni décoration achetable n'est ajouté.

Les dispositions de quatre à sept lapins sont adaptées à l'effectif : quatre en deux rangées de deux, cinq en trois puis deux, six en deux rangées de trois, sept en trois puis deux puis deux. Les trois emplacements initiaux restent inchangés. Les lapins avant sont remontés pour dégager le nom de l'habitat et sa bordure. Oreilles, ailes, plumages, lunettes et autres signes distinctifs des onze espèces sont conservés.

Le rendu classe les occupants selon leur profondeur animée. La sélection suit le centre visible du corps à chaque image ; elle choisit le corps le plus proche du toucher et, seulement à distance égale, le lapin au premier plan. La liste du panneau d'habitat reste un autre moyen de choisir chaque individu.

Les petits déplacements sont limités à ±3 pixels horizontalement et ±1,5 pixel verticalement, avec un bond supplémentaire de 5 pixels après nourriture. Ces mesures sont dans les coordonnées du monde avant zoom. La taille des lapins reste ×1,3, le rayon de sélection reste 27 pixels écran, et les boutons/panneaux gardent leurs dimensions tactiles. La projection régulière de 176 × 148 par case et les zooms minimum 0,8, initial 1,05 et maximum 1,65 sont conservés.

Cette passe ne change aucun état persistant, règle économique, probabilité, revenu ou capacité. Le format reste v4, avec les mêmes migrations et les mêmes clés `prairie-lapins.save.v1` et `prairie-lapins.development.*`. L'aperçu conseillé utilise le port 5175 et `?dev=1`, séparément de la version utilisée sur 5173. L'origine changeant avec le port, le transfert d'une partie se fait par export/import volontaire ; le stockage de 5173 reste distinct.

La référence de 361 tests est complétée par huit tests utiles de disposition/sélection, notamment pour tous les occupants d'un habitat de niveau 3 aux zooms minimum et initial et aux extrema des mouvements : **369 tests réussis dans 10 fichiers**, TypeScript strict et build validés. Les essais dans Chromium, avec un viewport paysage de 852 × 393 et une partie de test séparée, complètent les parcours HTML simulés. Ils ne valident pas Safari ni les gestes sur iPhone physique ; le nouveau parcours humain et le bilan courant sont dans [visual-iphone-test.md](visual-iphone-test.md) et [progress.md](progress.md), avec les autres vérifications dans [habitats-iphone-test.md](habitats-iphone-test.md).

## Finition de la prévisualisation — 9 octobre 2026

Les douze identifiants, prix, empreintes et règles v5 sont conservés. La démonstration place effectivement les huit objets extérieurs et les quatre références intérieures (six exemplaires répartis sur deux habitats). Les trois places intérieures de chaque habitat restent distinctes des places de lapins.

Outils propres à Décorations : départ avec les ressources ordinaires ; démonstration aérée de tout le catalogue ; sept occupants et trois objets dans l’habitat initial ; terrain dense à deux extensions, 512 objets possédés dont 140 posés. Les exemplaires supplémentaires restent en réserve. Chaque changement de scénario demande confirmation et passe par le validateur/import transactionnel. Ces quatre commandes ne sont pas exposées dans le laboratoire ordinaire.

Pendant une pose : message neutre avant sélection, refus ou validation avec symbole et texte, commandes de confirmation/annulation visibles pendant le défilement. L’objet à son ancien emplacement est atténué pendant l’aperçu ; il retrouve son apparence entière après annulation ou sortie. Prix, économie, perspective, zoom et taille des lapins inchangés. Arbres et arches sont légèrement réduits, avec la même échelle pour l’aperçu et l’objet posé. Photo utilise toujours la capture système et laisse fonctionner les sauvegardes.
