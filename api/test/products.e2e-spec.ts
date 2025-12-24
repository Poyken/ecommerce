import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ProductsController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Login to get token (assuming clear DB or known seed user, standard practice in e2e is to seed first)
    // For this quick test, we will try to login with a known user if exists, or just skip auth tests.
    // Let's first check public endpoints which is the goal of caching/performance check.
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/products (GET)', () => {
    it('should return a list of products', () => {
      return request(app.getHttpServer())
        .get('/api/products')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toBeInstanceOf(Array);
          expect(res.body.meta).toHaveProperty('total');
        });
    });

    it('should filter by price range', () => {
      return request(app.getHttpServer())
        .get('/api/products?minPrice=0&maxPrice=1000000000')
        .expect(200);
    });
  });

  describe('/products/:id (GET)', () => {
    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/api/products/non-existent-id')
        .expect(404);
    });
  });
});
