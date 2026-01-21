# Production Deployment Checklist

> **Goal**: 100% operational production environment using the Core Infrastructure requirements defined in `.agent`.

---

## 🚀 Pre-flight Checklist

1. **GitHub Repository**: Ensure both `api` and `web` directories are clean and building locally.
2. **Neon PostgreSQL**:
   - [ ] Provision database.
   - [ ] Enable `pgvector`.
   - [ ] Get **Pooled Connection** string.
3. **Upstash Redis**:
   - [ ] Provision Redis instance.
   - [ ] Ensure TLS/SSL is enabled.
   - [ ] Copy `rediss://` connection URL.

---

## 📡 Core Deployment Steps

### 1. Backend (API & Worker)

- [ ] Connect repository to your Compute provider (Render/AWS/Railway).
- [ ] Use `api` as root directory.
- [ ] Configure **Web Service** (`pnpm run start:prod`).
- [ ] Configure **Background Worker** (`node dist/src/main.js`, `IS_WORKER=true`).
- [ ] Set all Required Environment Variables.
- **Reference**: [api/infrastructure-reference.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/infrastructure-reference.md)

### 2. Frontend (Next.js Application)

- [ ] Connect repository to your Web provider (Vercel/Netlify).
- [ ] Use `web` as root directory.
- [ ] Set `NEXT_PUBLIC_API_URL`.
- [ ] Configure Custom Domains.
- **Reference**: [web/infrastructure-reference.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/infrastructure-reference.md)

---

## 🛠️ Verification & Monitoring

- [ ] **Health Check**: Verify `/health` on API return `200 OK`.
- [ ] **Data Sync**: Test 1 order flow to ensure DB, Redis, and Workers are communicating.
- [ ] **Error Tracking**: Verify Sentry is receiving events.
- **Reference**: [api/monitoring-observability-guide.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/monitoring-observability-guide.md)

---

## 🚨 Troubleshooting

For specific error codes and common issues, see:

- [API Troubleshooting](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/infrastructure-reference.md#troubleshooting)
- [Web Troubleshooting](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/infrastructure-reference.md#troubleshooting)
