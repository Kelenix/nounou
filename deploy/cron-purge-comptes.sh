#!/usr/bin/env bash
# ============================================================================
# Purge/anonymisation des comptes supprimés (cron du VPS).
# Appelle l'endpoint interne du conteneur, authentifié par CRON_SECRET.
#
# Installation (une seule fois, sur le VPS) — une fois par jour suffit
# (idempotent : n'anonymise que les comptes dont la conservation est écoulée) :
#   crontab -e
#   45 3 * * * /chemin/vers/projet/deploy/cron-purge-comptes.sh >> /var/log/jaimanounou-cron.log 2>&1
#
# Prérequis : CRON_SECRET dans .env.production.
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
URL="${CRON_URL:-http://127.0.0.1:3003/api/cron/purge-comptes}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Purge comptes supprimés…"
curl -fsS --max-time 120 -H "Authorization: Bearer $SECRET" "$URL"
echo
