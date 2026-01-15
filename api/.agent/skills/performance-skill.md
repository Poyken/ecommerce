# Skill: Backend Performance Optimization

> **Context:** NestJS API, PostgreSQL (Prisma), Redis, BullMQ.
> **Mục tiêu:** Tối ưu response time, throughput và resource usage.

## 1. Database Optimization (Prisma & PostgreSQL)

### A. Indexing (Critical)

Check file `schema.prisma`. Mọi field dùng trong `where`, `orderBy` đều phải có Index.

```prisma
// Bad
model User {
  email String
}

// Good
model User {
  email String @unique
  @@index([createdAt]) // Cho sort
  @@index([role, status]) // Cho filter compound
}
```

### B. Avoid N+1 Queries

Prisma rất dễ dính N+1 khi loop.

- **Bad:** Loop và query trong mỗi iteration.
- **Good:** Dùng `findMany` với `in` operator hoặc `include`.

```typescript
// Bad
for (const item of items) {
  const product = await prisma.product.findUnique({
    where: { id: item.productId },
  });
}

// Good
const products = await prisma.product.findMany({
  where: { id: { in: items.map((i) => i.productId) } },
});
```

### C. Select Fields (Over-fetching)

Chỉ select những field cần thiết, đặc biệt tránh select `TEXT` quá dài hoặc relation không dùng.

```typescript
// Good
prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true }, // Không lấy password, bio, logs...
});
```

## 2. Caching Strategy (Redis)

### A. Controller Level (Cache Interceptor)

Dùng cho GET request public, ít thay đổi (VD: Danh sách sản phẩm, Config).

```typescript
@Get()
@UseInterceptors(CacheInterceptor)
@CacheTTL(120) // 2 phút
findAll() { ... }
```

### B. Service Level (Manual Cache)

Dùng cho data phức tạp hoặc cần invalidate thủ công.

```typescript
const cacheKey = `product:${id}`;
let data = await this.cacheManager.get(cacheKey);

if (!data) {
  data = await this.db.find(...);
  await this.cacheManager.set(cacheKey, data, 300); // 5 phút
}
return data;
```

## 3. Async Processing (BullMQ)

Đừng để user chờ các tác vụ nặng (Gửi mail, Resize ảnh, Tính toán report).
Đẩy vào Queue để Worker xử lý nền.

```typescript
// Service
await this.emailQueue.add('send-welcome', { userId: 1 });

// Processor
@Processor('email')
export class EmailConsumer {
  @Process('send-welcome')
  async send(job: Job) { ... }
}
```

## 4. Response Compression

Đảm bảo `main.ts` đã bật compression:

```typescript
import * as compression from 'compression';
app.use(compression());
```

## 5. Checklist Performance Review

1.  [ ] Query có dùng Index không? (Dùng `EXPLAIN ANALYZE` nếu cần).
2.  [ ] Có N+1 Query trong vòng lặp không?
3.  [ ] API public có Caching không?
4.  [ ] Payloads phản hồi có bị dư thừa field không?
