# Bélier Gris, Feu et Volant — chantier en attente de la source Volant

Base : dernier `production` `e455986`, application publiée `5248235`. Neige, Paille et Terre sont validés sur iPhone par le joueur ; leurs fichiers, paramètres d’échelle et ancrage restent inchangés.

Bélier Gris et Feu sont préparés et intégrés dans cette branche de travail. Chaque espèce réutilise la méthode des originaux déjà validés : texture préchargée une seule fois, image entière sans déformation, même PNG dans habitats et portraits, ancrage au sol `(0.5, 1)` à `y = 12`, sélection par son masque alpha. Les noms des portraits proviennent désormais du catalogue `SPECIES`, ce qui permet d’étendre le registre sans maintenir une liste de trois noms. Aucun changement aux règles, sauvegardes, caméra, île, habitats ou décorations ; autres designs et Supabase conservés en l’état.

| Espèce | Source conservée | Asset | Dimensions | Largeur monde |
| --- | --- | --- | --- | --- |
| Bélier Gris | [source](reference/belier-gris/source.png) | [PNG](../public/assets/rabbits/belier-gris/belier-gris-v1.png) | 527 × 488 | 48 |
| Feu | [source](reference/feu/source.png) | [PNG](../public/assets/rabbits/feu/feu-v1.png) | 1004 × 827 | 50 |

[Préparation reproductible](reference/prepare-belier-feu.sh), ImageMagick 7 : retrait du fond connecté, masque alpha nettoyé, marge transparente de quatre pixels, RGB opaques conservés. Pointes des moustaches du Bélier préservées hors du museau pour éviter leur suppression par l’érosion. Le bandeau gris du fond s’arrête avant le corps et est retiré. [Comparaison des pixels](validation/belier-feu-v1/pixel-fidelity.json) : différence RGB maximale **0** sur 141 564 pixels opaques du Bélier et 539 351 de Feu.

Comparaisons : original à gauche, capture réelle de la fiche à droite, agrandie uniformément depuis son format 150 × 140 : [Bélier Gris](validation/belier-feu-v1/belier-gris-reference-vs-game.png), [Feu](validation/belier-feu-v1/feu-reference-vs-game.png). [Sept occupants mixtes](validation/belier-feu-v1/seven-occupants.png).

Contrôles locaux réussis : **586 tests / 18 fichiers**, TypeScript, builds normal et laboratoire, 21 sélections individuelles aux zooms 0,8 / 1,05 / 1,65 parmi Paille, Neige, Terre, Bélier Gris, Feu, Volant provisoire et Brumelin ; oreilles tombantes, fiches, boutique, collection, parents et écran portrait. [Rapport Chromium](validation/belier-feu-v1/browser.json). Le fixture mixte est créé uniquement par le script navigateur via le contrôleur d’import, sans modifier les scénarios ni introduire de hook dans le jeu livré. Aucun iPhone physique disponible pour ces nouveaux rendus.

## Blocage concret pour Volant

L’original [GitHub](https://github.com/sullivanlegoff-code/Project-L/blob/production/Design%20des%20lapins/Lapin%20Volant.png), aussi conservé [ici](reference/volant/source.png), a un contour de museau déjà coupé par son bord droit à x = 1023. Aucune reconstruction ni génération n’est effectuée. Le joueur a explicitement choisi d’attendre une référence complète. En attendant, le visuel provisoire de Volant reste actif. Les ailes nécessiteront une échelle fondée sur le corps et un contrôle du masque alpha parmi les six originaux.

Cette branche est un brouillon : **aucune fusion ni publication** tant que les trois rendus ne sont pas finalisés et validés. Le jeu public reste en `5248235` avec Neige, Paille et Terre inchangés.
