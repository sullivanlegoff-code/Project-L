# Paille et Terre originales v1 — validation de livraison

Deux visuels remplacés depuis les fichiers ajoutés par le joueur sur GitHub. Neige conservée. 586 tests / 18 fichiers, TypeScript, deux builds et contrôles Chromium locaux réussis ; 21 sélections parmi sept occupants mixtes aux trois zooms et sélection des oreilles. [Méthode, sources et comparaisons](paille-terre-v1.md). Publication après validation CI ; preuves publiques à consigner après déploiement.

# Neige originale v1 — livrée

Jeu normal et laboratoire : application `28eb90712608aab08517cc551d0ed8d1d508f613`, [PR nº 5 fusionnée](https://github.com/sullivanlegoff-code/Project-L/pull/5). Remplacement du seul visuel `neige` depuis l’original fourni, détouré avec conservation des RGB opaques (différence maximale 0). Même asset dans l’habitat, la fiche, la boutique, la collection et les parents ; échelle uniforme, ancrage au sol, translation de l’image entière et sélection par silhouette alpha. [Original et préparation](neige-v1.md) · [Comparaison référence/jeu](validation/neige-v1/reference-vs-game.png) · [Preuve de publication](validation/neige-v1/publication.json).

[CI réussie](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37994018115) : **584 tests / 17 fichiers**, TypeScript, builds normal/laboratoire et parcours existants. Vingt-et-une sélections individuelles parmi sept occupants mixtes aux zooms 0,8 / 1,05 / 1,65 ; fiche, boutique, collection, choix des parents et orientation portrait. Les sources de la branche, de la fusion testée et de la livraison ont exactement le même arbre Git. [Captures et rapports CI](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37994018115/artifacts/11645989160).

[Publication et essais publics réussis](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37994696234) : quatre révisions vérifiées et quatre parcours Chromium réussis. Normal et laboratoire servent le PNG SHA-256 `b85337b3d3b3079644fb3df3e7f13f50e4226a0389a5b1a1c95fabf3f348276a`, avec dimensions 518 × 473, transparence et pixel du pelage confirmés. Aucun hook ni injection de sauvegarde dans ce contrôle des builds. [Captures et preuves publiques](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37994696234/artifacts/11646487897).

Autres lapins, règles, sauvegardes v6, caméra, île et décorations conservés. Décorations reste en v5 `85fe255`, Comptes en v4 `3e70d9e` ; Supabase/email restent en pause. Aucun travail engagé sur le prochain lapin. Chromium avec émulation tactile ; Safari sur iPhone physique reste à vérifier selon le [parcours court](neige-v1.md).

## Fondations techniques v6 — livrées

Jeu normal et laboratoire : application `49cab78a87e4b68ca7f8ec90390980e391846cb4`, [PR nº 4 fusionnée](https://github.com/sullivanlegoff-code/Project-L/pull/4). Publication et contrôles des quatre routes réussis. [Preuve durable](validation/foundations-v6-2026-10-09.json) · [Architecture, invariants et limites inter-onglets](technical-foundations.md).

Corrections des crédits numériques, allocations et échéances avant paiement ou tirage ; arrêt des commandes d’un onglet obsolète avec export de sa copie en mémoire ; confirmations liées au remplacement réel de la partie ; nettoyage des listeners et expiration du cache anti-double pression ; conservation de la source illisible exportable lors d’une notification externe. Aucun contenu, équilibrage ou visuel ajouté ; format v6, migrations, clés et cache du terrain conservés.

[CI finale réussie](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37989448529) : 582 tests / 16 fichiers, TypeScript, builds normal/laboratoire, migration et gestes tactiles. Trois traces reproductibles de 180 commandes avec vérification des invariants, sauvegardes, tirages et équivalence temporelle à chaque étape. [Captures et rapports CI](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37989442388/artifacts/11644646696).

[Publication et essais publics réussis](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37990079926) : neuf groupes normal, sept laboratoire et trois sessions/conflits, sans injection dans les builds. Les révisions réellement servies sont vérifiées dans le JSON public et le JavaScript applicatif : normal/laboratoire `49cab78`, Décorations v5 `85fe255`, Comptes v4 `3e70d9e`. [Preuves publiques](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37990079926/artifacts/11644393022).

Chromium ne remplace pas Safari sur iPhone. Lecture/comparaison/écriture de localStorage ne constitue pas une transaction entre onglets : utiliser un seul onglet actif par partie. Le [parcours iPhone](technical-foundations.md#vérifications-reproductibles) comporte trois étapes. Comptes email et Supabase toujours en pause.

## Livraison précédente v6 — île à neuf parcelles et objets extérieurs

Jeu normal et laboratoire : application `ecb8953ffd1b2df2e414d31bb162d60b2c9e3e79`, [PR nº 3 fusionnée](https://github.com/sullivanlegoff-code/Project-L/pull/3). Huit achats libres de 500 à 4000 pattes, diagonales comprises ; douze objets exclusivement extérieurs ; une conversion vers v6 conservant les exemplaires, missions, ressources et travaux. Quinze espèces et règles économiques/reproduction inchangées. [Règles, conversion et parcours iPhone](land-v6.md), [preuve de publication](validation/production-v6-2026-10-09.json).

[CI réussie](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37983514087) : 569 tests / 15 fichiers, TypeScript, builds normal/laboratoire, conversion avec message unique, douze sélections tactiles, acquisition diagonale sans intermédiaire, forme en L/île complète et contrôle ciblé du cache. Neuf groupes normal et sept laboratoire avec quatorze scénarios, sans injection dans les builds. [Captures et rapports CI](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37983514087/artifacts/11642701225). Caméra et sélection également contrôlées aux quatre diagonales éloignées en paysage 852 × 393. Chromium ; aucun nouvel essai Safari physique prétendu.

Les quatre routes restent dans un artefact Pages unique : normal/laboratoire v6, Décorations figé en v5 `85fe255`, Comptes figés en v4 `3e70d9e`. Partie, horloge, préférences et secours du laboratoire restent isolés ; aucune action email, Supabase ou SQL. Les exports v6 ne sont pas compatibles avec les anciens clients et Comptes v4. Ne pas effacer les données Safari ; fermer les anciens onglets avant de rouvrir.

Les bilans précédents restent dans l’historique Git.
