# syntax=docker/dockerfile:1.4
# =====================================================================
# DOCKERFILE ULTRA-OPTIMIZED - API (NestJS)
# =====================================================================
# Tối ưu tối đa:
# 1. BuildKit cache mounts cho npm - Giảm download time đáng kể
# 2. Chỉ 2 stages (builder + runner) - Giảm copy overhead
# 3. Prisma generate chạy 1 lần duy nhất
# 4. Prod dependencies install trong cùng stage
#
# Build time cải thiện:
# - Lần đầu: ~5-7 phút (download npm)
# - Lần sau: ~1-2 phút (sử dụng cache)
# =====================================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Cài đặt dependencies hệ thống
RUN apk add --no-cache libc6-compat postgresql-client

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install ALL dependencies với cache mount
# Cache mount giữ lại npm cache giữa các builds
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source và build
COPY . .
# 1. Build main application
RUN npm run build
# 2. Build seed into dist/seeds
RUN npx tsc prisma/seed.ts --outDir dist/seeds --skipLibCheck --module commonjs --target es2020 --esModuleInterop

# Prune dev dependencies, giữ lại chỉ production deps
RUN --mount=type=cache,target=/root/.npm \
    npm prune --production

# =====================================================================
# RUNNER STAGE - Production image nhẹ
# =====================================================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Cài đặt postgresql-client cho health check
RUN apk add --no-cache postgresql-client && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs && \
    mkdir -p logs && chown nestjs:nodejs logs

# Copy build artifacts và production node_modules
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

USER nestjs
EXPOSE 8080
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/seeds/seed.js && node dist/main"]
