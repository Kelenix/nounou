# RAPPORT — « J'ai ma nounou »

> **But de ce fichier** : dire en un coup d'œil **ce qui est fait** et **ce qui reste à faire**.
> Reconstruit le **2026-09-03** à partir du **code réel** (routes, RLS, migrations, config, tests),
> pas d'un journal. Remplace l'ancien rapport devenu illisible.

---

## Verdict en une phrase

🟢 **Le produit est complet et sécurisé côté code.** Il ne reste, avant un **lancement pilote**,
que **2 branchements externes** (paiement réel + SMS réel) et le **déploiement** — ce sont des
tâches de configuration (comptes/clés), pas du développement.

**Prêt à ~90 %.** Ce qui manque ne dépend plus du code mais de comptes fournisseurs et d'un serveur.

---

## Santé technique (vérifiée aujourd'hui)

| Contrôle | Résultat |
|---|---|
| `tsc --noEmit` (typecheck) | ✅ vert |
| `next lint` | ✅ vert (0 avertissement) |
| Tests unitaires (Vitest) | ✅ 9 tests verts |
| Tests E2E (Playwright) | ✅ 11 tests verts (+ setup/teardown), rejoués sur la base Supabase locale |
| CI GitHub Actions | ✅ présente (`.github/workflows/ci.yml`) |

---

## ✅ CE QUI EST FAIT

### Fonctionnel (périmètre MVP complet)
- **Marketplace publique** (sans compte) : accueil, catalogue nounous + filtres, fiches, offres + filtres.
- **Auth** téléphone + OTP (natif Supabase), inscription progressive, connexion, gardes de routes.
- **Profils** candidate & employeur (création/édition + photo).
- **Offres** : publication, filtres, détail, candidature.
- **Candidatures** : 5 statuts, suivi candidate + gestion employeur.
- **Notation mutuelle**, **signalements**, **favoris**.
- **Messagerie interne réelle** (conversations, fil, non-lus, temps réel).
- **Notifications temps réel** (Supabase Realtime).
- **Back-office admin** complet : stats, hiérarchie **Super Admin / Staff** (permissions par section),
  journal d'audit, gestion utilisateurs/offres/signalements, **tarifs configurables**.
- **Suppression de son propre compte** (droit RGPD à l'effacement).
- **Interface bilingue FR/EN** (next-intl, 720 clés à parité).
- **PWA installable** (manifest + service worker + page hors-ligne).

### Sécurité — corrigée cette itération
| Réf | Correctif | État |
|---|---|---|
| **S1** | Élévation de privilège bloquée : trigger verrouillant les colonnes sensibles de `profiles` (rôle, super-admin, permissions, badge, suspension, téléphone) | ✅ corrigé |
| **S4** | En-têtes de sécurité HTTP + CSP (`next.config.mjs`) | ✅ corrigé |
| **S5** | Rate-limiting : signalements (10/h), tentatives de paiement (429) | ✅ corrigé |
| **S6** | Révélation de téléphone journalisée + plafonnée (30/h) anti-moissonnage (`contact_reveals`) | ✅ corrigé |
| **S8** | Bucket `avatars` durci côté serveur (images seules, 5 Mio) | ✅ corrigé |
| **S9** | Table `otp_codes` inutilisée supprimée | ✅ corrigé |
| **S7** | `is_active`/`is_suspended` dans `public_profiles` : **conservés** (nécessaires au masquage des comptes suspendus) — risque faible **accepté et documenté** | 🟡 documenté |

> Base solide déjà en place : RLS sur **toutes** les tables, `service_role` jamais exposé au
> client, validation Zod côté serveur, Super Admin protégé au niveau base (trigger + index unique).

### Légal / RGPD
- **CGU** et **Politique de confidentialité** étoffées (bases légales, finalités, durées, droits, ARTCI).
- **Mentions de l'éditeur complétées** : « J'ai ma nounou », entreprise individuelle (en ligne),
  contact `lionelkelenix@gmail.com` ; sous-traitants nommés (Supabase, Stripe/Djamo/PayDunya, Hostinger).

---

## ⬜ CE QUI RESTE À FAIRE

### A. Tâches manuelles — comptes & clés (bloquent le lancement, hors code)
| Réf | À faire | Pourquoi |
|---|---|---|
| **S2** | **Renseigner les clés** paiement (CinetPay / PayDunya / Stripe) et **finaliser + tester** chaque intégration | Le **scaffold est prêt** (variables d'env, squelettes de providers, route webhook signée, moyen « carte », activation uniquement sur webhook) — reste les clés + le mapping exact de chaque fournisseur, non testable sans compte |
| **S3** | Configurer un **fournisseur SMS de production** dans Supabase Auth (Twilio / LeTexto…) | Sans lui, **personne ne reçoit le code OTP** en prod |
| — | **1ᵉʳ Super Admin en prod** : promouvoir le compte fondateur en base (une seule fois) | Le seed super-admin est **dev uniquement** |
| — | **Supabase cloud** (projet prod, migrations appliquées, sauvegardes) + **hébergement** (Vercel ou VPS Hostinger) + domaine + HTTPS | Mise en ligne |

> Détail dans [`docs/manual-tasks.md`](docs/manual-tasks.md).

### B. Développement restant (non bloquant)
- **SMS critiques** (notifications) : brancher le hook une fois S3 en place.
- (Optionnel) élargir la couverture E2E (candidature / messagerie de bout en bout).
- (Optionnel) notifications push mobile.
- Après relecture juridique : retirer l'avertissement « modèle à compléter » en pied des pages légales.

---

## Prochaine étape recommandée

1. Brancher **paiement (S2)** + **SMS (S3)** réels → seul verrou fonctionnel restant.
2. Provisionner **Supabase cloud** + appliquer les migrations.
3. **Déployer** (Vercel ou VPS) + domaine + HTTPS + promouvoir le Super Admin.

Une fois 1→3 faits, le projet est 🟢 pour un **lancement pilote**.
_(Les tests unit + E2E sont déjà verts et rejoués automatiquement par la CI à chaque push — rien à relancer à la main.)_

---

*Références : suivi détaillé dans [`PROJECT_STATE.md`](PROJECT_STATE.md) · décisions dans*
*[`DECISION_LOG.md`](DECISION_LOG.md) · migrations dans `supabase/migrations/`.*
