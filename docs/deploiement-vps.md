# 🚀 Déploiement en production — « J'ai ma nounou »

> Cible : **VPS Hostinger** (Ubuntu 24.04, déjà en place avec Nginx + Docker) ·
> Base : **Supabase Cloud** (`lssqjjqszhwqetcifdpu`) · Domaine : **jaimanounou.com**
> Lancement : **connexion Google uniquement** (SMS ajouté plus tard).
>
> Légende : 👤 = toi (action manuelle) · 🤖 = déjà préparé dans le code.

---

## Vue d'ensemble

| Bloc | Ce qu'on fait |
|------|---------------|
| **A** | Préparer la base Supabase Cloud (schéma + Auth Google + clés + Super Admin) |
| **B** | Pointer le domaine (DNS) vers le VPS |
| **C** | Déployer l'app en Docker sur le VPS |
| **D** | Nginx + HTTPS (Let's Encrypt) |
| **E** | Vérifications finales |
| **F** | Mettre à jour l'app plus tard |

🤖 **Déjà prêt côté code** : `Dockerfile`, `.dockerignore`, `deploy/deploy.sh`,
`deploy/nginx/jaimanounou.com.conf`, `.env.production.example`, `next.config.mjs` en mode
`standalone`. Build de prod vérifié ✅.

---

## Bloc A — Base Supabase Cloud

### A1. Pousser le schéma (migrations) 👤
Sur **ta machine** (là où est le projet), une seule fois :
```bash
npx supabase login
npx supabase link --project-ref lssqjjqszhwqetcifdpu
npx supabase db push
```
> `db push` applique **uniquement les migrations** (tables, RLS, triggers). Il n'envoie
> **pas** les données de démo/test (`seed.sql`) — c'est voulu : la prod démarre vide et propre.

### A2. Configurer la connexion Google 👤
Dans le tableau de bord Supabase (projet cloud) :
- **Authentication → Providers → Google** : activer, coller le **Client ID** et le
  **Client Secret** (ceux de la console Google).
- **Authentication → URL Configuration** :
  - **Site URL** : `https://jaimanounou.com`
  - **Redirect URLs** : `https://jaimanounou.com/auth/callback` et
    `https://www.jaimanounou.com/auth/callback`

### A3. Vérifier la console Google 👤
Dans https://console.cloud.google.com/apis/credentials, sur ton client OAuth « Web » :
- **URI de redirection autorisés** doit contenir :
  `https://lssqjjqszhwqetcifdpu.supabase.co/auth/v1/callback`
- **Origines JavaScript** doit contenir : `https://jaimanounou.com` et `https://www.jaimanounou.com`

### A4. Récupérer les clés du projet cloud 👤
Supabase → **Project Settings → API** : note la **clé anon** (publique) et la
**clé service_role** (secrète). Tu les mettras dans `.env.production` (bloc C).

---

## Bloc B — Domaine (DNS)

### B1. Trouver l'IP de ton VPS 👤
Dans hPanel Hostinger (ou `curl -4 ifconfig.me` sur le VPS).

### B2. Créer les enregistrements DNS 👤
Chez le gestionnaire du domaine `jaimanounou.com`, crée deux enregistrements **A** :

| Type | Nom  | Valeur (cible)   |
|------|------|------------------|
| A    | `@`  | `IP_DE_TON_VPS`  |
| A    | `www`| `IP_DE_TON_VPS`  |

> La propagation DNS peut prendre de quelques minutes à quelques heures. Vérifie avec :
> `ping jaimanounou.com` (doit renvoyer l'IP de ton VPS).

---

## Bloc C — Déployer l'app (Docker, sur le VPS)

Toutes ces commandes se lancent **dans le terminal du VPS** (terminal Hostinger), en `root`.

### C1. Récupérer le code 👤
```bash
cd /opt
git clone https://github.com/Kelenix/nounou.git jaimanounou
cd jaimanounou
```
(Mises à jour futures : `git pull` dans ce dossier.)

### C2. Créer le fichier de secrets de prod 👤
```bash
cp .env.production.example .env.production
nano .env.production
```
Remplis :
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = clé **anon** du projet cloud (A4)
- `SUPABASE_SERVICE_ROLE_KEY` = clé **service_role** du projet cloud (A4)
- Le reste est déjà pré-rempli (URL Supabase, domaine, paiement en `mock`).

Enregistre (`Ctrl+O`, `Entrée`, `Ctrl+X`).

### C3. Construire et lancer 👤
```bash
bash deploy/deploy.sh
```
Ce script build l'image, (re)lance le conteneur sur `127.0.0.1:3002`, en redémarrage
automatique. Vérifie :
```bash
docker logs -f jaimanounou
```
Tu dois voir « Ready » / le serveur démarré. (`Ctrl+C` pour quitter les logs.)

---

## Bloc D — Nginx + HTTPS

### D1. Installer la config Nginx 👤
```bash
cp deploy/nginx/jaimanounou.com.conf /etc/nginx/sites-available/jaimanounou.com.conf
ln -s /etc/nginx/sites-available/jaimanounou.com.conf /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### D2. Activer le HTTPS (certificat gratuit Let's Encrypt) 👤
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d jaimanounou.com -d www.jaimanounou.com
```
Certbot obtient le certificat, ajoute le HTTPS et la redirection automatique HTTP → HTTPS.
Le renouvellement est automatique.

> ⚠️ Le bloc D ne marche que si le **DNS (bloc B) pointe déjà** vers le VPS.

---

## Bloc E — Vérifications finales

- [ ] `https://jaimanounou.com` s'ouvre (cadenas HTTPS présent).
- [ ] La marketplace publique s'affiche (vide au début, normal).
- [ ] **Connexion Google** fonctionne (Google → retour sur le site connecté).
- [ ] Créer ton **Super Admin** : connecte-toi une fois avec Google, puis dans
      Supabase → **SQL Editor**, exécute (remplace l'e-mail) :
      ```sql
      update public.profiles
         set role = 'admin', is_super_admin = true
       where id = (select id from auth.users where email = 'ton-email@gmail.com');
      ```
      Tu auras alors accès à `/admin`.

---

## Bloc F — Mettre à jour l'app plus tard

À chaque nouvelle version :
```bash
cd /opt/jaimanounou
git pull
bash deploy/deploy.sh
```
C'est tout — le conteneur est reconstruit et redémarré.

---

## ⚠️ Points d'attention (à savoir)

1. **Connexion téléphone (SMS) désactivée de fait** : sans fournisseur SMS, les pages
   Connexion/Inscription par téléphone échoueront en prod. Les visiteurs doivent utiliser
   **Google**. 👉 Je peux **masquer l'option téléphone** en prod pour éviter la confusion —
   demande-le-moi.
2. **Paiement en `mock`** : l'abonnement premium est simulé. À brancher (CinetPay / PayDunya /
   Stripe) quand tes comptes marchands seront prêts.
3. **Port 3002** : choisi pour ne pas entrer en conflit avec `melodie-web` (3001). Si 3002 est
   pris, change-le dans `deploy/deploy.sh` **et** dans `deploy/nginx/jaimanounou.com.conf`.
4. **Sauvegardes** : Supabase Cloud gère les sauvegardes de la base. Ton VPS n'héberge que
   l'app (sans état), donc rien de critique à sauvegarder côté VPS.
