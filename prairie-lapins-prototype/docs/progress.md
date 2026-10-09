# Finition de l’aménagement — 9 octobre 2026

Reprise depuis PR #2, `feature/meadow-decoration` `c9919b2`, cible `production`. Aucune remarque de revue ni vérification attachée au dernier commit documentaire ; le déploiement initial `37860899136` était réussi. Copie locale ancienne préservée dans `/workspace/Project-L` (`work`, `e3e4b89`, propre). Récupération vérifiable des 100 fichiers actifs et de leurs assets/configurations par le connecteur GitHub, sans checkout approximatif ni installation nouvelle. Dépendances locales réutilisées après égalité des lockfiles. Les archives historiques restent dans l’arbre distant ; aucune suppression prévue.

**Déjà livré avant cette reprise :** douze décorations et prix exacts, commandes transactionnelles, inventaire identifié, grille 4 × 4, collisions, rotations banc/arche, trois slots, modes Aménagement/photo, v5/migrations et espace séparé, PR brouillon et quatrième route. La base a été vérifiée maintenant : 436 tests et TypeScript réussis.

**Terminé ici :** scénario de départ visible ; démonstration aérée avec les douze références effectivement posées, tunnel inclus ; scénario dense accessible (512 exemplaires / 140 posés) ; liste des objets posés conservée à l’autosauvegarde ; position de défilement remise au départ lors d’un changement de vue ; état neutre sans destination ; commandes de pose visibles pendant le défilement ; ancien objet atténué pendant le déplacement ; silhouettes arbre/arche réduites et échelle fantôme identique. Prix, identifiants, économie, formats et gestes normaux conservés.

**Vérifications exécutées maintenant :** 441 tests / 12 fichiers réussis ; TypeScript ; preview v5 et builds de contrôle root/dev ; vérifications des bundles et absence du client de comptes. Chromium réel dans des profils jetables : 21 sélections des sept lapins aux zooms 0,8 / 1,05 / 1,65, pan/pinch sans pose ; photo avec autosauvegarde ; achat unique sur double confirmation, refus sur bâtiment, pose/rotation tactiles, annulation puis validation de déplacement, rangement/rechargement du même identifiant, export v5 marqué, quatre scénarios, rechargement de 512 objets, panneaux/HUD contenus dans 667 × 375 et 852 × 393. Clés étrangères préservées, zéro erreur et aucune requête Supabase dans le parcours tactile.

Captures et rapports de cette exécution : [démonstration](images/decorations/finition-2026-10-09/demo.png), [pose](images/decorations/finition-2026-10-09/placement.png), [sept occupants](images/decorations/finition-2026-10-09/seven.png), [photo](images/decorations/finition-2026-10-09/photo.png), [dense](images/decorations/finition-2026-10-09/dense.png), [petit paysage](images/decorations/finition-2026-10-09/compact-inventory.png), [parcours tactile](images/decorations/finition-2026-10-09/flow-report.json).

**Limites mesurées :** pas d’iPhone physique/Safari. Stress Chromium historique reconstruit à 512 exemplaires / 254 images, textures réutilisées : moyenne 5,6 images/s, p95 333 ms dans ce cloud partagé avec vérifications concurrentes. Cette mesure n’est pas comparable à un iPhone et ne permet pas de revendiquer la fluidité du scénario extrême. Le scénario accessible est moins chargé visuellement (140 objets posés). Validation Safari, copies de migrations représentatives et plan de récupération nécessaires avant une intégration normale. Comptes et configuration email en pause, client normal/labo v4 préservé.

Les accès HTTP directs du terminal restent bloqués par le proxy injoignable. Le serveur local et Chromium ont été autorisés par le sandbox ; ni proxy, politique réseau ni vérification TLS modifiés. Le publisher doit contrôler les quatre fichiers de révision et les scripts réellement servis après déploiement, depuis GitHub Actions. Les rapports HTTPS ci-dessous sont historiques, pas une nouvelle vérification de cette reprise.

