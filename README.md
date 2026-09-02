# J'ai ma nounou

PWA mobile-first de mise en relation entre familles et aides à domicile en **Côte d'Ivoire**
(nounou, ménage, cuisine, garde d'enfants…). Interface 100 % française, monnaie **FCFA**,
téléphone **+225**. Fil conducteur : **la confiance**.

## Stack

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS** + composants maison (style shadcn)
- **Supabase** : PostgreSQL + **RLS sur toutes les tables** + Auth (téléphone/OTP) + Storage + Edge
- **TanStack Query**, **Zod**, **lucide-react** (icônes), **Vitest**
- **PWA** installable (manifest + service worker, offline basique)

> Décisions d'architecture tracées dans [`DECISION_LOG.md`](DECISION_LOG.md).
> Avancement dans [`PROJECT_STATE.md`](PROJECT_STATE.md). Cahier des charges : [`INTAKE.md`](INTAKE.md).

## Fonctionnalités

- **Marketplace publique (sans compte)** : accueil (recherche + services + catalogue de nounous),
  `/nounous` et `/offres` avec **filtres + pagination**, fiches détaillées. Se connecter n'est
  requis que pour **agir** (contacter, postuler, favori).
- **Auth téléphone + OTP** : inscription progressive (rôle + prénom + nom + téléphone → OTP →
  compte), connexion. Un utilisateur connecté ne peut pas rouvrir connexion/inscription.
- **Espace candidate / employeur** : tableau de bord, recherche, offres, candidatures (statuts),
  favoris, notifications (marquage lu auto), profil (compétences), paiement Mobile Money (mock),
  **suppression de son compte** (RGPD).
- **Contact** : téléphone révélé aux connectés + boutons **Appeler / WhatsApp**.
- **Back-office admin** : stats, **gestion des utilisateurs** (filtres, pagination, suspendre /
  annuler l'abonnement / supprimer avec confirmation), offres, signalements, **paramètres du site**
  (tarifs configurables).
- **Hiérarchie d'administration** : **Super Admin** (propriétaire, protégé côté base — ni
  supprimable, ni rétrogradable, ni suspendable, un seul autorisé) → **Staff/Admin** (permissions
  déléguées par section) → **Utilisateur**. Gestion des admins et permissions sur
  `/admin/administrateurs`, **journal d'audit** des actions sensibles sur `/admin/journal`.

## Prérequis

- Node.js 20+ et npm
- **Docker Desktop** (pour la stack Supabase locale)
- Supabase CLI (via `npx supabase …`, aucune installation globale requise)

## Démarrage local

```bash
# 1) Installer les dépendances
npm install

# 2) Démarrer Supabase en local (Docker) : Postgres + Auth + Storage + Studio
npm run db:start          # = npx supabase start

# 3) Appliquer le schéma + les données de démo
npm run db:reset          # applique migrations + seed.sql

# 4) Copier les variables d'environnement
#    `npx supabase status` affiche l'URL et les clés locales.
cp .env.example .env.local   # puis renseigner si besoin (les clés locales de démo sont déjà fournies)

# 5) Lancer l'application
npm run dev               # http://localhost:3000
```

### Comptes de démonstration (dev)

| Rôle | Numéro | Code OTP |
|------|--------|----------|
| **Super Admin** (propriétaire, accès complet) | `07 00 00 00 01` | `123456` |
| Employeur | `07 00 00 00 02` | `123456` |
| Candidates (nounous) | `07 00 00 00 03` … `07` | `123456` |
| Test inscription (numéros libres) | `07 00 00 00 98` / `99` | `123456` |

> Le **Super Admin** est le compte `07 00 00 00 01` (marqué `is_super_admin` par le seed) :
> compte protégé côté base (ni supprimable, ni rétrogradable, ni suspendable ; un seul autorisé).
> Il crée les administrateurs « staff » depuis `/admin/administrateurs`, leur attribue des
> permissions par section et consulte le journal d'audit (`/admin/journal`). Les comptes staff
> créés se connectent avec leur propre numéro + OTP `123456` (en dev).

> Le seed crée aussi ~20 nounous de démonstration (catalogue + pagination), avec photos
> bundlées dans `public/demo/`.
> En local, aucun SMS réel n'est envoyé : les OTP de test sont définis dans
> `supabase/config.toml` (`[auth.sms.test_otp]`). Pour tester d'autres numéros, ajoutez-les là.

## Scripts

| Script | Rôle |
|--------|------|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build de production / serveur |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification des types |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run db:start` / `db:stop` | Stack Supabase locale (Docker) |
| `npm run db:reset` | Réapplique migrations + seed |
| `npm run db:types` | Régénère `src/lib/supabase/database.types.ts` |

## Structure

```
src/
  app/                 # Routes Next.js (App Router)
    (public)/          # Public : accueil, /nounous, /offres (+ détails), tarifs, FAQ, CGU…
    (auth)/            # /connexion, /inscription (navbar sans footer ; connectés redirigés)
    onboarding/        # Complément de profil (rôle) — fallback
    app/               # Espace connecté (sidebar desktop + bottom-nav mobile) : dashboard,
                       #   recherche, offres, candidatures, favoris, profil, notifications,
                       #   messages, paramètres, paiement, candidates/[id]
    admin/             # Back-office : dashboard, utilisateurs, offres, signalements, parametres
    api/paiement/      # Paiement (provider mock isolé, confirmation serveur)
    api/admin/users/   # Actions admin (annuler l'abonnement / supprimer) — service_role
    api/account/       # Suppression de son propre compte (RGPD) — service_role
  components/          # UI réutilisable (ui/, app/, brand/)
  features/            # Logique par domaine (auth, profiles, offers, applications, candidates,
                       #   catalog, ratings, reports, payments, notifications, admin, account, search, settings)
  lib/                 # supabase/ (clients + types), utils, constants, auth, env
supabase/
  migrations/          # Schéma, triggers, RLS, storage, navigation publique, RPC contact
  seed.sql             # Tarifs + comptes de démo + catalogue de nounous
  config.toml          # Config Supabase locale (ports décalés, OTP de test)
```

## Sécurité

- **RLS activée sur toutes les tables** : chaque utilisateur n'accède qu'à ses données ;
  l'admin a un accès élargi via `public.is_admin()`. La vue `public_profiles` expose les
  champs publics **sans le téléphone**.
- Authentification et autorisation validées **côté serveur** (middleware + Server Components) ;
  les pages `/connexion` et `/inscription` redirigent les utilisateurs déjà connectés.
- **Téléphone** jamais exposé publiquement ; révélé aux utilisateurs connectés via la fonction
  SECURITY DEFINER `public.candidate_phone`.
- Clé `service_role` **jamais** exposée au client ; utilisée uniquement dans les routes serveur
  de confiance qui **vérifient le rôle** (paiement simulé, actions admin sur les utilisateurs,
  suppression de compte RGPD).

## Points à finaliser (tâches manuelles)

Voir [`docs/manual-tasks.md`](docs/manual-tasks.md) : **logo** (`public/logo.png`), fournisseur
**SMS** et **agrégateur Mobile Money** réels (mock en dev, `PaymentProvider` swappable),
hébergement (Vercel ou VPS), relecture juridique des CGU / confidentialité.

## Déploiement

- **Vercel** (recommandé) : connecter le dépôt, définir les variables d'environnement
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`),
  puis lier un projet Supabase managé (`supabase link` + `supabase db push`).
- **VPS (Nginx + Node)** : `npm run build` puis `npm start` derrière Nginx (reverse proxy),
  Supabase managé.
