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

## Migration base à appliquer (réconciliation PayDunya)
- [ ] **Colonne `payments.provider_token`** (migration `20260908000001_payment_provider_token.sql`) :
  à appliquer sur **Supabase Cloud AVANT de déployer** le nouveau code (sinon l'insertion d'un
  paiement échoue). Depuis le repo lié au projet cloud : `supabase db push` — ou coller le contenu
  de la migration dans **Supabase → SQL Editor**. C'est un simple `ADD COLUMN IF NOT EXISTS`
  (idempotent, sans risque).

## Réconciliation automatique des paiements (cron VPS)
- [ ] **Générer le secret** : `openssl rand -hex 32` → coller dans `.env.production` :
  `CRON_SECRET=<valeur>` (puis relancer `bash deploy/deploy.sh` pour que le conteneur le charge).
- [ ] **Installer le cron** sur le VPS (réconciliation quotidienne à 03h15) : `crontab -e` puis
  ajouter (adapter le chemin du projet) :
  `15 3 * * * /chemin/vers/projet/deploy/cron-reconcile.sh >> /var/log/jaimanounou-cron.log 2>&1`
- [ ] **Vérifier** manuellement une fois : `bash deploy/cron-reconcile.sh` doit répondre
  `{"ok":true,...}`. Les exécutions apparaissent dans le **journal d'audit** (acteur « Système (cron) »).
- Note : la vérification interroge réellement le fournisseur uniquement si `PAYMENT_MOBILE_PROVIDER=cinetpay`
  et les clés CinetPay sont renseignées ; sinon le cron tourne sans effet (aucune transaction réelle).

## Relances e-mail d'onboarding (cron VPS)
> Rappels automatiques : profils incomplets + candidats n'ayant pas payé l'activation.
> Séquence espacée **J+0 / J+1 / J+3 / J+7** (4 e-mails max), avec lien de désinscription.
- [ ] **Migration** `20260909000001_email_relances.sql` à appliquer sur Supabase Cloud
  **avant de déployer** le nouveau code (`supabase db push` ou SQL Editor). Idempotente.
- [ ] **Resend opérationnel** : compte Resend + **domaine `jaimanounou.com` vérifié** (SPF/DKIM),
  puis dans `.env.production` : `RESEND_API_KEY=...`, `EMAIL_FROM="J'ai ma nounou <no-reply@jaimanounou.com>"`.
  ⚠️ Sans domaine vérifié, les e-mails partent en spam.
- [ ] **Secret désinscription** : `openssl rand -hex 32` → `EMAIL_UNSUB_SECRET=<valeur>` dans `.env.production`.
- [ ] **Installer le cron** (1×/jour suffit — c'est idempotent) : `crontab -e` puis
  `30 10 * * * /chemin/vers/projet/deploy/cron-relances.sh >> /var/log/jaimanounou-cron.log 2>&1`
- [ ] **Tester** une fois : `bash deploy/cron-relances.sh` doit répondre `{"ok":true,"sent":...}`.
  Les exécutions apparaissent dans le **journal d'audit** (action `email_relances`).

## Suppression douce des comptes + purge (cron VPS)
> Un compte supprimé (par l'admin ou par l'utilisateur lui-même) n'est plus effacé
> physiquement : il est **banni + masqué**, mais son historique (paiements, avis,
> signalements) est **conservé pour la traçabilité**, puis **anonymisé** après une
> durée de conservation (**12 mois**, cf. `ACCOUNT_RETENTION_MONTHS` dans
> `src/lib/constants.ts` — ajuster si besoin).
- [ ] **Migration** `20260910000001_soft_delete_accounts.sql` à appliquer sur Supabase
  Cloud **avant de déployer** (`supabase db push` ou SQL Editor). Idempotente : ajoute
  `deleted_at/deleted_by/deletion_reason/anonymized_at` sur `profiles` et masque les
  comptes supprimés dans la vue `public_profiles`.
- [ ] **Installer le cron de purge** (1×/jour, idempotent) : `crontab -e` puis
  `45 3 * * * /chemin/vers/projet/deploy/cron-purge-comptes.sh >> /var/log/jaimanounou-cron.log 2>&1`
- [ ] **Tester** une fois : `bash deploy/cron-purge-comptes.sh` doit répondre
  `{"ok":true,"anonymized":...}`. Exécutions visibles dans le **journal d'audit** (action `purge_comptes`).
- [ ] **Juridique** : valider la durée de conservation (12 mois) et la base légale
  (obligations comptables / prévention fraude) dans la Politique de confidentialité.
- Note (suivi ultérieur) : l'anonymisation efface le profil et supprime les
  notifications ; les **messages** et les **fichiers d'identité en Storage** ne sont pas
  encore purgés (à traiter dans une itération dédiée si nécessaire).

## Connexion / inscription par code e-mail (OTP, sans mot de passe)
> L'écran d'auth envoie un **code à 6 chiffres par e-mail** (`signInWithOtp` / `verifyOtp`).
> L'e-mail passe par le système d'e-mails de **Supabase Auth** (même canal que la confirmation
> d'inscription, déjà en place).
- [ ] **Provider Email activé** : Supabase → Authentication → Providers → **Email** activé
  (déjà le cas). L'OTP e-mail fonctionne avec ce provider.
- [ ] **Template « Magic Link »** : Supabase → Authentication → Email Templates → **Magic Link** →
  coller `docs/email-templates/magic-link.html` (sujet : `Votre code de connexion · J'ai ma nounou`).
  ⚠️ Il DOIT contenir la variable **`{{ .Token }}`** (le code), sinon l'utilisateur reçoit un lien
  au lieu d'un code et la saisie du code échoue.
- [ ] (Recommandé) **SMTP personnalisé** dans Supabase (Auth → Emails) pour la délivrabilité des
  e-mails d'OTP/confirmation (sinon quota d'envoi Supabase limité). Voir plus bas.
- [ ] **Expiration du code** : Auth → Providers → Email → *Email OTP Expiration*. Si les
  utilisateurs voient « code expiré » alors qu'ils viennent de le recevoir, la valeur est trop
  courte : la mettre à **600 s (10 min)** minimum, le temps d'ouvrir l'e-mail et saisir le code.
- Note : un **compte suspendu** ne peut plus se connecter ni valider de code (bannissement auth
  appliqué automatiquement à la suspension).

## Garde-fou identité (nom réel + téléphone obligatoire)
> Un compte actif (rôle choisi) doit avoir un **téléphone valide** et un **vrai nom**
> (les noms factices « test », « sans nom »… sont refusés). Validé côté client ET par un
> **trigger en base** (inviolable).
- [ ] **Migration** `20260910000002_profile_identity_guard.sql` à appliquer sur Supabase Cloud
  **avant de déployer** (`supabase db push` ou SQL Editor). Idempotente.
- Note : les comptes fictifs déjà en base ne sont pas supprimés automatiquement ; ils seront
  bloqués à leur prochaine modification de profil (ils devront saisir un vrai nom). Tu peux les
  supprimer depuis `/admin/utilisateurs` si besoin.

## Légal (Côte d'Ivoire)
- [ ] Valider les textes **CGU** et **Politique de confidentialité** (données perso + paiement).
  Claude fournira des gabarits ; une relecture juridique reste recommandée.
