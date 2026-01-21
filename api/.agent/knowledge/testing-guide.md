# Testing Guide - API

> **Stack**: Jest (Unit) + Supertest (E2E)  
> **Coverage Target**: >80%

---

## 1. Testing Philosophy

### Test Pyramid

```
       /\
      /E2E\       10% - End-to-end (slow)
     /------\
    /Integration\ 30% - Integration (medium)
   /------------\
  /  Unit Tests  \ 60% - Unit (fast)
 /----------------\
```

---

## 2. Unit Tests (Jest)

### Setup

Already configured in `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage"
  }
}
```

### Example: Service Test

```typescript
// src/catalog/products/products.service.spec.ts
import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '@/core/prisma/prisma.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: {
            product: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('findAll', () => {
    it('should return array of products', async () => {
      const mockProducts = [
        { id: '1', name: 'Product 1', price: 100 },
        { id: '2', name: 'Product 2', price: 200 },
      ];

      jest.spyOn(prisma.product, 'findMany').mockResolvedValue(mockProducts);

      const result = await service.findAll({});

      expect(result).toEqual(mockProducts);
      expect(prisma.product.findMany).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      const dto = { name: 'New Product', price: 100 };
      const created = { id: '3', ...dto };

      jest.spyOn(prisma.product, 'create').mockResolvedValue(created);

      const result = await service.create(dto);

      expect(result).toEqual(created);
      expect(prisma.product.create).toHaveBeenCalledWith({ data: dto });
    });
  });
});
```

### Coverage Targets

```bash
# Run with coverage
npm run test:cov

# Coverage report
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   82.5  |   75.3   |   88.1  |   82.5  |
 products.service   |   95.2  |   90.0   |   100   |   95.2  |
 orders.service     |   78.3  |   65.5   |   82.1  |   78.3  |
--------------------|---------|----------|---------|---------|
```

---

## 3. E2E Tests (Supertest)

### Setup

```typescript
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "testEnvironment": "node"
}
```

# Docker environment

DATABASE_URL="postgresql://user:pass@localhost:5432/<project_test_db>"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="test_secret"

### Database Setup

```typescript
// test/setup.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

beforeAll(async () => {
  // Clean database
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "Product" CASCADE`;
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Example: Auth E2E Test

```typescript
// test/auth.e2e-spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body).not.toHaveProperty('password');
        });
    });

    it('should fail with invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    it('should login and return tokens', async () => {
      // First register
      await request(app.getHttpServer()).post('/auth/register').send({
        email: 'login@example.com',
        password: 'Password123!',
      });

      // Then login
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });
  });
});
```

---

## 4. Integration Tests

### Example: Full Checkout Flow

```typescript
// test/checkout-flow.e2e-spec.ts
describe('Checkout Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let productId: string;

  beforeAll(async () => {
    // Setup app
    // Register user
    // Get auth token
    // Create product
  });

  it('should complete full checkout', async () => {
    // 1. Add to cart
    const cartRes = await request(app.getHttpServer())
      .post('/cart/items')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ productId, quantity: 2 })
      .expect(201);

    // 2. View cart
    const viewRes = await request(app.getHttpServer())
      .get('/cart')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(viewRes.body.items).toHaveLength(1);
    expect(viewRes.body.total).toBeGreaterThan(0);

    // 3. Checkout
    const orderRes = await request(app.getHttpServer())
      .post('/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        shippingAddress: '123 Main St',
        paymentMethod: 'COD',
      })
      .expect(201);

    expect(orderRes.body.order.status).toBe('PENDING');

    // 4. Verify cart is empty
    const emptyCart = await request(app.getHttpServer())
      .get('/cart')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(emptyCart.body.items).toHaveLength(0);
  });
});
```

---

## 5. Test Factories

```typescript
// test/factories/user.factory.ts
export const createUser = (overrides = {}) => ({
  email: 'test@example.com',
  password: 'Password123!',
  name: 'Test User',
  ...overrides,
});

export const createProduct = (overrides = {}) => ({
  name: 'Test Product',
  price: 100,
  stock: 50,
  ...overrides,
});

// Usage
describe('Products', () => {
  it('should create product', async () => {
    const product = createProduct({ name: 'Custom Product' });
    const res = await service.create(product);
    expect(res.name).toBe('Custom Product');
  });
});
```

---

## 6. Mocking

### Mock External APIs

```typescript
// test/mocks/gemini.mock.ts
export const mockGeminiService = {
  generateText: jest.fn().mockResolvedValue('AI-generated description'),
};

// In test
beforeEach(() => {
  jest.clearAllMocks();
});

it('should generate description', async () => {
  const result = await aiService.generateDescription(productId);
  expect(mockGeminiService.generateText).toHaveBeenCalled();
  expect(result).toContain('AI-generated');
});
```

### Mock Prisma

```typescript
const mockPrisma = {
  product: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
};

providers: [{ provide: PrismaService, useValue: mockPrisma }];
```

---

## 7. CI Integration

See [github-actions-cicd.md](file:///home/mguser/ducnv/ecommerce-main/api/.agent/workflows/github-actions-cicd.md) for CI setup.

```yaml
# GitHub Actions
- name: Run Tests
  run: |
    cd api
    npm run test
    npm run test:e2e
```

---

## 8. Best Practices

### DO

- ✅ Test business logic, not implementation
- ✅ Use descriptive test names
- ✅ Arrange-Act-Assert pattern
- ✅ Mock external dependencies
- ✅ Clean up after tests (database, mocks)

### DON'T

- ❌ Test framework code (NestJS internals)
- ❌ Hardcode test data
- ❌ Skip teardown
- ❌ Test multiple things in one test
- ❌ Ignore flaky tests

---

## 9. Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage
npm run test:cov

# E2E
npm run test:e2e

# Specific file
npm run test products.service.spec.ts

# With verbose output
npm run test -- --verbose
```

---

**Coverage Goals**: >80% for critical paths (auth, orders, payments)
