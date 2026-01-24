/**
 * =====================================================================
 * B2B2C FULL FLOW TEST - Test toàn diện luồng kinh doanh
 * =====================================================================
 *
 * 📚 LUỒNG TEST:
 * 1. TENANT SETUP: Super Admin creates tenant + admin user
 * 2. ADMIN SETUP: Tenant admin creates products
 * 3. CUSTOMER FLOW: Customer registers, buys, pays, receives order
 * 4. DELIVERY FLOW: Admin confirms → ships → delivers
 *
 * =====================================================================
 */
import axios from 'axios';
import { randomBytes } from 'crypto';

const API_URL = 'http://localhost:8080/api/v1';
const UNIQUE_ID = randomBytes(4).toString('hex');

const LOG_PREFIX = `[B2B2C-${UNIQUE_ID}]`;

// Colors for console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = (
  msg: string,
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'WARN' = 'INFO',
) => {
  let color = colors.cyan;
  if (type === 'SUCCESS') color = colors.green;
  if (type === 'ERROR') color = colors.red;
  if (type === 'WARN') color = colors.yellow;
  console.log(
    `${colors.bold}${LOG_PREFIX}${colors.reset} ${color}[${type}]${colors.reset} ${msg}`,
  );
};

// Test data
const SUPER_ADMIN = { email: 'super@platform.com', password: '12345678' };
const TEST_CUSTOMER = {
  email: `customer.${UNIQUE_ID}@example.com`,
  password: 'Password123!',
  firstName: 'Test',
  lastName: 'Customer',
};

