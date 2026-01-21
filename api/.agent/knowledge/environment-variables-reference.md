# Environment Variables Reference

> **Complete matrix** của tất cả environment variables cho API  
> **Purpose**: Single source of truth cho configuration

---

## 1. Required Variables (Production)

### Database

| Variable             | Required | Example                                                              | Description                                |
| -------------------- | -------- | -------------------------------------------------------------------- | ------------------------------------------ |
| `DATABASE_URL`       | ✅       | `postgresql://user:pass@host/db?sslmode=require&connection_limit=10` | PostgreSQL connection string (Neon pooled) |
| `DATABASE_POOL_SIZE` | ✅       | `10`                                                                 | Prisma connection pool size                |

### Redis

| Variable    | Required | Example                          | Description                         |
| ----------- | -------- | -------------------------------- | ----------------------------------- |
| `REDIS_URL` | ✅       | `rediss://default:pwd@host:6379` | Redis connection (Upstash with TLS) |

### JWT

| Variable                 | Required | Example                 | Description               |
| ------------------------ | -------- | ----------------------- | ------------------------- |
| `JWT_ACCESS_SECRET`      | ✅       | `64-char-hex-string`    | Access token signing key  |
| `JWT_REFRESH_SECRET`     | ✅       | `different-64-char-hex` | Refresh token signing key |
| `JWT_ACCESS_EXPIRATION`  | ✅       | `15m`                   | Access token TTL          |
| `JWT_REFRESH_EXPIRATION` | ✅       | `7d`                    | Refresh token TTL         |

**Generate secrets**:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### CORS & Frontend

| Variable       | Required | Example                       | Description         |
| -------------- | -------- | ----------------------------- | ------------------- |
| `FRONTEND_URL` | ✅       | `https://your-app.vercel.app` | Allowed CORS origin |

### Node Environment

| Variable   | Required | Example      | Description                     |
| ---------- | -------- | ------------ | ------------------------------- |
| `NODE_ENV` | ✅       | `production` | Environment mode                |
| `PORT`     | ✅       | `10000`      | HTTP port (Render auto-assigns) |

---

## 2. Optional Variables

### Cloudinary (Image Uploads)

| Variable                | Required | Example           | Description           |
| ----------------------- | -------- | ----------------- | --------------------- |
| `CLOUDINARY_CLOUD_NAME` | ❌       | `your_cloud_name` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY`    | ❌       | `123456789012345` | API key               |
| `CLOUDINARY_API_SECRET` | ❌       | `abc123xyz`       | API secret            |

### Sentry (Error Tracking)

| Variable     | Required | Example                                | Description        |
| ------------ | -------- | -------------------------------------- | ------------------ |
| `SENTRY_DSN` | ❌       | `https://xxx@xxx.ingest.sentry.io/xxx` | Sentry project DSN |

### Google AI (Gemini)

| Variable                | Required | Example     | Description           |
| ----------------------- | -------- | ----------- | --------------------- |
| `GOOGLE_GEMINI_API_KEY` | ❌       | `AIzaSy...` | Google Gemini API key |

### Email (SMTP)

| Variable    | Required | Example                  | Description   |
| ----------- | -------- | ------------------------ | ------------- |
| `SMTP_HOST` | ❌       | `smtp.gmail.com`         | SMTP server   |
| `SMTP_PORT` | ❌       | `587`                    | SMTP port     |
| `SMTP_USER` | ❌       | `your@email.com`         | SMTP username |
| `SMTP_PASS` | ❌       | `app-password`           | SMTP password |
| `SMTP_FROM` | ❌       | `noreply@yourdomain.com` | From address  |

### Feature Flags

| Variable    | Required | Example | Description                                 |
| ----------- | -------- | ------- | ------------------------------------------- |
| `IS_WORKER` | ❌       | `true`  | Flag worker instance (BullMQ consumer mode) |

---

## 3. Development vs Production

### Local Development (.env)

```bash
# Development config
NODE_ENV=development
PORT=8080

# Local Docker services
DATABASE_URL=postgresql://postgres:123456@localhost:5433/ecommerce?schema=public
REDIS_URL=redis://localhost:6380

# Dev JWT secrets (not secure, OK for dev)
JWT_ACCESS_SECRET=dev-secret-access
JWT_REFRESH_SECRET=dev-secret-refresh
JWT_ACCESS_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=30d

# Local frontend
FRONTEND_URL=http://localhost:3000

# Optional: Enable query logs
DATABASE_LOG_QUERIES=true
```

