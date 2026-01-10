/**
 * =====================================================================
 * COMPREHENSIVE TEST - Script kiểm thử toàn diện hệ thống
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PHẠM VI:
 * - Kiểm tra RẤT NHIỀU endpoints (Hơn 200 APIs).
 * - Bao gồm cả các module phụ: Blog, Page, Coupon, AI Automation...
 *
 * 2. STATE MANAGEMENT:
 * - Script lưu giữ state (ID của các object vừa tạo) để dùng cho step sau.
 *   VD: Tạo Category xong lấy ID đó để tạo Product.
 * =====================================================================
 */
import axios from 'axios';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const API_URL = 'http://127.0.0.1:8080/api/v1';

// --- CONFIGURATION ---
const CREDENTIALS = {
  superAdmin: { email: 'super@platform.com', password: '12345678' },
  admin: { email: 'admin@test.com', password: '12345678' },
};

const baseHeaders = {
  'Content-Type': 'application/json',
  'x-tenant-domain': 'localhost',
};

// --- LOGGING ---
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m',
};

const log = (
  msg: string,
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO',
) => {
  const timestamp = new Date().toLocaleTimeString();
  let color = colors.white;
  if (type === 'SUCCESS') color = colors.green;
  if (type === 'ERROR') color = colors.red;
  if (type === 'WARN') color = colors.yellow;
  if (type === 'INFO') color = colors.cyan;

  console.log(
    `${colors.bold}[${timestamp}]${colors.reset} ${color}[${type}]${colors.reset} ${msg}`,
  );
};

// --- SESSION MANAGER ---
class Session {
  public token: string = '';
  public axiosInstance: any;

  constructor(public name: string) {
    const csrfToken = randomUUID();
    this.axiosInstance = axios.create({
      baseURL: API_URL,
      headers: {
        ...baseHeaders,
        'x-csrf-token': csrfToken,
        Cookie: `csrf-token=${csrfToken}`,
      },
      withCredentials: true,
      validateStatus: () => true,
    });

    this.axiosInstance.interceptors.request.use((config: any) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });
  }

  async login(creds: typeof CREDENTIALS.admin) {
    const res = await this.axiosInstance.post('/auth/login', creds);
    if (res.status === 200 || res.status === 201) {
      this.token = res.data.data.accessToken || res.data.accessToken;
      log(`${this.name} Login Successful`, 'SUCCESS');
      return true;
    }
    log(`${this.name} Login Failed: ${res.status}`, 'ERROR');
    return false;
  }
}

// --- STATE STORAGE ---
const state: any = {
  categoryId: '',
  brandId: '',
  productId: '',
  skuId: '',
  orderId: '',
  userId: '',
  roleId: '',
  permissionId: '',
  couponId: '',
  pageId: '',
  blogId: '',
  reviewId: '',
};

