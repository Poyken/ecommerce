import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:8080/api/v1';

async function runSimulation() {
  console.log('🚀 Starting Full Flow Simulation (User + Admin)...');

  // CSRF Setup (Double Submit Cookie Pattern)
  const csrfToken = randomUUID();
  const headers: Record<string, string> = {
    'x-csrf-token': csrfToken,
    Cookie: `csrf-token=${csrfToken}`,
  };

  const axiosInstance = axios.create({
    baseURL: API_URL,
    headers: headers,
    withCredentials: true,
  });

  // Random User
  const timestamp = Date.now();
  const userEmail = `testuser_${timestamp}@example.com`;
  const userPass = 'Password123!';
  let userToken = '';

  // 1. Register
  try {
    console.log(`\n1️⃣  Registering User: ${userEmail}`);
    await axiosInstance.post(`/auth/register`, {
      email: userEmail,
      password: userPass,
      firstName: 'Test',
      lastName: 'User',
    });
    console.log('✅ Registration Successful');
  } catch (err: any) {
    console.error('❌ Registration Failed:', err.response?.data || err.message);
    return;
  }

  // 2. Login
  try {
    console.log(`\n2️⃣  Logging in...`);
    const loginRes = await axiosInstance.post(`/auth/login`, {
      email: userEmail,
      password: userPass,
    });
    userToken = loginRes.data.accessToken;
    console.log('✅ Login Successful. Token acquired.');
  } catch (err: any) {
    console.error('❌ Login Failed:', err.response?.data || err.message);
    return;
  }

  // Auth Header for subsequent requests
  const authHeaders = { ...headers, Authorization: `Bearer ${userToken}` };

  // 3. Get Products (to find a SKU)
  let skuId = '';
  try {
    console.log(`\n3️⃣  Browsing Products...`);
    const prodRes = await axiosInstance.get(`/products`);
    const products = prodRes.data.data;

    if (products && products.length > 0) {
      const firstProdId = products[0].id;
      const detailRes = await axiosInstance.get(`/products/${firstProdId}`);
      const product = detailRes.data;
      if (product.skus && product.skus.length > 0) {
        skuId = product.skus[0].id;
        console.log(
          `✅ Found Product: ${product.name}, SKU: ${product.skus[0].skuCode}`,
        );
      }
    }
  } catch (err: any) {
    console.error('❌ Fetch Products Failed:', err.message);
  }

  // 4. Add to Cart
  if (skuId) {
    try {
      console.log(`\n4️⃣  Adding to Cart...`);
      await axiosInstance.post(
        `/cart/items`,
        {
          skuId: skuId,
          quantity: 1,
        },
        { headers: authHeaders },
      );
      console.log('✅ Added to Cart');
    } catch (err: any) {
      console.error(
        '❌ Add to Cart Failed:',
        err.response?.data || err.message,
      );
    }

    // 5. Checkout (Create Order)
    try {
      console.log(`\n5️⃣  Checking Out...`);
      // Note: Creating order typically clears the cart items associated with the user
      const orderRes = await axiosInstance.post(
        `/orders`,
        {
          recipientName: 'Test User',
          phoneNumber: '0901234567',
          shippingAddress: '123 Test Street, Test City',
          paymentMethod: 'COD',
        },
        { headers: authHeaders },
      );
      console.log(
        `✅ Order Placed! Order ID: ${orderRes.data.id} - Status: ${orderRes.data.orderNumber} (${orderRes.data.status})`,
      );
    } catch (err: any) {
      console.error('❌ Checkout Failed:', err.response?.data || err.message);
    }
  }

  // 6. Admin Check
  try {
    console.log(`\n6️⃣  Admin Verification...`);
    const adminLogin = await axiosInstance.post(`/auth/login`, {
      email: 'admin@example.com',
      password: '123456',
    });
    const adminToken = adminLogin.data.accessToken;

    const ordersRes = await axiosInstance.get(`/orders`, {
      headers: { ...headers, Authorization: `Bearer ${adminToken}` },
    });

    console.log(
      `✅ Admin Orders Fetch Success. Total Orders in System: ${ordersRes.data.meta?.total || ordersRes.data.data?.length || 'Unknown'}`,
    );
  } catch (err: any) {
    console.error('❌ Admin verification failed:', err.message);
  }
}

runSimulation();