---

# Aménagement — prévisualisation v5, 9 octobre 2026

Branche `feature/meadow-decoration`, depuis `production` `45323cb`. Douze illustrations originales partagées entre boutique et textures Phaser, achats exclusivement en pattes, propriété d’exemplaires uniques, inventaire, grille fine 4 × 4 par case, deux rotations cohérentes, trois slots par habitat, aperçu/confirmation/annulation, déplacements/rangements gratuits et mode photo. Les règles économiques, missions et tirages de reproduction restent inchangés. [Guide et catalogue](decorations.md), [future compatibilité des comptes](accounts-v5-compatibility.md).

**Publication réelle réussie** à https://sullivanlegoff-code.github.io/Project-L/preview/decorations/, application figée sur `5feff8dcebd9dbcea331a312e95b51f807da2975`. Déploiement `production` `ae31131f8318ffbd69794f20e57c1050694afb49`, [workflow 37860899136 réussi](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37860899136). Les étapes installation/tests/TypeScript/build et déploiement des quatre routes ont réussi dans GitHub Actions. Le jeu normal et le laboratoire conservent leurs sources v4 ; les comptes gardent les sources figées `3e70d9e8cbe9228c63c73db007fff199199d6470`, leur branche et leur PR en brouillon. Aucun email demandé, aucune migration/édition SQL Supabase. L’exécution SQL avait été confirmée auparavant ; session réelle et synchronisation restent non validées et en pause.

Sauvegardes : v5 strict, propriété/localisation/rotation/références validées, limite de 512 exemplaires, v4 → v5 sans modification des champs de progression ni redotation, anciennes migrations conservées. Secours avant écriture et import transactionnel. Préfixe `prairie-lapins.preview.decorations.` pour partie, préférences, horloge et **tous** les secours ; aucune lecture/écriture normale automatique. Export nommé PREVIEW-DECORATIONS-v5-MODE-TEST ; incompatibilité v4 signalée. Pas de SDK/services comptes dans ce build.

Vérifications réellement exécutées : **436 tests / 12 fichiers**, TypeScript, builds normal/laboratoire de la branche v5 (contrôles seulement) et build de prévisualisation, contrôle des chemins et de l’absence des outils dans le build normal. Production stable vérifiée séparément : **381 tests / 11 fichiers**, TypeScript et ses deux builds v4. Aucun de ces builds v5 root/dev ne remplace les versions stables publiées.

Chromium réel / WebGL, Linux, viewport tactile paysage 852 × 393 : **21 sélections sur 21** des sept occupants, zooms 0,8 / 1,05 / 1,65 ; gestes de glissade et pincement via événements navigateur, caméra immobile lors d’un scroll dans un panneau, achat/aperçu/annulation, export v5 réellement téléchargé, rechargement et mode photo avec sauvegarde automatique active. Textures SVG corrigées après un vrai échec de décodage initial ; identité du nouvel objet transmise à la scène avant son premier toucher ; commandes écartées des visages et noms dessinés au-dessus des objets. Fond de canvas transparent sur le fond pastel pour éviter les marges noires observées dans le compositeur WebGL.

Mesure disponible, **sans extrapolation à l’iPhone** : prairie dense validée avec **512 objets possédés, 214 images de décoration visibles, sept lapins**. Échantillon de 180 frames sur 10,37 s : moyenne **17,36 frames/s**, intervalle p95 **66,8 ms** dans ce cloud partagé. Les 214 images restent les mêmes objets Phaser ; **14 textures** (12 objets + deux orientations supplémentaires) sont réutilisées. Ce résultat ne garantit pas le confort Safari ; l’essai physique demandé reste nécessaire. [Rapport Chromium](images/decorations/browser-report.json).

