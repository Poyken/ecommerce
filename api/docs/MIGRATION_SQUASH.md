# Migration Squash Guide

## ⚠️ Khi nào KHÔNG nên squash:

- Production database đã có data
- Shared database giữa nhiều developers
- Đang trong quá trình release

## ✅ Khi nào NÊN squash:

- Fresh development environment
- Sau khi release major version
- Reset staging/testing database

---

## Cách thực hiện (Development Only)

### Option 1: Baseline Migration (Recommended)

```bash
# 1. Đảm bảo schema.prisma là source of truth
npx prisma format

# 2. Backup migrations history (optional)
mv prisma/migrations prisma/migrations_backup_$(date +%Y%m%d)

# 3. Tạo fresh migrations folder
mkdir prisma/migrations

# 4. Tạo baseline migration từ current schema
npx prisma migrate dev --name init_baseline

# 5. Trên existing databases, mark as applied (không chạy lại SQL)
npx prisma migrate resolve --applied init_baseline
```

### Option 2: Keep History, Squash Manually

```bash
# 1. Gộp các migration SQL files thành 1
cat prisma/migrations/*/migration.sql > combined.sql

# 2. Review và optimize combined.sql
# - Remove redundant ALTER statements
# - Consolidate CREATE TABLE

# 3. Tạo single migration
rm -rf prisma/migrations/*
mkdir -p prisma/migrations/20260114000000_baseline
mv combined.sql prisma/migrations/20260114000000_baseline/migration.sql
```

---

## Sau khi Squash

1. Update `migration_lock.toml` nếu cần
2. Test với fresh database: `npx prisma migrate reset`
3. Commit changes

---

## Production Deployment

Khi deploy lên production với existing data:

```bash
# Mark baseline as already applied (KHÔNG chạy migration)
npx prisma migrate resolve --applied init_baseline
```

Điều này cho Prisma biết database đã ở state đúng mà không cần chạy lại migration.
