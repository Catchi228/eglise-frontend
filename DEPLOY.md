# Déploiement en production

Guide pour héberger l’application sur un **VPS** (Node.js + MariaDB). Ce projet n’est **pas** adapté à Vercel ou à un hébergement serverless sans disque persistant.

## Prérequis serveur

- Node.js **20+**
- MariaDB ou MySQL **10.6+**
- Reverse proxy HTTPS (Nginx, Caddy, etc.)
- Volume disque persistant pour `public/uploads/`

## 1. Base de données

Créer la base et un utilisateur dédié (exemple) :

```sql
CREATE DATABASE eglise CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'eglise_app'@'localhost' IDENTIFIED BY 'mot-de-passe-fort';
GRANT ALL PRIVILEGES ON eglise.* TO 'eglise_app'@'localhost';
FLUSH PRIVILEGES;
```

Appliquer le schéma :

```bash
npm run db:schema
```

## 2. Variables d’environnement

Copier `.env.example` vers `.env` ou `.env.local` sur le serveur :

| Variable | Obligatoire | Description |
|----------|-------------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | Oui | Connexion MariaDB |
| `SESSION_SECRET` | Oui | Min. 32 caractères aléatoires (`openssl rand -hex 32`) |
| `NODE_ENV` | Oui | `production` |
| `ALLOWED_ORIGINS` | Recommandé | Origines HTTPS supplémentaires, séparées par des virgules |
| `SEED_ADMIN_PASSWORD` | Au premier seed | Mot de passe admin fort (ne pas garder `admin123`) |
| `OPENAI_API_KEY` | Optionnel | Génération IA des questions QCM en admin |

Vérification :

```bash
npm run check:env
```

## 3. Données initiales

### Compte admin et démo

```bash
# Définir SEED_ADMIN_PASSWORD dans .env avant le seed
npm run db:seed
```

### Cours Ecodim CBT 2026 (10 leçons + contenu texte)

```bash
npm run db:seed:ecodim
```

Aucun PDF à déposer : chaque leçon expose un téléchargement généré depuis le contenu en base (`GET /api/courses/[id]/pdf`, utilisateur connecté).

## 4. Build et démarrage

```bash
npm ci
npm run build
npm run start
```

En production, utiliser un gestionnaire de processus (**PM2**, **systemd**) pour redémarrer l’app en cas de crash.

Exemple PM2 :

```bash
pm2 start npm --name eglise -- start
pm2 save
```

## 5. Reverse proxy (Nginx)

Exemple minimal (adapter le nom de domaine) :

```nginx
server {
    listen 443 ssl http2;
    server_name www.votredomaine.org;

    # certificats SSL (Let's Encrypt, etc.)

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 6. Bible intégrée (100 % locale, sans API à la lecture)

Une seule fois (machine avec Internet), avant ou après déploiement :

```bash
npm run bible:download
npm run bible:verify
```

Cela enregistre **~1 189 chapitres** (Louis Segond 1910) dans `public/bible/data/`.  
Durée indicative : 15–30 minutes. **Commitez** ce dossier avec le projet ou copiez-le sur le serveur.

En production, dans `.env` :

```env
BIBLE_LOCAL_ONLY=1
```

Le site ne tentera plus d’appeler bible.helloao.org : tout est lu depuis le disque (rapide, stable, hors ligne possible).

## 7. Fichiers uploadés

- Répertoire : `public/uploads/` (logo, images d’annonces, PDF de cours).
- **Sauvegarder** ce dossier avec la base de données.
- Ne pas le supprimer lors des mises à jour de code.

## 8. Sécurité avant ouverture au public

- [ ] `SESSION_SECRET` unique et long (≥ 32 caractères)
- [ ] Mot de passe admin changé (plus `admin123`)
- [ ] HTTPS actif sur tout le site
- [ ] `ALLOWED_ORIGINS` configuré si plusieurs domaines
- [ ] MariaDB : utilisateur à privilèges limités, pas `root` en prod
- [ ] Créer les **QCM** dans `/admin/qcm` pour les leçons accessibles (1–4)
- [ ] Mettre à jour Next.js quand des correctifs de sécurité sont publiés (`npm audit`)

## 9. Tests avant go-live

```bash
npm run lint
npm run build
npm run test:e2e
```

Les tests E2E démarrent l’app sur le port **3001** et nécessitent une base seedée (`PLAYWRIGHT_BASE_URL` optionnel).

## 10. Mises à jour

```bash
git pull
npm ci
npm run build
# Redémarrer le processus Node (pm2 restart eglise, etc.)
```

Si le schéma évolue : `npm run db:schema` (idempotent).

Pour réimporter uniquement les leçons Ecodim : `npm run db:seed:ecodim`.

## Dépannage

| Problème | Piste |
|----------|--------|
| Redirection infinie connexion | Vérifier cookies `secure` + HTTPS |
| PDF introuvable | Vérifier connexion utilisateur ; le PDF est généré par `/api/courses/[id]/pdf` |
| Erreur `SESSION_SECRET` au démarrage | Variable absente ou &lt; 32 caractères |
| Admin inaccessible | Connexion admin + code gate (`/admin/connexion`) |
| Cours vides côté client | Base seedée, utilisateur connecté |

## Références

- Configuration locale : `README.md`
- PDF de seed : `seed-data/README.md`
- Schéma SQL : `db/schema.sql`