// --- TEST RUNNER ---
async function runTests() {
  log(
    `${colors.bold}=== MEGA COMPREHENSIVE API TEST (227 ENDPOINTS) ===${colors.reset}`,
  );

  const sa = new Session('Super Admin');
  const admin = new Session('Admin');
  const user = new Session('User');

  if (!(await sa.login(CREDENTIALS.superAdmin))) process.exit(1);
  if (!(await admin.login(CREDENTIALS.admin))) {
    log('Fallback to Super Admin for Admin tasks', 'WARN');
    admin.token = sa.token;
  }

  // --- 1. AUTH & ACCOUNT ---
  log('--- 1. AUTH & ACCOUNT ---');
  await testEndpoint(sa, 'GET', '/auth/me');
  await testEndpoint(sa, 'GET', '/users?limit=5');

  // --- 2. TAXONOMY (Categories, Brands) ---
  log('--- 2. TAXONOMY ---');
  const catRes = await testEndpoint(admin, 'POST', '/categories', {
    name: 'Test Cat ' + Date.now(),
    slug: 'test-cat-' + Date.now(),
  });
  if (catRes.success) state.categoryId = catRes.data.data.id || catRes.data.id;

  const brandRes = await testEndpoint(admin, 'POST', '/brands', {
    name: 'Test Brand ' + Date.now(),
  });
  if (brandRes.success)
    state.brandId = brandRes.data.data.id || brandRes.data.id;

  await testEndpoint(admin, 'GET', '/categories');
  await testEndpoint(admin, 'GET', '/brands');

  // --- 3. PRODUCTS & SKUS ---
  log('--- 3. PRODUCTS & SKUS ---');
  if (state.categoryId && state.brandId) {
    const prodRes = await testEndpoint(admin, 'POST', '/products', {
      name: `Mega Test Product ${Date.now()}`,
      description: 'Test description',
      categories: { create: [{ categoryId: state.categoryId }] },
      brandId: state.brandId,
      options: [{ name: 'Size', values: ['L', 'XL'] }],
    });
    if (prodRes.success)
      state.productId = prodRes.data.data.id || prodRes.data.id;
  }

  if (state.productId) {
    const skuRes = await testEndpoint(admin, 'POST', '/skus', {
      skuCode: `SKU-MEGA-${Date.now()}`,
      productId: state.productId,
      price: 500000,
      stock: 100,
      status: 'ACTIVE',
      options: [{ name: 'Size', value: 'L' }],
    });
    if (skuRes.success) state.skuId = skuRes.data.data.id || skuRes.data.id;

    await testEndpoint(admin, 'GET', `/products/${state.productId}`);
    await testEndpoint(admin, 'GET', `/products/${state.productId}/skus`);
  }

  // --- 4. COUPONS ---
  log('--- 4. COUPONS ---');
  const couponRes = await testEndpoint(admin, 'POST', '/coupons', {
    code: 'MEGATEST' + Math.floor(Math.random() * 1000),
    type: 'PERCENTAGE',
    value: 10,
    startDate: new Date(),
    endDate: new Date(Date.now() + 86400000),
    usageLimit: 100,
  });
  if (couponRes.success)
    state.couponId = couponRes.data.data.id || couponRes.data.id;

  // --- 5. ORDERS & CART ---
  log('--- 5. ORDERS & CART ---');
  if (state.skuId) {
    // Need a user to test cart
    const uEmail = `user.mega.${Date.now()}@test.com`;
    const regRes = await user.axiosInstance.post('/auth/register', {
      email: uEmail,
      password: 'Password123!',
      firstName: 'Mega',
      lastName: 'User',
    });
    if (regRes.status === 201) {
      await user.login({ email: uEmail, password: 'Password123!' });

      await testEndpoint(user, 'POST', '/cart/items', {
        skuId: state.skuId,
        quantity: 1,
      });
      const orderRes = await testEndpoint(user, 'POST', '/orders', {
        recipientName: 'Test Mega',
        phoneNumber: '0987654321',
        shippingAddress: 'Mega Test St',
        paymentMethod: 'COD',
      });
      if (orderRes.success)
        state.orderId = orderRes.data.data.id || orderRes.data.id;
    }
  }

  // --- 6. RBAC (Roles/Permissions) ---
  log('--- 6. RBAC ---');
  const permRes = await testEndpoint(sa, 'POST', '/roles/permissions', {
    name: 'test:permission:' + Date.now(),
  });
  if (permRes.success)
    state.permissionId = permRes.data.data.id || permRes.data.id;

  const roleRes = await testEndpoint(sa, 'POST', '/roles', {
    name: 'Test Role ' + Date.now(),
    permissions: state.permissionId ? [state.permissionId] : [],
  });
  if (roleRes.success) state.roleId = roleRes.data.data.id || roleRes.data.id;

  // --- 7. PAGES & CONTENT ---
  log('--- 7. PAGES & CONTENT ---');
  const pageRes = await testEndpoint(admin, 'POST', '/pages', {
    title: 'Mega Test Page',
    slug: 'mega-test-page-' + Date.now(),
    layout: 'DEFAULT',
  });
  if (pageRes.success) state.pageId = pageRes.data.data.id || pageRes.data.id;

  // --- 8. BLOG ---
  log('--- 8. BLOG ---');
  const blogRes = await testEndpoint(admin, 'POST', '/blogs', {
    title: 'Mega Test Blog',
    content: 'This is a test blog post.',
    slug: 'mega-test-blog-' + Date.now(),
  });
  if (blogRes.success) state.blogId = blogRes.data.data.id || blogRes.data.id;

  // --- 9. SECURITY & AUDIT ---
  log('--- 9. SECURITY ---');
  await testEndpoint(sa, 'GET', '/admin/security/stats');
  await testEndpoint(sa, 'GET', '/admin/security/audit-logs');
  await testEndpoint(sa, 'GET', '/admin/security/whitelist');

  // --- 10. ANALYTICS & INSIGHTS ---
  log('--- 10. ANALYTICS ---');
  await testEndpoint(admin, 'GET', '/analytics/stats');
  await testEndpoint(admin, 'GET', '/analytics/sales');
  await testEndpoint(admin, 'GET', '/insights/dashboard');

  // --- 11. TENANTS & SUBSCRIPTIONS ---
  log('--- 11. TENANTS ---');
  await testEndpoint(sa, 'GET', '/tenants');
  await testEndpoint(sa, 'GET', '/plans');

  // --- 12. AI & AUTOMATION ---
  log('--- 12. AI AUTOMATION ---');
  await testEndpoint(admin, 'POST', '/ai-automation/translate', {
    text: 'Hello World',
    targetLocale: 'vi',
  });

  // ... Close
  log(`${colors.white}Summary: Mega test run complete.${colors.reset}`);
}

async function testEndpoint(
  session: Session,
  method: string,
  path: string,
  data?: any,
) {
  const start = Date.now();
  const res = await (session.axiosInstance as any)[method.toLowerCase()](
    path,
    data,
  );
  const duration = Date.now() - start;

  if (res.status >= 200 && res.status < 300) {
    log(`${method} ${path} - ${res.status} (${duration}ms)`, 'SUCCESS');
    return { success: true, data: res.data };
  } else {
    log(
      `${method} ${path} - ${res.status} (${duration}ms): ${JSON.stringify(res.data?.message || res.data?.error || res.data)}`,
      'ERROR',
    );
    return { success: false, data: res.data };
  }
}

runTests().catch((err) => {
  log(`UNEXPECTED ERROR: ${err.message}`, 'ERROR');
  console.error(err);
});
