# Tech Stack Reference

Tài liệu này chứa toàn bộ thông tin về Tech Stack, dependencies và cách sử dụng.

---

## 1. Backend (NestJS 11)

### Core Dependencies

| Package                 | Version | Mục đích                           |
| ----------------------- | ------- | ---------------------------------- |
| `@nestjs/core`          | 11.x    | Framework chính                    |
| `@nestjs/config`        | 4.x     | Environment variables              |
| `@nestjs/jwt`           | 11.x    | JWT Authentication                 |
| `@nestjs/passport`      | 11.x    | Auth strategies (Google, Facebook) |
| `@nestjs/swagger`       | 11.x    | API Documentation                  |
| `@nestjs/throttler`     | 6.x     | Rate Limiting                      |
| `@nestjs/bullmq`        | 11.x    | Job Queue                          |
| `@nestjs/event-emitter` | 3.x     | Domain Events                      |
| `@nestjs/schedule`      | 6.x     | Cron Jobs                          |
| `@nestjs/websockets`    | 11.x    | Real-time                          |
| `@nestjs/cache-manager` | 3.x     | Caching                            |

### Database & ORM

| Package          | Version | Mục đích        |
| ---------------- | ------- | --------------- |
| `prisma`         | 6.x     | ORM CLI         |
| `@prisma/client` | 6.x     | Database Client |
| `ioredis`        | 5.x     | Redis Client    |

### Validation (⚠️ CẦN TỐI ƯU)

| Package           | Status    | Khuyến nghị                 |
| ----------------- | --------- | --------------------------- |
| `joi`             | Đang dùng | ❌ Loại bỏ, chuyển sang Zod |
| `class-validator` | Đang dùng | ❌ Loại bỏ, chuyển sang Zod |
| `zod`             | 4.x       | ✅ Dùng làm chuẩn duy nhất  |

### Utilities

| Package      | Mục đích            |
| ------------ | ------------------- |
| `bcrypt`     | Password hashing    |
| `nodemailer` | Email sending       |
| `otplib`     | 2FA OTP generation  |
| `cloudinary` | Image upload        |
| `sharp`      | Image processing    |
| `slugify`    | URL slug generation |
| `exceljs`    | Excel export        |
| `winston`    | Logging             |

### AI

| Package                 | Mục đích          |
| ----------------------- | ----------------- |
| `@google/generative-ai` | Google Gemini API |

### Monitoring

| Package          | Mục đích       |
| ---------------- | -------------- |
| `@sentry/nestjs` | Error tracking |

---

## 2. Frontend (Next.js 16)

### Core

| Package     | Version | Mục đích        |
| ----------- | ------- | --------------- |
| `next`      | 16.x    | React Framework |
| `react`     | 19.x    | UI Library      |
| `react-dom` | 19.x    | DOM Rendering   |

### State & Data

| Package   | Mục đích                             |
| --------- | ------------------------------------ |
| `zustand` | Global State Management              |
| `swr`     | Data Fetching & Caching              |
| `nuqs`    | URL State Management (Search Params) |

### Forms

| Package               | Mục đích        |
| --------------------- | --------------- |
| `react-hook-form`     | Form Handling   |
| `@hookform/resolvers` | Zod Integration |
| `zod`                 | Validation      |

### UI Components

| Package                    | Mục đích                 |
| -------------------------- | ------------------------ |
| `@radix-ui/*`              | Headless UI (Accessible) |
| `lucide-react`             | Icons                    |
| `framer-motion`            | Animations               |
| `tailwindcss`              | Styling                  |
| `class-variance-authority` | Variant Styling          |
| `tailwind-merge`           | Class Merging            |

### Rich Text

| Package     | Mục đích       |
| ----------- | -------------- |
| `@tiptap/*` | WYSIWYG Editor |

### Charts

| Package    | Mục đích           |
| ---------- | ------------------ |
| `recharts` | Data Visualization |

### Utilities

| Package            | Mục đích                 |
| ------------------ | ------------------------ |
| `date-fns`         | Date Formatting          |
| `lodash`           | Utility Functions        |
| `jose`             | JWT (Server-side)        |
| `next-safe-action` | Type-safe Server Actions |
| `sonner`           | Toast Notifications      |

---

## 3. Infrastructure

### Docker Services

| Service    | Image                  | Port              |
| ---------- | ---------------------- | ----------------- |
| `postgres` | ankane/pgvector:v0.4.1 | 5432              |
| `redis`    | redis:7-alpine         | 6379              |
| `api`      | Custom (NestJS)        | 8080 (2 replicas) |
| `web`      | Custom (Next.js)       | 3000              |
| `worker`   | Custom (BullMQ)        | -                 |

### Environment Variables (Required)

```bash
# Database
DATABASE_URL=postgres://...

# Redis
REDIS_URL=redis://...

# Auth
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# Frontend
FRONTEND_URL=http://localhost:3000

# Optional
CLOUDINARY_*
SENTRY_*
GOOGLE_GEMINI_API_KEY
```

---

## 4. Scripts quan trọng

### API

```bash
npm run dev          # Development
npm run build        # Production build
npm run start:prod   # Production start (with migrate)
npm run seed         # Database seeding
npm run lint         # Linting
npm run test         # Unit tests
npm run test:e2e     # E2E tests
```

### Web

```bash
npm run dev          # Development
npm run build        # Production build
npm run start        # Production start
npm run lint         # Linting
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
```
