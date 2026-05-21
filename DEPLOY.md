# Déploiement Vercel + Supabase

## 1. Supabase (base de données)

1. Créer un projet sur [supabase.com](https://supabase.com).
2. **SQL Editor** → coller et exécuter le contenu de `db/schema.sql`.
3. (Optionnel) Seed depuis votre PC :

   ```bash
   npm run db:seed
   npm run db:seed:ecodim
   ```

4. Récupérer la chaîne de connexion :
   - **Settings → Database → Connection string**
   - Mode **Transaction** (pooler, port **6543**)
   - Format : `postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/postgres`

## 2. Vercel (frontend)

1. Importer le dépôt Git sur [vercel.com](https://vercel.com).
2. Framework : **Next.js** (détection automatique).
3. Variables d’environnement (Settings → Environment Variables) :

   | Variable | Obligatoire | Description |
   | -------- | ----------- | ----------- |
   | `DATABASE_URL` | Oui | Connection string Supabase (Transaction pooler) |
   | `SESSION_SECRET` | Oui | Min. 32 caractères aléatoires (`openssl rand -hex 32`) |
   | `NODE_ENV` | Auto | `production` (Vercel le définit) |
   | `BIBLE_LOCAL_ONLY` | Recommandé | `1` si la Bible est incluse dans le build |
   | `ALLOWED_ORIGINS` | Optionnel | Domaines autorisés pour POST (ex. `https://www.example.org`) |

   > Sans `DATABASE_URL` et `SESSION_SECRET`, l'inscription et la connexion échouent.

4. **Redéployer** après avoir ajouté les variables (Deployments → … → Redeploy).

5. Vérifier : ouvrir `https://votre-site.vercel.app/api/health` — doit afficher `{"ok":true,"db":true,"session":true}`.

## 3. Uploads (important)

Sur Vercel, le disque est **éphémère**. Les fichiers écrits dans `public/uploads/` ne persistent pas entre déploiements.

Pour la production, migrer les uploads vers **Supabase Storage** (logo, images d’annonces). En attendant, les uploads locaux fonctionnent en dev uniquement.

## 4. Mises à jour

```bash
git push   # Vercel rebuild automatiquement
```

Pour les changements de schéma SQL, ré-exécuter les migrations dans l’éditeur Supabase ou `npm run db:schema` depuis votre PC (avec `DATABASE_URL` dans `.env.local`).

## 5. Vérification

```bash
npm run check:env:production
```

Sur Vercel : consulter les **Runtime Logs** si erreur 500 (souvent `DATABASE_URL` ou `SESSION_SECRET` manquant).
