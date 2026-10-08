# Pause des emails et contrôle hébergé anonyme

9 octobre 2026 : propriétaire confirme correction de Site URL/Redirect URLs, puis nouvelle demande refusée par limite d’envoi/fréquence. Interface jusque-là regroupait ces causes ; message de quota email séparé du cooldown générique, avec wording lien plutôt que code. Quota exact confirmé par le propriétaire dans Authentication → Rate Limits : **2 emails/heure** pour le projet. Pause proposée d’une heure sans nouvelles demandes, sans changer de réglage. Aucun nouvel email automatiquement envoyé.

Contrôle hébergé anonyme préparé pour GitHub Actions, car le cloud direct reste bloqué au proxy : Auth settings, SELECT état/historique refusés, RPC/INSERT anonymes refusés, schéma privé non exposé. Corps d’INSERT volontairement invalide et sans partie réelle ; aucun email, secret admin ou session utilisés. Ces tests ne prouvent pas les permissions entre deux propriétaires ni une synchronisation authentifiée. Production normale conserve son code de jeu ; aucun compte normal activé. Workflow de contrôle hébergé [37856320968](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37856320968), révision de publication `45323cb`, preview figée `3e70d9e` ; résultat à vérifier avant de déclarer ces contrôles réussis.

# Lien neuf également refusé — diagnostic Auth nécessaire

9 octobre 2026 : propriétaire rapporte de nouveau `403 / otp_expired` après le nouvel essai demandé. Sa question sur une partie initiale est clarifiée : l’authentification Supabase vérifie le lien avant le retour au jeu, indépendamment de la sauvegarde locale. Aucun troisième envoi demandé. Prochaine étape de diagnostic : journaux Auth hébergés `/logs/auth-logs`, ne recueillir que méthode/chemin sans paramètres, statut et message, jamais token/lien complet. Préchargement du lien par la messagerie reste une hypothèse, pas une cause confirmée. Connexion et sauvegarde distante toujours non validées ; aucune intégration normale.

# Premier email reçu, lien refusé

9 octobre 2026 : propriétaire confirme réception de l’email réel. À l’ouverture, réponse Supabase `403 / otp_expired` : lien invalide ou expiré. La réception est confirmée par le retour utilisateur ; **session, sauvegarde distante et reprise toujours non validées**. Aucun lien/token transmis ni stocké. Documentation officielle consultée : auth-email-templates, section Email prefetching ; un scanner peut consommer un lien à usage unique, mais cette cause n’est pas établie pour cet essai. Prochain diagnostic : une nouvelle demande après cooldown, ouvrir uniquement le dernier lien une fois dans le navigateur du jeu, puis examiner les logs Auth expurgés si le même refus persiste. Aucun changement de SQL ou de sauvegarde, aucune annonce d’activation normale.

# Variables de preview actives — premier email à tester

9 octobre 2026 : le propriétaire confirme les deux variables publiques GitHub ajoutées. Relance automatique du [workflow 37853991358](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37853991358), Build/Deploy réussis. Contrôle des scripts réellement servis : URL du bon projet et clé publishable présentes dans la preview `df864e1`, bouton d’e-mail de connexion préparé. Aucune valeur de clé ni sauvegarde personnelle publiée dans ce suivi. Jeu normal/laboratoire restent `51e752d`, sans client de comptes.

Contrôle du backend depuis le cloud bloqué par le proxy (CONNECT 403 pour le nouveau domaine du projet). Ajout ciblé de `vadypvfzyopugcjeprqo.supabase.co` au brouillon de réseau, en préservant les trois domaines existants et les presets. Sauvegarde du brouillon confirmée, `requires_publish=true` : pas encore de preuve d’application à l’instance. Le propriétaire doit enregistrer/publier l’environnement cloud pour les vérifications automatisées du backend. L’essai dans son navigateur reste indépendant de ce blocage.

Statut réel : projet/SQL/Email/URL/Team renseignés selon les retours utilisateur, configuration publique du build **vérifiée**. Réception du lien, session authentifiée, accès RLS hébergés, enregistrement distant et deuxième navigateur **pas encore vérifiés**. Prochaine action : preview → Paramètres → saisir l’adresse autorisée de l’équipe → Recevoir un e-mail de connexion ; le propriétaire consulte lui-même sa boîte. Aucun accès à la boîte mail ni demande de secret.

# Adaptation au template email intégré

9 octobre 2026 : propriétaire confirme **projet prêt**, **SQL réussi** et Email activé. Il signale que le dashboard exige un SMTP personnalisé pour éditer Magic Link. Instructions corrigées : lien par défaut traité par le SDK officiel ; code numérique toujours possible ultérieurement avec SMTP/template. Aucun abonnement ou domaine demandé. Site URL/redirect, variables, reconstruction et email réel restent à configurer/vérifier. SQL réussi est un retour utilisateur, pas une vérification des permissions hébergées. Aucune donnée personnelle ou secret collecté. Sources mises à jour `df864e1` : **415 tests** et TypeScript réussis, preview construite et isolation/import/export/reset vérifiés dans Chromium local ; publication stable `51e752d` épinglant uniquement ces sources pour la preview. Aucun test email réel encore effectué.

# Activation des comptes — contrôle du 9 octobre 2026

Retour exact du joueur : les essais effectués fonctionnent, **sans preuve de connexion réelle ou de configuration Supabase**. Réponse explicite le 9 octobre : **aucun projet Supabase encore créé**.

