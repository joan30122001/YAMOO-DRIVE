# YAMOO DRIVE — site de location de véhicules (démonstration)

> **Démonstration indépendante.** Ce site est une proposition de concept. Il n'est ni commandé, ni approuvé, ni
> affilié officiellement à YAMOO DRIVE. Les véhicules, les tarifs et les photographies sont fictifs ou d'illustration ;
> les coordonnées de l'agence sont « à compléter » tant qu'elles n'ont pas été vérifiées.

Site vitrine en français pour une agence de location de véhicules à Douala (Cameroun) : catalogue filtrable, fiches
véhicules, **demande de réservation envoyée par WhatsApp** (aucune réservation n'est jamais présentée comme confirmée :
seule l'agence accepte, par sa réponse), pages À propos et Contact. Frontend seul, sans serveur.

Technologies : React 19, Vite, Tailwind CSS 4, Motion, React Router, Lucide. Polices : Space Grotesk et Manrope.

---

## 1. Installation et commandes

Prérequis : Node.js 20 ou plus récent.

```bash
cd yamoo-drive
npm install
npm run dev        # serveur de développement : http://localhost:5173
```

| Commande | Rôle |
|---|---|
| `npm run dev` | Développement avec rechargement à chaud. |
| `npm run build` | Valide les données, génère `robots.txt` et `sitemap.xml`, construit le site, puis **prérend le HTML de chaque page** dans `dist/`. |
| `npm run preview` | Sert `dist/` comme Vercel (pages prérendues, coquille vide pour les adresses inconnues, compression). |
| `npm test` | Tests unitaires et d'intégration (Vitest). |
| `npm run validate:data` | Vérifie `src/data/vehicles.json` (aussi lancé avant chaque build). |
| `npm run check:visual` | Parcourt 8 pages × 6 largeurs (320 à 1920 px) dans Chrome : débordement, cibles de 44 px, erreurs console. |
| `npm run check:e2e` | Parcours complets dans Chrome : recherche, filtres, réservation, contact, clavier, animations réduites. |
| `npm run check:images` | Vérifie que toutes les images se chargent. |
| `node scripts/check-links.mjs` | Suit tous les liens internes et signale les liens cassés. |
| `npm run check:lighthouse` | Lighthouse mobile (Performance, Accessibilité, Bonnes pratiques). |

Les contrôles `check:*` demandent que le site soit servi (`npm run build && npm run preview`) et utilisent Google Chrome
ou Edge déjà installé (variable `CHROME_PATH` pour indiquer un autre chemin).

---

## 2. Modifier les véhicules

Les véhicules sont dans **`src/data/vehicles.json`**. C'est le seul endroit à modifier : le catalogue, les filtres, les
fiches et l'accueil se mettent à jour tout seuls. Chaque véhicule :

```json
{
  "slug": "jetour-x50",
  "brand": "Jetour",
  "model": "X50",
  "category": "SUV / 4x4",
  "seats": 5,
  "transmission": "Automatique",
  "dailyRateXAF": 60000,
  "driverSupplementXAF": 15000,
  "services": { "selfDrive": true, "withDriver": true },
  "specs": { "Carburant": "Essence", "Puissance": "203 ch" },
  "equipment": ["Climatisation", "Bluetooth"],
  "images": { "main": "/vehicles/jetour-x50.webp", "gallery": ["/vehicles/jetour-x50-lg.webp", "…"] },
  "conditions": ["…"],
  "isDemo": true,
  "featured": true
}
```

- `category` : `SUV / 4x4` ou `Pick-up` (liste dans `src/data/vehicleSchema.js`).
- `dailyRateXAF` : montant en francs CFA, affiché « 60 000 FCFA ». Un tarif absent s'affiche « à compléter ».
- `services` : détermine si « avec chauffeur » et « sans chauffeur » sont proposés (filtre et formulaire).
- `featured: true` : le véhicule apparaît dans « À la une » sur l'accueil (3 au maximum).
- `isDemo` : mettre `false` pour un véhicule réel de l'agence.

Un véhicule invalide **fait échouer le build** avec un message en français indiquant le champ à corriger.

### Images

Les photos sont dans `public/vehicles/` et `public/images/`, au format WebP (le logo est en PNG). Pour en ajouter ou en
remplacer :

1. Utiliser une photo dont la licence autorise l'usage commercial (Pexels, Unsplash, ou une photo fournie par l'agence
   avec accord écrit). **Ne jamais publier une plaque lisible, une personne identifiable ou une propriété privée sans accord.**
2. La convertir en WebP (800 px de large pour les cartes, 1 200 px pour la galerie, 1 920 px pour le hero), moins de 250 Kio.
3. **Ajouter une ligne** dans `public/vehicles/LICENSES.md` (fichier, sujet, source, licence) : un test échoue sinon.

