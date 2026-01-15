# Checklist Deploy Tính Năng Mới

> Checklist này dựa trên cấu hình thực tế từ `package.json`, `Dockerfile`, `docker-compose.yml`.

---

## 1. Pre-build

### Code Quality

```bash
# Chạy linting
npm run lint

# Type check
npx tsc --noEmit

# Chạy tests
npm test
# Hoặc chỉ run tests (không watch)
npm run test:run
```

### Environment Variables

**Required ENV (từ docker-compose.yml):**

| Variable              | Description                    | Required |
| --------------------- | ------------------------------ | -------- |
| `NEXT_PUBLIC_API_URL` | Client-side API URL            | ✅       |
| `API_URL`             | Server-side API URL (internal) | ✅       |

**Check ENV:**

```bash
# Verify .env exists
cat .env

# Required variables
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 2. Build & Verification

### Local Build

```bash
# Production build
npm run build

# Verify build success
# Check .next folder exists
ls -la .next/
```

### Docker Build

```bash
# Build Docker image
docker build -t web:latest .

# Hoặc với build args
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.example.com/v1 \
  -t web:latest .
```

### Build Artifacts (từ Dockerfile)

| Artifact   | Location            | Description              |
| ---------- | ------------------- | ------------------------ |
| Standalone | `.next/standalone/` | Next.js optimized output |
| Static     | `.next/static/`     | Static assets            |
| Public     | `public/`           | Public files             |

**Dockerfile output (64 lines):**

- Multi-stage build (builder → runner)
- Image size ~100MB (standalone mode)
- Node 20 Alpine base

---

## 3. Database Migration

**[KHÔNG TÌM THẤY TRONG PROJECT]**

- Không có Prisma/Drizzle migrations trong web project
- Database được quản lý bởi API service

---

## 4. Deploy

### Docker Compose

```bash
# Từ folder web/
docker compose up -d --build

# Hoặc từ root
docker compose -f web/docker-compose.yml up -d --build
```

### Network Setup (từ docker-compose.yml)

```yaml
networks:
  ecommerce_network:
    external: true
    name: api_ecommerce_network
```

**⚠️ LƯU Ý**: API phải đang chạy trước khi start Web (external network).

### Manual Deploy

```bash
# SSH vào server
ssh user@server

# Pull latest code
git pull origin main

# Install deps
npm ci

# Build
npm run build

# Start với PM2 hoặc systemd
npm start
```

---

## 5. Post-deploy Verification

### Health Check

```bash
# Check container running
docker ps | grep web

# Check logs
docker logs web --tail 100

# Test endpoint
curl -I http://localhost:3000
```

### Smoke Tests

```bash
# E2E tests (Playwright)
npm run test:e2e

# Hoặc manual check các routes chính
# - Homepage: /
# - Products: /products
# - Cart: /cart
# - Checkout: /checkout
```

### Monitoring

```bash
# Docker logs
docker logs -f web

# Resource usage
docker stats web
```

---

## 6. Rollback Plan

### Docker Rollback

```bash
# Stop current container
docker compose down

# Pull previous image
docker pull registry/web:previous-tag

# Deploy previous version
docker compose up -d
```

### Git Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>

# Rebuild and deploy
npm run build && npm start
```

---

## Checklist Summary

### Pre-deploy

- [ ] `npm run lint` - no errors
- [ ] `npx tsc --noEmit` - no type errors
- [ ] `npm run test:run` - all tests pass
- [ ] ENV variables configured

### Deploy

- [ ] `docker compose up -d --build` successful
- [ ] Container running (`docker ps`)
- [ ] No errors in logs (`docker logs web`)

### Post-deploy

- [ ] Homepage loads
- [ ] Core user flows work
- [ ] No errors in browser console
- [ ] No spike in error rates

### If Issues

- [ ] Check logs first
- [ ] Rollback if critical
- [ ] Document issue for hotfix
