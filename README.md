# Project-L — Prairie de lapins

Les sources les plus récentes sont dans **[prairie-lapins-prototype](prairie-lapins-prototype/README.md)** : onze espèces, missions, six habitats spécialisés, trois niveaux, deux extensions et sauvegardes **v4**. La passe visuelle est réalisée dans la branche `visual/meadow-habitats`.

La branche **`production`** est préparée depuis cette version pour GitHub Pages. Elle seule déclenche le workflow de publication ; `main` n'a pas été intégrée et reste historique. Adresse HTTPS attendue après activation et contrôle : `https://sullivanlegoff-code.github.io/Project-L/`. Consulter [les instructions de publication et de transfert de partie](prairie-lapins-prototype/docs/deployment.md) et le [suivi des vérifications](prairie-lapins-prototype/docs/progress.md) pour le statut réel.

Les dossiers `V1.0.2`, `V1.0.3` et `V1.0.4` sont historiques. **`V1.0.4` contient le palier des missions, des sauvegardes v3 et 230 tests** ; le numéro du dossier n'est pas celui du format JSON. La livraison habitats comptait 361 tests ; la passe visuelle en compte 369. L'archive `prairie-lapins-habitats-v4.zip` conserve la livraison antérieure à cette passe.

Sous Windows, ouvrir un terminal dans `prairie-lapins-prototype` :

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

Sur l'iPhone connecté au même Wi-Fi, utiliser l'adresse **Network** affichée, avec `?dev=1`. Le port 5175 permet de laisser la session existante sur 5173. Les sauvegardes sont liées au domaine et au port ; les transférer uniquement par export/import volontaire, après avoir gardé un export de secours.

Les adresses `192.168.1.13:5173/?dev=1` et `:5175/?dev=1` désignent un serveur Vite local et une partie de test. La publication de l'environnement Codex prépare les prochaines tâches ; elle ne publie pas le jeu. Le workflow GitHub Pages est distinct, sans PWA ni promesse de fonctionnement hors connexion.

Voir le [bilan vérifié](prairie-lapins-prototype/docs/progress.md) et le [parcours iPhone](prairie-lapins-prototype/docs/visual-iphone-test.md).
