<div align="center">

<img src="public/logo.png" alt="J'ai ma nounou" width="340" />

# J'ai ma nounou

**La marketplace de confiance qui met en relation les familles ivoiriennes et les aides à domicile.**

Nounou · ménage · cuisine · garde d'enfants · aide aux personnes âgées — partout en Côte d'Ivoire.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20RLS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&logoColor=white)](#-progressive-web-app-pwa)
[![Tests](https://img.shields.io/badge/tests-unit%20%2B%20e2e-brightgreen)](#-tests)

</div>

---

## Table des matières

- [Présentation](#-présentation)
- [Fonctionnalités](#-fonctionnalités)
- [Stack technique](#-stack-technique)
- [Rôles &amp; hiérarchie d'administration](#-rôles--hiérarchie-dadministration)
- [Prise en main](#-prise-en-main)
- [Comptes de démonstration](#-comptes-de-démonstration-dev)
- [Scripts npm](#-scripts-npm)
- [Tests](#-tests)
- [Structure du projet](#-structure-du-projet)
- [Sécurité](#-sécurité)
- [Progressive Web App (PWA)](#-progressive-web-app-pwa)
- [Déploiement](#-déploiement)
- [État du projet &amp; feuille de route](#-état-du-projet--feuille-de-route)
- [Tâches manuelles restantes](#-tâches-manuelles-restantes)
- [Documentation du dépôt](#-documentation-du-dépôt)

---

## 🎯 Présentation

**J'ai ma nounou** est une application web **mobile-first** (PWA) pensée pour le marché ivoirien.
Elle fonctionne comme une marketplace : on **consulte librement** les profils de nounous et les
offres, et on ne se connecte **que pour agir** (contacter, postuler, mettre en favori). L'expérience
est entièrement en **français**, avec la monnaie **FCFA** et les numéros au format **+225**.

Le fil conducteur du produit est **la confiance** : profils vérifiés, notation mutuelle, messagerie
interne, contact protégé, et un back-office d'administration doté d'une hiérarchie de rôles avec
protections appliquées **au niveau de la base de données**.

| | |
|---|---|
| **Cible** | Familles (employeurs) et aides à domicile (candidates) en Côte d'Ivoire |
| **Plateforme** | Web responsive / PWA installable (mobile-first) |
| **Langue / devise** | Français · FCFA · téléphone +225 |
| **Modèle** | Consultation publique, connexion à l'action, abonnement d'activation |

---

## ✨ Fonctionnalités

### Pour tout le monde (sans compte)
- **Accueil marketplace** : recherche, services présentés avec descriptions, catalogue de nounous.
- **Catalogue `/nounous`** et **offres `/offres`** avec **filtres** (ville, service…) et **pagination**.
- **Fiches détaillées** : compétences, disponibilité, ancienneté, photo.
- **Pages informationnelles** : tarifs, FAQ, CGU / confidentialité.

### Pour les familles (employeurs)
- Publication et gestion d'**offres**, suivi des **candidatures** (avec consultation du profil avant d'accepter).
- **Favoris**, **messagerie interne**, **notifications temps réel**.
- **Contact révélé** une fois connecté : téléphone + boutons **Appeler** / **WhatsApp**.
- **Accès premium** (paiement Mobile Money — simulé en développement).

### Pour les nounous (candidates)
- **Profil enrichi** (compétences, expérience, disponibilité, photo), **activation** du profil par abonnement.
- Réception et suivi des **candidatures**, **messagerie**, **notation** mutuelle.

### Transverse
- **Auth téléphone + OTP** : inscription progressive (rôle → prénom + nom → téléphone → OTP).
- **Notation mutuelle** (5 critères + avis), **messagerie** (conversations + fil), **notifications temps réel** (Supabase Realtime).
- **Suppression de son propre compte** (RGPD).
- **Back-office admin** complet (voir ci-dessous).

---

## 🧱 Stack technique

| Domaine | Choix |
|---|---|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router, Server Components, route handlers) |
| **Langage** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI** | [Tailwind CSS 3.4](https://tailwindcss.com/) + composants maison (style shadcn/ui) · icônes [lucide-react](https://lucide.dev/) |
| **Backend / BaaS** | [Supabase](https://supabase.com/) — PostgreSQL, **RLS sur toutes les tables**, Auth (téléphone/OTP), Storage, Realtime |
| **Données / state** | [TanStack Query](https://tanstack.com/query) · validation [Zod](https://zod.dev/) |
| **Tests** | [Vitest](https://vitest.dev/) (unitaires) · [Playwright](https://playwright.dev/) (E2E) |
| **Distribution** | PWA installable (manifest + service worker, offline basique) |

> Les choix structurants sont tracés dans [`DECISION_LOG.md`](DECISION_LOG.md) (ADR léger).

---

## 🛡️ Rôles &amp; hiérarchie d'administration

Trois niveaux, avec des protections **appliquées côté base** (non contournables via l'interface **ou** une requête API directe) :

```
Super Admin  ──▶  Staff / Admin  ──▶  Utilisateur
(propriétaire)     (permissions          (candidate /
                    déléguées)             employeur)
```

- **Super Admin** — autorité maximale et **compte protégé** : il ne peut être **ni supprimé, ni
  rétrogradé, ni suspendu**, et **un seul** est autorisé. Il crée les administrateurs, attribue /
  révoque leurs permissions par section, gère les utilisateurs et consulte le **journal d'audit**.
  Tableau de bord complet (dont chiffre d'affaires).
- **Staff / Admin** — permissions **déléguées par le Super Admin**, section par section :
  `utilisateurs`, `offres`, `signalements`, `paramètres`. Ne voit pas le Super Admin et ne peut agir
  que sur des comptes de niveau inférieur.
- **Utilisateur** — candidate ou employeur.

**Garanties techniques :**

| Protection | Mécanisme |
|---|---|
| Super Admin non supprimable / rétrogradable / suspendable | Trigger PostgreSQL `protect_super_admin` (s'applique aussi au `service_role`) |
| Un seul Super Admin | Index unique partiel `one_super_admin_idx` |
| Traçabilité des actions sensibles | Table `admin_audit_log` (lecture admins, écriture `service_role` uniquement) → page `/admin/journal` |
| Le staff ne voit pas le Super Admin | Filtrage serveur des listes et du comptage |

Pages associées : `/admin/administrateurs` (gestion des admins &amp; permissions) et `/admin/journal`
(audit), réservées au Super Admin.

---

## 🚀 Prise en main

### Prérequis
- **Node.js 20+** et **npm**
- **Docker Desktop** (pour la stack Supabase locale)
- Supabase CLI — utilisé via `npx supabase …` (aucune installation globale requise)

### Installation &amp; lancement

```bash
# 1) Dépendances
npm install

# 2) Stack Supabase locale (Docker) : Postgres + Auth + Storage + Studio
npm run db:start

# 3) Schéma + données de démonstration
npm run db:reset

# 4) Variables d'environnement
#    « npx supabase status » affiche l'URL et les clés locales.
cp .env.example .env.local

# 5) Application
npm run dev            # http://localhost:3000
```

> **Ports locaux (décalés** pour cohabiter avec d'autres stacks Supabase**)** : API `54331` ·
> DB `54332` · Studio `54333` · Mailpit `54334`. Voir [`supabase/config.toml`](supabase/config.toml).

---

## 👤 Comptes de démonstration (dev)

| Rôle | Numéro | Code OTP |
|---|---|---|
| **Super Admin** (propriétaire, accès complet) | `07 00 00 00 01` | `123456` |
| Employeur | `07 00 00 00 02` | `123456` |
| Candidates (nounous) | `07 00 00 00 03` … `07` | `123456` |
| Test inscription (numéros libres) | `07 00 00 00 98` / `99` | `123456` |

> **Aucun SMS réel** n'est envoyé en local : les OTP de test sont définis dans
> [`supabase/config.toml`](supabase/config.toml) (`[auth.sms.test_otp]`). Ajoutez-y d'autres numéros au besoin.
>
> Le seed crée aussi **~20 nounous de démonstration** (catalogue + pagination) avec des photos
> bundlées dans `public/demo/`. Les administrateurs « staff » se connectent avec leur propre
> numéro + OTP `123456`.

---

## 📜 Scripts npm

| Script | Rôle |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` / `npm start` | Build de production / serveur de production |
| `npm run lint` | ESLint |
| `npm run typecheck` | Vérification des types TypeScript |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run test:e2e` | Tests end-to-end (Playwright) |
| `npm run test:e2e:ui` | Playwright en mode UI (débogage) |
| `npm run test:e2e:report` | Ouvre le dernier rapport HTML Playwright |
| `npm run db:start` / `db:stop` | Démarre / arrête la stack Supabase locale (Docker) |
| `npm run db:reset` | Réapplique les migrations + le seed |
| `npm run db:types` | Régénère `src/lib/supabase/database.types.ts` |

---

## 🧪 Tests

**Qualité vérifiée :** build de production vert (42 routes), `typecheck` vert, `lint` vert,
**tests unitaires** (Vitest) et **tests E2E** (Playwright) verts.

### Unitaires
```bash
npm run test
```
Portent sur la logique pure : schémas de validation (`src/features/auth/schemas.test.ts`) et
utilitaires (`src/lib/utils.test.ts`).

### End-to-end (Playwright)
**Prérequis :** la stack Supabase locale doit tourner **et** être seedée (`npm run db:start` puis
`npm run db:reset`). Playwright démarre le serveur Next lui-même (ou réutilise `npm run dev`).

```bash
npx playwright install chromium   # une seule fois : télécharge le navigateur
npm run test:e2e
```

Scénarios (`e2e/`) :
- **`public.spec.ts`** — consultation publique de la marketplace (accueil, nounous, offres, gate de contact).
- **`auth.spec.ts`** — login OTP par rôle (Super Admin → back-office, employeur → espace app).
- **`super-admin.spec.ts`** — la **hiérarchie d'administration** : le staff ne voit pas le Super
  Admin, les pages réservées le renvoient vers `/admin`, et l'API **refuse (403)** toute tentative
  du staff de supprimer / rétrograder / suspendre le Super Admin (protection doublée du trigger base).

Les sessions sont authentifiées une seule fois puis réutilisées (`e2e/auth.setup.ts`) ; le compte
promu comme staff de test est restauré en fin de suite (`e2e/global.teardown.ts`).

---

## 🗂️ Structure du projet

```
src/
  app/                 # Routes Next.js (App Router)
    (public)/          # Accueil, /nounous, /offres (+ détails), tarifs, FAQ, CGU…
    (auth)/            # /connexion, /inscription (navbar sans footer ; connectés redirigés)
    onboarding/        # Complément de profil (rôle) — fallback
    app/               # Espace connecté (sidebar desktop + bottom-nav mobile) :
                       #   dashboard, recherche, offres, candidatures, favoris, profil,
                       #   notifications, messages, paramètres, paiement, candidates/[id]
    admin/             # Back-office : dashboard, utilisateurs, offres, signalements,
                       #   parametres, administrateurs, journal
    api/paiement/      # Paiement (provider mock isolé, confirmation serveur)
    api/admin/         # Actions admin (users, create-admin, staff) — service_role
    api/account/       # Suppression de son propre compte (RGPD) — service_role
  components/          # UI réutilisable (ui/, app/, brand/)
  features/            # Logique par domaine (auth, profiles, offers, applications,
                       #   candidates, catalog, ratings, reports, payments,
                       #   notifications, admin, account, search, settings)
  lib/                 # supabase/ (clients + types), utils, constants, auth, env
supabase/
  migrations/          # Schéma, triggers, RLS, storage, navigation publique, RPC contact,
                       #   realtime, hiérarchie Super Admin + audit
  seed.sql             # Tarifs + comptes de démo + catalogue de nounous
  config.toml          # Config Supabase locale (ports décalés, OTP de test)
e2e/                   # Tests Playwright (setup d'auth, teardown, specs)
```

---

## 🔒 Sécurité

- **RLS activée sur toutes les tables** : chaque utilisateur n'accède qu'à ses données ; l'admin a
  un accès élargi via `public.is_admin()`. La vue `public_profiles` expose les champs publics **sans
  le téléphone**.
- **Autorisation validée côté serveur** (middleware + Server Components) ; `/connexion` et
  `/inscription` redirigent les utilisateurs déjà connectés.
- **Téléphone jamais exposé publiquement** : révélé aux utilisateurs connectés via la fonction
  `SECURITY DEFINER` `public.candidate_phone`.
- **Clé `service_role` jamais exposée au client** : utilisée uniquement dans des routes serveur de
  confiance qui **vérifient le rôle** (paiement simulé, actions admin, suppression RGPD).
- **Protections Super Admin au niveau base** (trigger + index unique) : non contournables même par
  une requête API directe. Actions sensibles **tracées** dans le journal d'audit.

---

## 📱 Progressive Web App (PWA)

L'application est **installable** (écran d'accueil mobile) grâce à un `manifest` et un service worker
écrit à la main (mise en cache basique / offline). Le design est **mobile-first** : sidebar sur
desktop, bottom-nav sur mobile.

---

## ☁️ Déploiement

**Vercel (recommandé)**
1. Connecter le dépôt à Vercel.
2. Définir les variables d'environnement : `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
3. Lier un projet Supabase managé : `supabase link` puis `supabase db push`.

**VPS (Nginx + Node)**
- `npm run build` puis `npm start`, derrière **Nginx** en reverse proxy, avec un Supabase managé.

> CI (GitHub Actions : lint + typecheck + tests à chaque push) et branchements réels
> **SMS** / **Mobile Money** restent à mettre en place (voir ci-dessous).

---

## 📈 État du projet &amp; feuille de route

Phases 0 → 5 **terminées** (produit MVP + marketplace + P1/P2 + qualité). Reste la **mise en
production**. Suivi détaillé dans [`PROJECT_STATE.md`](PROJECT_STATE.md).

- [x] Cœur MVP (auth OTP, profils, offres, candidatures, paiement mock)
- [x] Marketplace publique + filtres + pagination
- [x] Notation mutuelle · messagerie interne · notifications temps réel
- [x] Back-office admin + hiérarchie Super Admin / Staff (protections base + audit)
- [x] Qualité : build, typecheck, lint, tests unitaires **et** E2E verts
- [ ] CI GitHub Actions
- [ ] Branchements réels **SMS** et **Mobile Money**
- [ ] Déploiement (Vercel ou VPS + Supabase managé)

---

## 🧰 Tâches manuelles restantes

Voir [`docs/manual-tasks.md`](docs/manual-tasks.md) : fournisseur **SMS** et **agrégateur Mobile
Money** réels (mock en dev, `PaymentProvider` swappable), hébergement (Vercel ou VPS), relecture
juridique des CGU / confidentialité.

---

## 📚 Documentation du dépôt

| Fichier | Contenu |
|---|---|
| [`INTAKE.md`](INTAKE.md) | Cahier des charges initial |
| [`PLAN.md`](PLAN.md) | Plan de réalisation par incréments |
| [`PROJECT_STATE.md`](PROJECT_STATE.md) | Avancement par phase (source de vérité) |
| [`DECISION_LOG.md`](DECISION_LOG.md) | Journal des décisions d'architecture (ADR) |
| [`docs/manual-tasks.md`](docs/manual-tasks.md) | Actions nécessitant un compte / une clé externe |

---

<div align="center">

 **J'ai ma nounou**.

</div>
