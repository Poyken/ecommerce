# Chiến lược Testing
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ QA  
**Trạng thái**: Bản nháp  

---

### Triết lý Testing

#### Nguyên tắc Testing

1. **Test Early, Test Often**: Testing bắt đầu từ giai đoạn đầu
2. **Automation First**: Ưu tiên automated testing
3. **Multi-tenant Testing**: Test isolation và security
4. **Performance Testing**: Đảm bảo hiệu suất dưới load
5. **User-Centric Testing**: Focus trên trải nghiệm người dùng

#### Mục tiêu Testing

- **Code Coverage**: 80%+ coverage cho code quan trọng
- **Defect Detection**: 95% bugs phát hiện trước production
- **Performance**: <500ms API response dưới load
- **Security**: Zero critical security vulnerabilities
- **User Experience**: Smooth user journey testing
- **Usability**: Ensure exceptional user experience
- **Scalability**: Validate system can handle growth

#### Success Metrics

- **Code Coverage**: Minimum 80% unit test coverage
- **Test Automation**: 90% of tests automated
- **Defect Detection**: 95% of bugs caught before production
- **Performance**: All performance benchmarks met
- **Security**: Zero critical vulnerabilities in production

---

### Test Pyramid Strategy

```
        ┌─────────────────┐
        │   E2E Tests     │ ← Few (10%)
        │   (User Journeys)│
        └─────────────────┘
      ┌───────────────────────┐
      │   Integration Tests    │ ← Some (20%)
      │   (API & Database)    │
      └───────────────────────┘
    ┌─────────────────────────────┐
    │      Unit Tests             │ ← Many (70%)
    │   (Business Logic)          │
    └─────────────────────────────┘
```

#### Test Types Distribution

| Test Type | Percentage | Focus | Tools |
|-----------|------------|-------|-------|
| **Unit Tests** | 70% | Business logic, utilities | Jest, Vitest |
| **Integration Tests** | 20% | API endpoints, database | Supertest, TestContainers |
| **E2E Tests** | 10% | User journeys, UI | Playwright, Cypress |

---

### Unit Testing Strategy

#### Unit Testing Framework

**Backend (NestJS)**:
- **Framework**: Jest
- **Coverage**: Istanbul (built into Jest)
- **Mocking**: Jest mocks
- **Assertions**: Jest matchers

**Frontend (Next.js)**:
- **Framework**: Vitest
- **Component Testing**: React Testing Library
- **Mocking**: Vitest mocks
- **Assertions**: Vitest matchers

#### Unit Testing Guidelines

##### Test Structure

```typescript
// Example: Product Service Unit Test
describe('ProductsService', () => {
  let service: ProductsService;
  let repository: jest.Mocked<ProductsRepository>;
  let cacheService: jest.Mocked<CacheService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: ProductsRepository,
          useValue: {
            findByTenant: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            invalidate: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    repository = module.get(ProductsRepository);
    cacheService = module.get(CacheService);
  });

  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Arrange
      const createProductDto = {
        name: 'Test Product',
        price: 99.99,
        categoryId: 'category-id',
      };
      
      const expectedProduct = {
        id: 'product-id',
        ...createProductDto,
        createdAt: new Date(),
      };

      repository.create.mockResolvedValue(expectedProduct);
      cacheService.invalidate.mockResolvedValue();

      // Act
      const result = await service.createProduct('tenant-id', createProductDto);

      // Assert
      expect(result).toEqual(expectedProduct);
      expect(repository.create).toHaveBeenCalledWith({
        ...createProductDto,
        tenantId: 'tenant-id',
      });
      expect(cacheService.invalidate).toHaveBeenCalledWith('products:tenant-id');
    });

    it('should throw error when product name already exists', async () => {
      // Arrange
      const createProductDto = {
        name: 'Existing Product',
        price: 99.99,
        categoryId: 'category-id',
      };

      repository.create.mockRejectedValue(
        new ConflictException('Product with this name already exists')
      );

      // Act & Assert
      await expect(
        service.createProduct('tenant-id', createProductDto)
      ).rejects.toThrow(ConflictException);
    });
  });
});
```

##### Test Categories

**Business Logic Tests**:
- Service layer methods
- Business rule validation
- Data transformation logic
- Calculation functions

**Utility Function Tests**:
- Helper functions
- Validation functions
- Formatting functions
- Data processing functions

