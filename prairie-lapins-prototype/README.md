# Prairie de lapins — jeu normal v5

**Jouer : [jeu principal](https://sullivanlegoff-code.github.io/Project-L/).**
**Tester : [laboratoire](https://sullivanlegoff-code.github.io/Project-L/dev/)** avec bandeau permanent, ressources, horloge et onze scénarios dans une partie séparée.

La PR nº 2 est intégrée dans `production`. Révision applicative effectivement publiée : `7da76c747de6aec72cdcd3f1281bcf66dc2078d5`. Bilan de publication : [preuve](docs/validation/production-v5-2026-10-09.json), [suivi](docs/progress.md), [guide de publication](docs/deployment.md).

Quinze espèces : onze conservées, plus En Bouée, Géant, Magicien et Dragon. Neuf recettes avec conditions d’affection, chances réellement applicables et garantie ordinaire à six espèces. Dragon exige exactement Perroquet × Feu. Carnet et filtres par type, rareté et découverte. [Catalogue et règles](docs/species.md).

Île validée, habitats compatibles par types, douze décorations, sélection directe avec mise en évidence, déplacement confirmé, rotation compatible, rangement et vente atomique confirmée à 50 % en pattes, sans remboursement de cœurs. Aménagement, mode photo et cache statique conservés. [Décorations](docs/decorations.md), [île](docs/island.md), [performances](docs/performance.md).

Les silhouettes, animations et couleurs provisoires des lapins restent séparées des règles, par identifiants stables. Aucune nouvelle illustration ni accessoire ; leur design attend les références du joueur.

## Adresses et sauvegardes

| Route | Usage | Format et source |
|---|---|---|
| `/Project-L/` | Partie normale, aucun outil de test | v5, `7da76c747de6aec72cdcd3f1281bcf66dc2078d5` |
| `/Project-L/dev/` | Laboratoire, partie et horloge séparées | v5, même révision |
| `/Project-L/preview/decorations/` | Prévisualisation conservée, stockage distinct | v5, `85fe255` |
| `/Project-L/preview/accounts/` | Prévisualisation Comptes figée | v4, `3e70d9e` |

Un seul artefact Pages publie les quatre routes. Chaque révision se lit dans Paramètres et `build-revision.txt`. `production` déclenche la livraison ; `main` et la branche Comptes restent conservées. Email, Supabase et SQL restent en pause ; aucun backend utilisé par le normal ou le laboratoire.

La partie normale utilise les mêmes clés avec migration v4→v5 et secours, sans redotation ni effacement silencieux. Fermer les anciens onglets avant de rouvrir le jeu. Ne pas effacer les données Safari. Aucun transfert automatique depuis les espaces de test. Pour un transfert volontaire : exporter la source et la destination, puis importer la source dans la destination avec confirmation ; son ancienne partie sera remplacée. Les comptes v4 n’acceptent pas les fichiers v5. [Migration et récupération](docs/migration-v5.md).

## Développement et validation

Dans `prairie-lapins-prototype`, Node.js 24 :

```sh
npm ci
npm test
npm run typecheck
npm run build:pages -- /tmp/prairie-pages
```

Pour le développement : `npm run dev`. Les builds normal et laboratoire sont contrôlés séparément ; `?dev=1` ne permet pas d’activer les outils sur le jeu normal publié. Les commandes du laboratoire passent par le contrôleur dans un stockage préfixé.

Validation : 544 tests/14 fichiers, TypeScript, six parcours Chromium historiques, quatre builds, contrôles HTTPS de toutes les révisions et parcours réels normal/laboratoire après publication. Les profils navigateur sont jetables et n’accèdent à aucune partie du joueur. Le joueur a confirmé le fonctionnement général sur iPhone avant cette intégration ; les contrôles automatisés utilisent Chromium et ne constituent pas un nouvel essai Safari physique.
