# Multi-stage Dockerfile for Next.js + Prisma
FROM node:20-alpine AS base
WORKDIR /app

# ── deps: install all dependencies ──────────────────────────────────────────
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci

# ── builder: generate Prisma client and build Next.js ────────────────────────
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variabili placeholder necessarie solo durante la build di Next.js
# I valori reali vengono iniettati a runtime dal docker-compose
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXTAUTH_SECRET=build_placeholder
ENV AUTH_SECRET=build_placeholder
ENV DATABASE_URL=file:./dev.db

RUN npx prisma generate --schema=prisma/schema.prisma
RUN npm run build

# ── runner: minimal production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# OpenSSL è richiesto dal query engine di Prisma
RUN apk add --no-cache openssl

# Next.js standalone bundle (includes server + required node_modules subset)
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Prisma schema + migrations + generated client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# npx è necessario per `prisma migrate deploy` nell'entrypoint
COPY --from=deps /app/node_modules/prisma ./node_modules/prisma

# Entrypoint: esegue le migrazioni poi avvia il server
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