**Repository Tests**:
- Database query logic
- Data mapping
- Transaction handling
- Error handling

#### Unit Testing Best Practices

1. **AAA Pattern**: Arrange, Act, Assert
2. **Single Responsibility**: One test per behavior
3. **Descriptive Names**: Test names describe the behavior
4. **Independent Tests**: Tests should not depend on each other
5. **Mock External Dependencies**: Isolate the unit under test
6. **Test Edge Cases**: Test boundary conditions and error cases
7. **Maintain Test Data**: Keep test data clean and predictable

---

### Integration Testing Strategy

#### Integration Testing Scope

**API Integration Tests**:
- Endpoint functionality
- Request/response validation
- Authentication and authorization
- Error handling
- Rate limiting

**Database Integration Tests**:
- Database operations
- Transaction handling
- Data integrity
- Performance queries
- Migration testing

**External Service Integration**:
- Payment gateway integration
- Email service integration
- SMS service integration
- Third-party API integration

#### Integration Testing Framework

**Backend Integration Tests**:
```typescript
// Example: API Integration Test
describe('Products API (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get(PrismaService);
    
    await app.init();
  });

  beforeEach(async () => {
    await prisma.cleanDatabase(); // Clean test data
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/v1/products', () => {
    it('should create a product with valid data', async () => {
      // Arrange
      const tenant = await prisma.tenant.create({
        data: { name: 'Test Tenant', domain: 'test.com' },
      });

      const category = await prisma.category.create({
        data: {
          name: 'Test Category',
          slug: 'test-category',
          tenantId: tenant.id,
        },
      });

      const createProductDto = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'Test Description',
        basePrice: 99.99,
        categoryId: category.id,
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('X-Tenant-ID', tenant.id)
        .send(createProductDto)
        .expect(201);

      // Assert
      expect(response.body).toMatchObject({
        data: {
          name: createProductDto.name,
          slug: createProductDto.slug,
          basePrice: createProductDto.basePrice,
          categoryId: category.id,
          tenantId: tenant.id,
        },
      });

      // Verify database state
      const product = await prisma.product.findUnique({
        where: { id: response.body.data.id },
      });
      expect(product).toBeTruthy();
      expect(product.name).toBe(createProductDto.name);
    });

    it('should return 400 for invalid data', async () => {
      // Arrange
      const tenant = await prisma.tenant.create({
        data: { name: 'Test Tenant', domain: 'test.com' },
      });

      const invalidProductDto = {
        name: '', // Invalid: empty name
        basePrice: -10, // Invalid: negative price
      };

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post('/api/v1/products')
        .set('X-Tenant-ID', tenant.id)
        .send(invalidProductDto)
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

#### Database Integration Testing

**Test Database Setup**:
```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST,
    },
  },
});

beforeAll(async () => {
  // Run migrations
  await execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL_TEST },
  });
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

