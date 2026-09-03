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

## Nécessaire pour brancher le réel (différé — mock en dev pour l'instant)
- [ ] **Fournisseur SMS OTP** (ex. LeTexto, agrégateur local, Twilio) : compte + clés API.
- [ ] **Agrégateur Mobile Money** (ex. CinetPay, PayDunya, Djamo) : compte marchand + clés +
  URL de callback. Orange Money / MTN MoMo / Moov Money / Wave.

## Légal (Côte d'Ivoire)
- [ ] Valider les textes **CGU** et **Politique de confidentialité** (données perso + paiement).
  Claude fournira des gabarits ; une relecture juridique reste recommandée.
