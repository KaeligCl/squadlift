# SquadLift

Appli web installable (PWA) pour suivre ses séances de muscu entre potes : feed, amis, classement, séances en direct.

**Technos** : React 19 + TypeScript + Vite · Supabase (PostgreSQL, authentification, temps réel) · GitHub Pages

## Structure du projet

```
src/
  main.tsx              point d'entrée (enregistre le service worker)
  App.tsx               session, navigation entre les écrans
  styles.css            tout le style
  screens/              un fichier par écran
    Auth.tsx  Profile.tsx  Feed.tsx  Start.tsx  Log.tsx  Friends.tsx  Ranks.tsx
  components/           briques réutilisables
    Avatar.tsx  Icon.tsx  NavBar.tsx  Toast.tsx
  hooks/
    useSession.ts       utilisateur connecté
    useLoad.ts          charge des données quand un écran s'affiche
    useDraft.ts         brouillon de séance (gardé sur le téléphone)
  lib/
    supabase.ts         connexion à Supabase
    api.ts              TOUTES les requêtes vers la base
    types.ts            les types TypeScript
    format.ts           dates, chrono, résumé d'une séance
supabase/migrations/    fichiers SQL numérotés (0001 = schéma de départ)
public/                 icônes de l'app
vite.config.ts          config Vite + PWA (manifest, mode hors-ligne)
.github/workflows/      déploiement automatique sur GitHub Pages
```

Pour modifier un écran, ouvrez son fichier dans `src/screens/`. Pour changer une requête, regardez `src/lib/api.ts`.

## Lancer en local

Il faut [Node.js](https://nodejs.org) 20 ou plus.

```bash
npm install
npm run dev        # http://localhost:5173
```

`npm run build` vérifie les types et construit le site dans `dist/`.

## Environnements et Gitflow

| Branche | Rôle | Site | Base Supabase |
|---|---|---|---|
| `main` | ce que voient les amis | GitHub Pages | prod |
| `develop` | l'intégration, instable | Cloudflare Pages (branche de production) | dev |
| `feature/*` | une modification | adresse de prévisualisation Cloudflare | dev |
| `release/x.y.z` | préparation d'une version | — | dev, puis prod |
| `hotfix/*` | correction urgente depuis `main` | — | prod |

Les pull requests visent `develop`, sauf les releases et hotfix qui visent `main`.

## Mise en ligne de la production (GitHub Pages)

1. Dans **Settings > Secrets and variables > Actions > Variables**, créez `SUPABASE_URL` et `SUPABASE_ANON_KEY` (projet de **prod**).
2. Dans **Settings > Pages > Source : GitHub Actions**.
3. Chaque fusion sur `main` reconstruit et publie le site (onglet **Actions** pour suivre).
4. Adresse du site : `https://<utilisateur>.github.io/<nom-du-depot>/`. Copiez-la dans Supabase :
   **Authentication > URL Configuration > Site URL**.

## Supabase

Deux projets Supabase : **dev** et **prod**. Pour un nouveau projet, exécutez les fichiers de
`supabase/migrations/` dans l'ordre (**SQL Editor**), puis mettez son URL et sa clé `anon public` dans `.env`
(modèle : `.env.example`).

> La clé `anon` est publique par conception, la sécurité vient des règles RLS des fichiers SQL.
> Ne mettez **jamais** la clé `service_role` dans ce dépôt.
