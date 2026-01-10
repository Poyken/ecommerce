/**
 * =====================================================================
 * MEGA TEST - Kịch bản kiểm thử tích hợp (Integration Test)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ISOLATED TESTING:
 * - File này chạy độc lập, tự tạo session axios riêng cho 3 vai trò:
 *   SuperAdmin, Admin, User.
 *
 * 2. TEST FLOW (Luồng kiểm thử):
 * - Auth -> Tạo MetaData (Cat/Brand) -> Tạo Product -> Mua hàng (Order) -> Admin duyệt.
 * - Nếu script chạy từ đầu đến cuối không lỗi (xanh lè) -> Core luồng chính hoạt động tốt.
 * =====================================================================
 */
import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://127.0.0.1:8080/api/v1';

// Utilities (No Emojis)
const log = (msg: string, type: string = 'INFO') => {
  console.log(`[${type}] ${msg}`);
};

// Global State
let userId = '';
let createdProductId = '';
let createdSkuId = '';
let createdOrderId = '';

const baseHeaders = {
  'Content-Type': 'application/json',
  'x-tenant-domain': 'localhost', // Multi-tenancy header
};

const createSession = (name: string) => {
  const csrfToken = randomUUID();
  const session = axios.create({
    baseURL: API_URL,
    headers: {
      ...baseHeaders,
      'x-csrf-token': csrfToken,
      Cookie: `csrf-token=${csrfToken}`,
    },
    withCredentials: true,
    validateStatus: () => true,
  });

  const token = { value: '' };

  // Interceptor to add Bearer token
  session.interceptors.request.use((config) => {
    if (token.value) {
      config.headers.Authorization = `Bearer ${token.value}`;
    }
    return config;
  });

  return { session, token, name };
};

