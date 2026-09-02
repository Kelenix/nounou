# Plan de réalisation — « J'ai ma nounou »

_Phase 0 (Cadrage) — à valider avant de coder. Mode : PLAN_PUIS_VALIDATION._

## 1. Compréhension du besoin (reformulation)

**Objectif.** Livrer une **PWA mobile-first en français** de mise en relation entre familles/
particuliers (**employeurs**) et aides à domicile (**candidates** : ménage, cuisine, garde
d'enfants…) en **Côte d'Ivoire**. Fil conducteur : **la confiance**. Cible : smartphone Android,
réseau parfois lent → **légèreté et performance prioritaires**. Monnaie **FCFA (XOF)**, tél. **+225**.

**Rôles produit.** Candidate · Employeur · Administrateur.

**Périmètre de cette itération (MVP).**
1. Auth téléphone + **OTP SMS** (mock en dev). 2. Profils candidate & employeur (photo Storage).
3. Publication d'offres (employeur). 4. Liste/détail/filtres d'offres (candidate) + **Postuler**.
5. Recherche de candidates + filtres (employeur). 6. Candidatures + statuts + tableaux de bord.
7. Notifications temps réel. 8. Notation mutuelle + signalement. 9. Back-office admin + stats.
10. Paiement Mobile Money (**sandbox/mock isolé**). 11. Messagerie interne (après le cœur).
12. Pages publiques (accueil, comment ça marche, tarifs, FAQ, contact, CGU, confidentialité).

**Hors-périmètre (V2, ne pas coder, mais ne pas bloquer l'archi).** Matching par score %,
vérification d'identité par upload de pièce, abonnements/profils sponsorisés, app native,
options avancées de contrat (salaire/logée/type détaillés).

**Hypothèses retenues (comblent des vides du cahier des charges).**
- H1 — Numéro CI = **+225 puis 10 chiffres** ; validation stricte via Zod.
- H2 — En dev, l'**OTP est loggué** (pas de SMS réel) ; le **callback paiement est simulé**.
- H3 — Tarifs lus depuis la table `settings` (activation candidate 1 000 FCFA, premium employeur
  2 000 FCFA), **modifiables en admin**.
- H4 — Le compte **admin** est créé manuellement (seed) — pas d'auto-inscription admin.
- H5 — Langue unique **français** ; pas d'i18n multi-langue dans le MVP.
- H6 — SEO : pages publiques optimisées côté client (+ pré-rendu léger si besoin), pas de SSR.

## 2. Architecture cible (résumé — détaillée en phase 3)

- **Frontend** : React 18 + **Vite** + TypeScript + Tailwind + **shadcn/ui** + lucide-react.
  PWA via `vite-plugin-pwa` (manifest + service worker, install prompt, offline basique).
  Routing `react-router-dom`, données **TanStack Query**, formulaires `react-hook-form` + **Zod**.
- **Backend** : **Supabase** — Postgres (+ **RLS sur toutes les tables**), Auth (téléphone/OTP),
  Storage (photos), **Edge Functions** (envoi/vérif OTP, initiation & callback paiement).
- **Abstraction fournisseurs** : interfaces `SmsProvider` et `PaymentProvider` → `MockProvider`
  en dev, agrégateur réel branché plus tard sans refonte (cf. ADR-002).
- **Structure** : `/src/features/*` (auth, profiles, offers, applications, ratings, reports,
  payments, notifications, admin, messaging), `/src/components`, `/src/lib`, `/src/hooks`,
  `/src/pages`, `/supabase/migrations`, `/supabase/functions`.
- **Déploiement** : build statique → **Nginx** sur **VPS Hostinger** ; Supabase managé (cf. ADR-001).

## 3. Découpage en incréments verticaux (ordonnés)

| ID | Incrément | Exigence | Critères d'acceptation (résumé) |
|----|-----------|----------|----------------------------------|
| **Inc-0** | Fondations | §1,§2 | Projet démarre (`npm run dev`), thème + nav bottom-bar, PWA installable, schéma SQL + RLS migrés, `.env.example`. |
| **Inc-1** | Auth OTP | MVP-1 | Saisie +225 → OTP (loggué en dev) → session ; garde de routes. |
| **Inc-2** | Profils | MVP-2 | Créer/éditer profil candidate & employeur, upload photo, badge « téléphone vérifié ». |
| **Inc-3** | Offres | MVP-3,4 | Employeur publie/ferme une offre ; candidate liste + filtre + détail + postuler. |
| **Inc-4** | Recherche candidates | MVP-5 | Employeur filtre les candidates ; vue profil ; favoris. |
| **Inc-5** | Candidatures + dashboards | MVP-6 | Statuts EN_ATTENTE→…→ANNULEE ; tableaux de bord candidate/employeur. |
| **Inc-6** | Notifications | MVP-8 | Realtime in-app sur candidature/paiement/etc. ; hook SMS critique (mock). |
| **Inc-7** | Notation + signalement | MVP-9,10 | Note mutuelle post-expérience + moyenne affichée ; signalement avec motif. |
| **Inc-8** | Admin + stats | MVP-12 | Back-office protégé : gestion entités, suspension, tarifs, stats de base. |
| **Inc-9** | Paiement | MVP-7 | Edge Function init + callback simulé ; transactions tracées ; active profil/premium. |
| **Inc-10** | Messagerie | §3.13 | Conversations/messages entre employeur↔candidate. |
| **Inc-11** | Pages publiques | Pages | Accueil (hero+stats+confiance), tarifs, FAQ, contact, CGU, confidentialité. |

> Ordre de livraison : **cœur d'abord** (Inc-0→5) + pages publiques (Inc-11 en parallèle léger),
> puis Inc-6→9, puis messagerie (Inc-10). Chaque incrément : lint + types + tests + revue avant « fait ».

## 4. Séquence des phases et rôles activés

Phase 0 Cadrage (ici) → 1 Product Owner → 2 Project Manager → 3 Architecte + System Design +
Database Architect → 3bis UI/UX → 4 Implémentation par incrément (Backend ⇄ Frontend, Sécurité
en continu) → 5 QA + Code Reviewer (par incrément) → 6 DevOps + Release → 7 Documentation →
8 Maintenance. Chargement progressif : un fichier de rôle par phase.

## 5. Risques & parades

- **Paiement/OTP réels non branchés** → abstraction + mock isolé (ADR-002) ; tâche manuelle listée.
- **RLS mal configurée = fuite de données** → RLS obligatoire + tests d'accès par rôle (Sécurité/QA).
- **Réseau lent / Android** → bundle léger, lazy-loading, images compressées, cache PWA (Perf).
- **Divergence stack Next.js vs Vite** → tranchée par ADR-001 (INTAKE fait foi), à confirmer (Q1).
- **SEO sans SSR** → pré-rendu léger des pages publiques si nécessaire (rôle SEO).

## 6. Tâches manuelles utilisateur prévues

Voir `docs/manual-tasks.md` : compte Supabase (ou autorisation de provisionner), `.env.local`,
VPS Hostinger + domaine, fournisseurs SMS/Mobile Money (différés), validation textes légaux.

## 7. Questions ouvertes (à fort impact — regroupées)

1. **Stack** — Confirmer **React + Vite** (imposé par l'INTAKE) plutôt que Next.js (défaut du skill).
2. **Supabase** — Dois-je **provisionner un vrai projet Supabase maintenant** (outil connecté) ou
   **générer les migrations en local** pour que tu les appliques toi-même ?
3. **Portée de l'itération** — Vais-je jusqu'au **cœur MVP** (Inc-0→5 + pages publiques) puis
   je te rends la main, ou j'enchaîne **tout le MVP** (jusqu'à Inc-9/10) d'un trait ?
