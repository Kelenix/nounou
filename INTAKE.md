# Prompt de développement — « J'ai ma nounou »

## 0. Contexte pour l'assistant (à lire avant de générer)

- **Produit** : plateforme de mise en relation entre familles/particuliers et aides à domicile (nounous, ménage, cuisine, garde d'enfants…) en **Côte d'Ivoire**.
- **Nom** : **J'ai ma nounou**
- **Cible** : marché ivoirien, utilisateurs majoritairement sur **smartphone Android**, connexion parfois lente → **performance et légèreté prioritaires**.
- **Format** : **PWA installable** (Progressive Web App), pensée mobile d'abord, responsive vers desktop.
- **Livrable de cette itération** : le **MVP** (voir périmètre plus bas). Les fonctions marquées *« V2 »* ne doivent PAS être développées maintenant, mais l'architecture doit les rendre possibles.
- **Langue de l'interface** : **français / anglais**.
- **Monnaie** : **FCFA** (XOF). Téléphone : indicatif **+225**.

---

## 1. Stack technique imposée

| Couche | Choix |
|---|---|
| Frontend | **React** (Vite) + TypeScript + Tailwind CSS, PWA (vite-plugin-pwa / service worker + manifest) |
| Composants UI | shadcn/ui + lucide-react (icônes) |
| Backend / BDD | **Supabase** (PostgreSQL, Auth, Storage, Row Level Security, Edge Functions) |
| Auth | Connexion par **numéro de téléphone + OTP SMS** |
| Notifications | In-app (temps réel Supabase) + SMS pour les événements critiques |
| Paiement | **Mobile Money** : Orange Money, MTN MoMo, Moov Money, Wave |
| Hébergement | **VPS Hostinger** (build statique servi via Nginx ; Supabase managé) |

> Génère un code **propre, typé, modulaire**, avec des composants réutilisables et une structure de dossiers claire (`/features`, `/components`, `/lib`, `/hooks`, `/pages`).

---

## 2. Identité visuelle (design system)

Reprends l'identité de la maquette fournie :

- **Couleur primaire** : vert `#2E9E1F` (boutons, accents, liens actifs). Dégradés doux de vert clair pour les fonds de sections.
- **Vert clair / surface** : `#E8F5E4` (pastilles, badges, fonds d'icônes).
- **Texte principal** : gris très foncé / noir bleuté `#111827`.
- **Texte secondaire** : gris `#6B7280`.
- **Fond** : blanc `#FFFFFF` et gris très clair `#F9FAFB`.
- **Typographie** : sans-serif géométrique, moderne et lisible (type **Poppins** ou **Inter**), titres **très gras** (bold/extrabold), corps en regular/medium.
- **Style** : arrondis généreux (`rounded-2xl`), ombres légères, boutons pleins verts + boutons secondaires à bordure fine. Interface aérée, chaleureuse, rassurante — **la confiance est le fil conducteur** (badge « La confiance avant tout »).
- **Icônes** : ligne fine, cohérentes (lucide).
- **Logo** : « J'ai ma nounou » (placeholder si absent).
- **Navigation mobile** : barre inférieure fixe (bottom tab bar) avec : Accueil, Rechercher, Messages, Profil.

---

## 3. Périmètre du MVP (à développer maintenant)

1. Inscription par téléphone + vérification **OTP**.
2. Choix du rôle : **Candidate** (cherche un emploi) ou **Employeur** (cherche une aide).
3. Création de **profil candidate** et **profil employeur**.
4. **Publication d'offres** (employeur).
5. **Recherche d'offres** (candidate) avec filtres.
6. **Recherche de candidates** (employeur) avec filtres.
7. **Candidatures** (postuler + suivi des statuts).
8. **Paiement Mobile Money** (activation profil candidate 1 000 FCFA / accès premium employeur 2 000 FCFA — **tarifs configurables en admin**).
9. **Notifications** in-app (+ SMS critiques).
10. **Système de notation** (après expérience).
11. **Signalement** d'un utilisateur.
12. **Back-office administrateur** + statistiques de base.
13. **Messagerie interne** *(à prévoir dans l'architecture ; peut être livrée juste après le cœur MVP)*.

**Reporté en V2 (ne pas coder maintenant, mais ne pas bloquer) :** matching intelligent (score %), vérification d'identité par pièce jointe, abonnements/profils sponsorisés, app mobile native, salaire/type de contrat/logée détaillés en options avancées.

---

## PROMPT À COPIER

```
Tu es un développeur full-stack senior. Développe une PWA mobile-first nommée « J'ai ma nounou », une plateforme de mise en relation entre familles et aides à domicile en Côte d'Ivoire.

STACK : React + Vite + TypeScript + Tailwind + shadcn/ui + lucide-react en frontend, PWA installable (manifest + service worker, mode hors-ligne basique, prompt d'installation). Backend Supabase : PostgreSQL, Auth par téléphone/OTP, Storage pour les photos, Row Level Security, Edge Functions pour OTP et Mobile Money. Interface 100 % en français. Monnaie FCFA, téléphone +225. Build destiné à un VPS Hostinger (Nginx) ; Supabase managé.

DESIGN : mobile-first, chaleureux et rassurant, thème « la confiance avant tout ».
- Vert primaire #2E9E1F, vert clair #E8F5E4, texte #111827, secondaire #6B7280, fond blanc/#F9FAFB.
- Typo Poppins (titres extrabold, corps regular), coins arrondis rounded-2xl, ombres légères.
- Barre de navigation inférieure fixe : Accueil, Rechercher, Messages, Profil.
- Boutons pleins verts + boutons secondaires à bordure. Grands titres impactants comme sur la maquette.

RÔLES : Candidate, Employeur, Administrateur.

PARCOURS D'INSCRIPTION (obligatoire) :
1. Saisie numéro (+225) → 2. Envoi et vérification OTP par SMS (Edge Function) → 3. Infos perso (nom, prénom, photo, ville, commune/quartier) → 4. Choix du rôle (« Je recherche un emploi » / « Je recherche une personne »).

MODÈLE DE DONNÉES (Postgres/Supabase, avec RLS) :
- users (id, phone unique, phone_verified bool, role enum[candidate,employer,admin], nom, prenom, photo_url, ville, commune, created_at, is_active, verification_level enum[phone,identity,verified]).
- candidate_profiles (user_id FK, services[] enum[menage,cuisine,garde_enfants,lessive,repassage,entretien,assistance_personnes_agees,autre], experience_annees, competences[], disponibilite, temps_plein bool, description, salaire_souhaite nullable, is_active_paid bool).
- employer_profiles (user_id FK, type_besoin, description, nb_personnes_foyer, type_logement, horaires, salaire_propose nullable, conditions, is_premium bool).
- offers (id, employer_id FK, titre, type_service, description, ville, commune, quartier, horaires, salaire nullable, type_contrat nullable, logee bool nullable, date_debut, experience_souhaitee nullable, conditions nullable, status enum[active,close], created_at).
- applications (id, offer_id FK, candidate_id FK, status enum[en_attente,consultee,acceptee,refusee,annulee], created_at).
- ratings (id, from_user FK, to_user FK, role_context, ponctualite, serieux, qualite, respect, communication, note_moyenne, commentaire, created_at).
- reports (id, from_user, target_user, motif enum[fausse_identite,arnaque,harcelement,offre_frauduleuse,comportement,conditions_differentes,autre], description, status, created_at).
- payments (id, user_id, montant, moyen enum[orange_money,mtn_momo,moov_money,wave], reference_transaction, statut enum[en_attente,reussi,echoue,annule], type enum[activation_candidate,premium_employeur], created_at).
- notifications (id, user_id, type, titre, message, lu bool, created_at).
- settings (clé/valeur pour tarifs configurables : prix_activation_candidate=1000, prix_premium_employeur=2000, catégories de services).
- (prévoir tables conversations/messages pour la messagerie interne, à activer ensuite).

FONCTIONNALITÉS MVP À LIVRER :
1. Auth téléphone + OTP (Edge Function d'envoi/vérification ; en dev, mock du SMS avec code affiché en console/log).
2. Création & édition de profil candidate et employeur.
3. Employeur : publier une offre (champs obligatoires : titre, type_service, ville ; le reste facultatif), gérer ses offres (active/close).
4. Candidate : liste des offres + filtres (localisation, type de service, salaire, horaires, date). Détail d'offre + bouton « Postuler ».
5. Employeur : recherche de candidates avec filtres (ville, commune, quartier, type de service, expérience, disponibilité, temps plein/partiel). Vue profil candidate.
6. Candidatures : statuts EN_ATTENTE, CONSULTÉE, ACCEPTÉE, REFUSÉE, ANNULÉE. L'employeur gère les candidatures reçues, la candidate suit ses candidatures.
7. Paiement Mobile Money : Edge Function initiant une transaction (Orange Money, MTN MoMo, Moov Money, Wave). Activation profil candidate = 1 000 FCFA, accès premium employeur = 2 000 FCFA. Tarifs lus depuis settings. Enregistrer chaque transaction avec statut. En dev, simuler le callback de paiement (sandbox/mock) proprement isolé pour brancher un vrai agrégateur plus tard.
8. Notifications in-app en temps réel (Supabase Realtime) : nouvelle candidature, candidature acceptée/refusée, paiement confirmé, profil vérifié, signalement. Prévoir hook SMS pour les critiques.
9. Notation mutuelle après expérience (employeur↔candidate) avec note moyenne affichée sur le profil.
10. Signalement d'un utilisateur avec motif.
11. Badges de vérification visibles (téléphone vérifié maintenant ; identité/profil vérifié = niveaux prévus).
12. Tableaux de bord :
    - Candidate : profil, statut, offres recommandées (simple, par ville + service), mes candidatures, notifications, paiement/activation.
    - Employeur : mon profil, mes offres, candidatures reçues, candidates favorites, notifications, paiement.
    - Admin (back-office protégé) : gestion utilisateurs/candidates/employeurs/offres/candidatures/paiements/avis/signalements/vérifications/catégories, suspension/suppression de compte, tarifs configurables, et statistiques de base (nb utilisateurs, candidates, employeurs, offres, candidatures, transactions, chiffre d'affaires).

PAGES PUBLIQUES : Accueil (hero « Trouvez la nounou idéale pour vos enfants », CTA « Chercher une nounou » + « Je suis nounou », stats, section confiance), Comment ça marche, Tarifs, FAQ, Contact, CGU, Politique de confidentialité.

QUALITÉ & CONTRAINTES :
- Mobile-first strict, cible Android + réseau lent : lazy-loading, images optimisées, bundle léger.
- Code TypeScript typé, composants réutilisables, dossiers /features /components /lib /hooks /pages.
- RLS Supabase correcte (un utilisateur n'accède qu'à ses données ; admin séparé).
- Validation des formulaires (zod), gestion d'erreurs et états de chargement soignés.
- Textes 100 % en français, ton chaleureux et de confiance.
- Ne développe PAS pour l'instant : matching par score %, vérification d'identité par upload, abonnements/sponsoring, app native. Mais garde l'architecture ouverte pour les ajouter.
- Livre d'abord le cœur (auth + profils + offres + candidatures + admin), puis la messagerie interne, puis le paiement branché en réel.

Commence par : (1) le schéma Supabase + RLS, (2) le manifest/PWA + thème et navigation, (3) le parcours d'inscription OTP, (4) les profils, (5) offres & candidatures, (6) admin & stats. Explique chaque étape brièvement et fournis un code exécutable.
```

---

## 4. Ordre de construction recommandé (pour itérer avec l'assistant)

1. **Fondations** : schéma Supabase + RLS + thème Tailwind + PWA (manifest, service worker) + navigation.
2. **Auth OTP** (mock SMS en dev, Edge Function réelle ensuite).
3. **Profils** candidate & employeur (avec upload photo Storage).
4. **Offres** (publication + liste + détail + filtres).
5. **Recherche de candidates** + filtres.
6. **Candidatures** + statuts + tableaux de bord.
7. **Notifications** temps réel.
8. **Notation** + **signalement**.
9. **Back-office admin** + statistiques.
10. **Paiement Mobile Money** (sandbox → réel).
11. **Messagerie interne** (dès que le cœur fonctionne).

## 5. Points d'attention spécifiques Côte d'Ivoire

- Numéros à 10 chiffres après +225 ; valider le format.
- Prévoir l'intégration réelle d'un agrégateur Mobile Money (ex. CinetPay, PayDunya, Djamo…) via Edge Function — garder la logique de paiement **isolée derrière une interface** pour changer de fournisseur sans tout casser.
- SMS OTP : prévoir un fournisseur (ex. LeTexto, agrégateur local ou Twilio) branché dans l'Edge Function.
- Optimiser pour data mobile limitée : compression images, cache PWA, peu de dépendances lourdes.