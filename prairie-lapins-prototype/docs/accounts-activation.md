# Activation guidée — 9 octobre 2026

Le propriétaire confirme qu'il n'a pas encore créé de projet Supabase. Le jeu normal reste à **166700f**, la preview à **608f49a** ; son build publié n'a aucune configuration Supabase. Aucun compte en ligne n'est annoncé fonctionnel.

Effectuer les étapes une à une. Ne pas utiliser de sauvegarde personnelle pendant les premiers essais. Ne partager aucun mot de passe, clé d'administration, jeton de session ou identifiant SMTP dans la conversation.

## 1. Créer le projet de test

Ouvrir https://supabase.com/dashboard et se connecter/créer son compte. Choisir **New project**. Si nécessaire créer une organisation via **New organization** : Name `Prairie de lapins`, Plan **Free**. Ne pas sélectionner Pro ni option payante.

Dans le formulaire **Create a new project** :

- **Organization** : l'organisation Free choisie.
- **Project name / Name** : `prairie-lapins-test`.
- **Database Password** : utiliser **Generate a password** si proposé ; l'enregistrer dans un gestionnaire. C'est un secret, uniquement pour Supabase, jamais pour GitHub Variables ou le navigateur.
- **Region** : une région européenne proche, par exemple Europe / Frankfurt si disponible.

Cliquer **Create new project**, attendre que le tableau de bord du projet soit prêt et que la base soit opérationnelle. Si l'offre Free refuse un troisième projet, ne pas supprimer de projet ni accepter de formule payante : signaler cette limite et conserver le jeu actuel. Une organisation Free permet deux projets actifs au total selon les rôles propriétaire/admin.

Vérification : le tableau de bord affiche `prairie-lapins-test` et permet d'ouvrir **SQL Editor**. Aucun code SQL n'est nécessaire à cette première étape.

## 2. Installer le SQL exact

