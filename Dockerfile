# syntax=docker/dockerfile:1
# ============================================================================
# Image de production « J'ai ma nounou » (Next.js 15, sortie standalone).
# Build multi-étapes : deps -> builder -> runner (image finale minimale).
#
# ⚠️ Les variables NEXT_PUBLIC_* sont "gelées" au moment du BUILD (elles partent
#    dans le bundle navigateur). On les passe donc en --build-arg (voir runbook).
#    Les secrets serveur (SERVICE_ROLE, paiement…) se passent au RUN via --env-file.
# ============================================================================

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- Dépendances (couche cache) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Build ---
FROM base AS builder
# Variables publiques nécessaires à la compilation du bundle client
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# --- Image finale (runner) ---
FROM base AS runner
ENV NODE_ENV=production
# Utilisateur non-root pour la sécurité
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs nextjs

# Fichiers statiques + serveur autonome
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
