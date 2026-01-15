import axios from 'axios';
import { randomBytes } from 'crypto';

const API_URL = 'http://localhost:8080/api';
// Use a unique email for each run to avoid "User already exists"
const UNIQUE_ID = randomBytes(4).toString('hex');
const TEST_USER = {
  email: `test.shopper.${UNIQUE_ID}@example.com`,
  password: 'Password123!',
  firstName: 'Happy',
  lastName: 'Shopper',
  phone: '0987654321',
};

const LOG_PREFIX = `[HappyPath-${UNIQUE_ID}]`;

async function main() {
  console.log(`${LOG_PREFIX} 🚀 Starting Happy Path Flow Test...`);
  console.log(`${LOG_PREFIX} Target: ${API_URL}`);

  let accessToken = '';
  let productId = '';
  let skuId = '';
  const cartId = '';

  // 1. Register User
  try {
    console.log(`${LOG_PREFIX} 1. Registering user: ${TEST_USER.email}`);
    const res = await axios.post(`${API_URL}/v1/auth/register`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
      firstName: TEST_USER.firstName,
      lastName: TEST_USER.lastName,
      // phoneNumber: TEST_USER.phone, // Removed as not in DTO
    });
    console.log(`${LOG_PREFIX} ✅ Registered successfully.`);
  } catch (error: any) {
    console.error(
      `${LOG_PREFIX} ❌ Register Failed:`,
      error.response?.data || error.message,
    );
    process.exit(1);
  }

  // 2. Login
  try {
    console.log(`${LOG_PREFIX} 2. Logging in...`);
    const res = await axios.post(`${API_URL}/v1/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    accessToken = res.data.data.accessToken;
    console.log(
      `${LOG_PREFIX} ✅ Logged in. Token length: ${accessToken.length}`,
    );
  } catch (error: any) {
    console.error(
      `${LOG_PREFIX} ❌ Login Failed:`,
      error.response?.data || error.message,
    );
    process.exit(1);
  }

  const authHeaders = { headers: { Authorization: `Bearer ${accessToken}` } };

  // 3. Search/List Products
  try {
    console.log(`${LOG_PREFIX} 3. Searching for products...`);
    const res = await axios.get(`${API_URL}/v1/products?limit=1`, {
      ...authHeaders,
    } as any); // Public but verify auth works too
    const products = res.data.data;
    if (products.length === 0) {
      console.error(`${LOG_PREFIX} ❌ No products found. Please seed data.`);
      process.exit(1);
    }
    const product = products[0];
    productId = product.id;
    console.log(
      `${LOG_PREFIX} ✅ Found product: ${product.name} (${product.id})`,
    );

    // Get SKU (Assuming product has skus or we fetch details)
    // Fetch detail to get SKUs
    const detailRes = await axios.get(`${API_URL}/v1/products/${product.id}`, {
      ...authHeaders,
    } as any);
    const fullProduct = detailRes.data.data;
    if (fullProduct.skus && fullProduct.skus.length > 0) {
      skuId = fullProduct.skus[0].id;
      console.log(
        `${LOG_PREFIX} ✅ Selected SKU: ${fullProduct.skus[0].skuCode} (${skuId})`,
      );
    } else {
      console.error(`${LOG_PREFIX} ❌ Product has no SKUs.`);
      process.exit(1);
    }
  } catch (error: any) {
    console.error(
      `${LOG_PREFIX} ❌ Product Search Failed:`,
      error.response?.data || error.message,
    );
    process.exit(1);
  }

  // 4. Add to Cart
  try {
    console.log(`${LOG_PREFIX} 4. Adding to Cart...`);
    const res = await axios.post(
      `${API_URL}/v1/cart`,
      {
        skuId: skuId,
        quantity: 1,
      },
      authHeaders,
    );
    console.log(`${LOG_PREFIX} ✅ Added to cart.`);
  } catch (error: any) {
    console.error(
      `${LOG_PREFIX} ❌ Add to Cart Failed:`,
      error.response?.data || error.message,
    );
    process.exit(1);
  }

  // 5. Checkout (Create Order)
  try {
    console.log(`${LOG_PREFIX} 5. Checking out (COD)...`);
    const orderPayload = {
      recipientName: TEST_USER.firstName + ' ' + TEST_USER.lastName,
      phoneNumber: TEST_USER.phone,
      shippingAddress: '123 Test Street, Developer City',
      shippingCity: 'Hanoi',
      shippingDistrict: 'Ba Dinh',
      shippingWard: 'Kim Ma',
      paymentMethod: 'COD',
      // itemIds: [] // Optional: checkout all
    };

    const res = await axios.post(
      `${API_URL}/v1/orders`,
      orderPayload,
      authHeaders,
    );
    const order = res.data.data;
    console.log(`${LOG_PREFIX} ✅ Order Created! ID: ${order.id}`);
    console.log(`${LOG_PREFIX}    Status: ${order.status}`);
    console.log(`${LOG_PREFIX}    Total: ${order.totalAmount}`);

    if (order.status !== 'PENDING') {
      console.warn(
        `${LOG_PREFIX} ⚠️ Expected status PENDING, got ${order.status}`,
      );
    }
  } catch (error: any) {
    console.error(
      `${LOG_PREFIX} ❌ Checkout Failed:`,
      error.response?.data || error.message,
    );
    process.exit(1);
  }

  console.log(`${LOG_PREFIX} 🎉 Happy Path Test Completed Successfully!`);
}

main();