**Licences actuelles** : les photos viennent du site de Sky Motors Company Cameroun (Jetour et JMC), avec un accord d'utilisation déclaré par le
commanditaire et **à confirmer par écrit** avant toute mise en ligne publique ; le détail est fichier par fichier dans `public/vehicles/LICENSES.md`. Le **logo** a été fourni par le porteur du
projet : ses droits restent à confirmer par l'agence.

---

## 3. Configurer l'agence : WhatsApp, coordonnées, villes

Tout est dans **`src/data/agency.config.js`** :

```js
whatsappNumber: '',   // ex. '+237 6XX XX XX XX' : active les boutons WhatsApp et l'envoi de la demande
phone: '',
email: '',
address: '',
socials: { facebook: '', instagram: '', tiktok: '' },   // adresses complètes https://…
cities: ['Douala', 'Yaoundé'],                          // villes de prise en charge proposées
noindex: true,
```

Règle du projet : **une valeur vide s'affiche « à compléter » et désactive le lien associé** (jamais de lien mort). Tant
que `whatsappNumber` est vide, le bouton « Envoyer sur WhatsApp » est désactivé et le message préparé peut être copié.
Ne renseigner que des informations **vérifiées**.

---

## 4. Déployer sur Vercel

1. Mettre le projet dans un dépôt Git (GitHub, GitLab ou Bitbucket).
2. Sur [vercel.com](https://vercel.com) : **Add New… → Project**, puis importer le dépôt.
3. **Root Directory** : choisir le dossier **`yamoo-drive/`** (celui qui contient `package.json`).
4. Les réglages sont lus dans `vercel.json` ; vérifier :
   - **Framework Preset** : Vite (ou Other) ;
   - **Build Command** : `npm run build` ;
   - **Output Directory** : `dist`.
5. (Recommandé) Dans **Settings → Environment Variables**, ajouter `SITE_URL` = l'adresse publique du site
   (ex. `https://www.mon-domaine.com`) : elle sert au `sitemap.xml` et au `robots.txt`.
6. Cliquer sur **Deploy**.

Comment ça marche : `npm run build` écrit une page HTML complète par route (`dist/vehicules/index.html`, une page par
véhicule, etc.) ; React la reprend ensuite dans le navigateur. Toute adresse inconnue reçoit `app-shell.html` (voir
`vercel.json`) et affiche la page « introuvable ». Les fichiers de `assets/`, `images/` et `vehicles/` sont mis en cache.

### Passer de « non indexé » à « indexable »

Tant que le site est une démonstration, il est **volontairement exclu des moteurs de recherche**. Pour l'ouvrir, une fois
l'accord écrit de l'agence obtenu :

1. Dans `src/data/agency.config.js`, passer `noindex` à `false`.
2. Dans `index.html`, **supprimer** la ligne `<meta name="robots" content="noindex, nofollow" />` (un test vérifie que les
   deux restent cohérents et échoue sinon).
3. Relancer `npm run build` : `robots.txt` autorise alors l'indexation et pointe vers `sitemap.xml`.
4. Définir `SITE_URL`, puis redéployer.

---

## 5. Faire évoluer le site : remplacer le JSON par une API

Aucune page ne lit `vehicles.json` directement : tout passe par **`src/data/vehicleRepository.js`** (`getVehicles`,
`getVehicleBySlug`, `getFeaturedVehicles`). Pour brancher une API ou un back-office :

1. Réécrire ces trois fonctions pour lire l'API (elles deviendront asynchrones).
2. Adapter les pages qui les appellent (Catalogue, Fiche, Accueil, Réservation) pour attendre les données.
3. Conserver la validation de `src/data/vehicleSchema.js` à la réception des données.

Le calcul de la durée et de l'estimation, la préparation du message WhatsApp et les filtres sont des fonctions pures
(`src/utils/`), testées séparément : elles n'ont pas besoin de changer.

---

## 6. Règles de contenu à respecter

- Ne rien inventer sur l'agence : ni histoire, ni chiffres, ni récompenses, ni avis clients, ni promotions.
- Ne jamais écrire « réservation confirmée », « réservé » ou « validé » : un test parcourt tout le code et échoue si un
  tel libellé apparaît. Une demande est « non confirmée : en attente de validation par l'agence ».
- Les conditions de location (caution, kilométrage, carburant, âge minimum, annulation) sont « à compléter » tant que
  l'agence ne les a pas fournies.
- Le rouge `#C8102E` ne sert jamais pour du texte courant (erreurs de formulaire uniquement).
- Couleurs, polices et espacements : uniquement dans `src/styles/theme.css` (un test interdit les couleurs littérales
  ailleurs). Le document de design est dans `_bmad-output/planning-artifacts/ux-designs/`.

---

## 7. Qualité mesurée

Voir `npm run check:lighthouse` et les autres contrôles `check:*`. Les résultats de la dernière vérification sont dans
`_bmad-output/implementation-artifacts/visual-check/RAPPORT.md`.
