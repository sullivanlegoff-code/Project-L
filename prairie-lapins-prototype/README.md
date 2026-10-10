# Prairie de lapins — reproduction manuelle v8

La reproduction est gratuite. Les parents apparaissent au nid, avec leurs places réservées et leurs revenus conservés dans leurs habitats. Après 20 minutes, le joueur envoie manuellement le lapereau dans la nurserie libre ; sa croissance commence à ce clic et les parents reviennent. Accélérer termine uniquement le délai. Toute nouvelle partie possède déjà un enclos, un nid et une nurserie. Les anciens équipements manquants sont offerts sans déplacement d’objet, avec placement gratuit dans Aménagement si le terrain était plein.

[Parcours, migration v8 et captures](docs/manual-breeding-v8.md). Le laboratoire propose « Nid — parents et transfert manuel ». Illustrations et zoom validés conservés.

[Jouer](https://sullivanlegoff-code.github.io/Project-L/) · [Laboratoire séparé](https://sullivanlegoff-code.github.io/Project-L/dev/)

Bâtiments de 4 × 4 petits carrés, déplaçables d’un petit carré et à travers les frontières acquises. Neuf parcelles de neuf anciennes grosses cases : centre acquis au départ, huit achats libres de 500 à 4000 pattes selon leur ordre d’achat. Douze décorations exclusivement extérieures, dont tunnel tournable. Sélection directe, déplacement avec aperçu et annulation, rangement sans coût, vente confirmée à 50 % des pattes. Quinze espèces, neuf recettes, collection/carnet/filtres, missions, économie et habitats conservés ; six espèces utilisent leurs originaux liés aux identifiants stables : Neige, Paille, Terre, Bélier Gris, Feu et Volant.

[Vue d’ensemble, dézoom et vérifications](docs/camera-overview.md). Minimum de référence 0,4, adapté à l’écran pour cadrer neuf parcelles ; zoom initial 1,05 et maximum 1,65 conservés.

[Placement fin, migration et essai iPhone](docs/fine-buildings-v7.md). [Historique de l’île](docs/land-v6.md). Les anciens objets intérieurs rejoignent l’inventaire avec leurs identifiants. Les parties 1 à 7 passent directement en v8 avec secours, sans redotation ni perte. Les deux anciennes extensions deviennent Est puis Ouest ; huit nouvelles parcelles restent indépendantes. Les travaux et résultats déjà tirés conservent leurs échéances. Ne pas effacer les données Safari ; fermer les anciens onglets avant de rouvrir le jeu.

| Route | Sources et sauvegardes |
|---|---|
| `/Project-L/` | Jeu normal v8, sans outils de test |
| `/Project-L/dev/` | Même révision v8, partie/horloge/préférences/secours séparés |
| `/Project-L/preview/decorations/` | Prévisualisation v5 conservée, révision `85fe255`, stockage distinct |
| `/Project-L/preview/accounts/` | Comptes figés v4, révision `3e70d9e`, email/Supabase/SQL en pause |

Révision applicative v8 : `fc882e3ee4654d5b23a4f3e14318d9ff1147e9b8` ([PR nº 10 fusionnée](https://github.com/sullivanlegoff-code/Project-L/pull/10)). [Reproduction, captures et essai iPhone](docs/manual-breeding-v8.md) · [Validation CI](docs/validation/manual-breeding/ci.json) · [Publication vérifiée](docs/validation/manual-breeding/publication.json). 645 tests, TypeScript, deux builds, neuf suites et 33 contrôles sur les builds réels. Les neuf suites et leurs 33 contrôles réussissent aussi sur le site public ; les quatre révisions servies sont vérifiées. Le zoom et les six illustrations validés sont inchangés.

Dernière publication historique de l’île v6 : `ecb8953ffd1b2df2e414d31bb162d60b2c9e3e79` ([PR nº 3](https://github.com/sullivanlegoff-code/Project-L/pull/3)). [Publication et preuves](docs/validation/production-v6-2026-10-09.json).

La révision réellement servie est lisible dans Paramètres et `build-revision.txt`. Les quatre routes sont publiées dans un seul artefact Pages. Aucun transfert automatique des parties entre espaces ; un import volontaire remplace uniquement la destination après confirmation. Les anciens clients et Comptes v4 ne peuvent pas lire les exports v8.

Validation actuelle : 627 tests / 20 fichiers, TypeScript, builds normal et laboratoire ; parcours Chromium de terrain, sélection tactile des douze objets, gestes et vente ; neuf groupes du normal et sept du laboratoire, quinze scénarios isolés. Les tests automatisés ne remplacent pas un essai sur iPhone Safari physique.

## Développement

```sh
npm ci
npm test
npm run typecheck
npm run dev
npm run build:pages -- /tmp/prairie-pages
```

`?dev=1` active les outils seulement en développement ; le normal publié les exclut. `npm run build:lab` produit le laboratoire distinct. Règles dans `src/simulation`, contrôleur dans `src/application`, formats/migrations dans `src/persistence`, parcelles dans `src/config/land.ts`. Visuels des espèces liés aux identifiants stables dans `src/ui/portraits.ts`.

Historique v5 : [PR nº 2 fusionnée](https://github.com/sullivanlegoff-code/Project-L/pull/2), [preuve de publication](docs/validation/production-v5-2026-10-09.json). Les anciens rapports documentent leur étape, pas les règles actuelles.

Fondations techniques : [architecture, invariants, stockage et vérifications](docs/technical-foundations.md).

Visuel Neige : [original, comparaison en jeu et vérifications](docs/neige-v1.md).

[Paille et Terre : originaux, transparence, comparaisons et contrôles](docs/paille-terre-v1.md).

[Bélier Gris, Feu et nouveau Volant : originaux, comparaisons et vérifications](docs/belier-feu-volant-v1.md).
