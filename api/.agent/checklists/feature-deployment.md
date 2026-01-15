# Feature Deployment Checklist

> Checklist dành cho DevOps/Backend Engineer khi release tính năng mới.

## 1. Pre-build Verification

Trước khi build image, hãy đảm bảo code sạch và pass test.

- [ ] **Lint Check:**
  ```bash
  npm run lint
  # Nếu lỗi, chạy: npm run lint -- --fix
  ```
- [ ] **Unit Tests:**
  ```bash
  npm run test
  # Hoặc test coverage: npm run test:cov
  ```
- [ ] **E2E Tests (Optional but Recommended):**
  ```bash
  npm run test:e2e
  ```

## 2. Environment Variables Check

Đảm bảo các biến ENV sau đã được cấu hình trên Server (Render/Docker):

- **Database & Redis:**
  - `DATABASE_URL` (PostgreSQL connection string)
  - `REDIS_URL` (Redis connection string)
- **Auth Secrets:**
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- **Feature Flags (Nếu tính năng mới cần):**
  - `ENABLE_FEATURE_X=true` (Ví dụ)
- **Third Party:**
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (Nếu đụng đến ảnh)
  - `GEMINI_API_KEY` (Nếu dùng AI)

## 3. Build & Artifact Verification

- [ ] **Build Command:**
  ```bash
  npm run build
  ```
- [ ] **Verify Artifact:**
      Kiểm tra xem folder `dist/` đã được tạo ra chưa và chứa `main.js`.
  ```bash
  ls -la dist/
  # Expected: main.js, main.js.map, ...
  ```

## 4. Database Migration

⚠️ **Quan trọng:** Backup DB trước khi chạy nếu migration có tính chất destructive (drop column/table).

- [ ] **Deploy Migration (Production):**
  ```bash
  # Lệnh này sẽ apply các migration pending (từ folder prisma/migrations)
  npx prisma migrate deploy
  ```
- [ ] **Rollback Strategy (Nếu migration fail):**
      Prisma không có lệnh `rollback` native. Nếu lỗi:
  1. Revert code về version cũ.
  2. Nếu DB đã dính migration lỗi, dùng:
     ```bash
     npx prisma migrate resolve --rolled-back "tên_migration_gây_lỗi"
     ```
  3. Restore từ backup (Last resort).

## 5. Deployment (Docker / PM2)

- [ ] **Restart Application:**

  ```bash
  # Nếu dùng Docker Compose
  docker compose up -d --build api

  # Nếu dùng PM2 (Ecosystem)
  pm2 reload api --update-env
  ```

- [ ] **Check Logs (Startup):**
      Monitor log ngay sau khi start để bắt lỗi crash (ví dụ: thiếu env var).
  ```bash
  docker logs -f api --tail 100
  # Mong đợi: "🚀 Server is running on..."
  ```

## 6. Post-deploy Verification (Smoke Test)

- [ ] **Health Check:**
  ```bash
  curl http://localhost:8080/api/health
  # Expected: {"status":"ok", ...} hoặc 200 OK
  ```
- [ ] **Functional Check:**
      Test tay tính năng quan trọng nhất vừa deploy trên môi trường Production.
