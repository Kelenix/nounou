#!/usr/bin/env bash
# ============================================================================
# Déploiement / mise à jour de « J'ai ma nounou » sur le VPS (Docker).
# À lancer DEPUIS LE VPS, à la racine du projet :  bash deploy/deploy.sh
# Prérequis : fichier .env.production rempli à la racine (voir .env.production.example).
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")/.."

if [ ! -f .env.production ]; then
  echo "❌ .env.production manquant. Copie .env.production.example et remplis-le." >&2
  exit 1
fi

# Extraction sûre des variables publiques nécessaires au build — SANS « source »,
# pour tolérer des valeurs contenant espaces/apostrophes/chevrons (ex. EMAIL_FROM).
# (Le runtime, lui, charge tout le fichier via `docker run --env-file`.)
get_env() { { grep -E "^$1=" .env.production || true; } | head -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
NEXT_PUBLIC_SUPABASE_URL="$(get_env NEXT_PUBLIC_SUPABASE_URL)"
NEXT_PUBLIC_SUPABASE_ANON_KEY="$(get_env NEXT_PUBLIC_SUPABASE_ANON_KEY)"
NEXT_PUBLIC_APP_URL="$(get_env NEXT_PUBLIC_APP_URL)"
NEXT_PUBLIC_ANALYTICS_DOMAIN="$(get_env NEXT_PUBLIC_ANALYTICS_DOMAIN)"
NEXT_PUBLIC_ANALYTICS_SRC="$(get_env NEXT_PUBLIC_ANALYTICS_SRC)"

echo "🔨 Build de l'image…"
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  --build-arg NEXT_PUBLIC_ANALYTICS_DOMAIN="${NEXT_PUBLIC_ANALYTICS_DOMAIN:-}" \
  --build-arg NEXT_PUBLIC_ANALYTICS_SRC="${NEXT_PUBLIC_ANALYTICS_SRC:-}" \
  -t jaimanounou:latest .

echo "♻️  Redémarrage du conteneur…"
docker stop jaimanounou 2>/dev/null || true
docker rm jaimanounou 2>/dev/null || true
docker run -d --name jaimanounou --restart unless-stopped \
  -p 127.0.0.1:3003:3000 \
  --env-file .env.production \
  jaimanounou:latest

docker image prune -f >/dev/null 2>&1 || true
echo "✅ Déployé. Voir les logs :  docker logs -f jaimanounou"