Contrôle des quatre builds compilés sur une même origine locale : HTTP 200, v4/v4/v4/v5, action ordinaire normale (nourriture), absence des outils normaux même avec `?dev=1`, rechargements distincts, ressources/horloges/préférences/scénarios/achat/import/reset/photo de Décorations laissant toutes les autres clés **identiques octet pour octet**. Import volontaire d’une copie normale v4 avec secours local, export v5 marqué, zéro demande Supabase dans la preview. Aucune erreur de console, requête échouée ou réponse HTTP d’erreur dans les deux parcours Chromium. Les comptes du build local étaient issus de l’artefact antérieur conservé ; la révision figée effective a ensuite été vérifiée sur l’hébergement.

**Parcours HTTPS réel réussi sur les quatre routes**, dans un seul contexte Chromium jetable : builds normal/laboratoire `ae31131`, comptes `3e70d9e`, décorations `5feff8d` affichés et fichiers de révision HTTP 200 exacts, canvas, nourriture normale, `?dev=1` inactif normalement, trois progressions v4 distinctes et preview v5, ajout de ressources/horloge/préférences, scénario sept occupants, achat annulé conservé, import invalide refusé, copie v4 migrée avec secours local, export v5 téléchargé, reset, mode photo et rechargements. Toutes les clés hors préfixe Décorations restent identiques pendant ses commandes. Zéro erreur console, requête échouée, réponse HTTP d’erreur ou demande Supabase depuis Décorations. Aucun login ni email demandé. [Rapport HTTPS](images/decorations/https-report.json), [capture du build publié](images/decorations/published-seven.png). TLS système validé par curl ; Chromium utilise un lanceur temporaire limité à l’empreinte SPKI du certificat du site derrière le proxy, sans modification du magasin de confiance.

