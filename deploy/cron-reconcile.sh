#!/usr/bin/env bash
# ============================================================================
# Réconciliation automatique des paiements (cron du VPS).
# Appelle l'endpoint interne du conteneur, authentifié par CRON_SECRET.
#
# Installation (une seule fois, sur le VPS) — exécuter chaque jour à 03h15 :
#   crontab -e
#   15 3 * * * /chemin/vers/projet/deploy/cron-reconcile.sh >> /var/log/jaimanounou-cron.log 2>&1
#
# Prérequis : CRON_SECRET renseigné dans .env.production (voir .env.production.example).
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  echo "❌ .env.production manquant." >&2
  exit 1
fi

# Extraction sûre du secret (tolère guillemets).
SECRET="$({ grep -E '^CRON_SECRET=' .env.production || true; } | head -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
if [ -z "$SECRET" ]; then
  echo "❌ CRON_SECRET absent de .env.production." >&2
  exit 1
fi

# Le conteneur écoute sur 127.0.0.1:3003 (cf. deploy/deploy.sh).
URL="${CRON_URL:-http://127.0.0.1:3003/api/cron/reconcilier}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Réconciliation…"
curl -fsS --max-time 120 -H "Authorization: Bearer $SECRET" "$URL"
echo
