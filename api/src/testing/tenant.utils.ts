import { Tenant } from '@prisma/client';
import { tenantStorage } from '@core/tenant/tenant.context';

/**
 * =====================================================================
 * TEST UTILITIES - HELPER CHO UNIT TESTS MULTI-TENANCY
 * =====================================================================
 *
 * =====================================================================
 */

/**
 * Default mock tenant dùng cho testing.
 * Có thể override bằng cách truyền partial vào createMockTenant().
 */
export const DEFAULT_MOCK_TENANT: Tenant = {
  id: 'test-tenant-id',
  name: 'Test Store',

  ownerId: 'test-owner-id',
  subdomain: 'test-store',
  customDomain: null,
  domain: 'test-store.example.com',
  currency: 'VND',
  timezone: 'Asia/Ho_Chi_Minh',
  locale: 'vi-VN',
  themeConfig: null,
  logoUrl: null,
  faviconUrl: null,
  contactEmail: 'test@example.com',
  contactPhone: '0123456789',
  address: '123 Test Street',
  plan: 'BASIC',
  isActive: true,
  suspendedAt: null,
  suspensionReason: null,
  deletedAt: null,
  dbUrl: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  onboardingCompleted: false,
  onboardingStep: 0,
  trialEndsAt: null,
  trialStartedAt: null,
  productLimit: 100,
  storageLimit: 1024,
  staffLimit: 2,
  currentProductCount: 0,
  currentStorageUsed: 0,
  currentStaffCount: 0,
  businessType: null,
  businessSize: null,
  monthlyRevenue: null,
  referralCode: null,
  referredByCode: null,
  allowSocialRegistration: false,
};

/**
 * Tạo mock Tenant object cho testing.
 *
 * @param overrides - Partial Tenant để override các giá trị mặc định
 * @returns Tenant object hoàn chỉnh
 *
 * @example
 * ```typescript
 * const tenant = createMockTenant({ name: 'Custom Store' });
 * expect(tenant.name).toBe('Custom Store');
 * expect(tenant.id).toBe('test-tenant-id'); // Giữ nguyên default
 * ```
 */
export function createMockTenant(overrides?: Partial<Tenant>): Tenant {
  return {
    ...DEFAULT_MOCK_TENANT,
    ...overrides,
  };
}

/**
 * Chạy một function trong context của một tenant.
 * Sử dụng AsyncLocalStorage để inject tenant context.
 *
 * @param tenant - Tenant hoặc Partial<Tenant> để set context
 * @param fn - Function cần chạy trong context
 * @returns Kết quả của function
 *
 * @example
 * ```typescript
 * const result = await withTenantContext(mockTenant, async () => {
 *   return service.findAll(); // Service sẽ thấy tenant context
 * });
 * ```
 */
export async function withTenantContext<T>(
  tenant: Tenant | Partial<Tenant>,
  fn: () => T | Promise<T>,
): Promise<T> {
  const fullTenant = {
    ...DEFAULT_MOCK_TENANT,
    ...tenant,
  } as Tenant;

  return new Promise((resolve, reject) => {
    tenantStorage.run(fullTenant, async () => {
      try {
        const result = await fn();
        resolve(result);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  });
}

/**
 * Synchronous version của withTenantContext cho các test không async.
 */
export function withTenantContextSync<T>(
  tenant: Tenant | Partial<Tenant>,
  fn: () => T,
): T {
  const fullTenant = {
    ...DEFAULT_MOCK_TENANT,
    ...tenant,
  } as Tenant;

  let result: T;
  tenantStorage.run(fullTenant, () => {
    result = fn();
  });
  return result!;
}

/**
 * Tạo mock PrismaService với các methods phổ biến.
 * Dùng để inject vào services khi test.
 *
 * @returns Mock PrismaService object
 *
 * @example
 * ```typescript
 * const mockPrisma = createMockPrismaService();
 * mockPrisma.product.findMany.mockResolvedValue([{ id: '1', name: 'Test' }]);
 *
 * const module = await Test.createTestingModule({
 *   providers: [
 *     ProductsService,
 *     { provide: PrismaService, useValue: mockPrisma },
 *   ],
 * }).compile();
 * ```
 */
export function createMockPrismaService() {
  const createModelMock = () => ({
    findMany: jest.fn().mockResolvedValue([]),
    findFirst: jest.fn().mockResolvedValue(null),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest
      .fn()
      .mockImplementation((args) =>
        Promise.resolve({ id: 'mock-id', ...args.data }),
      ),
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    update: jest
      .fn()
      .mockImplementation((args) =>
        Promise.resolve({ id: args.where.id, ...args.data }),
      ),
    updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    delete: jest.fn().mockResolvedValue({}),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    count: jest.fn().mockResolvedValue(0),
    aggregate: jest.fn().mockResolvedValue({}),
    upsert: jest.fn().mockResolvedValue({}),
  });

  return {
    $transaction: jest.fn((fn) => fn(this)),
    $executeRawUnsafe: jest.fn().mockResolvedValue(0),
    $queryRawUnsafe: jest.fn().mockResolvedValue([]),

    // Common models
    user: createModelMock(),
    product: createModelMock(),
    sku: createModelMock(),
    order: createModelMock(),
    orderItem: createModelMock(),
    cart: createModelMock(),
    cartItem: createModelMock(),
    category: createModelMock(),
    brand: createModelMock(),
    review: createModelMock(),
    address: createModelMock(),
    tenant: createModelMock(),
    media: createModelMock(),
    promotion: createModelMock(),
    loyaltyPoint: createModelMock(),
    warehouse: createModelMock(),
    inventoryItem: createModelMock(),
  };
}

/**
 * Tạo mock ExecutionContext cho testing Guards.
 *
 * @param request - Request object để mock
 * @returns Mock ExecutionContext
 */
export function createMockExecutionContext(request: Partial<Request> = {}) {
  const mockRequest = {
    method: 'GET',
    url: '/api/test',
    ip: '127.0.0.1',
    ...request,
  };

  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
      getResponse: () => ({}),
    }),
    getHandler: () => ({ name: 'testHandler' }),
    getClass: () => ({ name: 'TestController' }),
  };
}

/**
 * Helper để reset tất cả mocks trong một mock service.
 */
export function resetMocks(
  mockService: ReturnType<typeof createMockPrismaService>,
) {
  Object.values(mockService).forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      Object.values(value).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          fn.mockReset();
        }
      });
    }
  });
}
