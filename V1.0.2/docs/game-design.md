# Référence du prototype — règles initiales du 5 octobre, cœurs validés le 6 octobre 2026

Cette référence reprend les règles et chiffres approuvés par le joueur. Une modification d'équilibrage doit être précédée d'une explication de sa raison. Les paramètres exécutables se trouvent dans `src/config/balance.ts`.

## Concept et périmètre

Jeu mobile solo de collection et de gestion d'une prairie de lapins. Boucle : récolter des pattes, produire de l'herbe, nourrir, reproduire, accueillir, construire et agrandir. Univers, noms, interface et visuels originaux. Les pattes financent les achats et productions ; l'herbe augmente l'affection. Aucun entretien obligatoire, faim, maladie, perte d'affection ou lapin perdu pendant l'absence.

Application web Phaser + TypeScript, utilisation tactile sur iPhone Safari, lien HTTPS, puis PWA. Progression locale avec export/import de secours. Aucun compte, serveur de jeu, achat réel ou publicité dans la première version.

Prototype : cinq espèces, enclos, ferme, nid, nurserie, achats, placement, déplacement, récolte, nourriture, reproduction, accueil, une extension et sauvegarde. Les espèces ont des types fixes et une rareté distincte. Feu, métal, vol et arc-en-ciel sont réservés pour la suite ; arc-en-ciel reste provisoirement spécial.

Reportés : missions, mini-jeux, énergie, vêtements, décorations avancées, événements, catalogue complet et recettes dépendant d'espèces précises.

## Partie initiale et terrain

- 300 pattes, 10 herbes et 12 cœurs.
- Un enclos en case `(0, 0)`, un Lapin Paille et un Lapin Neige d'affection 1.
- Prairie initiale de 3 colonnes × 2 lignes : six cases constructibles.
- Extension unique vers 6 colonnes × 2 lignes : six cases supplémentaires.
- Chaque bâtiment occupe une case libre. Placement à l'achat et déplacement gratuit.
- Construction immédiate ; pas de démolition dans le prototype.
- Enclos universel de trois places, sans contrainte de type.
- Deux fermes au maximum ; un nid et une nurserie au maximum.
- Nurserie d'une place. Les cinq espèces tiennent dans deux enclos avant l'extension.

## Espèces

| Identifiant stable | Nom | Types | Rareté | Achat |
|---|---|---|---|---:|
| paille | Lapin Paille | paille | commun | 80 pattes |
| neige | Lapin Neige | neige | commun | 80 pattes |
| terre | Lapin Terre | terre | commun | 80 pattes |
| brumelin | Brumelin | paille, neige | peu commun | impossible |
| mottelin | Mottelin | paille, terre | peu commun | impossible |

Brumelin et Mottelin restent des noms provisoires validés pour ce prototype. Une espèce est découverte au premier accueil dans un enclos, achat compris. La découverte reste enregistrée indépendamment des individus possédés.

## Économie

| Achat ou action | Coût | Délai ou effet |
|---|---:|---|
| Lapin commun | 80 pattes | immédiat, affection 1 |
| Enclos supplémentaire | 120 pattes | immédiat, trois places |
| Ferme | 60 pattes | immédiat |
| Nid | 100 pattes | immédiat |
| Nurserie | 80 pattes | immédiat |
| Extension | 500 pattes | immédiat, six cases |
| Reproduction | 20 pattes | 20 minutes |
| Croissance d'un commun | gratuit | 5 minutes |
| Croissance d'un hybride | gratuit | 15 minutes |

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

Chaque enclos stocke au maximum 600 pattes, puis cesse d'accumuler jusqu'à la récolte. Récolte manuelle des pattes entières, conservation des fractions restantes. La rareté n'ajoute aucun multiplicateur dans ce prototype.

Affection : de 1 à 20. Passer de A à A + 1 coûte `2 × A` herbes, immédiatement. Coût total de 1 à 20 : 380 herbes. Aucune autre dépense, attente ou perte d'affection.

## Reproduction

Deux individus distincts d'affection minimale 2. Pas de sexes à gérer. Toutes les paires d'espèces sont autorisées. Les parents sont conservés, peuvent être nourris et continuent à produire leurs revenus. Ils sont indisponibles pour une autre reproduction pendant les 20 minutes ; ils sont libérés à la fin, même si le résultat attend encore au nid.

Les probabilités dépendent de l'union des types des deux parents :

| Types réunis | Paille | Neige | Terre | Brumelin | Mottelin |
|---|---:|---:|---:|---:|---:|
| Paille | 100 % | 0 % | 0 % | 0 % | 0 % |
| Neige | 0 % | 100 % | 0 % | 0 % | 0 % |
| Terre | 0 % | 0 % | 100 % | 0 % | 0 % |
| Paille + neige | 40 % | 40 % | 0 % | 20 % | 0 % |
| Paille + terre | 40 % | 0 % | 40 % | 0 % | 20 % |
| Neige + terre | 0 % | 50 % | 50 % | 0 % | 0 % |
| Paille + neige + terre | 20 % | 20 % | 20 % | 20 % | 20 % |

