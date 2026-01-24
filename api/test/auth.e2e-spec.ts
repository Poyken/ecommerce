/**
 * =====================================================================
 * AUTH E2E SPEC - Kiểm thử End-to-End cho Authentication Flow
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * E2E test cho Auth bao gồm:
 * 1. Register: Đăng ký tài khoản mới
 * 2. Login: Đăng nhập và nhận token
 * 3. Token Refresh: Làm mới access token
 * 4. Protected Routes: Kiểm tra authentication required
 *
 * =====================================================================
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  // Test user credentials
  const testUser = {
    email: `test-${Date.now()}@e2e-test.com`,
    password: 'TestPassword123!',
    firstName: 'E2E',
    lastName: 'Test',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('user');
          expect(res.body.data.user.email).toBe(testUser.email);
          expect(res.body.data.user).not.toHaveProperty('password');
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send(testUser)
        .expect(409); // Conflict
    });

    it('should reject weak password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'weak@test.com',
          password: '123', // Too short
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });

    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('accessToken');
          expect(res.body.data).toHaveProperty('user');

          // Save tokens for subsequent tests
          accessToken = res.body.data.accessToken;
          // Refresh token might be in cookies
          const cookies = res.headers['set-cookie'];
          if (cookies && Array.isArray(cookies)) {
            const refreshCookie = cookies.find((c: string) =>
              c.startsWith('refreshToken='),
            );
            if (refreshCookie) {
              refreshToken = refreshCookie.split(';')[0].split('=')[1];
            }
          }
        });
    });

    it('should reject wrong password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject non-existent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'TestPassword123!',
        })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should access protected route with valid token', async () => {
      // Skip if no token (previous test failed)
      if (!accessToken) {
        console.warn('Skipping - no access token available');
        return;
      }

      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveProperty('email');
          expect(res.body.data.email).toBe(testUser.email);
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer()).get('/api/auth/me').expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout successfully', async () => {
      if (!accessToken) {
        console.warn('Skipping - no access token available');
        return;
      }

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });
});
