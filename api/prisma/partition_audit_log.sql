
-- Partitioning AuditLog by Month (SQL for Postgres 11+)

-- 1. Rename the existing table to migrate data later (if needed) or just start fresh if permissible. 
-- Assuming fresh start or migration strategy handled separately. 
-- Here we create the PARENT table.
DROP TABLE IF EXISTS "AuditLog";

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "payload" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

-- 2. Create partitions for upcoming months (Example)
CREATE TABLE "AuditLog_y2025m01" PARTITION OF "AuditLog"
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE "AuditLog_y2025m02" PARTITION OF "AuditLog"
    FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE "AuditLog_y2025m03" PARTITION OF "AuditLog"
    FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- 3. Indexing on Parent (Propagates to Children)
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog" ("userId");
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog" ("resource");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog" ("action");
CREATE INDEX "AuditLog_payload_idx" ON "AuditLog" USING GIN ("payload");

-- Note: Prisma will manage the schema but for Partitioning, it's best to create table manually or use `prisma migrate diff` --create-only
-- and edit the migration file to include these PARTITION BY clauses before applying.