Le résultat est choisi une seule fois, au lancement, puis enregistré avec son identité. Recharger ne le retire jamais au hasard. Chaque lapereau accueilli commence à l'affection 1.

### Protection contre la malchance

Une tentative est admissible si sa table comprend au moins un hybride non découvert. Les autres tentatives laissent le compteur inchangé. Chaque échec admissible incrémente le compteur. Après neuf échecs, la dixième tentative admissible garantit un hybride inconnu admissible ; s'il y en a deux, chacun a 50 % de chances.

Précision d'implémentation pour les découvertes en attente : un résultat hybride inédit tiré au lancement interrompt provisoirement la série d'échecs et ramène le compteur à zéro. Il porte une réservation de découverte persistée, sans ajouter son espèce aux découvertes. L'accueil effectif d'un nouvel hybride remet également le compteur à zéro. Ainsi, un résultat garanti en attente n'est pas laissé avec un compteur de neuf échecs et ne peut pas être annulé par un rechargement. Les tentatives admissibles suivantes comptent depuis cette réservation ; aucun résultat en attente n'est supprimable. Les probabilités ordinaires et la définition d'admissibilité restent celles ci-dessus.

### Nid et nurserie

À la fin de la reproduction, transfert automatique si la nurserie est libre. La croissance commence à la date réelle de fin, même en l'absence du joueur. Si elle est occupée, le résultat attend au nid. La croissance commence seulement à la libération effective de la nurserie. Un lapereau prêt attend son accueil manuel ; il ne disparaît jamais. Le nid ne peut pas lancer une autre reproduction tant qu'il contient un résultat.

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
- Sauvegarde automatique, restauration et export/import sont implémentés. Format exporté version 2 ; import des versions 1 et 2.


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

Actions : achats de bâtiments/lapins communs, extension, commande de ferme, lancement d'une reproduction. Les autres conditions (case, capacité, disponibilité, affection, limites) sont vérifiées avant toute proposition ou dépense. L'herbe n'est jamais substituable.

Pour coût C et pattes P insuffisantes : manque `C − P`, prix `ceil((C − P) / 25)` cœurs. La réussite consomme P pattes et ce nombre de cœurs, sans crédit supplémentaire. Exemple : un lapin à 80 pattes, solde 30 → 30 pattes + 2 cœurs ; après achat, 0 patte, sans monnaie rendue sur l'arrondi.

Le joueur choisit explicitement « Compléter », puis confirme le détail. Le paiement normal reste disponible selon ses règles et n'utilise jamais automatiquement les cœurs. Le prix en pattes et en cœurs ne peut dépasser les montants confirmés. Si une modification du portefeuille imposerait plus de pattes ou plus de cœurs, il faut un nouveau devis ; si les pattes suffisent maintenant, revenir au paiement normal. Un bâtiment n'est payé qu'après choix définitif de sa case et confirmation ; toute annulation reste gratuite.

### Transactions et sauvegarde v2

Commandes explicites `claimHearts`, `accelerate`, `payWithHearts`. Toutes passent par `GameController.perform` puis `act`, sans mutation de ressources par l'affichage. Refus : état de la transaction inchangé ; l'avance temporelle séparée du contrôleur est conservée. Une confirmation n'est utilisable qu'une fois ; la protection contre les doubles pressions reste active.

JSON v2 ajoute `hearts` et `nextHeartGiftAt`. La migration valide d'abord le v1 strictement, copie tous ses champs de progression, puis ajoute la dotation et l'échéance. Les v2 gardent leur solde à chaque lecture/import. Un import v1 calcule la première échéance à la confirmation effective (et non au simple aperçu). Réimporter un vieux v1 remplace volontairement la partie par cette ancienne progression migrée : aucun cumul de soldes entre parties.

Le stockage conserve la clé historique `prairie-lapins.save.v1` pour retrouver les anciennes parties ; le champ JSON `version` est l'autorité. Avant écriture d'une migration, le v1 brut est copié sous `prairie-lapins.backup.before-v2`. Un échec de copie ou d'écriture préserve la sauvegarde active antérieure. L'import n'active le candidat qu'après écriture réussie. En cas d'échec de sauvegarde d'une action jouée, la mémoire reste disponible et exportable avec avertissement. Les lecteurs v1 stricts ne savent pas charger un export v2.

Les durées v1 restent vérifiées exactement. En v2, un délai raccourci est admissible seulement s'il est déjà terminé, commence avant sa fin et ne dépasse pas la durée normale. Aucune date future raccourcie incohérente n'est acceptée.

Le jeu demeure local sans anti-triche serveur : une avance volontaire de l'horloge ou une restauration d'export est possible. La caméra, les proportions et le zoom de l'étape 4 restent inchangés et attendent toujours validation iPhone.
