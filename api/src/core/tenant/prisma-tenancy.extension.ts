import { Prisma } from '@prisma/client';
import { tenantStorage } from './tenant.context';
import { getTenant } from './tenant.context';

/**
 * =================================================================================================
 * PRISMA TENANCY EXTENSION - EXTENSION TỰ ĐỘNG HÓA MULTI-TENANCY
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 *    - Đây là "Trái tim" của hệ thống Multi-tenancy. Nó giúp ta không bao giờ quên `where: { tenantId }`.
 *    - Thay vì phải viết thủ công `db.product.findMany({ where: { tenantId: id } })` ở khắp mọi nơi,
 *      extension này sẽ TỰ ĐỘNG chèn điều kiện đó vào mọi câu lệnh database.
 *
 * 2. CƠ CHẾ HOẠT ĐỘNG (INTERCEPTOR):
 *    - Sử dụng tính năng `$extends` của Prisma (giống như Middleware).
 *    - `$allOperations`: Chặn (Intercept) TẤT CẢ các thao tác (find, create, update, delete...) trên TẤT CẢ các bảng ($allModels).
 *
 * 3. LOGIC XỬ LÝ:
 *    - Bước 1: Lấy `tenant` hiện tại từ Context (xem `tenant.context.ts`).
 *    - Bước 2: Kiểm tra xem Model đang thao tác có phải là "Shared Data" (dữ liệu dùng chung) hay không.
 *      - Nếu là Shared (VD: User, Category...), thì KHÔNG lọc -> Cho phép thấy toàn bộ.
 *      - Nếu là Private (VD: Order, Product, Cart...), thì BẮT BUỘC lọc theo `tenantId`.
 *    - Bước 3:
 *      - Với lệnh ĐỌC (Read): Tự động thêm `where: { tenantId: tenant.id }`.
 *      - Với lệnh GHI (Write): Tự động gán `data: { tenantId: tenant.id }`.
 *
 * 4. LƯU Ý QUAN TRỌNG (BẢO MẬT):
 *    - Các model như User, Page, Cart BẮT BUỘC phải được lọc theo tenantId (không để trong SHARED_MODELS).
 *    - Điều này đảm bảo User của Tenant A không bao giờ có thể thấy dữ liệu của Tenant B.
 *    - Nếu bạn đang viết API cho Super Admin (người quản lý toàn sàn), tenantId sẽ là null/undefined -> Extension sẽ bỏ qua bộ lọc này (đúng mong muốn). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Data Isolation: "Bức tường lửa" ngăn chặn việc lộ dữ liệu giữa các cửa hàng khác nhau (Tenant Leakage).
 * - Developer Productivity: Dev không cần nhớ viết `where: { tenantId }` trong mỗi câu query, giảm thiểu bug do quên sót.
 * - Compliance: Đáp ứng tiêu chuẩn bảo mật doanh nghiệp (Enterprise Grade Security).

 * =================================================================================================
 */

// [PERFORMANCE OPTIMIZATION] Static Sets for O(1) lookups
const SHARED_MODELS = new Set([
  'Tenant',
  'OutboxEvent',
  'Role',
  'Permission',
  'UserRole',
  'RolePermission',
  'UserPermission',
  'Notification',
  'ChatConversation',
  'ChatMessage',
  'AuditLog',
  'PerformanceMetric',
  'AiChatSession',
  'AiChatMessage',
  'ProductTranslation',
  'BlogProduct',
  'SubscriptionPlan',
]);

const MODELS_WITH_SOFT_DELETE = new Set([
  'Product',
  'Blog',
  'User',
  'Page',
  'Category',
  'Brand',
  'Order',
  'Review',
  'Media',
]);

export const tenancyExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenant = getTenant();

          // [RLS OPTIMIZATION] Thiết lập biến session cho PostgreSQL Row Level Security.
          // 📚 GIẢI THÍCH: Lệnh này nói với Database rằng "Tôi là Tenant X".
          // Database sẽ tự động áp dụng các Policy (RLS) để chặn truy cập trái phép ở tầng thấp nhất (Database Layer).
          // Ngay cả khi code Application bị lỗi lọc where, Database vẫn chặn được.
          if (tenant) {
            if (tenant['dbUrl']) {
              // DETECTED SILO MODE (Chế độ Kho Riêng)
              // Tenant này có Database riêng bbiệt. Connection Manager sẽ lo việc kết nối đúng DB.
              // Ở đây ta vẫn set context RLS để an toàn tuyệt đối (Defense in Depth).
            }
            await client.$executeRawUnsafe(
              `SET app.current_tenant_id = '${tenant.id}';`,
            );
          } else {
            await client.$executeRawUnsafe(`SET app.current_tenant_id = '';`);
          }

          // 1. Multi-tenancy Filter
          if (tenant && !SHARED_MODELS.has(model as string)) {
            const anyArgs = args as any;
            let currentOperation = operation;

            // [TENANCY OPTIMIZATION] If findUnique and we are adding tenantId,
            // we must use findFirst because findUnique only accepts unique criteria.
            if (operation === 'findUnique') {
              currentOperation = 'findFirst';
            }

            if (
              [
                'findUnique',
                'findFirst',
                'findMany',
                'count',
                'update',
                'updateMany',
                'delete',
                'deleteMany',
                'upsert',
              ].includes(operation)
            ) {
              anyArgs.where = {
                ...anyArgs.where,
                tenantId: tenant.id,
              };
            }

            if (operation === 'create' || operation === 'createMany') {
              if (anyArgs.data) {
                if (Array.isArray(anyArgs.data)) {
                  anyArgs.data.forEach((item: any) => {
                    // [FIX] Only set tenantId if not already explicitly provided
                    // This allows cross-tenant operations like creating admin user for a new tenant
                    if (item.tenantId === undefined) {
                      item.tenantId = tenant.id;
                    }
                  });
                } else {
                  // [FIX] Only set tenantId if not already explicitly provided
                  if (anyArgs.data.tenantId === undefined) {
                    anyArgs.data.tenantId = tenant.id;
                  }
                }
              }
            }
          }

          // 2. Soft Delete Filter (Auto-hide deleted items)
          if (
            MODELS_WITH_SOFT_DELETE.has(model as string) &&
            [
              'findUnique',
              'findFirst',
              'findMany',
              'count',
              'update',
              'updateMany',
              'aggregate',
            ].includes(operation)
          ) {
            const anyArgs = args as any;
            // Only apply if not explicitly looking for deleted items
            if (anyArgs.where?.deletedAt === undefined) {
              anyArgs.where = {
                ...anyArgs.where,
                deletedAt: null,
              };
            }
          }

          // 3. Intercept Delete Operations for Soft Delete
          if (
            MODELS_WITH_SOFT_DELETE.has(model as string) &&
            (operation === 'delete' || operation === 'deleteMany')
          ) {
            const anyArgs = args as any;
            // Transforming delete into update
            const newOperation =
              operation === 'delete' ? 'update' : 'updateMany';

            // Ensure we don't accidentally update everything if where is empty (though Prisma guards against this)
            if (anyArgs.where) {
              return (client as any)[model][newOperation]({
                ...anyArgs,
                data: {
                  ...anyArgs.data, // Should be empty for delete actually
                  deletedAt: new Date(),
                },
              });
            }
          }

          return query(args);
        },
      },
    },
  });
});
