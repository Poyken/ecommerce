-- =====================================================================
-- POSTGRESQL ROW LEVEL SECURITY (RLS) SETUP
-- =====================================================================
-- 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
-- RLS là lớp bảo mật cuối cùng ở tầng Database. 
-- Cho dù Code có bug và quên thêm WHERE tenantId, DB cũng sẽ từ chối trả về dữ liệu 
-- nếu session không đúng tenantId. Điều này cực kỳ quan trọng cho mô hình SaaS/Multi-tenancy.

-- 1. Hàm helper để lấy tenantId từ session
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT current_setting('app.current_tenant_id', true);
$$ LANGUAGE sql STABLE;

-- 2. Áp dụng RLS cho các bảng quan trọng
DO $$
DECLARE
    row_table_name text;
    tables_to_protect text[] := ARRAY[
        'User', 'Product', 'Order', 'Category', 'Brand', 'Sku', 
        'Review', 'Wishlist', 'Blog', 'Cart', 'Coupon', 
        'FeatureFlag', 'NewsletterSubscriber', 'InventoryLog'
    ];
BEGIN
    FOREACH row_table_name IN ARRAY tables_to_protect
    LOOP
        -- Bật RLS
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', row_table_name);
        
        -- Xóa policy cũ nếu có
        EXECUTE format('DROP POLICY IF EXISTS %I_isolation_policy ON %I', lower(row_table_name), row_table_name);
        
        -- Tạo policy mới
        -- Logic: 
        -- 1. Nếu app.current_tenant_id không được set (null) -> Cho phép toàn bộ (Dành cho Super Admin)
        -- 2. Nếu có set -> Chỉ cho phép hàng có tenantId khớp
        EXECUTE format('
            CREATE POLICY %I_isolation_policy ON %I
            USING (
                current_tenant_id() IS NULL OR 
                current_tenant_id() = "" OR
                "tenantId" = current_tenant_id()
            )
            WITH CHECK (
                current_tenant_id() IS NULL OR 
                current_tenant_id() = "" OR
                "tenantId" = current_tenant_id()
            )', lower(row_table_name), row_table_name);
            
        RAISE NOTICE 'Applied RLS to table: %', row_table_name;
    END LOOP;
END $$;
