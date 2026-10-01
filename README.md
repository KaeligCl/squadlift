# SquadLift

Appli web installable (PWA) pour suivre ses séances de muscu entre potes : feed, amis, classement, séances en direct.

- **Front** : HTML / CSS / JS, un seul fichier (`index.html`), sans build
- **Backend** : [Supabase](https://supabase.com) (PostgreSQL, authentification, temps réel)
- **Hébergement** : GitHub Pages

## Structure

```
index.html              l'application
manifest.webmanifest    infos d'installation (nom, couleurs, icônes)
sw.js                   service worker (mode hors-ligne)
icon-192.png, icon-512.png
supabase/schema.sql     tables, sécurité (RLS), classement, temps réel
```

## Installation

### 1. Supabase
1. Créer un projet sur supabase.com.
2. **SQL Editor > New query** : coller `supabase/schema.sql` puis **Run**.
3. **Authentication > Sign In / Providers** : vérifier que Email est activé.
4. Dans `index.html`, remplacer `SB_URL` et `SB_KEY` par l'URL du projet et la clé **anon public**
   (**Project Settings > API**).

> La clé `anon` est publique par conception : la sécurité vient des règles RLS du fichier SQL.
> Ne mettez **jamais** la clé `service_role` dans ce dépôt.

### 2. GitHub Pages
1. **Settings > Pages** : Source = *Deploy from a branch*, branche `main`, dossier `/ (root)`.
2. Au bout d'une minute, le site est disponible sur `https://<utilisateur>.github.io/<nom-du-depot>/`.
3. Copier cette adresse dans Supabase : **Authentication > URL Configuration > Site URL**.

### 3. Installer sur le téléphone
- **iPhone** : ouvrir le lien dans Safari, puis Partager > Sur l'écran d'accueil.
- **Android** : ouvrir le lien dans Chrome, puis « Installer l'application ».

## Développement en local

```bash
python3 -m http.server 8000
# puis http://localhost:8000
```

Chaque `git push` sur `main` met le site à jour. Si les amis voient l'ancienne version,
changer `C='squadlift-v1'` en `v2` dans `sw.js`.
