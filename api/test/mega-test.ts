import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://127.0.0.1:8080/api/v1';

// Utilities (No Emojis)
const log = (msg: string, type: string = 'INFO') => {
  console.log(`[${type}] ${msg}`);
};

// Global State
let adminToken = '';
let userToken = '';
let userId = '';
let createdProductId = '';
let createdSkuId = '';
let createdOrderId = '';

// Configure Axios
const csrfToken = randomUUID();
const baseHeaders = {
  'x-csrf-token': csrfToken,
  Cookie: `csrf-token=${csrfToken}`,
  'Content-Type': 'application/json',
};

const api = axios.create({
  baseURL: API_URL,
  headers: baseHeaders,
  withCredentials: true,
  validateStatus: () => true,
});

async function main() {
  log('STARTING COMPREHENSIVE ENDPOINT TEST...');

  // =================================================================
  // 1. AUTH MODULE
  // =================================================================
  log('--- 1. AUTH MODULE ---');

  // 1.1 Login Admin
  try {
    const adminLogin = await api.post('/auth/login', {
      email: 'admin@example.com',
      password: '123456',
    });
    if (adminLogin.status === 201 || adminLogin.status === 200) {
      adminToken = adminLogin.data.accessToken;
      log('Admin Login Successful', 'SUCCESS');
    } else {
      log(`Admin Login Failed: ${adminLogin.status}`, 'ERROR');
      return;
    }
  } catch (e: any) {
    log(`Admin Login Error: ${e.message}`, 'ERROR');
    return;
  }

  // 1.2 Register User
  const randomEmail = `test.user.${Date.now()}@example.com`;
  const registerRes = await api.post('/auth/register', {
    email: randomEmail,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'User',
  });
  if (registerRes.status === 201) {
    log(`Registered User: ${randomEmail}`, 'SUCCESS');
  } else {
    log(
      `Register Failed: ${registerRes.status} - ${JSON.stringify(registerRes.data)}`,
      'ERROR',
    );
  }

  // 1.3 Login User
  const userLogin = await api.post('/auth/login', {
    email: randomEmail,
    password: 'Password123!',
  });
  if (userLogin.status === 200 || userLogin.status === 201) {
    userToken = userLogin.data.accessToken;
    userId = userLogin.data.user?.id;
    log('User Login Successful', 'SUCCESS');
  } else {
    log(`User Login Failed: ${userLogin.status}`, 'ERROR');
  }

  // 1.4 Get Profile
  if (userToken) {
    const profileRes = await api.get('/auth/me', {
      headers: { ...baseHeaders, Authorization: `Bearer ${userToken}` },
    });
    if (profileRes.status === 200) log('Get Profile (Me) Works', 'SUCCESS');
    else log(`Get Profile Failed: ${profileRes.status}`, 'ERROR');
  }

  // =================================================================
  // 2. PRODUCTS MODULE (Admin)
  // =================================================================
  log('--- 2. PRODUCTS MODULE ---');
  const adminHeaders = {
    ...baseHeaders,
    Authorization: `Bearer ${adminToken}`,
  };

  // 2.1 Get Categories
  let categoryId = '';
  const catsRes = await api.get('/categories', { headers: adminHeaders });
  if (catsRes.status === 200 && catsRes.data.length > 0) {
    categoryId = catsRes.data[0].id;
    log(`Fetched Categories: Found ${catsRes.data.length}`, 'SUCCESS');
  } else {
    const newCat = await api.post(
      '/categories',
      { name: 'Test Cat ' + Date.now(), slug: 'test-cat-' + Date.now() },
      { headers: adminHeaders },
    );
    if (newCat.status === 201) {
      categoryId = newCat.data.id;
      log('Created Test Category', 'SUCCESS');
    }
  }

  // 2.2 Get Brands
  let brandId = '';
  const brandsRes = await api.get('/brands', { headers: adminHeaders });
  if (brandsRes.status === 200 && brandsRes.data.length > 0) {
    brandId = brandsRes.data[0].id;
    log(`Fetched Brands: Found ${brandsRes.data.length}`, 'SUCCESS');
  } else {
    const newBrand = await api.post(
      '/brands',
      { name: 'Test Brand ' + Date.now() },
      { headers: adminHeaders },
    );
    if (newBrand.status === 201) {
      brandId = newBrand.data.id;
      log('Created Test Brand', 'SUCCESS');
    }
  }

  // 2.3 Create Product
  if (categoryId && brandId) {
    const prodRes = await api.post(
      '/products',
      {
        name: `Test Product ${Date.now()}`,
        description: 'A test product',
        categoryId,
        brandId,
        options: [{ name: 'Color', values: ['Red'] }],
      },
      { headers: adminHeaders },
    );

    if (prodRes.status === 201) {
      createdProductId = prodRes.data.id;
      log(`Created Product: ${prodRes.data.name}`, 'SUCCESS');
    } else {
      log(`Create Product Failed: ${prodRes.status}`, 'ERROR');
    }
  }

  // 2.4 Create SKU
  if (createdProductId) {
    const skuRes = await api.post(
      '/skus',
      {
        skuCode: `SKU-${Date.now()}`,
        productId: createdProductId,
        price: 100000,
        stock: 50,
        status: 'ACTIVE',
      },
      { headers: adminHeaders },
    );

    if (skuRes.status === 201) {
      createdSkuId = skuRes.data.id;
      log(`Created SKU: ${skuRes.data.skuCode}`, 'SUCCESS');
    } else {
      // Fallback
      log(`Create SKU Failed: ${skuRes.status}`, 'WARN');
    }
  }

  if (!createdSkuId) {
    const allSkus = await api.get('/skus?limit=1', { headers: adminHeaders });
    if (allSkus.data.data && allSkus.data.data.length > 0) {
      createdSkuId = allSkus.data.data[0].id;
      log(`Fallback: Using existing SKU ${createdSkuId}`, 'INFO');
    }
  }

  // =================================================================
  // 3. CART & ORDERS (User)
  // =================================================================
  log('--- 3. CART & ORDERS ---');
  const userHeaders = { ...baseHeaders, Authorization: `Bearer ${userToken}` };

  if (createdSkuId && userToken) {
    const cartRes = await api.post(
      '/cart/items',
      { skuId: createdSkuId, quantity: 2 },
      { headers: userHeaders },
    );
    if (cartRes.status === 201 || cartRes.status === 200)
      log('Add to Cart Successful', 'SUCCESS');
    else log(`Add to Cart Failed: ${cartRes.status}`, 'ERROR');

    const getCartRes = await api.get('/cart', { headers: userHeaders });
    if (getCartRes.status === 200) log(`Get Cart Successful`, 'SUCCESS');

    const checkoutRes = await api.post(
      '/orders',
      {
        recipientName: 'Test Recipient',
        phoneNumber: '0123456789',
        shippingAddress: '123 Test St',
        paymentMethod: 'COD',
      },
      { headers: userHeaders },
    );

    if (checkoutRes.status === 201) {
      createdOrderId = checkoutRes.data.id;
      log(`Order Placed Successfully`, 'SUCCESS');
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
    const updateStatus = await api.patch(
      `/orders/${createdOrderId}/status`,
      { status: 'CONFIRMED' },
      { headers: adminHeaders },
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
  const usersRes = await api.get('/users?limit=5', { headers: adminHeaders });
  if (usersRes.status === 200) log(`Admin List Users Successful`, 'SUCCESS');
  else log(`Admin List Users Failed: ${usersRes.status}`, 'ERROR');

  log('--- TEST COMPLETE ---');
}

main();
