# Monitoring & Observability Guide

> **Stack**: Sentry (Errors) + Render Metrics + Future: Prometheus + Grafana  
> **Goal**: 99.9% uptime, <30s MTTR (Mean Time To Recovery)

---

## 1. Sentry Error Tracking

### 1.1 Setup

1. Tạo account: https://sentry.io
2. Create project: `{{YOUR_PROJECT_NAME}}` (Platform: Node.js)
3. Copy DSN: `https://xxx@xxx.ingest.sentry.io/xxx`

### 1.2 Integration

**Install**:

```bash
cd api
pnpm add @sentry/nestjs
```

**Configure**:

```typescript
// src/main.ts
import * as Sentry from '@sentry/nestjs';

async function bootstrap() {
  // Init Sentry FIRST
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 0.1, // 10% transactions
    profilesSampleRate: 0.1,
  });

  const app = await NestFactory.create(AppModule);
  // ...
}
```

### 1.3 Custom Contexts

```typescript
// Add user context
Sentry.setUser({ id: user.id, email: user.email });

// Add tags
Sentry.setTag('tenant', tenantId);

// Add breadcrumbs
Sentry.addBreadcrumb({
  category: 'order',
  message: 'Order created',
  level: 'info',
  data: { orderId },
});
```

### 1.4 Alert Rules

Trong Sentry Dashboard → Project Settings → Alerts:

- **High Error Rate**: >10 errors/minute → Slack notification
- **New Issue**: First occurrence → Email
- **Regression**: Issue reopened → Slack

---

## 2. Render Built-in Metrics

### 2.1 Available Metrics

**CPU Usage**:

- Ideal: <50%
- Warning: >70%
- Critical: >90%

**Memory Usage**:

- Ideal: <60%
- Warning: >80%
- Critical: >95% → OOM risk

**Response Time**:

- P50: <100ms
- P95: <500ms
- P99: <1000ms

### 2.2 Set Up Alerts

1. Service → **Settings** → **Notifications**
2. Add:
   - CPU >80% for 5 min → Email
   - Memory >90% for 5 min → Email + Slack
   - Service down → SMS (critical)

---

## 3. Health Check Endpoints

### 3.1 Basic Health

```typescript
// health.controller.ts
@Get('health')
health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### 3.2 Readiness Check

```typescript
@Get('health/ready')
async ready() {
  const checks = await Promise.allSettled([
    this.checkDatabase(),
    this.checkRedis(),
  ]);

  const dbOk = checks[0].status === 'fulfilled';
  const redisOk = checks[1].status === 'fulfilled';

  return {
    database: dbOk ? 'ok' : 'fail',
    redis: redisOk ? 'ok' : 'fail',
    ready: dbOk && redisOk,
  };
}

private async checkDatabase() {
  await this.prisma.$queryRaw`SELECT 1`;
}

private async checkRedis() {
  const pong = await this.redis.ping();
  if (pong !== 'PONG') throw new Error('Redis not ready');
}
```

### 3.3 Liveness Check

```typescript
@Get('health/live')
live() {
  // Simple check: process is running
  return { alive: true };
}
```

---

## 4. Application Logging

### 4.1 Winston Setup

Already configured in project. Levels:

- `error`: Errors, exceptions
- `warn`: Warnings, deprecations
- `info`: Important events (order created, user login)
- `debug`: Detailed debugging (only in dev)

### 4.2 Structured Logging

```typescript
this.logger.log({
  message: 'Order created',
  orderId,
  tenantId,
  amount,
  timestamp: new Date(),
});
```

### 4.3 Query Logs

```bash
# Enable in dev only
DATABASE_LOG_QUERIES=true
```

Prisma will log:

```
prisma:query SELECT * FROM "Order" WHERE "id" = $1
prisma:query Duration: 12ms
```

---

## 5. Uptime Monitoring

### 5.1 UptimeRobot (Free)

1. Sign up: https://uptimerobot.com
2. Add **HTTP Monitor**:
   - URL: `https://ecommerce-api.onrender.com/health`
   - Type: HTTP(s)
   - Interval: 5 minutes
   - Alert when down for: 2 minutes
