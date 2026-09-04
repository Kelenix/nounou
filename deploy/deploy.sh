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

# Charger les variables (dont les NEXT_PUBLIC_* nécessaires au build)
set -a; . ./.env.production; set +a

echo "🔨 Build de l'image…"
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_APP_URL="$NEXT_PUBLIC_APP_URL" \
  -t jaimanounou:latest .

echo "♻️  Redémarrage du conteneur…"
docker stop jaimanounou 2>/dev/null || true
docker rm jaimanounou 2>/dev/null || true
docker run -d --name jaimanounou --restart unless-stopped \
  -p 127.0.0.1:3002:3000 \
  --env-file .env.production \
  jaimanounou:latest

docker image prune -f >/dev/null 2>&1 || true
echo "✅ Déployé. Voir les logs :  docker logs -f jaimanounou"
