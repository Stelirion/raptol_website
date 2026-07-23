# Guide de mise à jour — sortie d'un titre Raptol

Ce document est la méthode de référence pour préparer, publier et vérifier chaque nouvelle sortie. Il doit être mis à jour à la fin de chaque release avec les points appris, afin que la suivante soit plus simple et plus fiable.

## 1. Décider le mode de publication

Avant toute modification, choisir un seul scénario :

- **Teaser avant la sortie** : la page d'accueil annonce le titre et la date ; les liens d'écoute et le clip peuvent être absents ou désactivés.
- **Publication complète le jour J** : tous les liens, le clip, la fiche 3D et les métadonnées sont publiés ensemble.

Ne pas afficher un bouton « Écouter » tant que le lien public définitif n'est pas prêt.

## 2. Informations à réunir

### Indispensables

- titre exact et capitalisation souhaitée ;
- date et heure de sortie, avec fuseau horaire ;
- cover finale ;
- phrase d'accroche et description courte ;
- lien universel d'écoute (Hyperfollow, smart link ou équivalent) ;
- type : single, EP ou album ;
- année et crédits.

### Pour une fiche complète

- durée ;
- paroles validées ;
- texte « histoire du morceau » ;
- liens Spotify, Bandcamp et clip YouTube ;
- identifiant YouTube de 11 caractères ou URL de la vidéo ;
- visuel Open Graph dédié, 1200 × 630 px.

### Pour l'univers 3D

- couleur principale et secondaire (hexadécimales si possible) ;
- direction visuelle : lave, roche, glace, gaz, planète océanique, etc. ;
- position souhaitée dans l'univers, si elle est importante pour la narration.

## 3. Préparer les assets

- Ajouter la cover dans `images/` avec un nom stable et explicite.
- Prévoir une version web optimisée : AVIF ou WebP en priorité, avec un PNG/JPG de repli si nécessaire.
- Ne pas utiliser une image de cover très lourde directement sans vérifier son poids ; le dépôt contient déjà plusieurs fichiers de plusieurs mégaoctets.
- Ajouter un visuel Open Graph distinct si la cover seule n'est pas adaptée au format horizontal.
- Vérifier les droits et attributions de tout asset externe.

## 4. Emplacements à mettre à jour

Le site est statique : pas de framework ni de build. Le contenu de sortie est aujourd'hui réparti entre plusieurs fichiers.

### `index.html`

- `<title>` et `<meta name="description">` ;
- balises Open Graph et Twitter (`og:url`, titre, description, image) ;
- hero : badge, titre, accroche, lien d'écoute, lien du clip et iframe YouTube ;
- carte en tête de la discographie : image, alt, titre, année, badge et attribut `data-album`.

### `script.js`

- ajouter ou mettre à jour l'entrée dans `ALBUM_DATA` ;
- attribuer le badge `Nouveau Single` à la sortie mise en avant et retirer ce badge de l'ancienne ;
- renseigner `listenUrl`, les données de piste, les liens et les textes ;
- ajouter la planète dans `PLANET_DEFS` (vue 2D) ;
- ajouter la sortie dans `bodyOrder` (vue 3D) ;
- choisir un shader existant ou créer un shader dédié si l'identité de la planète le justifie ;
- ajouter une texture dans `TEXTURE_MAP` seulement si une texture locale est réellement nécessaire ;
- mettre à jour le panneau artiste, dont la liste de discographie est encore écrite à la main.

### `styles.css`

- aucun changement nécessaire pour une mise à jour éditoriale standard ;
- intervenir seulement si le nouveau visuel, le badge ou l'ordre de grille créent un problème de lisibilité, en particulier sur mobile.

## 5. Règle de cohérence

Une même information ne doit pas diverger entre le hero, la carte de discographie, `ALBUM_DATA`, la planète 3D, le panneau artiste et les métadonnées sociales.

Avant publication, comparer systématiquement :

| Information | À vérifier partout |
| --- | --- |
| Titre | orthographe, accents, capitalisation |
| Statut | nouveau single, single, EP ou album |
| Date / année | hero, carte, données, partage social |
| Cover | carte, partage social, panneau artiste |
| Lien d'écoute | hero et fiche 3D |
| Vidéo | hero et fiche 3D |

