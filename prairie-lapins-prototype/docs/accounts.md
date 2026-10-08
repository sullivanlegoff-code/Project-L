# Comptes et sauvegardes privées — prévisualisation

**Jeu conservé : https://sullivanlegoff-code.github.io/Project-L/**

**Prévisualisation préparée : https://sullivanlegoff-code.github.io/Project-L/preview/accounts/**. Sa publication est distincte de l'activation de Supabase. Sans configuration valide, elle annonce « Invité — enregistré sur cet appareil uniquement » et l'indisponibilité des comptes ; aucun client Supabase n'est initialisé. Elle n'est pas une sauvegarde de votre partie normale.

Sources : branche `feature/private-cloud-saves`, issue de `production` `1747ea6`. Le laboratoire `/dev/` garde ses outils et son interdiction d'accès aux services de comptes. Le jeu normal publié reste celui d'avant les comptes jusqu'à la validation hébergée. Chaque route possède `build-revision.txt` et sa version dans les paramètres.

## Utilisation après activation du backend de test

Dans Paramètres → Compte et sauvegarde : entrer l'email autorisé, **Recevoir un code**, lire l'email puis **Valider le code**. Supabase crée le compte si nécessaire et attribue l'UUID propriétaire. Ni mot de passe maison, ni identité déduite d'une adresse saisie.

La lecture distante réussit et l'état v4 est validé avant tout envoi. Première connexion : aucune partie remplacée automatiquement. Choisir **Conserver et transférer la partie locale**, **Commencer une nouvelle partie**, ou **Charger la partie en ligne** si elle existe, avec confirmation et résumés pattes/herbes/cœurs/lapins/espèces. Une nouvelle installation initiale ne remplace pas automatiquement une partie avancée. Pas de fusion.

Pour tester une copie de votre partie actuelle : exporter un JSON dans Fichiers depuis le **jeu normal**, puis importer explicitement ce fichier dans la **prévisualisation**, avec confirmation. La source normale reste intacte. Ne faire cela qu'après les essais avec comptes et états fictifs ; conserver le JSON indépendant. Les exports de prévisualisation portent `PREVISUALISATION`, ceux du laboratoire `MODE-TEST` ; le contenu reste le format v4 habituel.

Actions sauvegardées immédiatement localement. Écritures regroupées après 2,5 secondes, sans attendre la fermeture. Progression passive de revenu/horloge seule ne provoque pas une écriture toutes les cinq secondes ; elle est reconstruite par la simulation depuis l'état synchronisé. Les mutations de progression, cadeaux, missions et jobs déclenchent un envoi. Retries réseau à 3/6/12/24/30 secondes, puis au retour visible/événement online ou via Réessayer ; chaque reprise relit le serveur avant d'autoriser un envoi.

**« Synchronisé en ligne » nécessite un accusé valide du serveur ou une relecture validée de la révision connue**. « Enregistré sur cet appareil » / « En attente » n'est pas une confirmation distante. Chaque envoi durable contient UUID, révision attendue, opération unique et état v4. Le serveur sérialise par propriétaire, contrôle la révision, attribue date/révision et déduplique les répétitions. Réponse perdue : l'envoi est repris, sans nouvelle dotation ni double récompense.

Conflit : conserver les deux versions, arrêter les écritures, afficher leurs résumés ; charger la distante ou remplacer après confirmation et point de secours. Une révision remplacée reste aussi dans les 20 dernières révisions. Import, restauration et remise à zéro connectés protègent l'état précédent avant remplacement ; si le stockage local du point échoue, l'opération est refusée. La restauration devient une **nouvelle** révision, et passe par le contrôleur/simulation existants.

Déconnexion : les caches et envois en attente restent par UUID/projet ; retour à la partie invitée séparée. Les opérations tardives de l'ancienne identité sont invalidées. Le RPC reçoit aussi le propriétaire attendu pour refuser un jeton d'un autre compte arrivé entre deux opérations. Les lectures de fichiers d'import sont invalidées lorsqu'on change de stockage. L'effacement de la session est signalé s'il échoue ; ne pas partager l'appareil dans ce cas.

## Architecture et stockage

- Invité normal : clé historique `prairie-lapins.save.v1`, backups v2/v3/v4 et préférences inchangés.
- Auth normale : `prairie-lapins.normal-auth.v1.<projet>`, gérée par Supabase et le stockage fourni, jamais supprimée par le laboratoire.
- Comptes : `prairie-lapins.backend.<projet>.prairie-lapins.account.<UUID>.` préfixe toutes les clés de partie et backups. `sync.v1` contient révision connue, empreinte, date confirmée, marqueur de choix interrompu, points et envoi durable.
- Prévisualisation : préfixe additionnel `prairie-lapins.preview.accounts.` pour invité, préférences, auth, comptes et backups. Aucun accès/repli vers la partie normale.
- Laboratoire : `prairie-lapins.development.` inchangé ; `SaveStorage.scope`, `GameController.storageScope`, `sessionPolicy(true)` et suppression du module de comptes au build empêchent l'initialisation du SDK et les appels. Ce préfixe est une prévention des mélanges, **pas une séparation de sécurité** entre scripts d'une même origine.

