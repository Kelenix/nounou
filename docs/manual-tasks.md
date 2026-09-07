# Tâches manuelles (à réaliser par toi, hors code)

> Comptes, clés API, domaine, etc. Claude ne peut pas (ou ne doit pas) faire ces actions seul :
> elles engagent des coûts, des identités ou des accès. Cochez au fur et à mesure.

## Identité visuelle (logo & photos)
- [x] **Logo** en place dans **`public/logo.png`** (fourni).
- [x] **Icônes PWA** générées depuis le logo (`public/icons/icon-192.png`, `icon-512.png`,
  `maskable-512.png`, avec safe-zone pour la *maskable*). Régénérables via `sharp` si le logo change.
- [ ] **Photos de démonstration** : `public/demo/nounou-1..5.jpg` sont des portraits libres
  génériques (128 px). À remplacer par de vraies photos (ou régénérer via IA si crédits dispo).
  Les vraies nounous téléversent leur photo depuis leur profil.

## Bloquant pour le développement local
- [x] **Supabase local (Docker)** opérationnel via `npm run db:start` (ports 54331+).
  `.env.local` fourni avec les clés de démo locales.
- [ ] Pour un vrai projet : créer un projet Supabase cloud, récupérer `SUPABASE_URL`, `anon key`,
  `service_role key` (secret), et faire `supabase link` + `supabase db push`.

## Bloquant pour la mise en production
- [ ] **VPS Hostinger** : accès SSH, domaine, configuration Nginx (un guide sera fourni).
- [ ] **Nom de domaine** + certificat TLS (Let's Encrypt via Nginx).

## Connexion Google (OAuth)
- [x] **Identifiant OAuth Google (local)** : client OAuth « Web » créé. `GOOGLE_CLIENT_ID` /
  `GOOGLE_SECRET` renseignés dans `.env.local`. Supabase local vérifié : provider Google actif,
  redirection vers Google OK.
- [ ] **Dans la console Google**, s'assurer que ces **URI de redirection autorisés** sont bien
  enregistrés (sinon erreur `redirect_uri_mismatch`) :
  - local : `http://127.0.0.1:54331/auth/v1/callback`
  - prod  : `https://lssqjjqszhwqetcifdpu.supabase.co/auth/v1/callback`
  Et ces **origines JavaScript** : `http://localhost:3000`, `https://jaimanounou.com`,
  `https://www.jaimanounou.com`.
- [ ] **Prod (le jour du déploiement)** — dans le tableau de bord Supabase Cloud du projet
  `lssqjjqszhwqetcifdpu` :
  - Auth → Providers → Google : activer + coller `Client ID` / `Client Secret`.
  - Auth → URL Configuration : Site URL = `https://jaimanounou.com` ;
    Redirect URLs = `https://jaimanounou.com/auth/callback` (+ variante `www`).
  - `.env` de prod de l'app : `NEXT_PUBLIC_APP_URL=https://jaimanounou.com`,
    `NEXT_PUBLIC_SUPABASE_URL=https://lssqjjqszhwqetcifdpu.supabase.co` (les clés Google ne
    vont PAS dans le `.env` de l'app en prod — c'est Supabase qui gère Google).

## Nécessaire pour brancher le réel (différé — mock en dev pour l'instant)
- [ ] **Fournisseur SMS OTP** (ex. LeTexto, agrégateur local, Twilio) : compte + clés API.
- [ ] **Agrégateur Mobile Money** (ex. CinetPay, PayDunya, Djamo) : compte marchand + clés +
  URL de callback. Orange Money / MTN MoMo / Moov Money / Wave.

## Légal (Côte d'Ivoire)
- [ ] Valider les textes **CGU** et **Politique de confidentialité** (données perso + paiement).
  Claude fournira des gabarits ; une relecture juridique reste recommandée.
