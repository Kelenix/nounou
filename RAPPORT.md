# RAPPORT D'ANALYSE — « J'ai ma nounou »

> Analyse indépendante et approfondie du code réel, confrontée au cahier des charges
> (`INTAKE.md`), avec un focus **sécurité des données personnelles** (téléphone, adresse
> ville/commune, e-mail à venir).
> **Date** : 2026-09-03 · **Analyste** : Claude (revue de code + sécurité)
> **Méthode** : lecture directe du code (routes serveur, RLS, Storage, Auth, migrations),
> **sans me fier** aux affirmations de `PROJECT_STATE.md`.

---

## 1. Résumé exécutif

Le produit est **fonctionnellement très avancé** : la quasi-totalité du périmètre MVP est
codée, avec une architecture propre, typée et modulaire. La couche d'autorisation côté
serveur (routes admin, hiérarchie Super Admin/Staff, journal d'audit) est **de bonne
qualité**.

**MAIS le projet n'est PAS prêt à être mis en ligne en l'état**, pour deux raisons majeures :

| # | Problème | Gravité | Impact |
|---|----------|---------|--------|
| 🔴 1 | **Élévation de privilège** : un simple utilisateur peut se transformer en **administrateur** depuis son navigateur → accès à **tous les numéros de téléphone** et données de tous les comptes. | **CRITIQUE** | Fuite totale des PII. Bloquant absolu. |
| 🔴 2 | **Paiement Mobile Money = simulateur** : toute transaction est marquée « réussie » sans argent réel. | **BLOQUANT LANCEMENT** | Aucune recette réelle ; activations offertes. |

**Verdict** : 🟠 **« Prêt à ~85 %, mais NON déployable »** tant que le point 🔴 1 n'est pas
corrigé. Le point 1 se corrige en **une migration SQL** (fournie en §7). Le point 2 est une
tâche d'intégration fournisseur (attendue, déjà isolée derrière une interface).

> ### ✅ MISE À JOUR — corrections appliquées le 2026-09-03
> Les corrections suivantes ont été **implémentées et vérifiées** après ce rapport
> (migrations appliquées, build/lint/typecheck/9 tests unitaires **verts**) :
>
> | Réf | Correction | État |
> |-----|-----------|------|
> | **S1** | Trigger anti-élévation de privilège (`20260903000001`) — vérifié en base (escalade + faux badge bloqués, flux légitimes OK) | ✅ **Corrigé** |
> | **S4** | En-têtes de sécurité HTTP + CSP (`next.config.mjs`) | ✅ **Corrigé** |
> | **S5** | Rate-limit signalements (trigger) + tentatives de paiement (route 429) + `[auth.rate_limit]` | ✅ **Corrigé** |
> | **S6** | `candidate_phone` journalisé + plafonné à 30/h (table `contact_reveals`) | ✅ **Corrigé** |
> | **S8** | Bucket `avatars` restreint (images, 5 Mio) au niveau serveur | ✅ **Corrigé** |
> | **S9** | Table `otp_codes` inutilisée supprimée | ✅ **Corrigé** |
> | **§6** | CGU + Politique de confidentialité étoffées (RGPD, placeholders à compléter) | ✅ **Corrigé** |
> | **§5** | Dépendances installées ; lint + typecheck + tests unitaires **verts** ; **build 42 routes OK** | ✅ **Vérifié** |
> | CI | Workflow GitHub Actions (`.github/workflows/ci.yml`) | ✅ **Ajouté** |
> | **S7** | `is_active`/`is_suspended` dans `public_profiles` : **conservés** — utilisés par la logique « masquer les comptes suspendus » (les utilisateurs ne peuvent pas lire `profiles` d'autrui). **Risque faible, accepté et documenté.** | 🟡 Documenté |
> | **S2** | Paiement Mobile Money réel + webhook signé | 🔴 **Reste manuel** (clés fournisseur) |
> | **S3** | Fournisseur SMS OTP de production | 🔴 **Reste manuel** (config Supabase) |
>
> **Nouveau verdict** : 🟢 pour un **lancement pilote** dès que S2 (paiement) et S3 (SMS) sont
> branchés — tous les défauts de sécurité corrigeables par le code sont traités.

> ⚠️ Écart avec `PROJECT_STATE.md` : ce fichier annonce « santé 🟢 OK, prêt, tests verts ».
> C'est **surévalué**. La faille critique n'y est pas vue, et les tests E2E Playwright
> annoncés « 12 verts » **ne sont pas exécutables actuellement** (dépendance non installée,
> cf. §5).

---

## 2. Inventaire des fonctionnalités vs cahier des charges

Légende : ✅ Prêt · 🟡 Partiel · 🔴 Manquant / à risque

### 2.1 Périmètre MVP (INTAKE §3)

| # | Fonctionnalité | État | Détail |
|---|----------------|------|--------|
| 1 | Inscription téléphone + **OTP SMS** | ✅ / 🟡 | Flux natif Supabase OTP complet (`signInWithOtp`/`verifyOtp`). **Fournisseur SMS réel non branché** (dev = code test). → tâche manuelle. |
| 2 | Choix du rôle candidate/employeur | ✅ | À l'inscription et à l'onboarding. |
| 3 | Profils candidate & employeur (création/édition) | ✅ | Formulaires complets, upload photo Storage. |
| 4 | Publication d'offres (employeur) | ✅ | `offer-form`, activation/clôture. |
| 5 | Recherche d'offres + filtres | ✅ | Public (`/offres`) et espace app, filtres + pagination. |
| 6 | Recherche de candidates + filtres | ✅ | `/nounous` + `/app/recherche`, filtres + pagination. |
| 7 | Candidatures + statuts | ✅ | 5 statuts, gestion employeur + suivi candidate. |
| 8 | **Paiement Mobile Money** | 🔴 | **Mock uniquement** (toujours « réussi »). Interface `PaymentProvider` bien isolée (bon), mais aucun agrégateur réel. Tarifs lus côté serveur depuis `settings` (bon). |
| 9 | Notifications in-app temps réel | ✅ | Supabase Realtime opérationnel. **SMS critiques : non implémentés** (hook prévu). |
| 10 | Notation mutuelle | ✅ | `rating-form`, moyenne affichée. |
| 11 | Signalement | ✅ | Motifs + traitement admin. |
| 12 | Back-office admin + stats | ✅ | **Très complet** : hiérarchie Super Admin/Staff, permissions par section, journal d'audit, stats (CA protégé). |
| 13 | Messagerie interne | ✅ | **Réelle** (pas un stub) : conversations, fil, non-lus, Realtime. |

### 2.2 Pages publiques & transverse

| Élément | État | Détail |
|---------|------|--------|
| Accueil, Comment ça marche, Tarifs, FAQ, Contact | ✅ | Présents. |
| CGU + Politique de confidentialité | 🟡 | Pages présentes mais **très courtes (~50 lignes)** — insuffisant juridiquement (RGPD/PII, cf. §6). |
| PWA installable (manifest + service worker + offline) | ✅ | Manifest + SW + page `/offline`. |
| **Interface FR/EN** (INTAKE §0) | 🔴 | **Français uniquement.** Le prompt dit « 100 % FR » mais l'entête demande FR/EN → à trancher (V2 possible). |
| Design system (vert #2E9E1F, arrondis, bottom-nav) | ✅ | Conforme à la maquette. |

### 2.3 Corrections déjà appliquées cette session
- ✅ Zone photo **vide par défaut** (plus d'initiales prises pour une photo assignée).
- ✅ **Admin/Staff peuvent éditer leur profil** (photo, nom, prénom) — page `/admin/profil/modifier` + liens.

---

## 3. Sécurité — analyse détaillée (priorité du projet)

### 🔴 CRITIQUE — S1 : Élévation de privilège vers « admin » (Broken Access Control)

**C'est le problème le plus grave. Il compromet directement la confidentialité de tous les
numéros de téléphone.**

**Mécanisme :**
- La politique RLS d'`UPDATE` sur `profiles` autorise un utilisateur à modifier **sa propre
  ligne** sans restriction de colonne :
  ```sql
  -- migrations/20260901000003_rls.sql
  create policy "profiles_update_own_or_admin" on public.profiles
    for update using (id = auth.uid() or public.is_admin())
    with check (id = auth.uid() or public.is_admin());
  ```
- La fonction d'admin repose uniquement sur la colonne `role` :
  ```sql
  -- migrations/20260901000001_init_schema.sql
  create function public.is_admin() ... select role = 'admin' from profiles where id = auth.uid();
  ```
- **Aucun trigger** n'empêche un utilisateur de changer sa propre colonne `role`.

**Conséquence :** n'importe quel compte connecté peut exécuter, depuis la console du
navigateur (clé anon + son JWT) :
```js
await supabase.from('profiles').update({ role: 'admin' }).eq('id', MON_ID)
```
→ `is_admin()` renvoie alors `true`. L'attaquant obtient immédiatement, **via la RLS** :
- lecture de **tous les `profiles`** → **tous les numéros de téléphone** ;
- lecture de **tous les `payments`**, `reports`, `messages`, `conversations` ;
- accès au back-office `/admin` (`requireRole('admin')` passe).

Il ne peut pas toucher au **Super Admin** (protégé par trigger + index unique), mais il
dispose d'un accès quasi total aux données personnelles de tous les utilisateurs.

**Corollaire (même faille) :** un utilisateur peut aussi se mettre
`verification_level = 'verified'` (faux badge de confiance) ou modifier `is_suspended`,
`phone_verified`, etc.

**Correctif :** verrouiller les colonnes sensibles via un trigger `BEFORE UPDATE`
(migration complète fournie en **§7.1**). Effort : ~30 min. **À faire avant toute mise en
ligne, et idéalement avant même d'ouvrir la base à des testeurs réels.**

---

### 🔴 BLOQUANT LANCEMENT — S2 : Paiement simulé

`features/payments/provider.ts` → `MockPaymentProvider` renvoie toujours `status: "reussi"`
et la route `/api/paiement` applique aussitôt l'activation/premium. **Aucun encaissement
réel, aucune vérification de callback.**
- ✅ Bon point : l'interface `PaymentProvider` est proprement isolée (ADR-002) → brancher
  CinetPay/PayDunya/Wave sans casser le reste.
- ✅ Bon point : le montant vient du serveur (`settings`), pas du client (pas de
  manipulation de prix).
- 🔴 À faire : implémentation réelle **+ webhook signé** confirmant le paiement avant
  d'activer (ne jamais activer sur la seule réponse d'initiation).

---

### 🟠 IMPORTANT — S3 : Fournisseur SMS OTP non configuré
Auth OTP native Supabase prête côté code, mais **aucun fournisseur SMS de production**
(Twilio/Vonage/LeTexto…) n'est configuré. Sans lui, personne ne reçoit de code en prod.
→ Tâche manuelle (config Supabase Auth), **bloquant lancement**.

### 🟠 IMPORTANT — S4 : En-têtes de sécurité HTTP absents
`next.config.mjs` ne définit **aucun** header de sécurité. Manquent notamment :
`Content-Security-Policy`, `X-Frame-Options` (anti-clickjacking), `X-Content-Type-Options`,
`Referrer-Policy`, `Strict-Transport-Security`, `Permissions-Policy`.
→ Correctif simple (config), fourni en §7.2.

### 🟡 MOYEN — S5 : Pas de limitation de débit (rate limiting)
Aucune protection sur : envoi OTP (coût SMS + abus), RPC `candidate_phone`
(**moissonnage possible de numéros** un par un), création de signalements, tentatives de
paiement. → Prévoir un throttling (au niveau Edge/proxy ou table de compteurs).

### 🟡 MOYEN — S6 : RPC `candidate_phone` — moissonnage
Le téléphone d'une candidate est révélé à **tout** utilisateur connecté (par UUID). C'est le
choix produit (contact des connectés), mais sans rate-limit ni journalisation, un compte peut
aspirer les numéros en masse. → Coupler au S5 + éventuel log d'accès.

### 🟡 MOYEN — S7 : Vue `public_profiles` expose `is_suspended` / `is_active`
La vue publique (lisible par `anon`) inclut `is_active` et `is_suspended` — informations
internes de modération qui n'ont pas à être publiques. → Retirer ces colonnes de la vue.

### 🟡 MOYEN — S8 : Bucket Storage `avatars` public, sans validation serveur
Bucket public, contrôle du **dossier** par utilisateur (bon), mais la validation de
type/taille est **uniquement côté client** (5 Mo). Un utilisateur peut y déposer un fichier
arbitraire dans son dossier. → Ajouter des restrictions de bucket (types MIME, taille) et
idéalement passer l'upload par une route serveur validante.

### 🟢 FAIBLE — S9 : Divers
- Table `otp_codes` (RLS deny-all) **inutilisée** (l'OTP passe par le schéma `auth` natif) → nettoyer.
- Vue `public_profiles` en **SECURITY DEFINER** implicite (contourne la RLS) : intentionnel
  mais à documenter/auditer (apparaîtra dans les *advisors* Supabase).

### ✅ Points forts sécurité (à conserver)
- Routes serveur admin : **vérification de rôle + permissions par section**, service_role
  **jamais** exposé au client, validation Zod systématique.
- Hiérarchie **Super Admin protégée au niveau base** (trigger `protect_super_admin` + index
  unique) — robuste, indépendant du front.
- **Journal d'audit** des actions sensibles.
- Séparation propre client anon / service_role ; `getServiceRoleKey()` côté serveur seul.
- RLS activée sur **toutes** les tables ; `otp_codes` en deny-all.

---

## 4. Qualité du code & architecture

- ✅ TypeScript strict, structure claire (`/features`, `/lib`, `/components`), composants
  réutilisables, Zod partout, states de chargement soignés.
- ✅ `tsc --noEmit` : **propre sur le code applicatif** (`src/`).
- 🟡 Les seules erreurs `tsc` viennent de `e2e/` (Playwright non installé, cf. §5) — sans
  impact runtime, mais fausse le « typecheck vert » global.
- ✅ Lint propre sur les fichiers touchés.

---

## 5. Tests & CI

| Élément | État | Détail |
|---------|------|--------|
| Tests unitaires (Vitest) | ✅ présents | `utils.test.ts`, `schemas.test.ts`. |
| Tests E2E (Playwright) | 🔴 **non exécutables** | `@playwright/test` est en `devDependencies` mais **pas installé** (`node_modules` absent) → `npm run test:e2e` échoue et `tsc` remonte des erreurs sur `e2e/`. L'affirmation « 12 E2E verts » de `PROJECT_STATE.md` n'est **pas reproductible en l'état**. |
| CI GitHub Actions | 🔴 à vérifier/mettre en place | Non confirmée par le code analysé. |

→ Action : `npm install` complet (ou `npx playwright install`), puis rejouer la suite pour
**prouver** le vert avant de s'appuyer dessus.

---

## 6. Conformité RGPD / données personnelles

Le système manipule des **PII sensibles** : téléphone (identifiant de connexion),
localisation (ville/commune), photo, et **e-mail à l'avenir**.

- 🔴 La faille **S1** est aussi un **risque RGPD majeur** (fuite potentielle de tous les
  numéros). Priorité absolue.
- 🟡 Pages **CGU / Confidentialité trop minces** (~50 lignes) : il faut a minima base légale,
  finalités, durées de conservation, droits (accès/rectification/suppression), contact DPO,
  sous-traitants (Supabase, agrégateur paiement, fournisseur SMS).
- ✅ Bon point : suppression de son propre compte déjà implémentée (droit à l'effacement).
- 🟡 Prévoir : journal minimal des accès aux contacts (traçabilité) et politique de
  rétention (offres/candidatures/messages).

---

## 7. Plan d'action priorisé

### P0 — À faire AVANT toute ouverture (bloquants)

**7.1 — Corriger l'élévation de privilège (S1)** — *nouvelle migration*
Créer `supabase/migrations/20260903000001_lock_profile_columns.sql` :

```sql
-- Empêche un utilisateur de modifier des colonnes sensibles de SON profil
-- (role->admin, is_super_admin, permissions, verification_level, suspension, phone…).
-- Les opérations serveur (service_role => auth.uid() IS NULL) et les admins existants
-- restent autorisés.
create or replace function public.profiles_guard_self_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_is_admin boolean;
begin
  -- Contexte serveur / service_role (pas de JWT) => chemin de confiance.
  if auth.uid() is null then
    return new;
  end if;

  -- Un admin DÉJÀ enregistré en base est de confiance pour les champs élevés.
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false)
    into caller_is_admin;
  if caller_is_admin then
    return new;
  end if;

  -- Utilisateur standard modifiant sa propre ligne : on verrouille.
  if new.role is distinct from old.role and new.role = 'admin'::public.user_role then
    raise exception 'Élévation de privilège interdite';
  end if;

  if new.is_super_admin   is distinct from old.is_super_admin
  or new.staff_permissions is distinct from old.staff_permissions
  or new.verification_level is distinct from old.verification_level
  or new.is_suspended     is distinct from old.is_suspended
  or new.phone_verified   is distinct from old.phone_verified
  or new.phone            is distinct from old.phone then
    raise exception 'Modification de champs protégés interdite';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_profiles_guard_self_update on public.profiles;
create trigger trg_profiles_guard_self_update
  before update on public.profiles
  for each row execute function public.profiles_guard_self_update();
```
> Compatible avec l'inscription/onboarding (rôle initial candidate/employeur autorisé) et
> l'édition de profil (nom/prénom/photo/ville/commune autorisés).
> Après création : `npm run db:reset` (dev) puis test manuel + E2E de non-régression.

**7.2 — En-têtes de sécurité (S4)** — `next.config.mjs`
Ajouter une fonction `headers()` renvoyant `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy`, `Strict-Transport-Security` (prod) et une `Content-Security-Policy`
adaptée à Supabase.

**7.3 — Paiement réel (S2)** + **7.4 — Fournisseur SMS OTP (S3)** : intégrations fournisseurs
(tâches manuelles ci-dessous), avec **webhook de confirmation signé** pour le paiement.

**7.5 — Vérifier les tests (S/§5)** : installer Playwright, rejouer unit + E2E, prouver le vert.

### P1 — Durcissement avant montée en charge
- **S5/S6** Rate limiting (OTP, RPC contact, signalements, paiement) + log d'accès contacts.
- **S7** Retirer `is_active`/`is_suspended` de la vue `public_profiles`.
- **S8** Validation serveur des uploads (types MIME + taille) / restrictions bucket.
- **§6** Étoffer CGU + Politique de confidentialité (RGPD).

### P2 — Améliorations / dette
- **S9** Supprimer la table `otp_codes` inutilisée ; documenter la vue SECURITY DEFINER.
- Décider **FR/EN** (i18n) ou acter « FR only » dans le cahier des charges.
- **SMS critiques** (notifications) : brancher le hook une fois le fournisseur SMS en place.
- CI GitHub Actions (lint + typecheck + unit + E2E) pour verrouiller la non-régression.

---

## 8. Tâches manuelles (hors code — comptes & clés)

1. **Agrégateur Mobile Money** (CinetPay / PayDunya / Wave…) : compte, clés API, URL de
   webhook. → alimente §7.3.
2. **Fournisseur SMS** pour l'OTP (Twilio / Vonage / LeTexto) : configurer dans Supabase Auth.
   → §7.4.
3. **Bootstrap du 1ᵉʳ Super Admin en production** : le seed (`is_super_admin=true`) est
   **dev uniquement**. En prod, promouvoir manuellement le compte fondateur en base (une
   seule fois — l'index unique garantit l'unicité).
4. **Supabase cloud** : projet de prod, migrations appliquées, RLS vérifiée, sauvegardes.
5. **Hébergement** (Vercel ou VPS Hostinger + Nginx) + domaine + HTTPS.
6. Compléter juridiquement **CGU / Confidentialité**.

---

## 9. Conclusion

Le cœur applicatif est **solide et quasi complet** ; l'autorisation côté serveur et la
hiérarchie admin sont bien pensées. **Un seul défaut critique** (S1) transforme l'évaluation
« prêt » en « à ne pas déployer » : il expose potentiellement **tous les numéros de
téléphone**, exactement le risque que tu veux éviter. Il se corrige avec **une migration**
(§7.1).

**Séquence recommandée :** (1) appliquer 7.1 → (2) headers 7.2 → (3) installer & rejouer les
tests → (4) brancher paiement + SMS réels → (5) durcir (P1) → (6) déployer.

Après 7.1, 7.2 et la validation des tests, le projet passe à 🟢 pour un lancement **pilote**
(paiement/SMS réels restant nécessaires pour la monétisation et l'OTP de production).
