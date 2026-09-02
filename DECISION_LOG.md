# Journal de décisions (DECISION_LOG)

> ADR léger. Chaque décision structurante prise par Claude **en autonomie** y est consignée :
> contexte → décision → alternatives écartées → conséquences. Le plus récent en haut.

---

## ADR-008 — Hiérarchie de rôles Super Admin / Staff & protections côté base

- **Date** : 2026-09-02
- **Statut** : Accepté
- **Décideur** : Utilisateur + Claude
- **Contexte** : projet de groupe ; besoin d'un compte propriétaire non compromettable et d'admins
  « staff » aux permissions limitées, avec des protections **impossibles à contourner via l'API ou
  une requête directe** (exigence explicite de l'utilisateur).
- **Décisions** :
  - **Modèle** : on garde `role = 'admin'` pour tous les administrateurs et on ajoute deux
    colonnes à `profiles` : `is_super_admin boolean` (autorité maximale, unique) et
    `staff_permissions text[]` (sections déléguées : `users`, `offers`, `reports`, `settings`).
    Alternative écartée : une table `roles`/`permissions` normalisée — surdimensionnée pour 4
    sections et 2 niveaux ; on pourra migrer si le besoin grandit.
  - **Protection au niveau base (défense en profondeur, pas seulement l'UI)** :
    - Trigger `protect_super_admin` (BEFORE UPDATE/DELETE) : refuse la **suppression**, la
      **rétrogradation** (`is_super_admin`/`role`) et la **suspension** du Super Admin, et interdit
      toute modification de son compte par autrui. Les triggers **s'appliquent aussi au
      `service_role`** (ils ne sont pas court-circuités comme la RLS) → une route API compromise ne
      peut pas passer outre.
    - Index unique partiel `one_super_admin_idx` → **un seul** Super Admin possible.
  - **Journal d'audit** (`admin_audit_log`) : actions sensibles tracées (`create_admin`, `set_role`,
    `set_permissions`, `suspend`, `delete_user`, `cancel_subscription`). RLS : lecture réservée aux
    admins, **écriture uniquement `service_role`** (aucune policy INSERT).
  - **Garde applicative en complément** : seul le Super Admin crée des admins / modifie les
    permissions ; un staff ne peut pas gérer un compte de niveau égal ou supérieur ; le CA et les
    sections sensibles sont masqués selon `canAccess`.
- **Conséquences** : sécurité non contournable côté serveur ; le compte du développeur (seed) est
  marqué `is_super_admin=true`. Les protections ont été **vérifiées en base** (suppression /
  rétrogradation / suspension refusées, 2ᵉ Super Admin refusé, staff toujours gérable).

---

## ADR-007 — Structuration back-office, comptes & configuration

- **Date** : 2026-09-02
- **Statut** : Accepté
- **Décideur** : Utilisateur + Claude
- **Contexte** : itérations UX/produit après la refonte marketplace (retours utilisateur).
- **Décisions** :
  - **Back-office admin** : même paradigme que l'app — **sidebar dédiée** sur toutes les pages
    `/admin` (desktop) + bottom-nav (mobile). L'admin est **redirigé directement vers `/admin`**
    (un admin sur `/app` est renvoyé vers `/admin`) ; « Retour à l'app » supprimé.
  - **Déconnexion** unique (sidebar + icône en-tête mobile), **redirige vers l'accueil** `/`.
  - **Auth verrouillée** : un utilisateur connecté ne peut pas accéder à `/connexion` ni
    `/inscription` (redirigé vers son espace par le layout `(auth)`, côté serveur). Ces pages sont
    dans un groupe `(auth)` avec navbar mais **sans footer** (évite le défilement).
  - **Gestion des utilisateurs (admin)** : filtres (recherche/rôle/statut/ville) + pagination +
    actions **suspendre / annuler l'abonnement / supprimer**, chacune derrière une **boîte de
    dialogue de confirmation** (avec détails d'abonnement). Suppression et annulation via
    **routes serveur** (`/api/admin/users`) qui vérifient le rôle admin et n'emploient la clé
    **service_role** que côté serveur.
  - **Suppression de son propre compte (RGPD)** via `DELETE /api/account` (service_role, cascade).
  - **Configuration du site** : page `/admin/parametres` éditant les **tarifs** (table `settings`,
    lus par le paiement et la page Tarifs).
  - **Contact prestataire** : téléphone jamais public ; révélé aux connectés via la fonction
    SECURITY DEFINER `candidate_phone` (migration `20260901000006`), avec Appeler / WhatsApp.
  - **Pagination** généralisée à toutes les listes volumineuses (composant `Pagination` par liens,
    préserve les filtres, revient à la page 1 au changement de filtre).
- **Conséquences** : cohérence de navigation app/admin ; opérations sensibles protégées côté
  serveur ; conformité RGPD (auto-suppression) ; tarifs modifiables sans redéploiement.
- **Impact** : produit + sécurité + architecture — niveau élevé.

---

## ADR-006 — Modèle marketplace : navigation publique sans connexion

- **Date** : 2026-09-01
- **Statut** : Accepté
- **Décideur** : Utilisateur (spec UX/UI détaillée) + Claude
- **Contexte** : L'utilisateur veut un parcours marketplace (façon Amazon) : découvrir → chercher
  → consulter, **sans compte**, la connexion n'intervenant que pour agir (contacter, postuler,
  favori, message). Le mur de connexion initial devait sauter.
- **Décision** :
  - **Catalogue public = nounous/prestataires** (choix utilisateur). Les offres d'emploi ont aussi
    une page publique (`/offres`) pour les candidates. Catégories inchangées (aide à domicile).
  - **RLS élargie** (migration `20260901000005`) : lecture publique (anon) des `candidate_profiles`
    activés, des `employer_profiles` et des `ratings`. Le **téléphone reste privé** (jamais dans
    `public_profiles`). Les offres actives étaient déjà publiques.
  - Pages publiques (groupe `(public)`, avec navbar+footer) : accueil marketplace, `/nounous`,
    `/nounous/[id]`, `/offres`, `/offres/[id]`, `/connexion`, `/inscription`.
  - Actions sensibles (contacter/postuler/favori) → CTA « Se connecter / Créer un compte » avec
    `?redirect=` vers l'action.
  - **Inscription** progressive : rôle + prénom + nom + téléphone → OTP → compte créé → dashboard
    (plus d'étape onboarding séparée ; infos complétées ensuite dans le profil).
- **Alternatives écartées** : catalogue = offres (moins aligné au hero « Trouvez la nounou ») ;
  marketplace généraliste avec jardinage/transport (hors périmètre INTAKE).
- **Conséquences** : accueil devient dynamique (données live). Profils prestataires publics =
  choix assumé de visibilité (documenté). Meilleure conversion (découverte avant inscription).
- **Impact** : métier + sécurité (visibilité) + architecture — niveau élevé.

---

## ADR-005 — Auth : OTP téléphone natif Supabase (plutôt qu'un flux OTP maison)

- **Date** : 2026-09-01
- **Statut** : Accepté
- **Décideur** : Claude (rôle : security-engineer / backend)
- **Contexte** : L'INTAKE décrit une Edge Function d'envoi/vérification OTP maison. Avec Next.js +
  Supabase SSR, l'auth téléphone native de Supabase (`signInWithOtp` / `verifyOtp`) fournit des
  **sessions réelles et sécurisées** (JWT, cookies httpOnly côté SSR, RLS via `auth.uid()`).
  Un flux maison devrait re-fabriquer des sessions à la main (risqué, non standard).
- **Décision** : Utiliser l'**OTP téléphone natif**. En **local**, `[auth.sms.test_otp]` fournit
  un code fixe (`123456`) sans SMS réel. En **prod**, on active un fournisseur SMS dans les
  réglages Auth Supabase (LeTexto/Twilio…). Une interface `SmsProvider` reste prévue (ADR-002)
  pour les SMS **critiques non-OTP** (candidature acceptée, etc.).
- **Alternatives écartées** : OTP maison (`otp_codes` + Edge Function) — table conservée pour un
  éventuel usage futur, mais non utilisée pour l'auth. Rejeté : complexité + sécurité des sessions.
- **Conséquences** : Auth standard, sûre, prête pour la prod. En dev local, tester avec les numéros
  déclarés dans `config.toml` (ou en ajouter).
- **Impact** : sécurité + fonctionnel — niveau élevé.

---

## ADR-004 — Supabase en local via Docker (CLI) pour le développement

- **Date** : 2026-09-01
- **Statut** : Accepté
- **Décideur** : Utilisateur + Claude
- **Contexte** : L'utilisateur veut « implémenter tout » (schéma + RLS + fonctions) et « faire les
  tests plus tard localement sur Docker ». Pas de provisionnement d'un projet distant maintenant.
- **Décision** : Utiliser la **Supabase CLI** avec la stack locale **Docker** (`supabase start`).
  Tout le SQL vit dans `/supabase/migrations`, un `seed.sql` crée l'admin + les `settings`.
  Les Edge Functions vivent dans `/supabase/functions`. Un `.env.example` documente les clés.
- **Alternatives écartées** : Provisionner un projet cloud maintenant — différé (coût/compte,
  non nécessaire pour développer et tester en local).
- **Conséquences** : Dev/test 100 % local et reproductible ; passage au cloud = `supabase link` +
  `db push` plus tard (tâche manuelle documentée).
- **Impact** : technique + financier (différé) — niveau moyen.

---

## ADR-003 — Stack frontend : Next.js 14 (App Router) — remplace ADR-001

- **Date** : 2026-09-01
- **Statut** : Accepté (remplace ADR-001)
- **Décideur** : Utilisateur (« choisis ce qui est mieux, moderne, Hostinger ou Vercel OK ») + Claude
- **Contexte** : L'utilisateur a levé la contrainte « Vite/Hostinger statique » de l'INTAKE et
  demandé la meilleure option moderne, tout hébergement accepté.
- **Décision** : **Next.js 14 App Router + TypeScript + Tailwind + shadcn/ui + Supabase + TanStack
  Query + Zod**, **installable en PWA** (Serwist/next-pwa : manifest + service worker + offline
  basique). Déploiement Vercel **ou** VPS (Node) — au choix plus tard.
- **Justification** : (1) stack native du skill et de `CLAUDE.md` → toolchain cohérente
  (Vitest/Playwright/GitHub Actions) ; (2) **SSR/SEO** pour les pages publiques de la marketplace ;
  (3) **RSC** = moins de JS côté client → bon pour Android/réseau lent ; (4) PWA conservée.
- **Alternatives écartées** : React + Vite (ADR-001) — SEO client plus faible pour des pages
  publiques dont dépend la découverte du service.
- **Conséquences** : Auth/RLS Supabase gérées côté serveur (route handlers/server actions) ; PWA
  offline un peu plus de travail qu'avec Vite (accepté).
- **Impact** : technique + architecture — niveau élevé (structurant).

---

## ADR-002 — Paiement & SMS OTP : couche d'abstraction + mock en dev

- **Date** : 2026-09-01
- **Statut** : Accepté
- **Décideur** : Claude (rôle : solution-architect)
- **Contexte** : L'INTAKE impose Mobile Money (Orange, MTN, Moov, Wave) et OTP SMS, mais autorise
  explicitement un mock/sandbox en dev, l'agrégateur réel étant branché plus tard. Le choix
  du fournisseur (CinetPay, PayDunya, Djamo… / LeTexto, Twilio…) a un impact financier et légal.
- **Décision** : Définir une **interface `PaymentProvider`** et une **interface `SmsProvider`**
  côté Edge Functions. Fournir une implémentation `MockProvider` en dev (code OTP loggué, callback
  paiement simulé). Le vrai fournisseur sera branché plus tard sans toucher au reste du code.
- **Alternatives écartées** : Coder directement contre un agrégateur — rejeté (verrou fournisseur,
  impact financier prématuré, non demandé maintenant).
- **Conséquences** : MVP démontrable sans compte payant ; bascule vers le réel = 1 implémentation.
- **Impact** : technique + financier (différé) — niveau moyen.

---

## ADR-001 — Stack frontend : React + Vite (dérogation à la stack par défaut Next.js)

- **Date** : 2026-09-01
- **Statut** : ⛔ Remplacé par ADR-003 (l'utilisateur a levé la contrainte Vite/Hostinger)
- **Décideur** : Claude (rôle : solution-architect)
- **Contexte** : La stack par défaut du skill (et de `CLAUDE.md`) est **Next.js**. L'`INTAKE.md`
  (cahier des charges, qui fait foi) **impose React + Vite + TypeScript + Tailwind + shadcn/ui**
  et une **PWA installable** servie en build statique sur **VPS Hostinger (Nginx)**.
- **Décision** : Suivre l'INTAKE → **React 18 + Vite + TypeScript**, PWA via `vite-plugin-pwa`,
  routing via `react-router-dom`, données via **TanStack Query**, validation **Zod**, backend
  **Supabase**. Déploiement = build statique servi par Nginx (pas Vercel/SSR).
- **Alternatives écartées** : Next.js (défaut du skill) — rejeté car l'INTAKE impose Vite/PWA
  statique et une cible Hostinger/Nginx sans besoin de SSR.
- **Conséquences** : Pas de SSR/SEO serveur natif → le SEO des pages publiques sera traité côté
  client + pré-rendu si nécessaire (rôle SEO). Bundle plus léger, adapté à la cible Android/réseau lent.
- **Impact** : technique + architecture — niveau élevé (structurant), aligné sur l'exigence.

---

## ADR-000 — Modèle d'enregistrement

- **Date** : 2026-09-01
- **Statut** : Accepté
- **Contexte** : Ce fichier établit le format des décisions.
- **Décision** : Utiliser ce gabarit pour toute décision ayant un impact sur l'architecture,
  les dépendances, la sécurité, le coût ou le comportement produit.
- **Alternatives écartées** : Documentation ad hoc dispersée — rejetée car non traçable.
- **Conséquences** : Traçabilité complète ; l'utilisateur peut revenir sur tout choix.

---

<!-- Copier ce bloc pour chaque nouvelle décision :

## ADR-NNN — <titre court>

- **Date** :
- **Statut** : Proposé / Accepté / Remplacé par ADR-XXX
- **Décideur** : Claude (rôle : <ex. solution-architect>)
- **Contexte** :
- **Décision** :
- **Alternatives écartées** :
- **Conséquences** :
- **Impact** :

-->

## 2026-09-03 — Avatar vide par défaut + édition de profil pour admin/staff
- **Décideur** : Claude (frontend + product)
- **Contexte** : À la création d'un profil (ex. admin créé par le Super Admin), la zone
  photo affichait les initiales sur pastille colorée, perçu comme une « photo assignée
  automatiquement ». Aucun visuel n'est réellement stocké (`profiles.photo_url` = null).
  Par ailleurs, `app/layout.tsx` redirige les admins hors de `/app`, et aucune page
  d'édition de profil n'existait côté `/admin` : les admins/staff ne pouvaient pas
  modifier leur profil (photo, nom, prénom).
- **Décision** :
  1. `Avatar` (composant partagé) : état sans photo = **silhouette neutre vide**, plus
     d'initiales. La zone reste vide tant que l'utilisateur n'a pas choisi de photo.
  2. Nouvelle page `/admin/profil/modifier` réutilisant `ProfileEditForm` (rôle admin →
     seules les infos communes : photo, prénom, nom, ville, commune). Liens ajoutés dans
     la sidebar admin (bloc avatar) et l'en-tête mobile admin. `ProfileEditForm` navigue
     désormais selon le rôle (`backHref`).
- **Alternatives écartées** : garder les initiales (rejeté par le PO) ; autoriser les
  admins dans `/app` (aurait affiché la nav candidat/employeur, incohérent).
- **Conséquences** : l'état « sans photo » est uniforme dans toute l'app (header, listes,
  profils). `ProviderPhoto` (catalogue public des nounous) reste inchangé (dégradé +
  initiales voulus côté marketing).
- **Impact** : fonctionnel (UX), non destructif, réversible. RLS `profiles_update_own_or_admin`
  couvre déjà l'auto-édition (`id = auth.uid()`).
