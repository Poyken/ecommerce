# syntax=docker/dockerfile:1.4
# =====================================================================
# DOCKERFILE ULTRA-OPTIMIZED - WEB (Next.js)
# =====================================================================
# Tối ưu tối đa:
# 1. BuildKit cache mounts cho npm - Cache npm packages
# 2. Next.js standalone output - Image size nhỏ (~100MB)
# 3. Giảm stages không cần thiết
#
# Build time cải thiện:
# - Lần đầu: ~3-5 phút
# - Lần sau: ~30s-1 phút (sử dụng cache)
# =====================================================================

FROM node:20-alpine AS builder
WORKDIR /app

# Cài đặt dependencies hệ thống
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies với cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source code
COPY . .

# Build với telemetry disabled
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# =====================================================================
# RUNNER STAGE - Production image (standalone mode)
# =====================================================================
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Setup user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs && \
    mkdir .next && chown nextjs:nodejs .next

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build (đã được Next.js tối ưu size)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
