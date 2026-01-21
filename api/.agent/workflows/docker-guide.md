---
description: Docker containerization guide for local development and production
---

# Docker Guide

> **Purpose**: Containerize API for consistent environments  
> **Use Cases**: Local dev, production deployment, CI/CD

---

## Current Docker Setup

### docker-compose.yml (Root)

```yaml
services:
  postgres:
    image: ankane/pgvector:v0.4.1
    ports: ['5433:5432']
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: 123456
      POSTGRES_DB: ecommerce
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports: ['6380:6379']
    volumes:
      - redis_data:/data

  api:
    build: ./api
    ports: ['8080:8080']
    deploy:
      replicas: 2 # Load balanced
    environment:
      DATABASE_URL: postgres://postgres:123456@postgres:5432/ecommerce
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  worker:
    build: ./api
    command: node dist/src/main.js
    environment:
      DATABASE_URL: postgres://postgres:123456@postgres:5432/ecommerce
      REDIS_URL: redis://redis:6379
      IS_WORKER: 'true'
    depends_on:
      - postgres
      - redis

  web:
    build: ./web
    ports: ['3000:3000']
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8080/api/v1
      API_URL: http://api:8080/api/v1
    depends_on:
      - api
```

---

## API Dockerfile (Multi-stage)

### Current (Single-stage)

```dockerfile
# api/Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm run build

EXPOSE 8080

CMD ["node", "dist/src/main.js"]
```

### Optimized (Multi-stage)

```dockerfile
# api/Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm install -g pnpm
RUN pnpm run build
RUN npx prisma generate

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy only production dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma
COPY package.json ./

EXPOSE 8080

CMD ["node", "dist/src/main.js"]
```

**Benefits**:

- Smaller image (~300MB → ~150MB)
- Faster builds (cached layers)
- Only production deps in final image

---

## Web Dockerfile (Multi-stage)

```dockerfile
# web/Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm install -g pnpm
RUN pnpm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Next.js Config** (enable standalone):

```javascript
// web/next.config.js
module.exports = {
  output: 'standalone', // For Docker
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};
```

---

## .dockerignore

### API

```
# api/.dockerignore
node_modules
dist
.env
.env.*
*.log
coverage
.git
.github
README.md
```

### Web

```
# web/.dockerignore
node_modules
.next
.env.local
.env.*.local
*.log
coverage
.git
.github
README.md
```

---

## Docker Compose Commands

### Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f api
docker compose logs -f web

# Restart service
docker compose restart api

# Stop all
docker compose down

# Reset (remove volumes)
docker compose down -v
```

### Production Build

```bash
# Build optimized images
docker compose -f docker-compose.prod.yml build

# Run production
docker compose -f docker-compose.prod.yml up -d
```

---

## Production docker-compose.yml

```yaml
# docker-compose.prod.yml
services:
  api:
    build:
      context: ./api
      dockerfile: Dockerfile
      target: runner # Multi-stage
    ports: ['8080:8080']
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    restart: always
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--quiet',
          '--tries=1',
          '--spider',
          'http://localhost:8080/health',
        ]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: ./api
      dockerfile: Dockerfile
      target: runner
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      IS_WORKER: 'true'
    restart: always

  web:
    build:
      context: ./web
      dockerfile: Dockerfile
      target: runner
    ports: ['3000:3000']
    environment:
      NODE_ENV: production
      NEXT_PUBLIC_API_URL: ${NEXT_PUBLIC_API_URL}
      API_URL: ${API_URL}
    restart: always
    healthcheck:
      test:
        [
          'CMD',
          'wget',
          '--quiet',
          '--tries=1',
          '--spider',
          'http://localhost:3000',
        ]
      interval: 30s
      timeout: 10s
      retries: 3
```

---

## Health Checks

```dockerfile
# Add to Dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/health || exit 1
```

---

## Environment Variables in Docker

### .env.docker (root)

```bash
DATABASE_URL=postgresql://postgres:123456@postgres:5432/ecommerce
REDIS_URL=redis://redis:6379
JWT_ACCESS_SECRET=dev-secret
JWT_REFRESH_SECRET=dev-secret-refresh
FRONTEND_URL=http://localhost:3000
```

Load in docker-compose:

```yaml
services:
  api:
    env_file:
      - .env.docker
```

---

## Docker Secrets (Production)

### Using Docker Secrets

```yaml
secrets:
  db_password:
    external: true

services:
  api:
    secrets:
      - db_password
    environment:
      DATABASE_URL: postgresql://user:${db_password}@host/db
```

Create secret:

```bash
echo "secure_password" | docker secret create db_password -
```

---

## Debugging

### Shell into container

```bash
docker compose exec api sh
docker compose exec web sh
```

### View logs

```bash
# Follow logs
docker compose logs -f --tail=100 api

# Search logs
docker compose logs api | grep ERROR
```

### Inspect

```bash
# Check running containers
docker ps

# Check resource usage
docker stats

# Inspect container
docker inspect ecommerce-api
```

---

## CI/CD with Docker

### Build in GitHub Actions

```yaml
- name: Build Docker Image
  run: |
    docker build -t ghcr.io/${{ github.repository }}/api:${{ github.sha }} ./api
    docker build -t ghcr.io/${{ github.repository }}/web:${{ github.sha }} ./web

- name: Push to Registry
  run: |
    echo ${{ secrets.GITHUB_TOKEN }} | docker login ghcr.io -u ${{ github.actor }} --password-stdin
    docker push ghcr.io/${{ github.repository }}/api:${{ github.sha }}
    docker push ghcr.io/${{ github.repository }}/web:${{ github.sha }}
```

---

## Best Practices

### DO

- ✅ Use multi-stage builds
- ✅ .dockerignore to exclude files
- ✅ Run as non-root user
- ✅ Use specific image tags (not `latest`)
- ✅ Add health checks
- ✅ Use secrets for sensitive data

### DON'T

- ❌ Include dev dependencies in production
- ❌ Run as root
- ❌ Hardcode secrets in Dockerfile
- ❌ Use `latest` tag in production
- ❌ Ignore .dockerignore

---

**Location**: `api/Dockerfile`, `web/Dockerfile`, `docker-compose.yml`
