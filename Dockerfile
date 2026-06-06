FROM node:20-slim AS base

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

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

# Garante que o diretório do banco seja gravável pelo usuário nextjs
RUN mkdir -p /app/prisma && chown -R nextjs:nodejs /app/prisma

USER nextjs
EXPOSE 3000

# Aplica migrations pendentes e inicia o servidor
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]
