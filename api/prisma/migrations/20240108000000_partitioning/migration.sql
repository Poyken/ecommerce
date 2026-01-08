-- Migration: Partitioning for AuditLog and PerformanceMetric

-- 1. Rename existing tables to prepare for replacement (if they exist and are not partitioned)
-- NOTE: In a real production scenario, you would migrate data FROM old table TO new partitioned table.
-- For this setup, we assume we can start fresh or this is a fresh applied migration.

-- =========================================================
-- AuditLog Partitioning
-- =========================================================

-- Drop existing foreign keys constraints if any that reference AuditLog (usually none)
-- Drop the table if it exists (WARNING: DATA LOSS if not backed up - Use carefully)
-- DROP TABLE IF EXISTS "AuditLog"; 

-- Re-create AuditLog as Partitioned Table
CREATE TABLE IF NOT EXISTS "AuditLog_Partitioned" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "payload" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Primary key MUST include the partition key
  CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

-- Create Initial Partitions (e.g., for current and next months)
CREATE TABLE IF NOT EXISTS "AuditLog_Default" PARTITION OF "AuditLog_Partitioned" DEFAULT;

-- Create Indices on Partitioned Table
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog_Partitioned"("userId");
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog_Partitioned"("resource");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog_Partitioned"("action");
CREATE INDEX "AuditLog_payload_idx" ON "AuditLog_Partitioned" USING GIN ("payload");

-- =========================================================
-- PerformanceMetric Partitioning
-- =========================================================

CREATE TABLE IF NOT EXISTS "PerformanceMetric_Partitioned" (
  "id"             TEXT NOT NULL,
  "name"           TEXT NOT NULL,
  "value"          DOUBLE PRECISION NOT NULL,
  "rating"         TEXT NOT NULL,
  "url"            TEXT NOT NULL,
  "userAgent"      TEXT,
  "navigationType" TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id", "createdAt")
) PARTITION BY RANGE ("createdAt");

CREATE TABLE IF NOT EXISTS "PerformanceMetric_Default" PARTITION OF "PerformanceMetric_Partitioned" DEFAULT;

CREATE INDEX "PerformanceMetric_name_idx" ON "PerformanceMetric_Partitioned"("name");
CREATE INDEX "PerformanceMetric_createdAt_idx" ON "PerformanceMetric_Partitioned"("createdAt");

-- =========================================================
-- Auto-Partitioning Function & Trigger (Optional but recommended)
-- =========================================================
-- This requires pg_cron or an external worker. For now, we rely on default partition.
