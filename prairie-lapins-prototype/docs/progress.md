# Livraison v6 — île à neuf parcelles et objets extérieurs

Jeu normal et laboratoire : application `ecb8953ffd1b2df2e414d31bb162d60b2c9e3e79`, [PR nº 3 fusionnée](https://github.com/sullivanlegoff-code/Project-L/pull/3). Huit achats libres de 500 à 4000 pattes, diagonales comprises ; douze objets exclusivement extérieurs ; une conversion vers v6 conservant les exemplaires, missions, ressources et travaux. Quinze espèces et règles économiques/reproduction inchangées. [Règles, conversion et parcours iPhone](land-v6.md), [preuve de publication](validation/production-v6-2026-10-09.json).

[CI réussie](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37983514087) : 569 tests / 15 fichiers, TypeScript, builds normal/laboratoire, conversion avec message unique, douze sélections tactiles, acquisition diagonale sans intermédiaire, forme en L/île complète et contrôle ciblé du cache. Neuf groupes normal et sept laboratoire avec quatorze scénarios, sans injection dans les builds. [Captures et rapports CI](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37983514087/artifacts/11642701225). Caméra et sélection également contrôlées aux quatre diagonales éloignées en paysage 852 × 393. Chromium ; aucun nouvel essai Safari physique prétendu.

Les quatre routes restent dans un artefact Pages unique : normal/laboratoire v6, Décorations figé en v5 `85fe255`, Comptes figés en v4 `3e70d9e`. Partie, horloge, préférences et secours du laboratoire restent isolés ; aucune action email, Supabase ou SQL. Les exports v6 ne sont pas compatibles avec les anciens clients et Comptes v4. Ne pas effacer les données Safari ; fermer les anciens onglets avant de rouvrir.

Les bilans précédents restent dans l’historique Git.
