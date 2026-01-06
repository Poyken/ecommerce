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
 * 4. LƯU Ý QUAN TRỌNG:
 *    - Nếu bạn đang viết API cho Super Admin (người quản lý toàn sàn), tenantId sẽ là null/undefined -> Extension sẽ bỏ qua bộ lọc này (đúng mong muốn).
 * =================================================================================================
 */

export const tenancyExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenant = getTenant();
          if (model === 'FeatureFlag') {
            console.log(
              `[Tenancy] Intercepting ${model}.${operation}, Tenant: ${
                tenant?.domain || 'Global'
              }, IsShared: true`,
            );
          }

          // List of models that should NOT be filtered by tenant (Shared data or 1:1 User data)
          const sharedModels = [
            'Tenant',
            'User', // Users are global-ish, managed by AuthService security checks
            'OutboxEvent',
            'Brand',
            'Category',
            'Role',
            'Permission',
            'UserRole',
            'RolePermission',
            'UserPermission',
            'Notification',
            'ChatConversation',
            'ChatMessage',
            'CartItem',
            'Cart', // Shared carts or managed explicitly
            'Page', // Page management often conflicts with implicit caching/filtering
            'AuditLog',
            'Sku',
            'SkuImage',
            'ProductImage',
            'ProductOption',
            'OptionValue',
            'SkuToOptionValue',
            'NewsletterSubscriber',
            'PerformanceMetric',
            'AiChatSession',
            'AiChatMessage',
            'FeatureFlag',
            'Coupon',
            'ProductTranslation',
            'BlogProduct',
          ];

          // Define which models have a deletedAt field for soft-delete
          const modelsWithSoftDelete = [
            'Product',
            'Blog',
            'User',
            'Page',
            'Category',
            'Brand',
            'Order',
            'Review',
          ];

          // 1. Multi-tenancy Filter
          if (tenant && !sharedModels.includes(model)) {
            const anyArgs = args as any;
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
                    item.tenantId = tenant.id;
                  });
                } else {
                  anyArgs.data.tenantId = tenant.id;
                }
              }
            }
          }

          // 2. Soft Delete Filter
          if (
            modelsWithSoftDelete.includes(model) &&
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

          return query(args);
        },
      },
    },
  });
});