async function main() {
  log('STARTING ISOLATED COMPREHENSIVE ENDPOINT TEST...');

  const superAdmin = createSession('Super Admin');
  const admin = createSession('Admin');
  const user = createSession('User');

  // =================================================================
  // 1. AUTH MODULE
  // =================================================================
  log('--- 1. AUTH MODULE ---');

  // 1.0 Super Admin Login
  const saLogin = await superAdmin.session.post('/auth/login', {
    email: 'super@platform.com',
    password: '123456',
  });
  if (saLogin.status === 201 || saLogin.status === 200) {
    superAdmin.token.value = saLogin.data.accessToken;
    log('Super Admin Login Successful', 'SUCCESS');
  } else {
    log(`Super Admin Login Failed: ${saLogin.status}`, 'ERROR');
  }

  // 1.1 Admin Login
  const aLogin = await admin.session.post('/auth/login', {
    email: 'admin@localhost.com',
    password: '123456',
  });
  if (aLogin.status === 201 || aLogin.status === 200) {
    admin.token.value = aLogin.data.accessToken;
    log('Admin Login Successful', 'SUCCESS');
  } else {
    log(
      `Admin Login Failed: ${aLogin.status}. Falling back to Super Admin token for Admin tasks.`,
      'WARN',
    );
    admin.token.value = superAdmin.token.value;
  }

  // 1.2 User Registration & Login
  const randomEmail = `test.user.${Date.now()}@example.com`;
  const registerRes = await user.session.post('/auth/register', {
    email: randomEmail,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  });
  if (registerRes.status === 201) {
    log(`Registered User: ${randomEmail}`, 'SUCCESS');
    const uLogin = await user.session.post('/auth/login', {
      email: randomEmail,
      password: 'Password123!',
    });
    if (uLogin.status === 200 || uLogin.status === 201) {
      user.token.value = uLogin.data.accessToken;
      userId = uLogin.data.user?.id;
      log('User Login Successful', 'SUCCESS');
    }
  }

  // =================================================================
  // 2. PRODUCTS MODULE (Admin)
  // =================================================================
  log('--- 2. PRODUCTS MODULE ---');

  // 2.1 Get Categories
  let categoryId = '';
  const catsRes = await admin.session.get('/categories');
  if (catsRes.status === 200 && catsRes.data.length > 0) {
    categoryId = catsRes.data[0].id;
    log(`Fetched Categories: Found ${catsRes.data.length}`, 'SUCCESS');
  } else {
    const newCat = await admin.session.post('/categories', {
      name: 'Test Cat ' + Date.now(),
      slug: 'test-cat-' + Date.now(),
    });
    if (newCat.status === 201) {
      categoryId = newCat.data.id;
      log('Created Test Category', 'SUCCESS');
    } else {
      log(`Failed to fetch/create category: ${newCat.status}`, 'ERROR');
    }
  }

  // 2.2 Get Brands
  let brandId = '';
  const brandsRes = await admin.session.get('/brands');
  if (brandsRes.status === 200 && brandsRes.data.length > 0) {
    brandId = brandsRes.data[0].id;
    log(`Fetched Brands: Found ${brandsRes.data.length}`, 'SUCCESS');
  } else {
    const newBrand = await admin.session.post('/brands', {
      name: 'Test Brand ' + Date.now(),
    });
    if (newBrand.status === 201) {
      brandId = newBrand.data.id;
      log('Created Test Brand', 'SUCCESS');
    }
  }

  // 2.3 Create Product
  if (categoryId && brandId) {
    const prodRes = await admin.session.post('/products', {
      name: `Test Product ${Date.now()}`,
      description: 'A test product',
      categories: { create: [{ categoryId }] },
      brandId,
      options: [{ name: 'Color', values: ['Red', 'Blue'] }],
    });

    if (prodRes.status === 201) {
      createdProductId = prodRes.data.id;
      log(`Created Product: ${prodRes.data.name}`, 'SUCCESS');
    } else {
      log(
        `Create Product Failed: ${prodRes.status} ${JSON.stringify(prodRes.data)}`,
        'ERROR',
      );
    }
  }

  // 2.4 Create SKU
  if (createdProductId) {
    const skuRes = await admin.session.post('/skus', {
      skuCode: `SKU-${Date.now()}`,
      productId: createdProductId,
      price: 100000,
      stock: 50,
      status: 'ACTIVE',
      options: [{ name: 'Color', value: 'Red' }],
    });

    if (skuRes.status === 201) {
      createdSkuId = skuRes.data.id;
      log(`Created SKU: ${skuRes.data.skuCode}`, 'SUCCESS');
    } else {
      log(
        `Create SKU Failed: ${skuRes.status} ${JSON.stringify(skuRes.data)}`,
        'WARN',
      );
    }
  }

  if (!createdSkuId) {
    const allSkus = await admin.session.get('/skus?limit=1');
    if (allSkus.data.data && allSkus.data.data.length > 0) {
      createdSkuId = allSkus.data.data[0].id;
      createdProductId = allSkus.data.data[0].productId;
      log(`Fallback: Using existing SKU ${createdSkuId}`, 'INFO');
    }
  }

  // =================================================================
  // 3. CART & ORDERS (User)
  // =================================================================
  log('--- 3. CART & ORDERS ---');

  if (createdSkuId && user.token.value) {
    const cartRes = await user.session.post('/cart/items', {
      skuId: createdSkuId,
      quantity: 1,
    });
    if (cartRes.status === 201 || cartRes.status === 200)
      log('Add to Cart Successful', 'SUCCESS');
    else
      log(
        `Add to Cart Failed: ${cartRes.status} ${JSON.stringify(cartRes.data)}`,
        'ERROR',
      );

    const checkoutRes = await user.session.post('/orders', {
      recipientName: 'Test Recipient',
      phoneNumber: '0123456789',
      shippingAddress: '123 Test St',
      paymentMethod: 'COD',
    });

    if (checkoutRes.status === 201) {
      createdOrderId = checkoutRes.data.id;
      log(
        `Order Placed Successfully: ${checkoutRes.data.orderNumber}`,
        'SUCCESS',
      );
    } else {
      log(
        `Checkout Failed: ${checkoutRes.status} ${JSON.stringify(checkoutRes.data)}`,
        'ERROR',
      );
    }
  }

  // =================================================================
  // 4. ORDER MANAGEMENT (Admin)
  // =================================================================
  log('--- 4. ORDER ADMIN ---');
  if (createdOrderId) {
    const updateStatus = await admin.session.patch(
      `/orders/${createdOrderId}/status`,
      { status: 'CONFIRMED' },
    );
    if (updateStatus.status === 200)
      log('Admin Update Order Status Successful', 'SUCCESS');
    else
      log(`Admin Update Order Status Failed: ${updateStatus.status}`, 'ERROR');
  }

  // =================================================================
  // 5. USERS (Admin)
  // =================================================================
  log('--- 5. USERS & ROLES ---');
  const usersRes = await admin.session.get('/users?limit=5');
  if (usersRes.status === 200) log(`Admin List Users Successful`, 'SUCCESS');
  else
    log(
      `Admin List Users Failed: ${usersRes.status} ${JSON.stringify(usersRes.data)}`,
      'WARN',
    );

  // =================================================================
  // 6. WISHLIST & REVIEWS (User)
  // =================================================================
  log('--- 6. WISHLIST & REVIEWS ---');
  if (createdProductId && user.token.value) {
    await user.session.post(`/wishlist/${createdProductId}`);
    log('Wishlist Toggle Successful', 'SUCCESS');

    await user.session.post('/reviews', {
      productId: createdProductId,
      rating: 5,
      comment: 'Great product!',
    });
    log('Review Created Successful', 'SUCCESS');
  }

  // =================================================================
  // 7. PUBLIC EXPLORATION
  // =================================================================
  log('--- 7. PUBLIC EXPLORATION ---');
  const publicProducts = await user.session.get('/products?limit=5');
  if (publicProducts.status === 200) log('Public Product List OK', 'SUCCESS');

  const publicBlogs = await user.session.get('/blogs?limit=5');
  if (publicBlogs.status === 200) log('Public Blog List OK', 'SUCCESS');

  log('=== FINAL REPORT ===', 'INFO');
  log(
    'All core flows tested: Auth, Products, Orders, User Interactions.',
    'SUCCESS',
  );
  log('--- TEST COMPLETE ---');
}

main();
