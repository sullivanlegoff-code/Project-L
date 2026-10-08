# Comptes en pause — future prise en charge des sauvegardes v5

La prévisualisation Décorations est locale et séparée. La branche `feature/private-cloud-saves`, sa PR en brouillon et son build publié v4 sont préservés. Aucun SQL Supabase, email, template, compte ou migration hébergée modifié dans le chantier Décorations.

La confirmation d’exécution SQL avait été reçue auparavant ; la connexion email et la synchronisation authentifiée restent non validées et en pause. Le quota SMTP intégré de 2 emails/heure n’est pas un préalable au chantier d’aménagement.

Le lecteur v4 des comptes **ne peut pas accepter un fichier v5**. Conserver le JSON v5 entier et refuser proprement un serveur/client incompatible ; ne jamais changer seulement son numéro en 4, supprimer les objets, ni migrer automatiquement une sauvegarde normale depuis une prévisualisation.

Avant une future intégration :

- Porter types, commandes, validateur strict et migrations v1–v4 → v5 dans le client des comptes. Vérifier identifiants, emplacements et collisions avec les mêmes règles que le jeu local.
- Adapter explicitement les enveloppes versionnées, empreintes de comparaison, import/export, cache par propriétaire, file d’attente et checkpoints à v5. Une référence déplacée et une décoration posée/rangée doivent compter comme changements ; aucune exclusion des objets lors d’un calcul d’empreinte.
- Préparer, relire et appliquer **dans un chantier distinct** une migration serveur pour les versions de payload admises, le schéma/validateur et les RPC. Conserver ownership/RLS, CAS, idempotence, historique/rétention et refus des écritures obsolètes. Ne pas présumer qu’un stockage JSONB suffit si les gardes RPC imposent v4.
- Migrer une sauvegarde v4 en v5 seulement avec secours/checkpoint récupérable et transition coordonnée des clients et du backend. Protéger les clients v4 encore ouverts contre l’écrasement d’une progression v5 ; prévoir leur message de mise à jour et le retour arrière.
- Réexécuter les tests PostgreSQL de droits, isolation, CAS, reprise, checkpoints, historique et migration ; vérifier avec deux comptes de test une synchronisation v5 réellement authentifiée et la conservation de tous les objets après conflits et reconnexions.
- Maintenir le laboratoire et toutes les prévisualisations avec services en ligne désactivés par défaut. Aucun partage de session, cache, horloge ou sauvegarde avec la partie normale.

L’intégration en production nécessite également le retour visuel Safari du joueur, les vérifications de migration sur copies représentatives et un plan de récupération. Le mode Décorations reste une prévisualisation en attendant cette décision.