## 6. Vérification avant publication

- Tester le site sur ordinateur et mobile.
- Ouvrir la nouvelle carte de discographie, puis la planète 2D et 3D.
- Vérifier l'ouverture de chaque lien externe dans un nouvel onglet.
- Vérifier l'iframe YouTube et l'absence d'erreur si le clip n'existe pas encore.
- Vérifier que le nouveau titre est le premier élément visible de la discographie.
- Vérifier l'affichage des textes longs : histoire, paroles et crédits.
- Contrôler le poids des nouvelles images et les temps de chargement sur mobile.
- Prévisualiser le partage sur les réseaux après déploiement ; les plateformes peuvent conserver une ancienne image en cache.

## 7. Points de vigilance identifiés en juillet 2026

- Le domaine actif est `raptol.com`. Les métadonnées de la version actuelle utilisent encore `raptol.fr` : toujours employer le domaine canonique `https://raptol.com/` pour `og:url` et les URLs d'images sociales.
- La version actuelle contient des données de catalogue incohérentes à certains endroits (par exemple le type ou l'année de certaines sorties). Toute release doit être l'occasion de vérifier ces informations, pas seulement le nouveau morceau.
- Les données de release sont actuellement dupliquées dans le HTML et le JavaScript. Pour les évolutions futures, privilégier progressivement une source unique de contenu, puis générer les cartes et le panneau artiste à partir d'elle.
- `audio/virgo.mp3` est présent dans le dépôt mais n'est pas référencé par le site. Ne pas ajouter de fichiers audio lourds sans usage prévu.
- La newsletter masque actuellement les erreurs de soumission. Vérifier manuellement Formspree après une évolution du formulaire.
- Il n'existe pas de tests automatisés : la validation visuelle et fonctionnelle est obligatoire avant chaque publication.
- Les easter eggs ou animations décoratives ne doivent jamais masquer le hero d'une campagne. Pendant un teaser, les désactiver explicitement ou les limiter à une zone qui ne recouvre pas le message de sortie.
- Un shader 3D peut être syntaxiquement valide en JavaScript mais échouer à la compilation WebGL. Toujours ouvrir l'exploration 3D et vérifier qu'aucune erreur de shader n'apparaît dans la console avant publication.

## 8. Après la publication

- Vérifier la page live sur `https://raptol.com/` depuis un navigateur sans cache.
- Tester les aperçus de partage sur les réseaux prioritaires.
- Vérifier l'arrivée d'un abonnement test dans Formspree si le formulaire a changé.
- Noter dans la section suivante les problèmes rencontrés, leur correction et toute donnée manquante à demander plus tôt la prochaine fois.

## Journal des améliorations

### 2026-07-23 — audit initial

- Création de ce guide avant la préparation du prochain morceau.
- À centraliser à terme : hero, carte discographie et panneau artiste, actuellement maintenus séparément.

### 2026-07-23 — Stella Polare, teaser

- Assets reçus : cover carrée 3000 × 3000 px et wordmark transparent 2384 × 602 px ; une version JPEG web de 1600 × 1600 px est utilisée par le site.
- Teaser publié sans lien d'écoute ni clip ; les paroles, la durée et les crédits sont prêts dans `ALBUM_DATA`.
- La planète est un shader doré rayonnant : sa compilation WebGL a été vérifiée dans l'exploration 3D.
- Le coureur-easter egg est désactivé tant que la classe `release-teaser` est présente, afin de préserver la lisibilité du hero.
- Le wordmark de campagne ne doit contenir que le nom de la sortie ; conserver le logo Raptol séparé dans la navigation et le footer. Utiliser la palette or chaud de Stella Polare (`#efb84b`, `#a36b28`, `#ffe0a0`) pour les accents de campagne.
- Une planète de release doit raconter le morceau au premier regard : pour Stella Polare, conserver les pôles lumineux, les deux trajectoires de lumière incomplètes et le beacon nord comme signature de guide dans la nuit. Animer au minimum la rotation, les aurores, le halo et le beacon.
- Avant le jour J : ajouter le lien universel d'écoute et, s'il existe, le lien/iframe du clip ; remplacer le libellé « Prochain single » et « Bientôt disponible » par les libellés de sortie.