beforeEach(async () => {
  // Clean database
  await testPrisma.$executeRaw`TRUNCATE TABLE "users", "products", "orders" CASCADE`;
});
```

**Transaction Testing**:
```typescript
describe('Order Service Transactions', () => {
  it('should rollback transaction on payment failure', async () => {
    // Arrange
    const product = await createTestProduct();
    const user = await createTestUser();
    
    const orderDto = {
      items: [{ productId: product.id, quantity: 1 }],
      paymentMethod: 'invalid-method', // This will fail
    };

    // Mock payment service to fail
    paymentService.processPayment.mockRejectedValue(
      new Error('Payment failed')
    );

    // Act & Assert
    await expect(orderService.createOrder(user.id, orderDto))
      .rejects.toThrow('Payment failed');

    // Verify rollback
    const orders = await prisma.order.findMany({
      where: { userId: user.id },
    });
    expect(orders).toHaveLength(0);

    // Verify inventory not affected
    const inventory = await prisma.inventoryItem.findUnique({
      where: { skuId: product.skus[0].id },
    });
    expect(inventory.quantity).toBe(product.skus[0].stock);
  });
});
```

---

### End-to-End Testing Strategy

#### E2E Testing Framework

**Tool Selection**: Playwright
- **Cross-browser**: Chrome, Firefox, Safari, Edge
- **Mobile**: iOS Safari, Android Chrome
- **Parallel Execution**: Multiple browsers simultaneously
- **Network Control**: Mock API responses, simulate network conditions
- **Screenshot/Video**: Visual regression testing

#### E2E Test Scenarios

**Critical User Journeys**:

1. **Customer Purchase Journey**
   - Product browsing and search
   - Add to cart and checkout
   - Payment processing
   - Order confirmation and tracking

2. **Admin Order Management**
   - Login and dashboard access
   - Order processing and fulfillment
   - Inventory management
   - Customer management

3. **Multi-tenant Operations**
   - Tenant isolation verification
   - Cross-tenant data access prevention
   - Tenant-specific configurations

#### E2E Test Implementation

```typescript
// e2e/customer-purchase.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Customer Purchase Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test data
    await setupTestData();
  });

  test('complete purchase flow', async ({ page }) => {
    // 1. Browse products
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Featured Products');
    
    // 2. Search for product
    await page.fill('[data-testid="search-input"]', 'laptop');
    await page.press('[data-testid="search-input"]', 'Enter');
    
    // 3. View product details
    await page.click('[data-testid="product-card"]:first-child');
    await expect(page.locator('h1')).toContainText('Laptop Pro');
    
    // 4. Add to cart
    await page.click('[data-testid="add-to-cart"]');
    await expect(page.locator('[data-testid="cart-count"]')).toContainText('1');
    
    // 5. View cart
    await page.click('[data-testid="cart-icon"]');
    await expect(page.locator('[data-testid="cart-item"]')).toHaveCount(1);
    
    // 6. Proceed to checkout
    await page.click('[data-testid="checkout-button"]');
    
    // 7. Fill shipping information
    await page.fill('[data-testid="first-name"]', 'John');
    await page.fill('[data-testid="last-name"]', 'Doe');
    await page.fill('[data-testid="email"]', 'john.doe@example.com');
    await page.fill('[data-testid="address"]', '123 Main St');
    await page.fill('[data-testid="city"]', 'New York');
    await page.selectOption('[data-testid="country"]', 'US');
    await page.fill('[data-testid="postal-code"]', '10001');
    
    // 8. Select shipping method
    await page.click('[data-testid="shipping-method-standard"]');
    
    // 9. Select payment method
    await page.click('[data-testid="payment-method-credit-card"]');
    await page.fill('[data-testid="card-number"]', '4242424242424242');
    await page.fill('[data-testid="expiry"]', '12/25');
    await page.fill('[data-testid="cvv"]', '123');
    
    // 10. Place order
    await page.click('[data-testid="place-order"]');
    
    // 11. Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-number"]')).toBeVisible();
    
    // 12. Verify order in database
    const orderNumber = await page.locator('[data-testid="order-number"]').textContent();
    const order = await getOrderFromDatabase(orderNumber);
    expect(order).toBeTruthy();
    expect(order.status).toBe('pending');
  });

  test('handle out of stock product', async ({ page }) => {
    // Setup out of stock product
    await createOutOfStockProduct();
    
    await page.goto('/products/out-of-stock-product');
    
    // Verify out of stock message
    await expect(page.locator('[data-testid="out-of-stock"]')).toBeVisible();
    
    // Verify add to cart is disabled
    await expect(page.locator('[data-testid="add-to-cart"]')).toBeDisabled();
  });
});
```

#### Visual Regression Testing

```typescript
// e2e/visual-regression.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test('product page layout', async ({ page }) => {
    await page.goto('/products/test-product');
    
    // Take screenshot and compare with baseline
    await expect(page.locator('[data-testid="product-page"]')).toHaveScreenshot('product-page.png');
  });

  test('admin dashboard layout', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/dashboard');
    
    await expect(page.locator('[data-testid="dashboard"]')).toHaveScreenshot('dashboard.png');
  });
});
```

---

### Performance Testing Strategy

#### Performance Testing Types

**Load Testing**:
- Normal user load simulation
- Response time validation
- Throughput measurement
- Resource utilization monitoring

**Stress Testing**:
- Maximum capacity determination
- Breaking point identification
- System behavior under extreme load
- Recovery time measurement

**Scalability Testing**:
- Horizontal scaling validation
- Performance vs. user count
- Database performance under load
- Cache effectiveness measurement

#### Performance Testing Tools

**Backend Performance**:
```typescript
// tests/performance/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate below 1%
    errors: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get('https://api.ecommerce.com/api/v1/products');
  
  const result = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!result);
  
  sleep(1);
}
```

**Database Performance**:
```sql
-- Database performance test queries
-- Test query performance under load

