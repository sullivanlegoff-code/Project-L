# Prairie de lapins — île carrée v6

[Jouer](https://sullivanlegoff-code.github.io/Project-L/) · [Laboratoire séparé](https://sullivanlegoff-code.github.io/Project-L/dev/)

Neuf parcelles de neuf cases : centre acquis au départ, huit achats libres de 500 à 4000 pattes selon leur ordre d’achat. Douze décorations exclusivement extérieures, dont tunnel tournable. Sélection directe, déplacement avec aperçu et annulation, rangement sans coût, vente confirmée à 50 % des pattes. Quinze espèces, neuf recettes, collection/carnet/filtres, missions, économie et habitats conservés ; aucune nouvelle illustration de lapin.

[Règles, conversion unique et parcours iPhone](docs/land-v6.md). Les anciens objets intérieurs rejoignent l’inventaire avec leurs identifiants. Les parties 1 à 5 passent directement en v6 avec secours, sans redotation ni perte. Les deux anciennes extensions deviennent Est puis Ouest ; huit nouvelles parcelles restent indépendantes. Les travaux et résultats déjà tirés conservent leurs échéances. Ne pas effacer les données Safari ; fermer les anciens onglets avant de rouvrir le jeu.

| Route | Sources et sauvegardes |
|---|---|
| `/Project-L/` | Jeu normal v6, sans outils de test |
| `/Project-L/dev/` | Même révision v6, partie/horloge/préférences/secours séparés |
| `/Project-L/preview/decorations/` | Prévisualisation v5 conservée, révision `85fe255`, stockage distinct |
| `/Project-L/preview/accounts/` | Comptes figés v4, révision `3e70d9e`, email/Supabase/SQL en pause |

La révision réellement servie est lisible dans Paramètres et `build-revision.txt`. Les quatre routes sont publiées dans un seul artefact Pages. Aucun transfert automatique des parties entre espaces ; un import volontaire remplace uniquement la destination après confirmation. Les anciens clients et Comptes v4 ne peuvent pas lire les exports v6.

Validation v6 : 569 tests / 15 fichiers, TypeScript, builds normal et laboratoire ; parcours Chromium de terrain, sélection tactile des douze objets, gestes et vente ; neuf groupes du normal et sept du laboratoire, quatorze scénarios isolés. Les tests automatisés ne remplacent pas un essai sur iPhone Safari physique.

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