3. Notifications: Email + Slack

### 5.2 Better Uptime (Premium)

Alternative với UI đẹp hơn: https://betterstack.com/better-uptime

**Features**:

- Status pages
- Incident management
- On-call scheduling

---

## 6. Future: Prometheus + Grafana

### 6.1 Why Prometheus?

Supastarter uses Prometheus for custom metrics:

- Request rate per endpoint
- Cache hit rate
- Database query time
- Custom business metrics (orders/minute)

### 6.2 Installation (Planned)

```bash
pnpm add @willsoto/nestjs-prometheus prom-client
```

```typescript
// app.module.ts
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
})
```

### 6.3 Custom Metrics

```typescript
import { Counter, Histogram } from 'prom-client';

const orderCounter = new Counter({
  name: 'orders_total',
  help: 'Total orders created',
  labelNames: ['status', 'tenant'],
});

orderCounter.inc({ status: 'success', tenant: 'shop1' });
```

### 6.4 Grafana Dashboard

Template dashboards:

- NestJS Overview (ID: 11159)
- PostgreSQL (ID: 9628)
- Redis (ID: 2751)

---

## 7. Performance Monitoring

### 7.1 Database Query Performance

**Slow Query Log**:

```typescript
// prisma middleware
prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  if (after - before > 100) {
    // >100ms
    console.warn(
      `Slow query: ${params.model}.${params.action} took ${after - before}ms`,
    );
  }

  return result;
});
```

### 7.2 API Response Time Tracking

```typescript
// Interceptor
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, url } = req;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        if (responseTime > 500) {
          console.warn(
            `Slow endpoint: ${method} ${url} took ${responseTime}ms`,
          );
        }
      }),
    );
  }
}
```

---

## 8. Incident Response Playbook

### 8.1 High Error Rate (>50 errors/min)

1. **Check Sentry** for error pattern
2. **Check Render logs** for stack traces
3. **If database issue**: Check Neon status page
4. **If Redis issue**: Check Upstash status
5. **Rollback** if recent deployment

### 8.2 High Response Time (P95 >1s)

1. **Check Render metrics** → CPU/Memory
2. **Check database queries** → Slow query log
3. **Check Redis** → Cache hit rate
4. **Scale up** instance if needed

### 8.3 Service Down

1. **Check Render status**: https://status.render.com
2. **Manual restart**: Render Dashboard → Service → **Manual Deploy**
3. **Check logs** for crash reason
4. **Notify team** via Slack

---

## 9. Monitoring Dashboard (Recommended)

Setup một dashboard tổng hợp:

**Option 1: Grafana Cloud** (Free tier)

- Add Prometheus data source
- Import NestJS dashboard
- Add custom panels

**Option 2: Render Logs + Sentry**

- Sentry for errors
- Render for infrastructure
- UptimeRobot for uptime

**Option 3: Datadog** (Enterprise)

- Full observability
- APM tracing
- Cost: ~$15/host/month

---

## 10. Best Practices

### DO

- ✅ Log all errors với stack trace
- ✅ Set up alerts cho critical paths
- ✅ Monitor database connection pool
- ✅ Track business metrics (orders, revenue)
- ✅ Regular log review (weekly)

### DON'T

- ❌ Log sensitive data (passwords, tokens)
- ❌ Ignore warnings
- ❌ Over-alert (alert fatigue)
- ❌ Log ở `debug` level trong production
- ❌ Forget to rotate logs

---

## Verification Checklist

- [ ] Sentry receiving errors
- [ ] Render alerts configured
- [ ] UptimeRobot monitoring active
- [ ] Health endpoints working
- [ ] Logs structured and readable
- [ ] Team knows incident response playbook

---

**Next**: [background-jobs-guide.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/background-jobs-guide.md) để setup Bull Board monitoring cho jobs

**Reference**: [Infrastructure Reference](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/infrastructure-reference.md)
