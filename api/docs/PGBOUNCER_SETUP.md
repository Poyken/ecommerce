# PgBouncer Connection Pooling Setup

## 📚 Hướng dẫn cài đặt PgBouncer cho Production

PgBouncer là connection pooler cho PostgreSQL, giúp:

- Giảm overhead khi tạo connection mới
- Hỗ trợ nhiều client connections hơn
- Tăng throughput cho high-traffic applications

---

## 1. Docker Setup (Khuyến nghị)

### docker-compose.yml (thêm service)

```yaml
services:
  # ... existing postgres, redis services ...

  pgbouncer:
    image: edoburu/pgbouncer:1.21.0
    container_name: pgbouncer
    environment:
      DATABASE_URL: 'postgresql://postgres:123456@postgres:5432/ecommerce'
      POOL_MODE: transaction # Recommended cho web apps
      MAX_CLIENT_CONN: 1000 # Max connections từ app
      DEFAULT_POOL_SIZE: 25 # Connections tới PostgreSQL
      MIN_POOL_SIZE: 10
      RESERVE_POOL_SIZE: 5
      STATS_USERS: postgres
    ports:
      - '6432:5432' # PgBouncer port
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - ecommerce_network
    restart: always
```

### Cập nhật .env

```env
# Thay đổi từ connect trực tiếp PostgreSQL sang PgBouncer
DATABASE_URL="postgresql://postgres:123456@localhost:6432/ecommerce?schema=public&pgbouncer=true"
```

---

## 2. Prisma Configuration

### prisma/schema.prisma

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Lưu ý quan trọng với PgBouncer

```typescript
// Thêm ?pgbouncer=true vào DATABASE_URL để:
// 1. Prisma dùng prepared statements compatible với PgBouncer
// 2. Tránh lỗi "prepared statement already exists"
```

---

## 3. Pool Mode Comparison

| Mode            | Description                                     | Use Case               |
| --------------- | ----------------------------------------------- | ---------------------- |
| **transaction** | Connection được trả về pool sau mỗi transaction | Web APIs (khuyến nghị) |
| **session**     | Connection được giữ cho toàn session            | Legacy apps            |
| **statement**   | Connection được trả về sau mỗi query            | Read-heavy workloads   |

---

## 4. Monitoring Commands

```bash
# Kết nối vào PgBouncer admin console
psql -h localhost -p 6432 -U postgres pgbouncer

# Xem thống kê connections
SHOW POOLS;
SHOW STATS;
SHOW CLIENTS;
SHOW SERVERS;

# Xem config
SHOW CONFIG;
```

---

## 5. Production Recommendations

### Connection Pool Sizing Formula

```
DEFAULT_POOL_SIZE = (num_cores * 2) + effective_spindle_count
```

Ví dụ cho 4-core server với SSD:

```
POOL_SIZE = (4 * 2) + 1 = 9 ~ 10 connections per database
```

### Với Prisma (multiple databases/tenants)

```env
# Prisma tự quản lý pool, nhưng bạn có thể tune:
DATABASE_POOL_SIZE=10
DATABASE_CONNECTION_LIMIT=5
```

---

## 6. Health Check

```typescript
// Thêm vào health.controller.ts
@Get('pgbouncer')
async checkPgBouncer() {
  try {
    // Query qua PgBouncer
    const result = await this.prisma.$queryRaw`SELECT 1`;

    // Query stats từ PgBouncer (nếu có quyền)
    // const stats = await this.prisma.$queryRaw`SHOW POOLS`;

    return { status: 'ok', connection: 'pooled' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

---

## 7. Troubleshooting

### Lỗi "prepared statement already exists"

- Thêm `?pgbouncer=true` vào DATABASE_URL
- Hoặc set `DISABLE_PREPARED_STATEMENTS=true`

### Lỗi "too many connections"

- Tăng `MAX_CLIENT_CONN` trong PgBouncer
- Giảm `DATABASE_POOL_SIZE` trong Prisma

### Performance không cải thiện

- Kiểm tra `POOL_MODE` có phải `transaction` không
- Monitor với `SHOW STATS` để xem connection reuse

---

## 8. Metrics to Monitor

| Metric      | Description                 | Alert Threshold         |
| ----------- | --------------------------- | ----------------------- |
| `cl_active` | Active client connections   | > 80% MAX_CLIENT_CONN   |
| `sv_active` | Active server connections   | > 90% DEFAULT_POOL_SIZE |
| `avg_query` | Average query time          | > 100ms                 |
| `avg_wait`  | Time waiting for connection | > 10ms                  |
