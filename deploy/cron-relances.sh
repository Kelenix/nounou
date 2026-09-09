#!/usr/bin/env bash
# ============================================================================
# Relances e-mail d'onboarding (cron du VPS).
# Appelle l'endpoint interne du conteneur, authentifié par CRON_SECRET.
#
# Installation (une seule fois, sur le VPS) — une fois par jour suffit (séquence
# J+0/1/3/7, idempotente : relancer 2×/jour n'envoie rien de plus) :
#   crontab -e
#   30 10 * * * /chemin/vers/projet/deploy/cron-relances.sh >> /var/log/jaimanounou-cron.log 2>&1
#
# Prérequis : CRON_SECRET, RESEND_API_KEY, EMAIL_FROM, EMAIL_UNSUB_SECRET dans .env.production.
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  echo "❌ .env.production manquant." >&2
  exit 1
fi

SECRET="$({ grep -E '^CRON_SECRET=' .env.production || true; } | head -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
if [ -z "$SECRET" ]; then
  echo "❌ CRON_SECRET absent de .env.production." >&2
  exit 1
fi

# Le conteneur écoute sur 127.0.0.1:3003 (cf. deploy/deploy.sh).
URL="${CRON_URL:-http://127.0.0.1:3003/api/cron/relances}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Relances e-mail…"
curl -fsS --max-time 120 -H "Authorization: Bearer $SECRET" "$URL"
echo
