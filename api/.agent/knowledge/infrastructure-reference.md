# Backend Infrastructure Reference

> **Purpose**: Define the operational requirements for running the NestJS API in production.  
> **Target**: DevOps / Senior Engineers  
> **Ideal Stack**: Docker-ready environment with PostgreSQL, Redis, and a background processing layer.

---

## 1. Runtime Requirements

- **Node.js**: v20 or higher (LTS recommended).
- **Process Manager**: Docker / Kubernetes or PM2.
- **Package Manager**: pnpm (v8+).

---

## 2. Dependencies (Internal & External)

### 2.1 Primary Database (PostgreSQL)

- **Standard**: PostgreSQL 16+ with `pgvector` extension enabled.
- **Connection**: Connection pooling is mandatory for serverless or high-traffic scenarios (e.g., PgBouncer or Neon Pooled Connection).
- **Migrations**: Managed via Prisma CLI (`npx prisma migrate deploy`).

### 2.2 Cache & Task Queue (Redis)

- **Standard**: Redis 7+ (TLS recommended in production).
- **Format**: ioredis-compatible connection strings (`rediss://...`).
- **Persistence**: Required for long-lived background jobs.

---

## 3. Deployment Architecture

Hệ thống được thiết kế để tách biệt phần xử lý HTTP và phần xử lý Task không đồng bộ:

### 3.1 HTTP Web Service

- **Role**: Xử lý API requests từ Frontend.
- **Scaling**: Stateless, có thể scale ngang (horizontal) không giới hạn.
- **Health Checks**: `/health` (liveness) và `/health/ready` (readiness).

### 3.2 Background Worker

- **Role**: Consume BullMQ jobs từ Redis.
- **Activation**: Chạy code gốc của API nhưng với flag `IS_WORKER=true`.
- **Scaling**: Scale dựa trên độ dài hàng đợi (Queue depth).

---

## 4. Networking & Security

- **CORS**: Phải được cấu hình nghiêm ngặt (`FRONTEND_URL=https://<your-web-project>.vercel.app`)
- **TLS/SSL**: Bắt buộc cho toàn bộ giao dịch.
- **Rate Limiting**: Throttler layer tích hợp sẵn (mặc định 100 req/min/IP).
- **Encryption**: JWT secrets phải có độ dài tối thiểu 64 ký tự (Random Hex).

---

## 5. Environment Isolation

| Layer | local        | staging          | production               |
| ----- | ------------ | ---------------- | ------------------------ |
| DB    | Local Docker | Staging Neon     | Production Neon (Pooled) |
| Redis | Local Docker | Upstash Dev      | Upstash Prod             |
| Files | Local FS     | Cloudinary Stage | Cloudinary Prod          |

---

## 6. Implementation Example: Render

Dưới đây là cấu hình tham khảo cho Render:

- **Web Service**:
  - Root Directory: `api`
  - Build Command: `pnpm install && pnpm run build`
  - Start Command: `pnpm run start:prod`
- **Background Worker**:
  - Start Command: `node dist/src/main.js`
  - Env: `IS_WORKER=true`

---

**Next**: [environment-variables-reference.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/environment-variables-reference.md)
