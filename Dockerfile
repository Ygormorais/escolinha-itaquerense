FROM node:22-slim AS base

# Dependências para compilar better-sqlite3
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

FROM base AS builder
WORKDIR /app
ENV NODE_OPTIONS="--max-old-space-size=4096"
# NEXT_PUBLIC_* é embutido no bundle durante o build, também no código do servidor.
# O Railway repassa as variáveis do serviço como build args quando o ARG existe.
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_VAPID_PUBLIC_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_VAPID_PUBLIC_KEY=$NEXT_PUBLIC_VAPID_PUBLIC_KEY
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN case "${NEXT_PUBLIC_APP_URL:-}" in \
      ""|*localhost*|*127.0.0.1*) \
        echo "AVISO: NEXT_PUBLIC_APP_URL vazio ou local; links de e-mail, QR e sitemap vão apontar para localhost." >&2 ;; \
    esac && \
    npx prisma generate && npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Defaults dentro do volume do Railway (railway.json: requiredMountPath=/data).
ENV DATABASE_URL=file:/data/prod.db
ENV UPLOADS_DIR=/data/uploads
ENV BACKUP_DIR=/data/backups
ENV CLUB_CONFIG_PATH=/data/config/club.config.json

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
# Tudo o que prisma.config.ts e prisma/seed-prod.ts importam (rodam via tsx no start).
COPY --from=builder /app/lib/db-path.ts ./lib/db-path.ts
COPY --from=builder /app/lib/password-hash.ts ./lib/password-hash.ts
COPY --from=builder /app/scripts/load-env.ts ./scripts/load-env.ts
COPY --from=builder /app/deploy/railway-start.sh ./deploy/railway-start.sh
COPY --from=builder /app/.next ./.next
# next start lê a configuração do disco (imagens remotas, headers, poweredByHeader).
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Garante permissões para o banco (prisma) e engines nativas
RUN mkdir -p /app/prisma /data/uploads /data/backups /data/config && \
    chown -R nextjs:nodejs /app/prisma /data && \
    chown -R nextjs:nodejs /app/node_modules/@prisma

USER nextjs
EXPOSE 3000

# O entrypoint aplica migrations no volume, cria o admin apenas quando necessário
# e então inicia o Next. No Railway, o volume /data é montado em runtime.
CMD ["sh", "deploy/railway-start.sh"]
