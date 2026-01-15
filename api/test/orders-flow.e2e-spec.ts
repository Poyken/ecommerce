import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { OrderStatus } from '@prisma/client';

/**
 * =====================================================================
 * ORDERS FLOW E2E TEST - Quy trình mua hàng hoàn chỉnh
 * =====================================================================
 */

describe('Orders Flow (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let skuId: string;
  let orderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    await app.init();

    // 1. Get Access Token (assuming admin@example.com / Admin@123 exists from seed)
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin@123',
      });

    if (loginRes.status === 200 || loginRes.status === 201) {
      accessToken = loginRes.body.data.accessToken;
    }

    // 2. Get a valid SKU ID
    const productRes = await request(app.getHttpServer()).get(
      '/api/v1/products?limit=1',
    );

    if (productRes.body.data?.[0]?.skus?.[0]) {
      skuId = productRes.body.data[0].skus[0].id;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('SHIPPING-001: Should create a full order from cart', async () => {
    if (!accessToken || !skuId) {
      console.warn(
        'Skipping E2E test: No token or SKU found. Ensure database is seeded.',
      );
      return;
    }

    // 1. Add to cart
    await request(app.getHttpServer())
      .post('/api/v1/cart')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ skuId, quantity: 1 })
      .expect(201);

    // 2. Create order
    const orderRes = await request(app.getHttpServer())
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        recipientName: 'Test Receiver',
        phoneNumber: '0912345678',
        shippingAddress: '123 Test Street',
        shippingCity: 'Hanoi',
        shippingDistrict: 'Ba Dinh',
        shippingWard: 'Kim Ma',
        paymentMethod: 'COD',
      })
      .expect(201);

    orderId = orderRes.body.data.id;
    expect(orderId).toBeDefined();
    expect(orderRes.body.data.status).toBe(OrderStatus.PENDING);
    expect(orderRes.body.data.paymentMethod).toBe('COD');
  });

  it('SHIPPING-002: Should find the created order in user history', async () => {
    if (!orderId) return;

    const res = await request(app.getHttpServer())
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const found = res.body.data.find((o: any) => o.id === orderId);
    expect(found).toBeDefined();
  });

  it('SHIPPING-003: Should be able to cancel a PENDING order', async () => {
    if (!orderId) return;

    await request(app.getHttpServer())
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ reason: 'Changed my mind' })
      .expect(201);

    // Verify status updated
    const statusRes = await request(app.getHttpServer())
      .get(`/api/v1/orders/${orderId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(statusRes.body.data.status).toBe(OrderStatus.CANCELLED);
  });
});
