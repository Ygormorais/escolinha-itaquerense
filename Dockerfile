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
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM node:22-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/prod.db
ENV UPLOADS_DIR=/app/data/uploads
ENV BACKUP_DIR=/app/data/backups
ENV CLUB_CONFIG_PATH=/app/data/config/club.config.json

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder /app/lib/db-path.ts ./lib/db-path.ts
COPY --from=builder /app/scripts/load-env.ts ./scripts/load-env.ts
COPY --from=builder /app/deploy/railway-start.sh ./deploy/railway-start.sh
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Garante permissões para o banco (prisma) e engines nativas
RUN mkdir -p /app/prisma /app/data/uploads /app/data/backups /app/data/config && \
    chown -R nextjs:nodejs /app/prisma /app/data && \
    chown -R nextjs:nodejs /app/node_modules/@prisma

USER nextjs
EXPOSE 3000

# O entrypoint aplica migrations no volume, cria o admin apenas quando necessário
# e então inicia o Next. No Railway, o volume /data é montado em runtime.
CMD ["sh", "deploy/railway-start.sh"]
