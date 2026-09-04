# État du projet — PROJECT_STATE — « J'ai ma nounou »

> Mis à jour à la fin de chaque phase / incrément. Toujours lire ce fichier avant d'agir.

## Snapshot

- **Phase courante** : 6 — Mise en production (phases 0→5 terminées : MVP + P1/P2 + qualité vertes ;
  **lot de durcissement sécurité S1/S4/S5/S6/S8/S9 appliqué**, CI en place). Reste : branchements
  paiement/SMS réels + déploiement. **Synthèse claire fait/à-faire : voir `RAPPORT.md`.**
- **Dernière mise à jour** : 2026-09-03
- **Santé** : 🟢 OK — **typecheck vert, lint vert, 9 tests unitaires verts, 11 tests E2E Playwright
  verts (+ setup/teardown, rejoués le 2026-09-03 sur la base locale).** Vérifié en local (Docker +
  navigateur) sur les parcours clés. Protections Super Admin testées en base (trigger + index unique) **et via E2E (API 403)**.
- **P1–P2 terminés** : notation mutuelle, messagerie interne, notifications temps réel (Realtime).
- **Stack** : Next.js 15 (App Router) · TypeScript · Tailwind + shadcn-like · Supabase
  (Postgres + RLS + Auth téléphone/OTP + Storage + Edge/route handlers) · TanStack Query · Zod ·
  Vitest. PWA installable. Voir `DECISION_LOG.md`.
- **Supabase local (Docker)** : API 54331 · DB 54332 · Studio 54333 · Mailpit 54334 (ports décalés
  pour cohabiter avec la stack `melodie-ai`, analytics désactivé). Dev : http://localhost:3000.
- **Prochaine action** : branchement d'un vrai agrégateur Mobile Money + fournisseur SMS, puis
  déploiement (Vercel ou VPS + Supabase cloud).

## Ce qui est livré (fonctionnel + vérifié)

- **Marketplace publique (sans connexion)** : accueil (hero + recherche + services + catalogue
  nounous), `/nounous` (+ filtres + pagination), `/nounous/[id]` (fiche complète, photo, compétences,
  dispo, ancienneté), `/offres` (+ filtres + pagination), `/offres/[id]`. Contact/postuler/favori =
  connexion requise (avec `?redirect=`).
- **Auth** : OTP téléphone natif Supabase. **Inscription** progressive (rôle + prénom + nom +
  téléphone → OTP → compte). **Connexion** (téléphone → OTP). Pages en 2 colonnes (logo + formulaire),
  navbar sans footer. **Un connecté ne peut pas accéder à connexion/inscription** (redirigé).