Les états locaux et métadonnées sont validés ; réponse manquante/malformée, état incompatible ou ancien compte connu sans ligne distante suspendent l'envoi et demandent une intervention. Une ligne distante réellement absente après une lecture réussie autorise uniquement le choix explicite initial. Les fonctions serveur vérifient `auth.uid()` ; SELECT RLS pour états/historique, aucun accès anonyme, aucune écriture directe depuis le client. Fonction SECURITY DEFINER dans un schéma privé non exposé ; wrapper public SECURITY INVOKER réservé à authenticated. Aucune clé d'administration ou données personnelles dans Git.

Rétention : union **20 révisions + 7 points quotidiens sur jours actifs UTC + 20 secours explicites**, au plus 47 états historiques ; 64 reçus/empreintes d'opérations, paramètres bornés en base. Les points quotidiens plus anciens peuvent rester s'ils font partie des 20 révisions récentes. Voir [backend/README.md](../backend/README.md) pour configuration, quotas, SMTP et limites. L'historique dépend du même service ; le JSON exporté dans Fichiers reste votre secours indépendant.

Pas de PWA ni promesse de démarrage hors connexion. Une interruption pendant une page chargée conserve les actions locales. Free ne garantit ni conservation totale, ni uptime, ni livraison des emails. Le serveur ne valide pas autoritairement toutes les règles d'un jeu compétitif ; le propriétaire pourrait altérer sa propre partie. Le client valide intégralement les états v4 avant envoi/lecture.

## Validation réalisée et restante

**414 tests dans 15 fichiers**, TypeScript, builds normal/laboratoire/prévisualisation. Les 381 tests existants restent réussis. PostgreSQL réel embarqué PGlite : accès anonyme/direct/UUID forgé, isolation de deux propriétaires et historique, CAS, idempotence, état invalide, checkpoint immuable, limite 64 reçus, 20 secours, 7 jours actifs et garde futur format. Machine de synchronisation : transfert volontaire, partie avancée, délai, coupure/réponse perdue, mutations pendant envoi, conflits, choix confirmé, session expirée, résultats tardifs d'ancien compte, imports/restaurations sans nouveaux cœurs, quota local. SDK/panneau : OTP, messages, contrôles réseau, absence de client non configuré et laboratoire ; passerelle : réponses vides/invalides, UUID et accusés incohérents.

Chromium sur serveur statique : les huit contrôles normaux et les sept groupes laboratoire passent, sans erreur de console/réseau. Contrôle spécifique de prévisualisation : transfert JSON volontaire, export identifié, progression séparée, retour normal, marqueur d'auth préservé lors du reset laboratoire et aucun appel de compte sans configuration. Ce n'est pas Safari physique ni une connexion hébergée réelle.

**Restent bloqués par l'absence d'un projet/compte Supabase accessible** : vrai email reçu/vérifié, JWT/API gérés, permissions via l'hébergement réel, reprise authentifiée dans un second navigateur et parcours iPhone des comptes. Aucun compte/sauvegarde en ligne n'est annoncé actif. Préparation détaillée : [configuration du backend](../backend/README.md).

## Parcours iPhone après configuration et tests hébergés

1. Jeu normal : exporter dans Fichiers et conserver cette copie. Ouvrir la prévisualisation, vérifier le bandeau et importer une **copie de test**.
2. Paramètres : demander puis saisir le code de l'adresse autorisée ; confirmer le transfert local et attendre **Synchronisé en ligne**.
3. Effectuer une action, attendre la nouvelle confirmation serveur ; ouvrir la prévisualisation dans un second navigateur/contexte, se connecter au même compte et choisir **Charger la partie en ligne**.
4. Modifier dans les deux contextes : vérifier le conflit et annuler d'abord le remplacement ; restaurer ensuite un point après confirmation.
5. Revenir au jeu normal et au laboratoire : la partie normale demeure intacte, le reset du laboratoire conserve la session normale. Garder le JSON dans Fichiers.

## Construire, publier et revenir en arrière

`npm ci`, `npm test`, `npm run typecheck`, `npm run build:pages -- /tmp/prairie-pages`, `npm run build:account-preview -- --outDir /tmp/prairie-pages/preview/accounts`. `VITE_BUILD_REVISION` injecte le SHA source ; la configuration publique vient des variables décrites dans le guide backend. Ne jamais committer un `.env` contenant des valeurs réelles ; `.env.example` est seulement un modèle.

L'artefact Pages unique doit réunir **jeu stable, laboratoire stable et prévisualisation issue d'un SHA dédié figé**. Une publication indépendante de preview supprimerait les autres routes : interdite. Le workflow stable doit tester le SHA de preview, construire chaque base, puis uploader l'ensemble. Conserver cet ajout dans les futurs workflows pour que normal/lab ne suppriment pas la preview. Le retrait de la preview consiste à enlever sa construction du workflow, sans modifier les clés du jeu normal. Revenir au commit `1747ea6` conserve v4/partie normale et laboratoire mais retire la route de preview. Les caches de comptes restent sans être repris automatiquement par un ancien client invité ; exporter avant toute rétrogradation d'un client connecté.
