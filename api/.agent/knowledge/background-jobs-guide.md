# Background Jobs & Bull Board Guide

> **Queue System**: BullMQ  
> **Monitoring UI**: Bull Board  
> **Use Cases**: Email sending, report generation, AI processing

---

## 1. Current Implementation Audit

### 1. 1 Existing Setup

Dự án đã có BullMQ:

- Package: `@nestjs/bullmq`, `bullmq`
- Redis: Upstash (production) hoặc local Redis (dev)
- Worker: Render Background Worker service

### 1.2 Current Queues

```typescript
// src/core/queue/queue.module.ts
@Module({
  imports: [
    Bull Module.registerQueue(
     { name: 'email' },
      { name: 'ai' },
      { name: 'reports' },
    ),
  ],
})
```

---

## 2. Adding Bull Board Dashboard

### 2.1 Why Bull Board?

**Without Board**:

- ❌ No visibility into job status
- ❌ Manual queue inspection (Redis CLI)
- ❌ Hard to debug failed jobs

**With Bull Board**:

- ✅ Visual UI for all queues
- ✅ Retry failed jobs with 1 click
- ✅ Monitor job metrics (throughput, latency)
- ✅ Inspect job data

### 2.2 Installation

```bash
cd api
pnpm add @bull-board/api @bull-board/nestjs @bull-board/ui
```

### 2.3 Configuration

```typescript
// src/core/queue/bull-board.module.ts
import { Module } from '@nestjs/common';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { Queue } from 'bullmq';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'email',
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'ai',
      adapter: BullMQAdapter,
    }),
    BullBoardModule.forFeature({
      name: 'reports',
      adapter: BullMQAdapter,
    }),
  ],
})
export class BullBoardModule {}
```

Import vào `AppModule`:

```typescript
// app.module.ts
@Module({
  imports: [
    BullBoardModule,
    // ... other modules
  ],
})
```

### 2.4 Access Control

**Protect với Admin Guard**:

```typescript
// bull-board.guard.ts
@Injectable()
export class BullBoardGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Only super admins can access
    return user?.role === 'SUPER_ADMIN';
  }
}

// Apply guard
@Controller('admin/queues')
@UseGuards(JwtAuthGuard, BullBoardGuard)
export class BullBoardController {
  // Bull Board auto-mounts here
}
```

### 2.5 Access Dashboard

Development:

```
http://localhost:8080/admin/queues
```

Production:

```
https://ecommerce-api.onrender.com/admin/queues
```

**Features**:

- **Jobs**: View all job statuses (waiting, active, completed, failed)
- **Retry**: Click failed job → Retry
- **Stats**: Throughput, latency, failure rate
- **Clean**: Remove old completed/failed jobs

---

## 3. Job Patterns

### 3.1 Send Welcome Email

```typescript
// auth.service.ts
@Injectable()
export class AuthService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async register(dto: RegisterDto) {
    const user = await this.createUser(dto);

    // Enqueue email job (non-blocking)
    await this.emailQueue.add('welcome', {
      to: user.email,
      name: user.name,
    });

    return { user };
  }
}
```

**Processor**:

```typescript
// email.processor.ts
@Processor('email')
export class EmailProcessor {
  @Process('welcome')
  async sendWelcomeEmail(job: Job) {
    const { to, name } = job.data;

    await this.mailer.send({
      to,
      subject: 'Welcome!',
      template: 'welcome',
      context: { name },
    });

    return { sent: true };
  }
}
```

### 3.2 Generate Monthly Report

```typescript
// reports.service.ts
async scheduleMonthlyReport(tenantId: string) {
  await this.reportsQueue.add(
    'monthly-sales',
    { tenantId },
    {
      // Cron: Run on 1st of every month at 9am
      repeat: { pattern: '0 9 1 * *' },
    },
  );
}
```

**Processor**:

```typescript
@Process('monthly-sales')
async generateMonthlySales(job: Job) {
  const { tenantId } = job.data;

  // Query database
  const orders = await this.getOrders(tenantId);

  // Generate Excel
  const buffer = await this.excelService.generate(orders);

  // Email report
  await this.emailQueue.add('send-report', {
    tenantId,
    attachment: buffer,
  });

  return { ordersCount: orders.length };
}
```

### 3.3 AI Product Description

```typescript
// ai.service.ts
async generateDescription(productId: string) {
  return this.aiQueue.add(
    'generate-description',
    { productId },
    {
      attempts: 3, // Retry 3 times on failure
      backoff: {
        type: 'exponential',
        delay: 2000, // 2s, 4s, 8s
      },
    },
  );
}
```

**Processor**:

```typescript
@Process('generate-description')
async processDescription(job: Job) {
  const { productId } = job.data;

  const product = await this.prisma.product.findUnique({
    where: { id: productId },
  });

  // Call Google Gemini API
  const description = await this.gemini.generateText({
    prompt: `Write description for: ${product.name}`,
  });

  // Update product
  await this.prisma.product.update({
    where: { id: productId },
    data: { aiDescription: description },
  });

  return { description };
}
```

---

## 4. Error Handling & Retries

### 4.1 Retry Strategy

```typescript
// Default retry config
@Process('email')
async sendEmail(job: Job) {
  try {
    await this.mailer.send(job.data);
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      // Transient error → retry
      throw error;
    } else {
     // Permanent error → don't retry
      job.moveToFailed(error, false);
    }
  }
}
```

### 4.2 Dead Letter Queue

Jobs failed after all retries:

