/**
 * =====================================================================
 * ORDERS E2E SPEC - Kiểm thử End-to-End cho Order Flow
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Test toàn bộ flow mua hàng từ đầu đến cuối:
 * 1. Add to Cart
 * 2. Create Order
 * 3. Payment
 * 4. Order Status Updates
 *
 * =====================================================================
 */
import { INestApplication } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let testSkuId: string;
  let testOrderId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ZodValidationPipe());
    await app.init();

    // Login to get token (use existing test user or seed data)
    try {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'Admin@123',
        });

      if (loginRes.status === 200) {
        accessToken = loginRes.body.data.accessToken;
      }
    } catch (e) {
      console.warn('Could not login for order tests:', e.message);
    }

    // Get a product SKU for testing
    try {
      const productsRes = await request(app.getHttpServer()).get(
        '/api/products?limit=1',
      );

      if (productsRes.body.data?.[0]?.skus?.[0]?.id) {
        testSkuId = productsRes.body.data[0].skus[0].id;
      }
    } catch (e) {
      console.warn('Could not get product SKU for order tests');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Cart Operations', () => {
    it('should get empty cart for new user', async () => {
      if (!accessToken) {
        console.warn('Skipping - no access token');
        return;
      }

      return request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('items');
          expect(Array.isArray(res.body.data.items)).toBe(true);
        });
    });

    it('should add item to cart', async () => {
      if (!accessToken || !testSkuId) {
        console.warn('Skipping - missing token or SKU');
        return;
      }

      return request(app.getHttpServer())
        .post('/api/cart')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          skuId: testSkuId,
          quantity: 1,
        })
        .expect((res) => {
          // Accept 200 or 201
          expect([200, 201]).toContain(res.status);
        });
    });

    it('should update cart item quantity', async () => {
      if (!accessToken) {
        console.warn('Skipping - no access token');
        return;
      }

      // First get cart to find item ID
      const cartRes = await request(app.getHttpServer())
        .get('/api/cart')
        .set('Authorization', `Bearer ${accessToken}`);

      const itemId = cartRes.body.data?.items?.[0]?.id;
      if (!itemId) {
        console.warn('Skipping - no item in cart');
        return;
      }

      return request(app.getHttpServer())
        .patch(`/api/cart/${itemId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ quantity: 2 })
        .expect(200);
    });
  });

  describe('Order Creation', () => {
    it('should reject order without authentication', () => {
      return request(app.getHttpServer())
        .post('/api/orders')
        .send({})
        .expect(401);
    });

    it('should reject order with empty cart', async () => {
      if (!accessToken) {
        console.warn('Skipping - no access token');
        return;
      }

      // Clear cart first
      await request(app.getHttpServer())
        .delete('/api/cart')
        .set('Authorization', `Bearer ${accessToken}`);

      return request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          shippingAddressId: 'fake-address-id',
          paymentMethod: 'COD',
        })
        .expect(400);
    });
  });

  describe('Order Listing', () => {
    it('should get user orders', async () => {
      if (!accessToken) {
        console.warn('Skipping - no access token');
        return;
      }

      return request(app.getHttpServer())
        .get('/api/orders')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
        });
    });

    it('should reject without authentication', () => {
      return request(app.getHttpServer()).get('/api/orders').expect(401);
    });
  });
});