- **Espace app (candidate/employeur)** : sidebar desktop + bottom-nav mobile ; tableau de bord,
  recherche, offres (employeur), candidatures (avec « voir le profil » avant d'accepter), favoris,
  messages (stub), notifications (marquage lu auto → badge disparaît), profil + édition (compétences),
  paramètres (dont **suppression de son propre compte** RGPD), paiement mock (activation/premium).
- **Contact révélé aux connectés** : téléphone + boutons Appeler / WhatsApp sur la fiche candidate.
- **Back-office admin** : sidebar dédiée (admin arrive directement sur `/admin`), tableau de bord +
  stats, **utilisateurs** (filtres + pagination + suspendre / annuler l'abonnement / supprimer, avec
  **dialogues de confirmation** et détails d'abonnement), offres (pagination), signalements
  (pagination + traitement), **paramètres du site** (tarifs configurables + catégories).
- **Interface multilingue FR/EN** : `next-intl` (cookie, sans préfixe d'URL, défaut FR),
  sélecteur globe dans les 3 en-têtes, tout le périmètre traduit (public + app + admin, dont
  CGU/confidentialité), 719 clés à parité, dates localisées.
- **Hiérarchie d'administration** : **Super Admin** (compte protégé côté base — ni supprimable,
  ni rétrogradable, ni suspendable, un seul autorisé ; crée les admins, attribue/révoque les
  permissions, voit le journal d'audit, tableau de bord complet dont CA) · **Staff/Admin**
  (permissions déléguées par section : utilisateurs, offres, signalements, paramètres) ·
  **Utilisateur**. Journal d'audit des actions sensibles (`/admin/journal`). Gestion des admins
  sur `/admin/administrateurs`.
- **Sécurité** : RLS sur toutes les tables ; vue `public_profiles` sans téléphone ; RPC
  `candidate_phone` (téléphone révélé aux connectés) ; routes serveur admin/compte protégées
  (vérif rôle + service_role côté serveur uniquement).
- **Transverse** : pagination sur toutes les listes volumineuses, animations CSS (perf réseau lent),
  cartes « photo d'abord » (photos de démo bundlées `public/demo/`).

## Avancement par phase

| Phase | État | Notes |
|-------|------|-------|
| 0 — Cadrage & intake        | ✅ fait | INTAKE, plan, docs de pilotage |
| 1 — Définition produit      | ✅ fait | périmètre MVP + marketplace |
| 2 — Planification           | ✅ fait | incréments verticaux |
| 3 — Architecture & design   | ✅ fait | schéma + RLS + design system |
| 4 — Implémentation          | ✅ fait | MVP + marketplace + admin + P1/P2 (notation, messagerie, Realtime). Reste : branchements réels paiement/SMS = tâches manuelles (comptes fournisseurs) |
| 5 — Qualité                 | ✅ fait | build (42 routes), typecheck, lint, 9 tests unitaires **et 12 tests E2E Playwright** verts |
| 6 — Mise en production      | 🔄 en cours | CI GitHub Actions ✅ en place ; reste : branchements paiement/SMS réels + déploiement Vercel/VPS + Supabase cloud |
| 7 — Documentation           | ✅ fait | README, PROJECT_STATE, DECISION_LOG, manual-tasks à jour (doc « pro/publiable » optionnelle non faite) |
| 8 — Maintenance             | ⬜ à faire | passation après mise en prod |

> États : ⬜ à faire · 🔄 en cours · ✅ fait · ⏸️ en attente (raison)

## Backlog incréments

| ID | Incrément | Priorité | État |
|----|-----------|----------|------|
| Inc-0 | Fondations (Next.js 15, Tailwind, PWA, schéma + RLS) | P0 | ✅ |
| Inc-1 | Auth téléphone + OTP + inscription progressive | P0 | ✅ |
| Inc-2 | Profils candidate & employeur (+ upload photo) | P0 | ✅ |
| Inc-3 | Offres : publication + liste + détail + filtres | P0 | ✅ |
| Inc-4 | Recherche de candidates + filtres + favoris | P0 | ✅ |
| Inc-5 | Candidatures + statuts + tableaux de bord | P0 | ✅ |
| Inc-6 | Notifications (liste + triggers + **Realtime** badge/toast) | P1 | ✅ |
| Inc-7 | Signalement + **Notation mutuelle** (employeur↔candidate + avis) | P1 | ✅ |
| Inc-8 | Back-office admin (stats, users, offres, signalements, paramètres) | P1 | ✅ |
| Inc-9 | Paiement Mobile Money (mock isolé, provider swappable) | P1 | ✅ (mock) |
| Inc-10 | **Messagerie interne** (conversations + fil + envoi + Realtime) | P2 | ✅ |
| Inc-11 | Pages publiques + marketplace + pagination partout | P1 | ✅ |
| Inc-12 | Gestion admin des utilisateurs (suspension/abo/suppression) | P1 | ✅ |
| Inc-13 | Suppression de son propre compte (RGPD) | P1 | ✅ |
| Inc-14 | Paramètres du site (tarifs configurables) | P1 | ✅ |
| Inc-15 | Hiérarchie Super Admin / Staff / Utilisateur (permissions + protections backend) | P1 | ✅ |

### Reste à faire
- **Paiement/SMS réels** : brancher un agrégateur derrière `PaymentProvider` / un fournisseur SMS.
- **Déploiement** (Vercel ou VPS + Supabase cloud).
- (Optionnel) badge Realtime pour la messagerie côté mobile, notifications push.
- (Optionnel) élargir la couverture E2E (parcours candidature/messagerie de bout en bout).

## Blocages

- (aucun).

## Tâches manuelles utilisateur

- voir `docs/manual-tasks.md`.

## Journal de session (le plus récent en haut)

- 2026-09-04 — **Préparation du déploiement VPS (Docker) + login Google opérationnel.**
  Login Google branché et vérifié en local (Supabase local + console Google). Correctif base :
  fonction de garde `profiles_guard_self_update` réalignée sur la migration (autorise la 1ʳᵉ
  saisie du téléphone à l'onboarding) — débloque le choix de rôle. **Scaffolding de déploiement**
  ajouté : `next.config` en `output: "standalone"`, `sharp` installé (optimisation images
  auto-hébergée), `Dockerfile` multi-étapes + `.dockerignore`, `deploy/deploy.sh` (build+run en
  une commande, port `127.0.0.1:3002`), `deploy/nginx/jaimanounou.com.conf` (reverse proxy),
  `.env.production.example`, `.gitignore` durci (`.env.production`). Runbook complet :
  `docs/deploiement-vps.md`. **Build prod vérifié vert (44 routes).** Cible : app sur VPS Hostinger,
  base sur Supabase Cloud `lssqjjqszhwqetcifdpu`, domaine `jaimanounou.com`, **lancement Google-only**
  (SMS différé). Reste manuel (toi) : push migrations cloud, config Auth Google cloud, DNS, exécution
  sur le VPS (blocs A→E du runbook).

- 2026-09-03 — **Paiement « prêt à recevoir les clés »** : couche multi-fournisseurs derrière
  `PaymentProvider`. Sélection par moyen (carte → `PAYMENT_CARD_PROVIDER`, Mobile Money →
  `PAYMENT_MOBILE_PROVIDER` ; mock par défaut). Squelettes **CinetPay / PayDunya / Stripe**
  (initiation + `parseWebhook` signé, vérif Stripe HMAC précise), **route webhook**
  `/api/paiement/webhook/[provider]`, helper partagé `confirm.ts` (activation **uniquement** sur
  webhook, idempotent), moyen **`carte`** ajouté (migration `20260903000006` + enum local), variables
  d'env documentées dans `.env.example`, formulaire (redirection + téléphone masqué pour la carte).
  **Vérifié** : typecheck + lint + **build 44 routes** verts. Reste manuel : clés + finalisation par
  fournisseur (non testable sans compte).
- 2026-09-03 — **Correctif Realtime (notifications + messagerie)** : le socket ne portait pas le
  JWT utilisateur avant de rejoindre le canal → la RLS bloquait la livraison (il fallait recharger
  la page). Ajout de `supabase.realtime.setAuth(session.access_token)` **avant** `.subscribe()`
  dans `realtime-notifications.tsx` et `realtime-messages.tsx`. Typecheck + lint verts.
- 2026-09-03 — **Rapport remis à plat** : `RAPPORT.md` reconstruit à partir du code réel (fait ✅ /
  reste ⬜), clair et scannable (l'ancien mélangeait verdict initial et correctifs → illisible ;
  il avait aussi été supprimé au dernier commit). **Mentions légales complétées** : identité de
  l'éditeur (« J'ai ma nounou », entreprise individuelle, en ligne), e-mail `lionelkelenix@gmail.com`
  (CGU + confidentialité + page Contact), sous-traitants nommés (Supabase, Stripe/Djamo/PayDunya,
  Hostinger). **Vérifié** : typecheck + lint + 9 tests unitaires verts.
- 2026-09-03 — **Lot de durcissement sécurité (S1/S4/S5/S6/S8/S9)** suite à la revue de sécurité
  (cf. `RAPPORT.md` + `DECISION_LOG.md`) : trigger anti-élévation de privilège sur `profiles` (S1),
  en-têtes HTTP + CSP (S4), rate-limiting signalements + paiement (S5), révélation de téléphone
  journalisée/plafonnée (S6), bucket `avatars` durci serveur (S8), table `otp_codes` supprimée (S9).
  S7 conservé et documenté (risque faible accepté). CI GitHub Actions ajoutée. **Reste manuel** :
  paiement réel (S2) + fournisseur SMS prod (S3).
- 2026-09-03 — **Interface multilingue FR/EN** (next-intl, mode cookie sans préfixe d'URL,
  défaut FR). Sélecteur de langue (globe FR/EN) dans les 3 en-têtes (public, app, admin).
  **Tout le périmètre traduit** : public (accueil, catalogue, offres, fiches, tarifs, FAQ,
  contact, comment ça marche, **CGU/confidentialité** en versions FR/EN), auth (OTP), espace
  connecté (dashboards, recherche, candidatures, favoris, messagerie, notifications, profil +
  édition, paiement, signalements) et **back-office admin** (utilisateurs, offres, signalements,
  paramètres, administrateurs, journal d'audit). Dictionnaires `messages/fr.json` + `en.json`
  (**719 clés, parité 100 %**), dates localisées (`dateLocale`). **Vérifié** : build prod vert,
  typecheck + lint verts, bascule FR↔EN testée en production. Corrigé au passage : en-tête
  `Permissions-Policy` (`interest-cohort` retiré), icônes PWA générées depuis le logo, `priority`
  sur le logo (LCP).
- 2026-09-03 — **Tests E2E Playwright** (`e2e/`, 12 tests + setup/teardown, tous verts, ×2 stables).
  Couvre : marketplace publique (accueil/nounous/offres + gate de contact), login OTP par rôle
  (Super Admin → `/admin`, employeur → `/app`, redirection des connectés), et la **hiérarchie
  d'admin** — staff ne voit pas le Super Admin, pages réservées → `/admin`, et **API 403** sur
  toute action du staff visant le Super Admin (delete/set_role/suspend). Auth mutualisée via
  `storageState` (setup unique par rôle → limite les envois OTP), compte staff de test restauré en
  teardown. Scripts `test:e2e*`, artefacts ignorés par git.
- 2026-09-02 — **Hiérarchie de rôles Super Admin / Staff / Utilisateur** (migration
  `20260902000003_super_admin`). Colonnes `is_super_admin` + `staff_permissions[]` sur `profiles`.
  **Protections appliquées côté base (non contournables via l'API/interface)** : trigger
  `protect_super_admin` (refuse suppression, rétrogradation et suspension du Super Admin, même en
  `service_role`) + index unique `one_super_admin_idx` (un seul Super Admin). Sections déléguables
  au staff : utilisateurs, offres, signalements, paramètres (`canAccess`). Seul le Super Admin crée
  des admins, assigne/révoque les permissions et voit le **journal d'audit** (`admin_audit_log`,
  RLS lecture admins, écriture service_role). Pages `/admin/administrateurs` et `/admin/journal`,
  sidebar & tableau de bord adaptés au rôle (CA visible Super Admin/paramètres). **Tests base OK** :
  suppression/rétrogradation/suspension du Super Admin refusées ; staff gérable ; 2ᵉ Super Admin
  refusé. Typecheck + lint verts.
- 2026-09-02 — Back-office : **création d'un nouvel administrateur** (paramètres, via service_role ;
  promeut un compte existant si le numéro existe) + **assignation/changement de rôle** des
  utilisateurs (candidate/employeur/admin) avec confirmation. Correctif RLS marquage messages « lu ».
- 2026-09-02 — **P1–P2 finis** : notation mutuelle (5 critères + avis), messagerie interne
  (conversations + fil + envoi, vérifiée en base), notifications temps réel (migration
  `20260902000001_realtime` : publication supabase_realtime + abonnements). Build 38 routes vert.
- 2026-09-02 — Marketplace publique, refonte auth (2 colonnes, redirection des connectés),
  refonte admin (sidebar, gestion utilisateurs complète + confirmations, paramètres du site),
  pagination généralisée, suppression de compte (RGPD), photos & UX. Build 36 routes vert.
- 2026-09-01 — Cœur MVP (Inc-0→5) + pages publiques + admin + paiement mock ; Supabase local Docker.
