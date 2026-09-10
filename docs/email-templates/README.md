# Templates d'e-mails Supabase Auth

E-mails d'authentification (confirmation d'inscription, réinitialisation de mot de passe)
aux couleurs de la marque. À **coller dans le Dashboard Supabase**, ils ne sont pas lus
automatiquement par l'application.

## Où coller

Supabase → **Authentication → Email Templates** → sélectionner le template → onglet **Source**
(éditeur HTML) → coller le contenu du fichier correspondant → **Save**.

| Template Supabase | Fichier | Sujet à mettre |
|---|---|---|
| **Confirm signup** | [`confirm-signup.html`](confirm-signup.html) | `Confirmez votre adresse e-mail · J'ai ma nounou` |
| **Reset Password** | [`reset-password.html`](reset-password.html) | `Réinitialisez votre mot de passe · J'ai ma nounou` |

## Règles importantes

- **Conserver la variable `{{ .ConfirmationURL }}`** telle quelle (c'est le lien d'action généré
  par Supabase). Ne pas la modifier.
- Le **logo** est chargé depuis `https://jaimanounou.com/logo.png` (URL absolue obligatoire dans
  un e-mail). Il s'affiche une fois le site en ligne.
- Prérequis délivrabilité : **SMTP personnalisé** configuré (cf. `docs/manual-tasks.md`) et
  domaine vérifié chez le fournisseur d'envoi.

## Autres templates (non utilisés actuellement)

Magic Link, Invite user, Change Email, Reauthentication ne sont pas utilisés par le parcours
actuel (connexion par mot de passe + Google). On pourra les styliser de la même façon si besoin.
