import { Prisma } from '@prisma/client';
import { getTenant } from './tenant.context';

export const tenancyExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenant = getTenant();

          // List of models that should NOT be filtered by tenant (Shared data or 1:1 User data)
          const sharedModels = [
            'Tenant',
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
            'Cart',
            'CartItem',
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
          ];

          if (tenant && !sharedModels.includes(model)) {
            // Check if model has tenantId field (runtime check or schema knowledge)
            // Ideally we rely on schema naming convention or explicit list

            // For now, assume common operations where `where` clause applies
            if (
              operation === 'findUnique' ||
              operation === 'findFirst' ||
              operation === 'findMany' ||
              operation === 'count' ||
              operation === 'update' ||
              operation === 'updateMany' ||
              operation === 'delete' ||
              operation === 'deleteMany' ||
              operation === 'upsert'
            ) {
              args.where = {
                ...args.where,
                tenantId: tenant.id,
              };
            }

            // For create operations, inject tenantId automatically
            if (operation === 'create' || operation === 'createMany') {
              if (args.data) {
                if (Array.isArray(args.data)) {
                  args.data.forEach((item: any) => {
                    item.tenantId = tenant.id;
                  });
                } else {
                  (args.data as any).tenantId = tenant.id;
                }
              }
            }
          }

          return query(args);
        },
      },
    },
  });
});
