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
| `nestjs-cls`            | 6.x     | Tenant Context Storage             |
| `nestjs-i18n`           | 10.x    | Backend Internationalization       |

### Database & ORM

| Package          | Version | Mục đích        |
| ---------------- | ------- | --------------- |
| `prisma`         | 5.22.0  | ORM CLI         |
| `@prisma/client` | 5.22.0  | Database Client |
| `ioredis`        | 5.x     | Redis Client    |

### Validation (Zod-First Standard)

| Package           | Status     | Khuyến nghị                 |
| ----------------- | ---------- | --------------------------- |
| `joi`             | ❌ REMOVED | Đã loại bỏ hoàn toàn        |
| `class-validator` | ❌ REMOVED | Đã loại bỏ hoàn toàn        |
| `zod`             | 3.x        | ✅ Chuẩn duy nhất API + Web |

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
| `next`      | 16.1.x  | React Framework |
| `react`     | 19.2.x  | UI Library      |
| `react-dom` | 19.2.x  | DOM Rendering   |

### State & Data

| Package     | Version | Mục đích                             |
| ----------- | ------- | ------------------------------------ |
| `zustand`   |         | Global State Management              |
| `swr`       |         | Data Fetching & Caching              |
| `nuqs`      | 2.8.x   | URL State Management (Search Params) |
| `next-intl` | 4.6.x   | Internationalization (i18n)          |

### Forms

| Package               | Mục đích        |
| --------------------- | --------------- |
| `react-hook-form`     | Form Handling   |
| `@hookform/resolvers` | Zod Integration |
| `zod`                 | Validation      |

### Real-time & Communications

| Package              | Mục đích            |
| -------------------- | ------------------- |
| `@nestjs/websockets` | WebSocket Gateway   |
| `socket.io`          | Socket Server       |
| `socket.io-client`   | Socket Client (Web) |
| `nodemailer`         | Email Service       |

### UI Components (Shadcn System)

| Package                    | Mục đích            |
| -------------------------- | ------------------- |
| `shadcn-ui` (CLI)          | Component System    |
| `@radix-ui/*`              | Headless Primitives |
| `class-variance-authority` | Component Variants  |

| Package                    | Mục đích                 |
| -------------------------- | ------------------------ |
| `@radix-ui/*`              | Headless UI (Accessible) |
| `lucide-react`             | Icons                    |
| `framer-motion`            | Animations               |
| `tailwindcss`              | 4.x (CSS-first)          |
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

| Package            | Mục đích                   |
| ------------------ | -------------------------- |
| `date-fns`         | Date Formatting            |
| `lodash`           | Utility Functions          |
| `jose`             | JWT (Server-side)          |
| `next-safe-action` | Type-safe Server Actions   |
| `middleware.ts`    | Auth Guard & Auto Refresh  |
| `sonner`           | Toast Notifications        |
| `zustand/persist`  | Multi-currency Persistence |

---

## 3. Infrastructure

### Docker Services

| Service    | Image                  | Port              | Env (Local)    |
| ---------- | ---------------------- | ----------------- | -------------- |
| `postgres` | ankane/pgvector:v0.4.1 | 5432              | Docker         |
| `redis`    | redis:7-alpine         | 6385              | Docker         |
| `api`      | Custom (NestJS)        | 8080 (2 replicas) | Local / Docker |
| `web`      | Custom (Next.js)       | 3000              | Local          |

### Production Cloud (Modern Stack)

- **Frontend**: Vercel
- **Backend**: Railway / Render
- **Database**: Neon (Serverless Postgres)
- **Cache/Queue**: Upstash (Redis/Kafka)

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
