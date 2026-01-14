-- =====================================================================
-- POSTGRESQL TABLE PARTITIONING SETUP (BETA)
-- =====================================================================
-- 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
-- 
-- 1. VẤN ĐỀ:
-- Các bảng như `AuditLog` hay `PerformanceMetric` tăng trưởng rất nhanh.
-- Khi bảng đạt vài chục triệu dòng, việc Index và Query sẽ trở nên rất chậm.
-- 
-- 2. GIẢI PHÁP (PARTITIONING):
-- Thay vì để 1 bảng khổng lồ, ta chia thành các bảng nhỏ theo thời gian (PARTITION BY RANGE).
-- Ví dụ: audit_log_2024_01, audit_log_2024_02...
-- 
-- 3. LỢI ÍCH:
-- - Query nhanh hơn vì Postgres chỉ cần quét trên bảng của tháng đó.
-- - Maintenance dễ dàng: Muốn xóa data cũ hơn 1 năm? Chỉ cần DROP TABLE thay vì DELETE.
-- - Hiệu năng Ghi (Write) tốt hơn vì Index nhỏ hơn.
-- =====================================================================

-- LƯU Ý: Prisma hiện tại chưa hỗ trợ tạo Partition trực tiếp từ schema.prisma.
-- Ta phải thực hiện bằng Raw SQL.

-- Ví dụ cấu trúc lệnh chuyển đổi (Chỉ chạy khi bảng trống hoặc migrate cẩn thận):

/*
-- 1. Tạo bảng AuditLog dạng Partitioned
CREATE TABLE "AuditLog_Partitioned" (
  "id" UUID NOT NULL,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "resource" TEXT NOT NULL,
  "payload" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id", "createdAt") -- Cần include partition key vào PK
) PARTITION BY RANGE ("createdAt");

-- 2. Tạo các bảng con (Partitions) cho từng tháng
CREATE TABLE "AuditLog_2024_01" PARTITION OF "AuditLog_Partitioned"
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE "AuditLog_2024_02" PARTITION OF "AuditLog_Partitioned"
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- 3. Dùng pg_cron hoặc Worker để tự động tạo partition cho tháng mới
*/

-- Hàm mẫu để tự động tạo Partition cho tháng tiếp theo
CREATE OR REPLACE FUNCTION create_audit_log_partition_next_month()
RETURNS void AS $$
DECLARE
    next_month_start timestamp;
    next_month_end timestamp;
    partition_name text;
BEGIN
    next_month_start := date_trunc('month', now() + interval '1 month');
    next_month_end := next_month_start + interval '1 month';
    partition_name := 'AuditLog_' || to_char(next_month_start, 'YYYY_MM');

    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = lower(partition_name)) THEN
        EXECUTE format('CREATE TABLE %I PARTITION OF "AuditLog" FOR VALUES FROM (%L) TO (%L)', 
            partition_name, next_month_start, next_month_end);
        RAISE NOTICE 'Created partition: %', partition_name;
    END IF;
END;
$$ LANGUAGE plpgsql;
