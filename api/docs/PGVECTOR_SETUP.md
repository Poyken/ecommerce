# PostgreSQL pgvector Extension Setup Guide

## 📚 Hướng dẫn kích hoạt pgvector cho Semantic Search

pgvector cho phép lưu trữ và tìm kiếm vector embeddings trong PostgreSQL,
hỗ trợ tính năng AI Search (tìm kiếm ngữ nghĩa) của hệ thống.

---

## Option 1: Sử dụng Docker (Khuyến nghị)

Docker Compose đã được cấu hình sẵn với pgvector:

```bash
# Từ thư mục api/
docker compose up -d postgres redis

# Đợi container khởi động xong
docker compose logs -f postgres
```

Sau khi container chạy, update `.env`:

```
DATABASE_URL="postgresql://postgres:123456@localhost:5432/ecommerce?schema=public"
```

---

## Option 2: Cài pgvector trên PostgreSQL local

### Windows

```powershell
# Yêu cầu Visual Studio Build Tools
git clone --branch v0.7.0 https://github.com/pgvector/pgvector.git
cd pgvector
nmake /F Makefile.win
nmake /F Makefile.win install
```

### macOS (Homebrew)

```bash
brew install pgvector
```

### Ubuntu/Debian

```bash
sudo apt install postgresql-15-pgvector
```

### Sau khi cài xong, kích hoạt extension:

```sql
-- Kết nối vào database
psql -U postgres -d ecommerce

-- Tạo extension
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## Kích hoạt trong Prisma Schema

Sau khi pgvector đã sẵn sàng, sửa file `prisma/schema.prisma`:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["fullTextSearchPostgres", "postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector]
}

model Product {
  // ... existing fields ...

  // Uncomment this line:
  embedding Unsupported("vector(768)")?
}
```

Sau đó chạy migration:

```bash
npx prisma migrate dev --name enable_vector
```

---

## Sử dụng trong code

```typescript
// Tạo embedding từ Gemini
const embedding = await geminiService.getEmbedding(product.description);

// Lưu vào database (raw query vì Prisma không hỗ trợ vector type)
await prisma.$executeRaw`
  UPDATE "Product" 
  SET embedding = ${embedding}::vector 
  WHERE id = ${productId}
`;

// Semantic search
const results = await prisma.$queryRaw`
  SELECT id, name, 1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
  FROM "Product"
  WHERE embedding IS NOT NULL
  ORDER BY embedding <=> ${queryEmbedding}::vector
  LIMIT 10
`;
```

---

## Troubleshooting

### Lỗi "extension vector is not available"

- PostgreSQL chưa cài pgvector extension
- Sử dụng Docker option để đảm bảo tương thích

### Lỗi "vector type does not exist"

- Extension chưa được enable trong database
- Chạy `CREATE EXTENSION vector;` trong psql

### Performance Tips

- Tạo index cho vector column: `CREATE INDEX ON "Product" USING ivfflat (embedding vector_cosine_ops)`
- Batch insert embeddings thay vì từng cái một
