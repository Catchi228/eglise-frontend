# Convention Baptiste du Togo — frontend

Application [Next.js](https://nextjs.org) (App Router) pour le portail et l’administration.

## Prérequis

- Node.js 20+
- **MariaDB / MySQL** (ex. XAMPP : démarrer le service **MySQL** avant `npm run dev`)

## Configuration

1. Copier les variables d’environnement :

   ```bash
   copy .env.example .env.local
   ```

   Ajuster `DB_*` si votre MariaDB n’est pas en `root` sans mot de passe sur `127.0.0.1:3306`.

2. Générer un `SESSION_SECRET` suffisamment long en production (ex. `openssl rand -hex 32`).

3. Initialiser la base (schéma + données de démo + compte admin) :

   ```bash
   npm run db:init
   ```

   Compte administrateur par défaut (modifiable dans `.env.local` avant le seed) :

   - **Email** : `admin@cbdtogo.org`
   - **Mot de passe** : `admin123`

## Cours Ecodim CBT 2026

```bash
npm run db:seed:ecodim
```

Le contenu des leçons est en base ; le **PDF se génère automatiquement** au téléchargement (aucun fichier à ajouter).

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Déploiement production

Voir **[DEPLOY.md](./DEPLOY.md)** (VPS, MariaDB, HTTPS, checklist sécurité).

## Données et fichiers

- Contenus (annonces, cours, QCM, messages, etc.) : **MariaDB**, base `eglise` (voir `db/schema.sql`).
- Uploads (logo, images d’annonces, PDF de cours) : répertoire `public/uploads/` (ignoré par Git sauf `.gitkeep`).
- Authentification : cookies **httpOnly** (`eglise_sid`) + cookies signés pour le proxy (`eglise_role`, `eglise_admin_gate`). Le fichier `src/proxy.ts` remplace l’ancien `middleware.ts` (Next.js 16 ; doit être au même niveau que `src/app`).

## Scripts npm

| Script        | Description                                      |
| ------------- | ------------------------------------------------ |
| `npm run dev` | Serveur de développement                       |
| `npm run build` | Build production                             |
| `npm run db:schema` | Applique uniquement `db/schema.sql`    |
| `npm run db:seed`   | Exécute `scripts/seed.mjs` (admin + mocks) |
| `npm run db:init`   | Schéma + seed                            |
| `npm run db:seed:ecodim` | 10 leçons Ecodim 2026 + contenu texte |
| `npm run check:env` | Vérifie SESSION_SECRET                   |

## Learn More (Next.js)

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