EXPLAIN (ANALYZE, BUFFERS) 
SELECT p.*, c.name as category_name 
FROM products p 
LEFT JOIN categories c ON p.categoryId = c.id 
WHERE p.tenantId = $1 
  AND p.isActive = true 
  AND p.basePrice BETWEEN $2 AND $3 
ORDER BY p.sortOrder 
LIMIT 20;

-- Index usage analysis
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

#### Performance Benchmarks

**API Response Times**:
- Authentication: <200ms
- Product listing: <500ms
- Product details: <300ms
- Search: <1s
- Order creation: <1s
- Checkout: <2s

**Database Performance**:
- Simple queries: <100ms
- Complex queries: <500ms
- Write operations: <200ms
- Transaction commits: <300ms

**Frontend Performance**:
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s
- Time to Interactive: <3s
- Cumulative Layout Shift: <0.1

---

### Security Testing Strategy

#### Security Testing Types

**Static Application Security Testing (SAST)**:
- Code vulnerability scanning
- Dependency vulnerability scanning
- Configuration security review
- Secret detection

**Dynamic Application Security Testing (DAST)**:
- OWASP Top 10 testing
- Injection attacks testing
- Authentication bypass testing
- Authorization testing

**Penetration Testing**:
- Manual security testing
- Business logic flaws
- Multi-tenant isolation
- Data exposure testing

#### Security Testing Implementation

**OWASP ZAP Integration**:
```bash
# Security scanning with OWASP ZAP
docker run -t owasp/zap2docker-stable \
  zap-baseline.py -t https://api.ecommerce.com \
  -J gl-sast-report.json
```

**Dependency Scanning**:
```yaml
# .github/workflows/security-scan.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run npm audit
        run: npm audit --audit-level high
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      
      - name: Run CodeQL analysis
        uses: github/codeql-action/analyze@v2
```

**Security Test Cases**:
```typescript
// tests/security/auth-security.spec.ts
describe('Authentication Security', () => {
  test('prevent SQL injection in login', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: maliciousInput,
        password: 'password',
      })
      .expect(400);
    
    // Verify users table still exists
    const users = await prisma.user.findMany();
    expect(users.length).toBeGreaterThan(0);
  });

  test('prevent brute force login attempts', async () => {
    const email = 'test@example.com';
    
    // Attempt multiple failed logins
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/v1/auth/login')
        .send({ email, password: 'wrong' })
        .expect(401);
    }
    
    // Verify account is locked
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email, password: 'correct' })
      .expect(423);
    
    expect(response.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  test('enforce tenant isolation', async () => {
    // Create tenants and users
    const tenant1 = await createTestTenant();
    const tenant2 = await createTestTenant();
    const user1 = await createTestUser(tenant1.id);
    const user2 = await createTestUser(tenant2.id);
    
    // Try to access other tenant's data
    const response = await request(app)
      .get('/api/v1/products')
      .set('Authorization', `Bearer ${user1.token}`)
      .set('X-Tenant-ID', tenant2.id)
      .expect(403);
    
    expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
  });
});
```

---

### Test Data Management

#### Test Data Strategy

**Test Data Categories**:
- **Static Data**: Categories, brands, basic products
- **Dynamic Data**: Users, orders, transactions
- **Sensitive Data**: PII, payment information (mocked)
- **Performance Data**: Large datasets for load testing

#### Test Data Management

**Factory Pattern for Test Data**:
```typescript
// tests/factories/user.factory.ts
import { faker } from '@faker-js/faker';
import { PrismaClient } from '@prisma/client';

export class UserFactory {
  constructor(private prisma: PrismaClient) {}

  create(overrides: Partial<any> = {}) {
    return this.prisma.user.create({
      data: {
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'customer',
        isActive: true,
        ...overrides,
      },
    });
  }

  createMany(count: number, overrides: Partial<any> = {}) {
    return Promise.all(
      Array.from({ length: count }, () => this.create(overrides))
    );
  }

  createWithOrders(orderCount: number) {
    return this.prisma.user.create({
      data: {
        email: faker.internet.email(),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        role: 'customer',
        isActive: true,
        orders: {
          create: Array.from({ length: orderCount }, () => ({
            orderNumber: `ORD-${faker.string.alphanumeric(8)}`,
            status: 'completed',
            total: parseFloat(faker.commerce.price()),
            currency: 'USD',
          })),
        },
      },
      include: { orders: true },
    });
  }
}
```