Projet de test → **SQL Editor → New query**. Ouvrir [le fichier SQL figé utilisé par la preview](https://github.com/sullivanlegoff-code/Project-L/blob/608f49a473fc1e275414119dd041d3dbdee6aeb0/prairie-lapins-prototype/backend/migrations/001_private_saves.sql), puis **Raw** et copier le fichier en entier. Coller dans l'éditeur SQL Supabase et **Run**, une seule fois sur le projet neuf. Ne pas utiliser un ancien projet contenant des données sans examiner son schéma.

Vérification : exécution réussie ; **Table Editor**, schéma `public`, contient `prairie_saves` et `prairie_history`. Le schéma `prairie_private` reste privé : ne pas l'ajouter à la liste des schémas exposés de la Data API. Si une erreur apparaît, transmettre uniquement le message d'erreur expurgé de toute valeur personnelle ; ne pas relancer aveuglément un script déjà installé.

## 3. Activer les codes email

**Authentication → Sign In / Providers → Email** : activer le fournisseur Email et autoriser les inscriptions. **Authentication → Email Templates → Magic Link** : garder un objet reconnaissable, remplacer le contenu par `<p>Votre code Prairie de lapins : {{ .Token }}</p>`, puis enregistrer. La variable Token est nécessaire : le template par défaut envoie un lien au lieu du code numérique attendu.

**Authentication → URL Configuration → Site URL** : `https://sullivanlegoff-code.github.io/Project-L/preview/accounts/`, enregistrer. Vérifier les réglages de validité, cooldown et longueur du code (client 6–10 chiffres). Les menus exacts peuvent évoluer ; les fonctions et template sont confirmés dans [la documentation officielle OTP](https://supabase.com/docs/guides/auth/auth-email-passwordless).

Vérification : le modèle enregistré contient `{{ .Token }}`. Le code réel ne sera demandé qu'après la reconstruction de la preview.

## 4. Vérifier qui peut recevoir un email

**Organization Settings → Team** : vérifier quelle adresse figure pour votre compte propriétaire. Le premier essai peut utiliser **cette adresse d'équipe**. Si vous vous êtes connecté via GitHub, ne pas supposer que toutes vos autres adresses sont autorisées : vérifier l'adresse réellement affichée.

Sans SMTP personnalisé, Supabase Auth refuse les adresses extérieures à l'équipe ; quota très bas/variable, pas de garantie de livraison. Cela ne constitue pas une ouverture aux joueurs. Ne pas ajouter des joueurs comme administrateurs pour contourner la restriction. Un second compte de test doit appartenir à une personne/adresse de test autorisée ; son usage et les permissions doivent être validés avant ouverture.

Pour ouvrir à d'autres adresses : **Authentication → SMTP Settings**, fournisseur SMTP adapté, expéditeur validé, host/port/user/password saisis **uniquement dans Supabase**. Le choix d'un fournisseur/expéditeur existant sera traité séparément ; aucun abonnement ou domaine acheté. Ne pas demander un mot de passe email dans la conversation. [Documentation officielle actuelle](https://supabase.com/docs/guides/auth/auth-smtp).

Vérification réelle attendue : un code arrive dans la boîte de l'adresse autorisée et est accepté. Le propriétaire consulte lui-même sa boîte ; l'IA n'y accède pas.

## 5. Ajouter les deux valeurs publiques dans GitHub

Supabase → **Connect / Project Settings** : relever **Project URL**, de forme `https://<projet>.supabase.co`. **Project Settings → API Keys** : relever seulement la clé **Publishable key**, `sb_publishable_…`. Ces deux valeurs sont publiques. Ne pas utiliser `sb_secret_`, `service_role`, mot de passe de base, SMTP ou token de session.

GitHub → dépôt **Project-L → Settings → Secrets and variables → Actions → Variables → New repository variable** :

- Name `PRAIRIE_PREVIEW_SUPABASE_URL`, Value l'URL publique.
- Name `PRAIRIE_PREVIEW_SUPABASE_PUBLISHABLE_KEY`, Value la clé publishable.

Enregistrer les deux. L'intégration actuelle reçoit HTTP 403 sur leur administration : le propriétaire effectue ces clics. Vérification : les deux noms apparaissent dans **Repository variables**. Ne pas envoyer une capture contenant d'autres secrets.

## 6. Reconstruire et vérifier réellement

GitHub → **Actions → Publier Prairie de lapins → Run workflow → Branch production → Run workflow**. Cette relance construit ensemble jeu stable, laboratoire et preview ; seules les deux variables de preview sont injectées dans celle-ci.

Vérification : jobs Build/Deploy verts, puis ouvrir la preview ; Paramètres affiche les champs Email/Code. C'est seulement une preuve de configuration du client, pas encore une preuve de sauvegarde en ligne. L'IA peut contrôler le nouveau build et les accès anonymes une fois publié.

Les essais de code/session sont effectués avec l'adresse autorisée et une partie fictive. Ne pas communiquer de code/token de session dans un rapport public. Préparer deux contextes de navigateur, puis confirmer : transfert choisi, reçu serveur, progression identique après seconde connexion, action, historique/restauration, coupure/reprise, conflit, déconnexion/changement d'identité. Tester directement les permissions hébergées entre deux comptes autorisés et en anonyme. Rien n'est annoncé validé par simple présence des boutons.

## Passage au jeu normal

Choix prévu : **un projet de test pour la preview et un projet distinct pour le jeu normal**, tous deux Free si les quotas le permettent. Le second projet sera configuré et testé avant publication des comptes normaux. Même email ne signifie pas même UUID entre deux projets : le compte normal est créé/reconnecté séparément, et les sessions locales ne migrent pas.

Les parties et comptes de preview restent conservés sur le projet de test. Pour récupérer volontairement une progression de preview : export JSON, garder la copie, connexion au jeu normal, import confirmé avec secours. Aucun historique ni session transféré automatiquement. Pour garder la vraie partie invitée normale : export dans Fichiers avant activation, puis connexion normale et choix explicite **Conserver et transférer la partie locale**. Jamais de copie/fusion du laboratoire. L'activation normale attend toutes les validations du backend destiné à la production.

L'historique dépend du même service ; un export JSON dans Fichiers apporte un secours indépendant. Pas de garantie d'absence totale de perte, pas de nouvelle fonctionnalité de jeu pendant cette activation. Après finalisation uniquement : chantier proposé d'aménagement/personnalisation, décorations intérieures et extérieures.
