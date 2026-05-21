# Convention Baptiste du Togo — frontend

Application [Next.js](https://nextjs.org) (App Router) pour le portail et l’administration.

## Prérequis

- Node.js 20+
- Projet [Supabase](https://supabase.com) (PostgreSQL)

## Configuration

1. Copier les variables d’environnement :

   ```bash
   copy .env.example .env.local
   ```

   Renseigner `DATABASE_URL` (Supabase → Settings → Database → Connection string, mode **Transaction**).

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

Voir **[DEPLOY.md](./DEPLOY.md)** — frontend sur **Vercel**, base de données sur **Supabase**.

## Données et fichiers

- Contenus (annonces, cours, QCM, messages, etc.) : **Supabase PostgreSQL** (voir `db/schema.sql`).
- Uploads (logo, images d’annonces) : `public/uploads/` en local ; migrer vers **Supabase Storage** pour la prod Vercel.
- Authentification : cookies **httpOnly** (`eglise_sid`) + cookies signés pour le proxy (`eglise_role`, `eglise_admin_gate`).

## Scripts npm

| Script | Description |
| ------ | ----------- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm run db:schema` | Applique `db/schema.sql` sur Supabase |
| `npm run db:seed` | Admin + données de démo |
| `npm run db:init` | Schéma + seed |
| `npm run db:seed:ecodim` | 10 leçons Ecodim 2026 |
| `npm run check:env` | Vérifie SESSION_SECRET et DATABASE_URL |

## Learn More (Next.js)

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