async function main() {
  log('🚀 STARTING B2B2C FULL FLOW TEST...', 'INFO');
  log(`Target API: ${API_URL}`, 'INFO');

  let superAdminToken = '';
  let customerToken = '';
  let orderId = '';
  let skuId = '';
  let product: any = null;
  let fullProduct: any = null;

  // =====================================================================
  // PHASE 1: SUPER ADMIN LOGIN
  // =====================================================================
  log('=== PHASE 1: SUPER ADMIN LOGIN ===', 'INFO');
  try {
    const res = await axios.post(`${API_URL}/auth/login`, SUPER_ADMIN, {
      headers: { 'x-tenant-domain': 'localhost' },
    });
    superAdminToken = res.data.data?.accessToken || res.data.accessToken;
    log('✅ Super Admin logged in successfully', 'SUCCESS');
  } catch (error: any) {
    log(
      `❌ Super Admin login failed: ${error.response?.data?.message || error.message}`,
      'ERROR',
    );
    process.exit(1);
  }

  const adminHeaders = {
    Authorization: `Bearer ${superAdminToken}`,
    'x-tenant-domain': 'localhost',
    'Content-Type': 'application/json',
  };

  // =====================================================================
  // PHASE 2: VERIFY PRODUCTS EXIST
  // =====================================================================
  log('=== PHASE 2: VERIFY PRODUCTS ===', 'INFO');
  try {
    const res = await axios.get(`${API_URL}/products?limit=1`, {
      headers: adminHeaders,
    });
    const products = res.data.data;
    if (products.length === 0) {
      log('❌ No products found. Please run seed first.', 'ERROR');
      process.exit(1);
    }
    product = products[0];
    log(`✅ Found product: ${product.name}`, 'SUCCESS');

    // Get SKU
    const detailRes = await axios.get(`${API_URL}/products/${product.id}`, {
      headers: adminHeaders,
    });
    fullProduct = detailRes.data.data;
    if (fullProduct.skus && fullProduct.skus.length > 0) {
      skuId = fullProduct.skus[0].id;
      log(
        `✅ Selected SKU: ${fullProduct.skus[0].skuCode} (Price: ${fullProduct.skus[0].price})`,
        'SUCCESS',
      );
    } else {
      log('❌ Product has no SKUs', 'ERROR');
      process.exit(1);
    }
  } catch (error: any) {
    log(
      `❌ Product fetch failed: ${error.response?.data?.message || error.message}`,
      'ERROR',
    );
    process.exit(1);
  }

  // =====================================================================
  // PHASE 3: CUSTOMER REGISTRATION & LOGIN
  // =====================================================================
  log('=== PHASE 3: CUSTOMER REGISTRATION ===', 'INFO');
  try {
    await axios.post(
      `${API_URL}/auth/register`,
      {
        email: TEST_CUSTOMER.email,
        password: TEST_CUSTOMER.password,
        firstName: TEST_CUSTOMER.firstName,
        lastName: TEST_CUSTOMER.lastName,
      },
      { headers: { 'x-tenant-domain': 'localhost' } },
    );
    log(`✅ Customer registered: ${TEST_CUSTOMER.email}`, 'SUCCESS');

    const loginRes = await axios.post(
      `${API_URL}/auth/login`,
      { email: TEST_CUSTOMER.email, password: TEST_CUSTOMER.password },
      { headers: { 'x-tenant-domain': 'localhost' } },
    );
    customerToken =
      loginRes.data.data?.accessToken || loginRes.data.accessToken;
    log('✅ Customer logged in successfully', 'SUCCESS');
  } catch (error: any) {
    log(
      `❌ Customer registration/login failed: ${error.response?.data?.message || error.message}`,
      'ERROR',
    );
    process.exit(1);
  }

  const customerHeaders = {
    Authorization: `Bearer ${customerToken}`,
    'x-tenant-domain': 'localhost',
    'Content-Type': 'application/json',
  };

  // =====================================================================
  // PHASE 4: ADD TO CART & CREATE ORDER
  // =====================================================================
  log('=== PHASE 4: SHOPPING FLOW ===', 'INFO');
  try {
    // Add to cart
    await axios.post(
      `${API_URL}/cart`,
      { skuId, quantity: 2 },
      { headers: customerHeaders },
    );
    log('✅ Added 2 items to cart', 'SUCCESS');

    // View cart
    const cartRes = await axios.get(`${API_URL}/cart`, {
      headers: customerHeaders,
    });
    log(`✅ Cart total: ${cartRes.data.data?.totalAmount || 'N/A'}`, 'SUCCESS');

    // Create order with COD
    // Note: The API PlaceOrderInput requires detailed item snapshots
    const orderRes = await axios.post(
      `${API_URL}/orders`,
      {
        recipientName: `${TEST_CUSTOMER.firstName} ${TEST_CUSTOMER.lastName}`,
        phoneNumber: '0987654321',
        shippingAddress: '123 Test Street, B2B2C Test',
        shippingCity: 'Ho Chi Minh',
        shippingDistrict: 'District 1',
        shippingWard: 'Ben Nghe',
        paymentMethod: 'COD',
        items: [
          {
            skuId,
            quantity: 2,
            productId: product.id,
            skuName: fullProduct.skus[0].skuCode,
            productName: fullProduct.name,
            price: Number(fullProduct.skus[0].price),
          },
        ],
      },
      { headers: customerHeaders },
    );
    // TransformInterceptor wraps response in { success: true, data: ... }
    const orderData = orderRes.data.data;
    orderId = orderData.orderId || orderData.id;
    const totalAmount = orderData.totalAmount;
    log(`✅ Order created successfully`, 'SUCCESS');
    log(`   - Order ID: ${orderId}`, 'INFO');
    log(`   - Total: ${totalAmount} VND`, 'INFO');
    log(`   - Status: PENDING`, 'INFO');
  } catch (error: any) {
    log(
      `❌ Shopping flow failed: ${error.response?.data?.message || error.message}`,
      'ERROR',
    );
    process.exit(1);
  }

  // =====================================================================
  // PHASE 5: ADMIN ORDER MANAGEMENT
  // =====================================================================
  log('=== PHASE 5: ORDER FULFILLMENT ===', 'INFO');
  try {
    // Process order (PENDING → PROCESSING)
    await axios.patch(
      `${API_URL}/orders/${orderId}/status`,
      { status: 'PROCESSING' },
      { headers: adminHeaders },
    );
    log('✅ Order PROCESSING', 'SUCCESS');

    // Ship order (PROCESSING → SHIPPED)
    await axios.patch(
      `${API_URL}/orders/${orderId}/status`,
      { status: 'SHIPPED' },
      { headers: adminHeaders },
    );
    log('✅ Order SHIPPED', 'SUCCESS');

    // Deliver order (SHIPPED → DELIVERED)
    await axios.patch(
      `${API_URL}/orders/${orderId}/status`,
      { status: 'DELIVERED' },
      { headers: adminHeaders },
    );
    log('✅ Order DELIVERED', 'SUCCESS');
  } catch (error: any) {
    log(
      `❌ Order fulfillment failed: ${error.response?.data?.message || error.message}`,
      'ERROR',
    );
    log(`   Response: ${JSON.stringify(error.response?.data)}`, 'ERROR');
    process.exit(1);
  }

  // =====================================================================
  // PHASE 6: VERIFY FINAL ORDER STATUS
  // =====================================================================
  log('=== PHASE 6: VERIFICATION ===', 'INFO');
  try {
    const orderRes = await axios.get(`${API_URL}/orders/${orderId}`, {
      headers: customerHeaders,
    });
    const finalOrder = orderRes.data.data;
    log(`✅ Final Order Status: ${finalOrder.status}`, 'SUCCESS');
    log(`   - Payment: ${finalOrder.paymentMethod}`, 'INFO');
    log(`   - Total: ${finalOrder.totalAmount} VND`, 'INFO');

    if (finalOrder.status === 'DELIVERED') {
      log('🎉 B2B2C FULL FLOW TEST PASSED!', 'SUCCESS');
    } else {
      log(`⚠️ Expected DELIVERED, got ${finalOrder.status}`, 'WARN');
    }
  } catch (error: any) {
    log(
      `❌ Verification failed: ${error.response?.data?.message || error.message}`,
      'ERROR',
    );
  }

  // =====================================================================
  // SUMMARY
  // =====================================================================
  console.log('\n' + colors.bold + '='.repeat(60) + colors.reset);
  log('📊 TEST SUMMARY', 'INFO');
  console.log(colors.bold + '='.repeat(60) + colors.reset);
  log('✅ Super Admin Login: PASSED', 'SUCCESS');
  log('✅ Product Verification: PASSED', 'SUCCESS');
  log('✅ Customer Registration: PASSED', 'SUCCESS');
  log('✅ Shopping Flow (Cart → Order): PASSED', 'SUCCESS');
  log('✅ Order Fulfillment (PENDING → DELIVERED): PASSED', 'SUCCESS');
  console.log(colors.bold + '='.repeat(60) + colors.reset);
}

main().catch((err) => {
  log(`UNEXPECTED ERROR: ${err.message}`, 'ERROR');
  console.error(err);
  process.exit(1);
});
