# Livraison normale v5 publiée — 9 octobre 2026

**PR nº 2 fusionnée dans `production`** : application `7da76c747de6aec72cdcd3f1281bcf66dc2078d5`. [Publication et contrôles HTTPS réussis](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37956243641), [preuve durable](validation/production-v5-2026-10-09.json), [captures et rapports publics](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37956243641/artifacts/11627499043) conservés jusqu’au 8 novembre 2026.

**Jouer : [jeu principal](https://sullivanlegoff-code.github.io/Project-L/). Tester : [laboratoire](https://sullivanlegoff-code.github.io/Project-L/dev/).** Normal et laboratoire v5, même révision `7da76c7`. Quinze espèces, neuf recettes et filtres ; île validée, douze décorations avec sélection, déplacement, rangement et vente, Aménagement/photo et cache statique conservés. Aucun nouveau visuel de lapin ni changement d’équilibrage.

Normal : aucun outil de temps ou ressources, même avec `?dev=1`. Laboratoire : onze scénarios dont collection quinze espèces et sept scénarios d’île/décorations, partie/horloge/préférences/secours séparés et bandeau permanent. Une seule publication pour quatre routes : Décorations v5 figé `85fe255`, Comptes v4 figés `3e70d9e`, stockages isolés. Branche Comptes/PR nº 1 conservées ; email/Supabase/SQL restent en pause. Aucun appel backend ajouté à la publication.

Avant fusion : [544 tests/14 fichiers, TypeScript et six parcours Chromium réussis](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37955358594), [préflight quatre builds réussi](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37955358771). Livraison : 544 tests actuels, 415 Comptes figés, 544 Décorations figées, TypeScript et quatre builds. Après déploiement : révisions, HTML, scripts et fonctionnalités des quatre routes contrôlés ; neuf groupes d’interactions normales réelles dont achat/annulation/vente atomique/rechargement, sept groupes laboratoire dont carnet Dragon exact Perroquet × Feu à 2 %, onze scénarios, conservation des clés normales et rechargement. Aucun hook, interception ou sauvegarde préchargée dans ces deux parcours HTTPS ; aucune erreur console/réseau.

Le joueur a confirmé le fonctionnement général sur iPhone avant intégration. Aucun détail de scénario, modèle ou version Safari supplémentaire déduit ; les parcours automatisés Chromium ne constituent pas un nouvel essai Safari physique.

Migration v4→v5 sur les mêmes clés avec secours, sans redotation ni effacement silencieux. Fermer les anciens onglets puis ouvrir le normal ; ne pas effacer les données Safari. Aucun transfert automatique depuis un espace de test. Pour un transfert volontaire, exporter source et destination puis importer avec confirmation dans la destination, ce qui remplacera sa partie. Les fichiers v5 restent incompatibles avec les comptes v4. [Migration et récupération](migration-v5.md).

Les sections suivantes sont les bilans historiques des étapes précédentes ; elles ne décrivent pas les sources actuelles du normal/laboratoire.

---

# Publication HTTPS — GitHub Pages

## Version et hébergement retenus

Source validée : branche `visual/meadow-habitats`, commit `87862a073eafd6cc699236ea3b863607fa4c35b1`. Retour reçu le 8 octobre 2026 : **« tout fonctionne bien pendant mon essai » sur iPhone**. Aucun scénario détaillé n'a été communiqué ; ce retour ne prouve pas une liste d'essais particulière.

La branche de livraison **`production`** part de cette source et ajoute la publication HTTPS, ses contrôles et sa version dans Paramètres, puis le laboratoire explicitement séparé décrit dans [laboratory.md](laboratory.md). `main` contient encore l'ancien état `e3e4b89` ; elle ne déclenche pas ce déploiement. Les règles, graphismes, caméra et sauvegardes sont conservés.

Le dépôt `sullivanlegoff-code/Project-L` est déjà **public**, constaté sur GitHub. Sa visibilité n'a pas été modifiée. GitHub Pages est disponible gratuitement pour les dépôts publics. Ce jeu solo statique, sans achat réel, tient largement dans les limites documentées : site ≤1 Go, bande passante indicative 100 Go/mois. Aucun abonnement ni domaine acheté.

Adresse publiée et vérifiée le 8 octobre 2026 : **[https://sullivanlegoff-code.github.io/Project-L/](https://sullivanlegoff-code.github.io/Project-L/)**. Elle sert le jeu normal, accessible sans l'ordinateur du joueur. Première révision déployée et vérifiée : `520d4a457877420a97ea709bb918e2cf013f573a`, [workflow réussi](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37800632189). Les mises à jour documentaires suivantes déclenchent également un build : consulter Paramètres ou [build-revision.txt](https://sullivanlegoff-code.github.io/Project-L/build-revision.txt) pour la révision effectivement servie.

Références officielles consultées : [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [limites](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits), [publication par workflow](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages). Leur source officielle `github/docs` a été lue lorsque l'accès à `docs.github.com` était bloqué.

## Construction reproductible

Pour la livraison comprenant le laboratoire, utiliser maintenant **`npm run build:pages -- /tmp/prairie-pages`**, avec la même variable `VITE_BUILD_REVISION`. Le workflow publie un artefact unique : jeu normal à la racine et laboratoire dans `dev/`, depuis la même révision. Détails, isolation du stockage et scénarios : [laboratory.md](laboratory.md). Les commandes suivantes décrivent la construction normale seule, utile pour un contrôle isolé.

Racine : **`prairie-lapins-prototype`**, Node.js 24, `package-lock.json` inchangé.

```bash
npm ci
npm test
npm run typecheck
VITE_BUILD_REVISION="$(git rev-parse HEAD)" npm run build -- --base=/Project-L/ --outDir ../build-pages
node scripts/verify-production.mjs ../build-pages /Project-L/
```

Le workflow utilise le même enchaînement, avec `VITE_BUILD_REVISION` issu de `github.sha` et une sortie dans le dossier temporaire du runner. Il ne touche pas au `dist` historique suivi par Git. Le contrôle vérifie les chemins, les fichiers distribués, l'absence des outils de temps de développement et des URLs de serveur local.

Chaque route distribue uniquement `index.html`, les assets Vite nommés par hash et `build-revision.txt`, avec `.nojekyll` à la racine de l'artefact commun. Aucun ZIP, source TypeScript, test, fichier de sauvegarde du joueur ou secret n'est publié. Les générateurs de scénarios et commandes de test sont compilés uniquement dans les assets du laboratoire. Aucun service backend, tunnel ou serveur Vite de développement requis. Les sons et illustrations sont produits par le jeu ; aucune police ou image locale externe n'est nécessaire.

Le sous-chemin **`/Project-L/`** est explicite dans la commande Vite. Pour un autre hébergeur ou nom de dépôt, adapter ce chemin et refaire les contrôles. La version discrète dans Paramètres vient de `src/config/release.ts` et de la révision injectée au build ; le fichier `build-revision.txt` permet également d'identifier l'artefact.

## Activation initiale et accès

Si GitHub Pages n'est pas activé, ouvrir [les paramètres Pages du dépôt](https://github.com/sullivanlegoff-code/Project-L/settings/pages), puis **Build and deployment → Source → GitHub Actions**. Cette activation nécessite les droits du compte propriétaire ; aucun jeton à copier dans le jeu ou dans la conversation.

Le workflow `.github/workflows/deploy-pages.yml` ne publie que `production`, y compris lorsqu'il est lancé manuellement sur une autre branche (les jobs sont alors ignorés). Il installe les dépendances verrouillées, exécute les tests/typecheck, construit, contrôle le build puis déploie via les actions officielles épinglées à leurs révisions. Les permissions de publication sont limitées au job de déploiement.

Si le premier run a échoué avant activation Pages : ouvrir **Actions → Publier Prairie de lapins → dernier run → Re-run all jobs** après activation. Si l'environnement `github-pages` possède une restriction de branche qui refuse le job, sélectionner `production` dans **Settings → Environments → github-pages → Deployment branches and tags**. Ne pas autoriser les branches expérimentales à publier sur l'adresse du jeu.

L'environnement cloud doit aussi pouvoir atteindre `api.github.com` et `sullivanlegoff-code.github.io` pour suivre et vérifier la publication, ainsi que `docs.github.com` pour la documentation. Ces destinations ont été ajoutées au brouillon réseau, en préservant les presets existants. Un brouillon enregistré ne prouve pas que les règles sont actives dans la machine.

## Vérification du jeu publié

Le test `docs/production-browser-check.cjs` ouvre une **partie normale dans un contexte Chromium jetable**, sans toucher aux données du joueur. Il doit être exécuté sur l'adresse HTTPS effective après publication. Les mêmes contrôles sont exécutables avant publication sur un serveur statique sous le vrai sous-chemin `/Project-L/`.

Contrôles : rendu et ressources, absence d'erreurs bloquantes, navigation des panneaux, nourriture suivie de rechargement, export/import annulé et confirmé, refus d'un fichier invalide, sauvegarde v4 et identification de build. `?dev=1` laisse cachés le badge et les boutons de développement en production. Les huit contrôles ont réussi sur le site réel, sans erreur de console ou de requête. Une réponse HTTP 200 seule n'est pas une validation du jeu.

HTTPS vérifié avec `curl`, validation de certificat système active et réponse 200. Le proxy cloud émet un certificat dont l'autorité était absente du magasin Chromium ; l'ajout permanent a été refusé par le contrôle automatique. Pour le parcours fonctionnel, le navigateur jetable utilise temporairement l'empreinte SPKI du certificat du site déjà validé par `curl`, sans modification du magasin de confiance ni `ignoreHTTPSErrors` global. Ce parcours ne constitue pas une validation du certificat dans Safari ni un essai physique sur iPhone.

## Transférer une partie depuis Windows/iPhone

1. Rallumer une dernière fois le serveur local sur Windows, puis ouvrir **sur l'iPhone** l'ancienne adresse exacte (`http://192.168.1.13:5175/?dev=1`, ou votre adresse réellement utilisée).
2. **Paramètres → Exporter ma partie**, puis enregistrer le JSON dans **Fichiers**. Conserver cet export original.
3. Ouvrir la nouvelle adresse HTTPS dans Safari. Avant import, elle possède une partie normale distincte.
4. **Paramètres → Importer une partie**, choisir le JSON et vérifier le résumé. Annuler si ce n'est pas la bonne sauvegarde.
5. Confirmer, vérifier ressources/lapins/habitats/progression, puis recharger le même lien.

La partie `?dev=1` de l'ancien serveur est une **partie de test accélérée**. Vous pouvez l'importer volontairement ou commencer une partie normale neuve. Les dates exportées sont conservées, même si l'horloge de test a été avancée ; aucun temps ni solde n'est réécrit pour le déploiement.

JSON **v4**, migrations v1/v2/v3, clés actives/de secours et protections d'import inchangés. Pas de fusion, redotation ou réinitialisation d'une sauvegarde importée. Les préférences sons/tutoriel sont séparées de l'export. Le site ne synchronise pas téléphone et ordinateur : stockage local par appareil/navigateur/origine. La même adresse HTTPS doit être conservée ; un export reste utile comme sauvegarde de secours.

## Mises à jour, aperçu et retour arrière

- Développer sur une branche de travail, tester localement sur le port 5175 et faire valider les changements. GitHub Pages ne fournit pas d'aperçu par branche publiquement disponible avec l'action de déploiement utilisée ; aucun aperçu expérimenté ne remplace le site.
- Intégrer uniquement la révision approuvée dans **`production`** et pousser cette branche. Les tests/build sont rejoués avant publication. L'adresse reste identique, sans nouveau téléchargement pour le joueur.
- Le dernier run réussi et sa révision forment le point de retour. Pour annuler une livraison, créer un commit `git revert` sur `production` restaurant le code fonctionnel compatible v4, puis pousser, en conservant le workflow et la configuration de publication. Ne pas revenir au palier historique v3 ni réécrire l'historique par force-push. Si un run échoue avant le déploiement, le site précédemment publié reste servi.
- Les assets Vite changent de nom par hash lors des modifications. Le cache HTTP de GitHub Pages est géré par l'hébergeur. Les réponses réelles de la page d'entrée et de `build-revision.txt`, relevées le 8 octobre 2026, portent **`Cache-Control: max-age=600`**, `ETag` et `Last-Modified` : une ancienne page peut rester en cache dix minutes avant revalidation. La page d'entrée peut être rechargée pour récupérer le nouvel asset après expiration/revalidation. Il n'y a ni service worker ni cache applicatif ajouté. **Ne pas effacer les données Safari pour mettre à jour** : cela effacerait la partie locale.

Pour le test final sur votre iPhone : ouvrir le lien, effectuer une action, fermer puis rouvrir ; éteindre Windows ; couper le Wi-Fi en gardant les données mobiles et rouvrir. Le jeu doit fonctionner sans l'ordinateur mais requiert encore Internet. La PWA et le jeu entièrement hors connexion restent une étape ultérieure.
