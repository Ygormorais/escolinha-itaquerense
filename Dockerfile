FROM node:20-alpine AS base

# Dependências para compilar better-sqlite3
RUN apk add --no-cache python3 make g++

FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

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