La [PR #2](https://github.com/sullivanlegoff-code/Project-L/pull/2) reste en **brouillon**, non fusionnée. Le publisher stable est repris dans la branche de travail pour garder une demande d’intégration résoluble ; le code applicatif servi reste le SHA figé `5feff8d`. La PR comptes #1 reste ouverte/en brouillon sur `1b7f4c0`, inchangée.

Captures de comparaison avec les mêmes bâtiments et progression : [avant](images/decorations/before.png), [après](images/decorations/after.png). Autres captures : [sept occupants décorés](images/decorations/seven.png), [mode photo](images/decorations/photo.png), [boutique](images/decorations/shop.png), [aperçu de pose](images/decorations/placement.png). Ces captures proviennent du rendu Phaser, pas d’une maquette DOM.

Limites : pas de test iPhone physique dans cette exécution, trois slots fixes, esthétique uniquement, plafond de 512 objets, pas de vente/suppression, aucune compatibilité cloud v5 encore implémentée. Intégration normale différée jusqu’au retour visuel et à une stratégie de migration/retour arrière validée. Consignes de démarrage cloud actualisées et enregistrées en brouillon ; leur publication d’environnement est distincte de GitHub Pages.

# Historique des paliers précédents

# Contrôle hébergé anonyme et quota SMTP

9 octobre 2026 : quota du SMTP intégré confirmé par le propriétaire à **2 emails/heure** ; réception des deux premiers emails puis refus des demandes supplémentaires. Pause des envois, aucun email automatique demandé. Preview avec message spécifique de quota email et contrôle hébergé anonyme dans le workflow (Auth activé, refus état/historique/RPC/INSERT, schéma privé non exposé). Sources figées `3e70d9e8cbe9228c63c73db007fff199199d6470`, 415 tests et TypeScript réussis avant intégration du workflow. Le contrôle hébergé doit réussir avant publication ; ne constitue pas une validation de session, de sauvegarde authentifiée ou d’isolation entre deux propriétaires. Code du jeu normal/laboratoire inchangé.

# Prévisualisation : lien email standard

9 octobre 2026 : le propriétaire confirme projet Supabase prêt, SQL exécuté avec succès, fournisseur Email activé. Le dashboard impose un SMTP personnalisé pour modifier le template. La preview est adaptée au **lien par défaut**, via détection SDK de la session dans le retour URL ; un code numérique reste optionnel avec template/SMTP futur. Aucun abonnement/domaine acheté, client de comptes toujours absent du jeu normal et du laboratoire. Preview figée sur `df864e11a14badae0806714a4fb71be95d5067db`. 415 tests, TypeScript et builds réussis sur les sources expérimentales. Ces tests ne constituent toujours pas une preuve d’email réel ou de sauvegarde hébergée. URL de retour, variables publiques et parcours d'intégration restent à configurer/vérifier. Ne pas rerun SQL ni retoucher le template pour suivre ce nouveau parcours. Le workflow continue de publier les trois routes dans un artefact unique.

# Prévisualisation des comptes — publication séparée

8 octobre 2026. Le joueur confirme que **jeu normal et laboratoire fonctionnent pendant son essai iPhone** ; aucun scénario supplémentaire déduit. Les sources du jeu normal et du laboratoire restent celles de `1747ea6` ; seuls le workflow et ce suivi changent ici. Une troisième route `/Project-L/preview/accounts/` est ajoutée dans le même artefact Pages, depuis les sources expérimentales figées `608f49a` sur `feature/private-cloud-saves`.

Comptes OTP, serveur de sauvegardes privées et historique préparés ; **aucun projet Supabase accessible ni email réel vérifié**, donc comptes non activés. Sans configuration, la preview indique clairement que la progression est locale. Son invité, ses préférences, sessions, comptes et backups utilisent un préfixe supplémentaire ; elle ne reprend pas automatiquement la partie normale.

Validation des sources expérimentales : **414 tests / 15 fichiers**, TypeScript, trois builds ; PostgreSQL embarqué PGlite avec permissions/RLS/CAS/rétention ; parcours Chromium locaux normal, laboratoire et isolation preview/auth/reset. Ce ne sont pas encore des essais du SMTP, JWT ou API Supabase hébergés. La connexion réelle et reprise dans un second navigateur restent conditionnées à la configuration et aux comptes de test.

[Guide comptes et parcours iPhone](https://github.com/sullivanlegoff-code/Project-L/blob/feature/private-cloud-saves/prairie-lapins-prototype/docs/accounts.md) ; [configuration externe et SQL](https://github.com/sullivanlegoff-code/Project-L/blob/feature/private-cloud-saves/prairie-lapins-prototype/backend/README.md). Le propriétaire devra créer/configurer un projet Free et les deux variables publiques **PRAIRIE_PREVIEW_SUPABASE_URL / PRAIRIE_PREVIEW_SUPABASE_PUBLISHABLE_KEY** dans GitHub (API d'administration indisponible à l'intégration, HTTP 403). Ces variables concernent uniquement la preview ; aucun SDK de comptes ajouté au jeu stable ni au laboratoire stable. Conserver l'export JSON indépendant. La livraison des comptes sur l'adresse normale attend les vérifications réelles. Point de retour intégral avant preview : `1747ea6`.

# Consolidation et première passe visuelle — 8 octobre 2026

## Laboratoire publié — HTTPS vérifié

Retour reçu : le jeu HTTPS fonctionne sur l’iPhone du joueur, **ordinateur éteint**. Ce retour confirme cet essai ; aucun test détaillé supplémentaire ni essai du laboratoire sur iPhone n’est inventé.

Branche de travail `feature/published-laboratory`, depuis `production` `2d3ba56`. Jeu normal préservé à `/Project-L/`, laboratoire publié à `/Project-L/dev/`, avec mêmes sources et révision. Le workflow produit les deux builds dans un artefact Pages unique : aucune publication indépendante qui retirerait l’autre route. Le paramètre normal `?dev=1` n’active toujours rien.

Réutilisation du préfixe historique `prairie-lapins.development.` pour partie, migrations/backups, préférences et horloge de test. Adaptateur de sauvegarde préfixant toutes les clés, sans repli vers les clés normales. Scope explicite sur stockage/contrôleur ; les commandes de test refusent un contrôleur normal. Politique de session interdisant les futurs services en ligne dans le laboratoire ; aucun compte développé.

Ajouts : lien dans Paramètres normal, bandeau permanent **MODE TEST — PARTIE SÉPARÉE** et retour normal, cinq avances de temps, six ajouts de ressources prédéfinis, reset confirmé, quatre scénarios validés v4, export/import existant et fichiers **MODE-TEST**. Le reset ne touche que la partie de test et conserve horloge, préférences et backups. Aucun format JSON ni règle normale modifié.

Validation : **381 tests / 11 fichiers réussis**, dont 12 tests du laboratoire. TypeScript et les deux builds réussissent ; contrôle des chemins, absence des commandes dans le build normal et présence dans le laboratoire. Les quatre scénarios passent la validation v4. Deux parcours Chromium sur serveur statique sous les chemins réels ont réussi : huit contrôles normaux, puis sept groupes de contrôles d’isolation sur une même origine, sans erreur de console/réseau. Toutes les clés hors espace de test restent identiques pendant les commandes, imports et resets ; les rechargements restaurent leurs progressions et horloges respectives.

**Publication réelle réussie**, première révision `92d6511a4b478af9df8b0c2a8f1852949303d3be`, [workflow 37809697390](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37809697390). Installation verrouillée, tests, TypeScript, deux builds et déploiement réussis dans GitHub Actions. Les deux `build-revision.txt` HTTPS répondent 200 et indiquent exactement cette révision. Les huit contrôles normaux et les sept groupes du parcours laboratoire ont également réussi sur les vraies adresses, en contexte Chromium jetable, sans erreur de console, requête échouée ni réponse HTTP d’erreur. Nourriture normale conservée, export/import normal valide, liens aller/retour, tous les presets, reset confirmé/annulé, quatre scénarios, affichage portrait utilisable, stockage normal inchangé pendant les commandes de test et rechargements indépendants.

Rapports locaux : `/workspace/artifacts/normal-laboratory-local/` et `/workspace/artifacts/laboratory-local-final/`. Rapports HTTPS : `/workspace/artifacts/normal-laboratory-https/` et `/workspace/artifacts/laboratory-https/`. Les deux accès passent la validation TLS système ; le navigateur de test utilise temporairement l’empreinte du certificat du site derrière le proxy cloud, sans changer le magasin de confiance. L’essai physique du laboratoire sur Safari reste à effectuer. Le point de retour avant laboratoire est `2d3ba56` ; celui comprenant les deux routes est `92d6511`. Les mises à jour documentaires produisent un nouvel identifiant de build ; la révision actuellement servie est accessible dans Paramètres et dans `build-revision.txt` de chaque route. [Guide complet](laboratory.md) : commandes, clés exactes, transfert volontaire, builds, rollback et cinq étapes iPhone.

## Mise en ligne HTTPS — publiée et vérifiée

**Jouer : [https://sullivanlegoff-code.github.io/Project-L/](https://sullivanlegoff-code.github.io/Project-L/)**. Publication gratuite sur GitHub Pages réussie le 8 octobre 2026 depuis `production`. Première révision publique vérifiée : `520d4a457877420a97ea709bb918e2cf013f573a`, [workflow 37800632189 réussi](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37800632189). La révision servie après chaque mise à jour se lit dans Paramètres et [build-revision.txt](https://sullivanlegoff-code.github.io/Project-L/build-revision.txt).

Retour du joueur après installation depuis GitHub et essai iPhone : **« tout fonctionne bien pendant mon essai »**. Aucun détail des scénarios n'a été communiqué ; ne pas en déduire une validation exhaustive ni un essai du nouveau site HTTPS.

La source validée est `visual/meadow-habitats`, commit `87862a073eafd6cc699236ea3b863607fa4c35b1`. La branche de livraison `production` a été créée depuis cette source ; `main` reste à `e3e4b89`. Le dépôt était déjà public ; visibilité conservée, aucun abonnement ni domaine acheté. Seul `production` déclenche le workflow de publication, avec Node 24, installation verrouillée/tests/typecheck/build, actions officielles épinglées et fichiers construits exclusivement. Base Vite `/Project-L/` explicite, version dans Paramètres issue de `src/config/release.ts` et de la révision injectée. Économie, graphismes/caméra, JSON v4, migrations et clés inchangés.

**Validation de construction : 369 tests / 10 fichiers réussis**, TypeScript et build sous `/Project-L/` réussis dans GitHub Actions. Contrôle des chemins, fichiers distribués et exclusion des outils de développement réussi. Le parcours final sur serveur statique local avait également réussi ses huit contrôles ; une requête favicon 404 a été corrigée avant publication.

**Validation du site réel HTTPS : huit contrôles Chromium réussis**, dans une partie jetable et un viewport paysage 852×393 :

- Prairie et ressources affichées ; nouvelle partie normale v4, deux lapins.
- Boutique, collection, missions, paramètres et version `520d4a4`.
- Sélection réelle de Paille sur le canvas, bouton Nourrir : affection 1→2, herbe 10→8.
- Export JSON v4 réellement téléchargé ; import annulé conservant la progression.
- Import confirmé avec 317 pattes, conservation des lapins/herbes/cœurs/habitats et nouvel export cohérent.
- JSON invalide refusé sans remplacer la partie.
- Rechargement conservant 317 pattes, 8 herbes, 12 cœurs et affection 2.
- `?dev=1` conserve la partie normale, sans badge, bouton ou sauvegarde de développement.

Aucune erreur de console, requête échouée ou réponse HTTP d'erreur pendant ce parcours. Rapport, captures et exports : `/workspace/artifacts/production-https-validation/`. Les données du joueur n'ont pas été utilisées ni modifiées. L'essai physique Safari sur iPhone, Windows éteint et en données mobiles reste à effectuer par le joueur.

HTTPS : `curl` réussit avec validation TLS système active, réponses 200 pour la page et l'identifiant de build. Le proxy cloud présente une autorité absente de Chromium ; le contrôle automatique a refusé son ajout permanent au magasin de confiance. Le parcours fonctionnel utilise donc un lanceur jetable limité à l'empreinte SPKI du certificat du site déjà validé par `curl`, sans changement permanent de confiance. Cela distingue la vérification TLS système du parcours Chromium derrière le proxy. Cache réellement observé : `max-age=600`, avec `ETag` et `Last-Modified`. Aucun service worker ajouté ni effacement des données Safari demandé.

Historique des accès : les destinations API/Pages ont d'abord été bloquées par le proxy réseau, puis ajoutées au brouillon cloud en préservant les presets ; les opérations API et HTTPS fonctionnent. Le premier déploiement a échoué parce que Pages n'était pas activé (404) ; le compte propriétaire a choisi Source **GitHub Actions**. Le job suivant a été refusé par la règle de l'environnement `github-pages` autorisant seulement `main` ; le propriétaire a ajouté **`production`**. Ces deux réglages administratifs étaient refusés à l'intégration (403). Après vérification effective de la règle, la relance du job de déploiement a réussi. Aucun contournement des règles ni intégration du vieux `main`.

Les prochaines mises à jour validées sont poussées sur `production`, avec tests et publication automatiques sur la même adresse. Le premier point de retour public fonctionnel est `520d4a4` ; les commits documentaires suivants ne changent pas les règles du jeu mais produisent un nouvel identifiant de build. Guide complet : [deployment.md](deployment.md), incluant transfert volontaire depuis l'ancienne adresse, cache et retour arrière compatible v4. Pas de synchronisation entre appareils ; le mode entièrement hors connexion reste ultérieur.

## Bilan de la passe visuelle précédente

La cible réelle est `prairie-lapins-prototype`, sauvegardes **v4**. Le dossier `V1.0.4` correspond au palier précédent des missions, sauvegardes v3 et 230 tests. Les sources habitats et leur archive existaient déjà ; aucune mécanique n'a été réimplémentée depuis le brief.

Révision de départ : `e3e4b8924ce09e065ccd552bef5cd7db0c416828`, branche initiale `work`, copie de travail propre. `origin/main` porte la même révision ; aucune autre branche distante ni tag trouvé. Travail dans `visual/meadow-habitats`. Dossiers historiques, archive originale et builds versionnés conservés.

## Fonctionnalités et corrections

Onze espèces, affection, revenus fractionnaires, fermes, reproduction/garantie, nurserie, cœurs, missions et export/import sont présents. Six habitats spécialisés et universels, niveaux 1–3, capacités 3/5/7, coûts/plafonds validés, deux extensions (3×2 → 6×2 → 9×2), migrations v1/v2/v3 vers v4 : tout est conservé.

Défauts visuels constatés : cinq occupants utilisaient les cinq premiers emplacements de la disposition pour sept ; à sept, les lapins du premier plan empiétaient sur le nom de l'habitat. Aucun défaut de simulation reproductible trouvé dans cette étape.

- Dispositions équilibrées de quatre à sept occupants, premier plan remonté pour dégager le nom ; zones de toucher suivant les positions animées, priorité au premier plan à distance égale, tri des animaux par profondeur.
- Animation réduite à ±3 pixels horizontalement, ±1,5 verticalement et un bond de nourriture de 5 pixels. Taille 1,3 et rayon de sélection 27 pixels écran conservés.
- Prairie moins quadrillée : nuances et plaques végétales, fleurs déterministes, liseré et ombre légère. Plantes éloignées des bâtiments.
- Habitats aux proportions communes : sol en relief, bordures et repères de niveau. Paille : botte et épis ; neige : congères/cristaux ; terre : terrier/pierres ; feu : galets lumineux/fleurs chaudes ; métal : dallage/bornes ; vol : nuages/rubans.
- Noms sur cartouches arrondis, panneaux et boutons conservés. Dessins vectoriels originaux dans `src/display/habitatArt.ts`, sans dépendance ni asset externe.

Projection, zoom 1,05 et limites 0,8–1,65, recentrage et identité des espèces inchangés. Économie, probabilités et horloges inchangées. Le décor est indépendant des tirages de reproduction. Des ailes peuvent se recouvrir légèrement à sept ; les visages et cibles restent distincts.

## Vérifications exécutées

| Vérification | Résultat |
|---|---|
| Référence avant modifications | 361 tests / 9 fichiers, TypeScript et build réussis |
| Version finale | **369 tests / 10 fichiers réussis**, aucun échec ni test ignoré |
| Nouveaux tests | 8 : sélection cinq/sept, animation/nourriture aux extrêmes, profondeur et noms dégagés |
| TypeScript strict | Réussi, seul et dans le build |
| Build final | Réussi, 47 modules ; JS 1 364,65 ko / gzip 379,48 ko ; CSS 6,91 ko |
| Avertissement Phaser | Taille du bundle, non bloquant |
| Vite | Version visuelle démarrée sur 5175, réponses HTTP vérifiées |
| Chromium réel | Prairie rendue, six spécialisés et universel niveau 3 avec sept occupants |
| Clics canvas | Sept occupants aux zooms 0,8 / 1,05 / 1,65 : **21/21**, avant et après |
| Panneaux | Boutique et Missions ; panneau contenu dans le viewport paysage |
| Console/réseau | Aucune erreur ni requête échouée dans les parcours |
| Persistance en mode test | Nourriture par contrôleur, affection 4→5 écrite puis conservée au rechargement ; aucune sauvegarde normale créée |
| Build en navigateur | Partie initiale v4 affichée, aucune erreur ; `?dev=1` ne crée pas de mode test en production |
| Safari sur iPhone physique | Retour général reçu : « tout fonctionne bien pendant mon essai » ; scénarios détaillés non communiqués |

Contextes navigateur jetables, sauvegarde de développement uniquement. Captures ordinateur **1500×700** et paysage mobile **852×393**. Les scènes sont figées pour les captures/clics comparables ; les cibles pendant l'animation sont couvertes par les tests. Ces résultats ne valident pas Safari ni les gestes physiques.

Helper reproductible : `docs/visual-browser-check.cjs`, avec Playwright et Chromium disponibles dans le cloud sans modification du lockfile. Il exécute également une nourriture via le contrôleur, vérifie la sauvegarde de développement écrite, puis la retrouve après rechargement ; aucune clé de partie normale créée.

```bash
PRAIRIE_TEST_URL='http://127.0.0.1:5175/?dev=1' node docs/visual-browser-check.cjs after
```

Captures et rapports sous `/workspace/artifacts/prairie-visual/` : `before-desktop.png`, `after-desktop.png`, `before-mobile-seven.png`, `after-mobile-seven.png`, variantes habitats/boutique et rapports JSON. La référence avant provient d'une copie temporaire de la révision Git originale ; les modifications en cours n'ont pas été effacées. Sortie configurable par `PRAIRIE_CAPTURE_DIR`.

## Version accessible et lancement

L'adresse fournie, `http://192.168.1.13:5173/?dev=1`, est un **serveur Vite sur le réseau local du joueur**, en mode de test séparé. Elle ne révèle pas le dossier lancé sur Windows. Lors de cette passe visuelle précédente, aucun hébergeur, workflow de déploiement ou URL publique n’était encore configuré dans le dépôt. Les builds statiques ne constituent pas une publication du jeu. La publication de l'environnement Codex prépare les tâches futures ; elle ne publie pas le site. Aucun site public remplacé, aucun aperçu cloud partageable disponible ici. Pas de PWA ni de promesse de fonctionnement hors connexion.

Sous Windows, ouvrir un terminal dans **`prairie-lapins-prototype`** :

```bash
npm ci
npm run dev -- --host 0.0.0.0 --port 5175 --strictPort
```

Sur l'iPhone du même Wi-Fi : adresse **Network** avec `?dev=1`. Si Windows conserve `192.168.1.13`, la nouvelle version utilise **5175**. La session actuelle sur 5173 reste distincte. Scénario facultatif : `docs/test-saves/visual-ready-v4.json`, à importer seulement après vérification du badge Mode test. Guide : [parcours iPhone](visual-iphone-test.md).

Compilation sans écraser le dist versionné :

```bash
npm run build -- --outDir ../build-visual
```

Build cloud vérifié sous `/workspace/project-l-build/habitats-visual`. Un aperçu de production n'active pas `?dev=1` ; les outils de développement sont exclus du bundle.

Archive de cette passe : `/workspace/artifacts/prairie-lapins-visuel-v4.zip`, avec sources, tests, documents, scénario, build final et captures dans `validation/`. L'archive historique du dépôt n'a pas été remplacée. Les champs cloud `install_script` et `start_skill` ont été enregistrés dans un nouveau brouillon pour cibler le bon dossier et le port 5175 ; ce brouillon ne publie ni l'environnement ni le jeu. Sa revue/enregistrement/publication se fait dans les paramètres de l'environnement.

## Sauvegardes et suite

JSON **v4** et clés inchangés, aucune migration supplémentaire ni redotation. Les v4 restent compatibles ; l'ancienne version v3 ne lit pas les v4. Changer de protocole, domaine ou port impose un export/import volontaire : garder l'export original. Aucun scénario chargé automatiquement dans une partie normale.

Prochaine étape : essai iPhone de cette passe (habitats, sept sélections, gestes/recentrage, panneaux, améliorations et extension), puis export/import et reprise. Recueillir le retour avant d'élargir l'illustration ou d'ajouter du contenu. Missions, nouvelles rares et dépenses de cœurs restent aussi à valider sur appareil.

Bilans historiques : [habitats, 361 tests](history/progress-habitats-v4.md) et [missions, 230 tests](history/progress-missions-v3.md).
