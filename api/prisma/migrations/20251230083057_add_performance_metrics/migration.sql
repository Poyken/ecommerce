-- CreateTable
CREATE TABLE "PerformanceMetric" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "rating" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "userAgent" TEXT,
    "navigationType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceMetric_name_idx" ON "PerformanceMetric"("name");

-- CreateIndex
CREATE INDEX "PerformanceMetric_createdAt_idx" ON "PerformanceMetric"("createdAt");