### Production (Render)

```bash
# Production config
NODE_ENV=production
PORT=10000

# Neon PostgreSQL (pooled)
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/main?sslmode=require&connection_limit=10
DATABASE_POOL_SIZE=10

# Upstash Redis (TLS)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# Secure JWT secrets (generated)
JWT_ACCESS_SECRET=<64-char-random-hex>
JWT_REFRESH_SECRET=<different-64-char-random-hex>
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Vercel frontend URL
FRONTEND_URL=https://your-app.vercel.app

# Production services
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
GOOGLE_GEMINI_API_KEY=...
```

---

## 4. Security Best Practices

### DO

- ✅ Use different secrets for dev/prod
- ✅ Rotate secrets every 90 days
- ✅ Use strong random secrets (64+ chars)
- ✅ Store in encrypted service (Render env vars)
- ✅ Never commit to git

### DON'T

- ❌ Use same secret in multiple environments
- ❌ Share secrets via Slack/Email
- ❌ Hardcode secrets in code
- ❌ Use predictable secrets (`secret123`)
- ❌ Expose .env file publicly

---

## 5. Env Vars in Code

### Access Variables

```typescript
// config/database.config.ts
export default () => ({
  database: {
    url: process.env.DATABASE_URL,
    poolSize: parseInt(process.env.DATABASE_POOL_SIZE, 10) || 10,
  },
  redis: {
    url: process.env.REDIS_URL,
  },
  jwt: {
    access: {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    },
    refresh: {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    },
  },
});
```

### Validation

```typescript
// config/env.validation.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  FRONTEND_URL: z.string().url(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.format());
    process.exit(1);
  }

  return result.data;
}
```

Call in `main.ts`:

```typescript
async function bootstrap() {
  validateEnv(); // Crash early if invalid
  // ...
}
```

---

## 6. Secret Rotation

### Steps

1. **Generate new secret**:

   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Update Render env var** (both old and new)

   ```bash
   JWT_ACCESS_SECRET=<old-secret>
   JWT_ACCESS_SECRET_NEW=<new-secret>
   ```

3. **Update code** to check both:

   ```typescript
   jwt.verify(
     token,
     process.env.JWT_ACCESS_SECRET || process.env.JWT_ACCESS_SECRET_NEW,
   );
   ```

4. **Deploy** and wait 24h (for old tokens to expire)

5. **Remove old secret**, rename new:
   ```bash
   JWT_ACCESS_SECRET=<new-secret>
   # Delete JWT_ACCESS_SECRET_NEW
   ```

---

## 7. Troubleshooting

### Error: "JWT_ACCESS_SECRET is required"

**Cause**: Missing env var

**Solution**:

```bash
# Check env vars are set
echo $JWT_ACCESS_SECRET

# In Render dashboard, verify variable exists
```

### Error: "Database connection failed"

**Cause**: Invalid `DATABASE_URL`

**Solution**:

```bash
# Verify format
postgresql://user:pass@host/db?sslmode=require

# Test connection
psql "$DATABASE_URL"
```

### Error: "Redis connection timeout"

**Cause**: Using `redis://` instead of `rediss://`

**Solution**:

```bash
# ✅ Correct (with TLS)
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# ❌ Wrong
REDIS_URL=redis://...
```

---

## 8. Example .env.example

```bash
# ==================================
# DATABASE
# ==================================
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
DATABASE_POOL_SIZE=10

# ==================================
# REDIS
# ==================================
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379

# ==================================
# JWT
# ==================================
JWT_ACCESS_SECRET=your-64-char-secret-here
JWT_REFRESH_SECRET=different-64-char-secret
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ==================================
# CORS
# ==================================
FRONTEND_URL=http://localhost:3000

# ==================================
# OPTIONAL SERVICES
# ==================================
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

SENTRY_DSN=

GOOGLE_GEMINI_API_KEY=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=

# ==================================
# NODE
# ==================================
NODE_ENV=development
PORT=8080
```

---

**Next**: [testing-guide.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/testing-guide.md) cho E2E test strategy
