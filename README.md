# Project-L — Prairie de lapins

**Prévisualisation Décorations v5** : [jouer sans serveur local](https://sullivanlegoff-code.github.io/Project-L/preview/decorations/). Douze objets originaux, achat en pattes, inventaire, pose fine, trois emplacements par habitat, déplacement/rangement et mode photo. Branche `feature/meadow-decoration` depuis `production` `45323cb` ; [guide, stockage séparé et essai iPhone](prairie-lapins-prototype/docs/decorations.md). Le jeu normal et le laboratoire restent en **v4** ; les comptes sont conservés dans leur preview v4, connexion et synchronisation en pause. Le workflow réunit les quatre routes avant une seule publication. Aucun SQL Supabase modifié.

Le **laboratoire de test** est publié à [l'adresse `/dev/`](https://sullivanlegoff-code.github.io/Project-L/dev/), avec un lien depuis les paramètres du jeu normal. Ses commandes, sauvegardes, préférences, horloge et backups sont séparés. Les deux builds de la même révision sont publiés ensemble depuis `production`. Guide : [laboratory.md](prairie-lapins-prototype/docs/laboratory.md), statut réel : [progress.md](prairie-lapins-prototype/docs/progress.md). Validation : **381 tests**, TypeScript, deux builds, huit contrôles normaux et sept groupes de contrôles d’isolation sur les deux adresses HTTPS réussis.

Les sources sont dans **[prairie-lapins-prototype](prairie-lapins-prototype/README.md)**. `production` conserve le jeu stable v4 ; `feature/meadow-decoration` prépare sa future évolution locale v5. Les dossiers `V1.0.x` restent historiques.

**Jouer : [https://sullivanlegoff-code.github.io/Project-L/](https://sullivanlegoff-code.github.io/Project-L/)**. Le jeu est publié gratuitement sur GitHub Pages depuis **`production`**, issue de la version visuelle validée. Cette branche seule déclenche la publication ; `main` reste historique. Le 8 octobre 2026, les 381 tests et les huit contrôles du jeu normal sur l’adresse HTTPS ont réussi. L'identifiant servi se trouve dans Paramètres et dans [build-revision.txt](https://sullivanlegoff-code.github.io/Project-L/build-revision.txt). Consulter [le transfert de partie et les prochaines mises à jour](prairie-lapins-prototype/docs/deployment.md) et le [suivi des vérifications](prairie-lapins-prototype/docs/progress.md).

Les dossiers `V1.0.2`, `V1.0.3` et `V1.0.4` sont historiques. **`V1.0.4` contient le palier des missions, des sauvegardes v3 et 230 tests** ; le numéro du dossier n'est pas celui du format JSON. La livraison habitats comptait 361 tests ; la passe visuelle en compte 369. L'archive `prairie-lapins-habitats-v4.zip` conserve la livraison antérieure à cette passe.

Sous Windows, ouvrir un terminal dans `prairie-lapins-prototype` :

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

Sur l'iPhone connecté au même Wi-Fi, utiliser l'adresse **Network** affichée, avec `?dev=1`. Le port 5175 permet de laisser la session existante sur 5173. Les sauvegardes sont liées au domaine et au port ; les transférer uniquement par export/import volontaire, après avoir gardé un export de secours.

Les adresses `192.168.1.13:5173/?dev=1` et `:5175/?dev=1` désignent un serveur Vite local et une partie de test. La publication de l'environnement Codex prépare les prochaines tâches ; elle ne publie pas le jeu. Le workflow GitHub Pages est distinct, sans PWA ni promesse de fonctionnement hors connexion.

Voir le [bilan vérifié](prairie-lapins-prototype/docs/progress.md) et le [parcours iPhone](prairie-lapins-prototype/docs/visual-iphone-test.md).