```typescript
@OnQueueFailed()
async onFailed(job: Job, error: Error) {
  console.error(`Job ${job.id} failed:`, error);

  // Log to Sentry
  Sentry.captureException(error, {
    contexts: {
      job: {
        id: job.id,
        name: job.name,
        data: job.data,
      },
    },
  });

  // Notify admin
  await this.notifyAdmin({
    subject: `Job Failed: ${job.name}`,
    body: error.message,
  });
}
```

### 4.3 Job Timeout

```typescript
await queue.add(
  'long-task',
  { data },
  {
    timeout: 60000, // 60s max
  },
);

// Processor
@Process({ name: 'long-task', timeout: 60000 })
async processLongTask(job: Job) {
  // Will throw TimeoutError if >60s
}
```

---

## 5. Monitoring Jobs in Production

### 5.1 Bull Board Metrics

Access `/admin/queues` để xem:

**Per Queue**:

- Waiting: Jobs queued
- Active: Currently processing
- Completed: Successful jobs
- Failed: Failed jobs
- Delayed: Scheduled for future

**Performance**:

- Throughput: Jobs/minute
- Latency: Avg processing time
- Failure Rate: % failed

### 5.2 Job Events Logging

```typescript
@OnQueueActive()
onActive(job: Job) {
  console.log(`[${job.queue.name}] Processing job ${job.id}: ${job.name}`);
}

@OnQueueCompleted()
onCompleted(job: Job, result: any) {
  console.log(`[${job.queue.name}] Completed job ${job.id}`, result);
}

@OnQueueFailed()
onFailed(job: Job, error: Error) {
  console.error(`[${job.queue.name}] Failed job ${job.id}:`, error.message);
}
```

### 5.3 Prometheus Metrics (Future)

```typescript
// Track job metrics
const jobCounter = new Counter({
  name: 'bullmq_jobs_total',
  help: 'Total jobs processed',
  labelNames: ['queue', 'status'],
});

@OnQueueCompleted()
onCompleted(job: Job) {
  jobCounter.inc({ queue: job.queue.name, status: 'completed' });
}

@OnQueueFailed()
onFailed(job: Job) {
  jobCounter.inc({ queue: job.queue.name, status: 'failed' });
}
```

---

## 6. Best Practices

### DO

- ✅ Use queues for async tasks (email, reports)
- ✅ Set reasonable timeouts
- ✅ Implement retries với exponential backoff
- ✅ Log job events (start, complete, fail)
- ✅ Monitor queue depths (alert if >1000 waiting)
- ✅ Clean old jobs periodically

### DON'T

- ❌ Queue synchronous operations (database lookups)
- ❌ Store large data in job payload (>100KB) - store IDs instead
- ❌ Infinite retries
- ❌ Process jobs trong API server (use dedicated worker)
- ❌ Ignore failed jobs

---

## 7. Scaling Workers

### Single Worker (Current)

```
[API Server x2] → [Redis Queue] → [Worker x1]
```

**Limitation**: 1 worker = 1 job at a time

### Multiple Workers

```
[API Server x2] → [Redis Queue] → [Worker x3]
```

**Setup**:

1. Render: Scale worker instances to 3
2. Each worker processes jobs concurrently
3. Redis ensures no duplicate processing

**Or use concurrency**:

```typescript
@Processor({ name: 'email', concurrency: 5 })
// 1 worker, 5 concurrent jobs
```

---

## 8. Testing

### Unit Test

```typescript
describe('EmailProcessor', () => {
  it('should send welcome email', async () => {
    const job = {
      data: { to: 'test@example.com', name: 'John' },
    } as Job;

    const result = await processor.sendWelcomeEmail(job);

    expect(mailer.send).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Welcome!',
      template: 'welcome',
      context: { name: 'John' },
    });

    expect(result).toEqual({ sent: true });
  });
});
```

### Integration Test

```typescript
describe('Job Queue Integration', () => {
  it('should enqueue and process job', async () => {
    // Enqueue
    await emailQueue.add('welcome', { to: 'test@example.com' });

    // Wait for processing
    await new Promise((r) => setTimeout(r, 1000));

    // Verify
    const completed = await emailQueue.getCompleted();
    expect(completed).toHaveLength(1);
  });
});
```

---

## 9. Troubleshooting

### Issue: Jobs stuck in "waiting"

**Causes**:

- Worker not running
- Worker crashed
- Redis connection lost

**Solutions**:

1. Check worker logs: `render logs ecommerce-worker`
2. Verify Redis connection
3. Restart worker: Render → Manual Deploy

---

### Issue: Jobs failing repeatedly

**Check**:

1. Bull Board → Click failed job → View error
2. Check if external service is down (email, AI API)
3. Verify job data format

**Fix**:

```typescript
// Add validation
@Process('email')
async sendEmail(job: Job) {
  const schema = z.object({
    to: z.string().email(),
    subject: z.string(),
  });

  const validated = schema.parse(job.data);
  // ... send email
}
```

---

### Issue: High memory usage

**Cause**: Too many completed jobs in Redis

**Solution**: Auto-clean old jobs

```typescript
@Cron('0 0 * * *') // Daily at midnight
async cleanOldJobs() {
  await emailQueue.clean(7 * 24 * 60 * 60 * 1000, 'completed'); // 7 days
  await emailQueue.clean(30 * 24 * 60 * 60 * 1000, 'failed'); // 30 days
}
```

---

## 10. Checklist

- [ ] Bull Board installed and accessible
- [ ] All queues visible in dashboard
- [ ] Worker processing jobs successfully
- [ ] Error handling implemented
- [ ] Retry logic configured
- [ ] Job events logged
- [ ] Old jobs cleaned periodically

---

**Next**: [environment-variables-reference.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/knowledge/environment-variables-reference.md) cho complete env vars matrix
