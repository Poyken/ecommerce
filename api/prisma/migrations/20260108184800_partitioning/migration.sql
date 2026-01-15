-- Migration: Partitioning for AuditLog and PerformanceMetric

-- Drop existing tables to prepare for replacement
DROP TABLE IF EXISTS "AuditLog" CASCADE; 
DROP TABLE IF EXISTS "PerformanceMetric" CASCADE;

-- =========================================================
-- AuditLog Partitioning
-- =========================================================

-- Re-create AuditLog as Partitioned Table
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

-- Create Initial Partitions
CREATE TABLE "AuditLog_Default" PARTITION OF "AuditLog" DEFAULT;

-- Create Indices
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_payload_idx" ON "AuditLog" USING GIN ("payload");

-- =========================================================
-- PerformanceMetric Partitioning
-- =========================================================

CREATE TABLE "PerformanceMetric" (
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

CREATE TABLE "PerformanceMetric_Default" PARTITION OF "PerformanceMetric" DEFAULT;

CREATE INDEX "PerformanceMetric_name_idx" ON "PerformanceMetric"("name");
CREATE INDEX "PerformanceMetric_createdAt_idx" ON "PerformanceMetric"("createdAt");