**Database Seeding**:
```typescript
// tests/seeds/test-data.seed.ts
import { PrismaClient } from '@prisma/client';
import { UserFactory } from '../factories/user.factory';
import { ProductFactory } from '../factories/product.factory';

export class TestDataSeeder {
  constructor(private prisma: PrismaClient) {}

  async seedBasicData() {
    const userFactory = new UserFactory(this.prisma);
    const productFactory = new ProductFactory(this.prisma);

    // Create test tenant
    const tenant = await this.prisma.tenant.create({
      data: {
        name: 'Test Store',
        domain: 'test-store.com',
        status: 'active',
      },
    });

    // Create test users
    const admin = await userFactory.create({
      tenantId: tenant.id,
      role: 'admin',
    });

    const customer = await userFactory.create({
      tenantId: tenant.id,
      role: 'customer',
    });

    // Create test categories
    const category = await this.prisma.category.create({
      data: {
        name: 'Electronics',
        slug: 'electronics',
        tenantId: tenant.id,
      },
    });

    // Create test products
    const products = await productFactory.createMany(10, {
      tenantId: tenant.id,
      categoryId: category.id,
    });

    return { tenant, admin, customer, category, products };
  }

  async cleanup() {
    await this.prisma.$executeRaw`TRUNCATE TABLE "users", "products", "orders", "categories" CASCADE`;
  }
}
```

---

### Test Automation

#### Continuous Integration Testing

**CI Pipeline Testing**:
```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run db:migrate
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

#### Test Reporting

**Coverage Reports**:
```json
// .nycrc.json
{
  "reporter": [
    "text",
    "text-summary",
    "html",
    "lcov",
    "json"
  ],
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "node_modules/",
    "dist/"
  ],
  "thresholds": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

**Test Result Dashboard**:
- **Coverage Trends**: Track coverage over time
- **Test Execution Time**: Monitor test performance
- **Flaky Test Detection**: Identify unstable tests
- **Failure Analysis**: Categorize test failures

---

### Quality Gates

#### Pre-Deployment Quality Gates

**Code Quality Gates**:
- [ ] Minimum 80% test coverage
- [ ] All tests passing
- [ ] No critical security vulnerabilities
- [ ] Code quality score > 8/10
- [ ] Performance benchmarks met

**Functional Gates**:
- [ ] All critical user journeys working
- [ ] Multi-tenant isolation verified
- [ ] Payment processing functional
- [ ] Email notifications working
- [ ] Search functionality working

**Performance Gates**:
- [ ] API response times < 500ms (95th percentile)
- [ ] Page load times < 2s
- [ ] Database query times < 100ms
- [ ] Memory usage within limits
- [ ] No memory leaks detected

#### Release Criteria

**Must Have**:
- All quality gates passed
- Security scan passed
- Performance tests passed
- E2E tests passed
- Documentation updated

**Should Have**:
- Load testing completed
- Accessibility audit passed
- Cross-browser compatibility verified
- Mobile responsiveness verified
- User acceptance testing completed

---

### Test Environment Management

#### Test Environments

**Development Testing**:
- Local development environment
- Unit and integration tests
- Fast feedback loop
- Debugging capabilities

**Staging Testing**:
- Production-like environment
- Full test suite execution
- Performance testing
- Security testing

**Production Monitoring**:
- Synthetic monitoring
- Real user monitoring
- Performance monitoring
- Error tracking

#### Test Environment Configuration

```typescript
// config/test.config.ts
export const testConfig = {
  database: {
    url: process.env.DATABASE_URL_TEST,
    logging: false,
  },
  redis: {
    url: process.env.REDIS_URL_TEST,
  },
  app: {
    port: 3001,
    environment: 'test',
  },
  externalServices: {
    stripe: {
      apiKey: process.env.STRIPE_TEST_KEY,
      webhookSecret: process.env.STRIPE_TEST_WEBHOOK_SECRET,
    },
    email: {
      provider: 'mock', // Use mock email service
    },
  },
};
```

---

### Approval

**QA Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Test Architect**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**DevOps Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