Vérification effective : `production` toujours `166700f`, PR nº1 ouverte en brouillon, sources `feature/private-cloud-saves` `e7874b8` avant cette mise à jour documentaire ; preview toujours figée sur `608f49a`. Analyse des scripts réellement servis : aucune URL de projet Supabase ni clé publishable injectée dans la preview. Aucun nouveau déploiement de production observé. Administration des variables GitHub toujours refusée à l'intégration (HTTP 403) : présence de variables non inspectable par API, mais configuration absente du build publié. Aucun secret ni contenu personnel collecté.

Statut : projet absent confirmé par le propriétaire ; schéma/fonctions hébergés non installés puisque projet à créer ; configuration publique absente du build ; aucun email réel/session/distante/seconde connexion vérifiés. Les 414 tests de la livraison précédente ne sont pas présentés comme nouveaux tests hébergés. Aucun changement de code ni publication de comptes en production pendant cette préparation.

Prochaine action guidée : créer **prairie-lapins-test** dans une organisation Free, garder le mot de passe uniquement dans un gestionnaire et attendre que le projet soit prêt. Puis SQL exact, OTP, contrôle de l'adresse de l'équipe autorisée, variables publiques et reconstruction, une étape à la fois. [Accompagnement pas à pas](accounts-activation.md).

Passage prévu : **projet de test distinct du futur projet de production**, dans la limite des deux projets Free disponibles. Les comptes/sessions/parties de preview restent sur le projet de test ; aucune copie automatique. Une progression à conserver sera exportée puis importée volontairement après connexion au nouveau projet de production. La partie invitée normale et le laboratoire restent inchangés ; les services de comptes restent interdits au laboratoire. Le second projet sera aussi validé avant activation normale. Aucun abonnement, domaine ou destruction autorisés automatiquement.

# Comptes privés — prévisualisation, activation externe en attente

8 octobre 2026. Retour humain exact : **jeu normal et laboratoire fonctionnent pendant l’essai iPhone** ; aucun scénario supplémentaire déduit. Production de départ `1747ea6` conservée. Travail sur `feature/private-cloud-saves`. Supabase Free choisi après lecture des documents officiels ; aucune intégration/clé/compte Supabase ou SMTP accessible. Variables GitHub Actions : administration refusée à l’intégration (HTTP 403), saisie des deux valeurs publiques par le propriétaire nécessaire.

Client OTP officiel, choix initial explicite, cache par compte/projet et preview, simulation/contrôleur conservés, CAS SQL serveur, horodatage serveur, envoi durable/idempotent, reprise, conflits, invalidation des anciens comptes, garde avant import/reset/restauration, historique borné et exports v4 indépendants. SDK complètement absent du laboratoire compilé ; stockage normal, horloge de test, migrations et règles préservés. L’absence de configuration affiche honnêtement un mode invité local sans boutons de connexion.

Validation : **414 tests / 15 fichiers**, TypeScript et builds normal, laboratoire et prévisualisation. PostgreSQL embarqué réel : permissions RLS/RPC, propriétaires, CAS/rejeu, invalides, format futur et rétention. Ces essais ne sont pas des tests du Supabase hébergé. Parcours Chromium statique : huit contrôles normaux et sept groupes laboratoire réussis sans erreur ; isolation preview/auth/reset testée séparément. Connexion réelle par email, API/JWT hébergés, seconde connexion réelle et Safari comptes restent à vérifier après configuration.

[Guide et parcours iPhone](accounts.md) ; [SQL et manipulations exactes](../backend/README.md). Ne pas annoncer la protection en ligne ni fusionner le client de comptes en production avant les vérifications hébergées. La prévisualisation peut être publiée séparément, dans le même artefact conservant jeu normal/laboratoire.

# Consolidation et première passe visuelle — 8 octobre 2026

## Prévisualisation publiée et HTTPS contrôlé

Déploiement [37817000453](https://github.com/sullivanlegoff-code/Project-L/actions/runs/37817000453) réussi. Jeu normal et laboratoire : révision **166700f**, sources de jeu de **1747ea6** conservées ; seules publication et documentation changent. Preview : source figée **608f49a**, à [l’adresse publique séparée](https://sullivanlegoff-code.github.io/Project-L/preview/accounts/). Les trois `build-revision.txt` répondent 200 et portent ces SHA exacts. Un seul artefact contient les trois routes ; les variables Supabase publiques ne concernent que la preview. `production` n’intègre ni SDK ni client de comptes.

Trois parcours Chromium sur les adresses réelles ont réussi : huit contrôles normaux, sept groupes laboratoire et deux groupes preview/auth/isolation. Aucune erreur JavaScript, requête de compte ou modification de la clé témoin de session normale durant les opérations de preview/laboratoire ; imports/exports volontaires et rechargements conservés. Les profils sont jetables et les sauvegardes fictives. Rapports locaux : `/workspace/artifacts/accounts-normal-https/`, `/workspace/artifacts/accounts-laboratory-https/`, `/workspace/artifacts/accounts-preview-https/`. TLS validé par curl ; Chromium utilise uniquement une empreinte temporaire du certificat du site derrière le proxy, sans ajout au magasin de confiance. Pas d’essai Safari physique de cette fonctionnalité ni de compte Supabase réel. Les comptes restent inactifs, avec information de stockage local explicite.

[Brouillon de PR nº1](https://github.com/sullivanlegoff-code/Project-L/pull/1) pour revue ; ne pas fusionner le client de comptes avant configuration et essais hébergés. Cette branche reprend les changements de publication de production pour éviter un conflit de revue, sans déployer le client normal expérimental. Retour complet avant preview : `1747ea6` ; retour au déploiement incluant preview : `166700f`.

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
