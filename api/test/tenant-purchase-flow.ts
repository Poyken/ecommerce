import axios from 'axios';
import { randomUUID } from 'crypto';

const TENANT_DOMAIN = 'demoshop2026.localhost';
const API_URL = 'http://localhost:8080/api/v1';
const HEADERS = {
  'x-tenant-domain': TENANT_DOMAIN,
  'Content-Type': 'application/json',
};

const LOG_PREFIX = `[${TENANT_DOMAIN}]`;

async function runTest() {
  console.log(`${LOG_PREFIX} 🚀 STARTING CUSTOMER PURCHASE FLOW...`);

  try {
    // 1. Check Products
    console.log(`${LOG_PREFIX} 1. Fetching products...`);
    const prodsRes = await axios.get(`${API_URL}/products`, {
      headers: HEADERS,
    });
    const product = prodsRes.data.data?.[0];

    if (!product) {
      throw new Error('No products found on tenant!');
    }
    console.log(
      `${LOG_PREFIX}    ✅ Found product: ${product.name} (${product.minPrice} VND)`,
    );
    console.log(`${LOG_PREFIX}       SKU ID: ${product.skus[0].id}`);

    const skuId = product.skus[0].id;

    // 2. Register Customer
    const customerEmail = `customer.${randomUUID().substring(0, 8)}@example.com`;
    const customerPass = 'Password123!';
    console.log(`${LOG_PREFIX} 2. Registering customer: ${customerEmail}`);

    await axios.post(
      `${API_URL}/auth/register`,
      {
        email: customerEmail,
        password: customerPass,
        firstName: 'Test',
        lastName: 'Buyer',
      },
      { headers: HEADERS },
    );

    // 3. Login
    console.log(`${LOG_PREFIX} 3. Logging in...`);
    const loginRes = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: customerEmail,
        password: customerPass,
      },
      { headers: HEADERS },
    );

    const token = loginRes.data.data.accessToken;
    const authHeaders = { ...HEADERS, Authorization: `Bearer ${token}` };
    console.log(`${LOG_PREFIX}    ✅ Logged in successfully`);

    // 4. Add to Cart
    console.log(`${LOG_PREFIX} 4. Adding to cart...`);
    await axios.post(
      `${API_URL}/cart/items`,
      {
        skuId: skuId,
        quantity: 2,
      },
      { headers: authHeaders },
    );
    console.log(`${LOG_PREFIX}    ✅ Added 2 items to cart`);

    // 5. Checkout
    console.log(`${LOG_PREFIX} 5. Checking out...`);
    const orderRes = await axios.post(
      `${API_URL}/orders`,
      {
        recipientName: 'Test Buyer',
        phoneNumber: '0900000000',
        shippingAddress: '123 Tenant Street, SaaS City',
        paymentMethod: 'COD',
      },
      { headers: authHeaders },
    );

    const orderId = orderRes.data.data.id;
    console.log(
      `${LOG_PREFIX}    🎉 ORDER PLACED SUCCESSFULLY! ID: ${orderId}`,
    );
    console.log(
      `${LOG_PREFIX}       Total: ${orderRes.data.data.totalAmount} VND`,
    );

    // 6. Verify Tenant Admin sees the order
    console.log(`${LOG_PREFIX} 6. Verifying Order in Admin Panel...`);
    // Login as Admin
    const adminRes = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'admin2026@example.com',
        password: 'Password123!',
      },
      { headers: HEADERS },
    );

    const adminToken = adminRes.data.data.accessToken;
    const adminHeaders = { ...HEADERS, Authorization: `Bearer ${adminToken}` };

    const adminOrderRes = await axios.get(`${API_URL}/orders/${orderId}`, {
      headers: adminHeaders,
    });

    if (adminOrderRes.data.data.id === orderId) {
      console.log(`${LOG_PREFIX}    ✅ Admin verified order exists.`);
    } else {
      console.error(`${LOG_PREFIX}    ❌ Admin CANNOT find order!`);
    }
  } catch (error: any) {
    console.error(
      `${LOG_PREFIX} ❌ TEST FAILED:`,
      error.response?.data || error.message,
    );
    process.exit(1);
  }
}

runTest();
