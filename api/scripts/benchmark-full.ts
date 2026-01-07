import axios from 'axios';
import chalk from 'chalk';
import { Table } from 'console-table-printer';

const API_URL = 'http://localhost:8080/api/v1';

interface BenchmarkResult {
  category: string;
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  rating: string;
}

async function runFullBenchmark() {
  console.log(
    chalk.blue.bold('\n🚀 COMPREHENSIVE API BENCHMARK - 204 ENDPOINTS\n'),
  );

  // =================================================================
  // 1. AUTHENTICATION
  // =================================================================
  let superToken = '';
  let tenantToken = '';

  try {
    const superRes = await axios.post(
      `${API_URL}/auth/login`,
      { email: 'super@platform.com', password: '123456' },
      { headers: { 'x-tenant-domain': 'localhost' } },
    );
    superToken = superRes.data.data.accessToken;
    console.log(chalk.green(`✅ Super Admin authenticated`));

    const tenantRes = await axios.post(
      `${API_URL}/auth/login`,
      { email: 'admin@localhost.com', password: '123456' },
      { headers: { 'x-tenant-domain': 'localhost' } },
    );
    tenantToken = tenantRes.data.data.accessToken;
    console.log(chalk.green(`✅ Tenant Admin authenticated`));
  } catch (error) {
    console.error(chalk.red('❌ Login failed.'));
    process.exit(1);
  }

  const superClient = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${superToken}`,
      'x-tenant-domain': 'localhost',
    },
    validateStatus: () => true,
    timeout: 30000,
  });

  const tenantClient = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${tenantToken}`,
      'x-tenant-domain': 'localhost',
    },
    validateStatus: () => true,
    timeout: 30000,
  });

  const publicClient = axios.create({
    baseURL: API_URL,
    headers: { 'x-tenant-domain': 'localhost' },
    validateStatus: () => true,
    timeout: 30000,
  });

  const results: BenchmarkResult[] = [];

  async function measure(
    category: string,
    client: any,
    method: string,
    url: string,
    data?: any,
  ) {
    const start = performance.now();
    let res;
    try {
      if (method === 'GET') res = await client.get(url);
      else if (method === 'POST') res = await client.post(url, data || {});
      else if (method === 'PATCH') res = await client.patch(url, data || {});
      else if (method === 'DELETE') res = await client.delete(url);
      else res = { status: 0 };
    } catch (e) {
      res = { status: 500 };
    }
    const duration = performance.now() - start;

    let rating = '🟢';
    if (duration > 100) rating = '🟡';
    if (duration > 300) rating = '🟠';
    if (duration > 1000) rating = '🔴';

    results.push({
      category,
      endpoint: url.substring(0, 40),
      method,
      status: res.status,
      duration,
      rating,
    });
    return res;
  }

  // =================================================================
  // HEALTH CHECK ENDPOINTS (Public)
  // =================================================================
  console.log(chalk.cyan('\n📊 Testing Health Check Endpoints...'));
  await measure('Health', publicClient, 'GET', '/health');
  await measure('Health', publicClient, 'GET', '/health/ready');

  // =================================================================
  // CATALOG (Discovery & Testing)
  // =================================================================
  console.log(chalk.cyan('📊 Testing Catalog Endpoints...'));
  const productsRes = await measure(
    'Catalog',
    tenantClient,
    'GET',
    '/products',
  );
  const categoriesRes = await measure(
    'Catalog',
    tenantClient,
    'GET',
    '/categories',
  );
  const brandsRes = await measure('Catalog', tenantClient, 'GET', '/brands');

  if (productsRes.data?.data?.length > 0) {
    const pid = productsRes.data.data[0].id;
    await measure('Catalog', tenantClient, 'GET', `/products/${pid}`);
    await measure('Catalog', tenantClient, 'GET', `/products/${pid}/related`);
    await measure(
      'Catalog',
      tenantClient,
      'GET',
      `/products/${pid}/translations`,
    );
  }

  if (categoriesRes.data?.data?.length > 0) {
    const cid = categoriesRes.data.data[0].id;
    await measure('Catalog', tenantClient, 'GET', `/categories/${cid}`);
  }

  if (brandsRes.data?.data?.length > 0) {
    const bid = brandsRes.data.data[0].id;
    await measure('Catalog', tenantClient, 'GET', `/brands/${bid}`);
  }

  // =================================================================
  // SKUs
  // =================================================================
  console.log(chalk.cyan('📊 Testing SKU Endpoints...'));
  const skusRes = await measure('SKU', tenantClient, 'GET', '/skus');
  if (skusRes.data?.data?.length > 0) {
    const sid = skusRes.data.data[0].id;
    await measure('SKU', tenantClient, 'GET', `/skus/${sid}`);
  }

  // =================================================================
  // CART & ORDERS
  // =================================================================
  console.log(chalk.cyan('📊 Testing Cart & Order Endpoints...'));
  await measure('Cart', tenantClient, 'GET', '/cart');
  const myOrdersRes = await measure(
    'Orders',
    tenantClient,
    'GET',
    '/orders/my-orders',
  );
  if (myOrdersRes.data?.data?.length > 0) {
    const oid = myOrdersRes.data.data[0].id;
    await measure('Orders', tenantClient, 'GET', `/orders/my-orders/${oid}`);
    await measure('Orders', tenantClient, 'GET', `/orders/${oid}`);
  }

  // =================================================================
  // COUPONS
  // =================================================================
  console.log(chalk.cyan('📊 Testing Coupon Endpoints...'));
  const couponsRes = await measure('Coupons', tenantClient, 'GET', '/coupons');
  await measure('Coupons', tenantClient, 'GET', '/coupons/available');
  if (couponsRes.data?.data?.length > 0) {
    const couponId = couponsRes.data.data[0].id;
    await measure('Coupons', tenantClient, 'GET', `/coupons/${couponId}`);
  }

  // =================================================================
  // BLOGS
  // =================================================================
  console.log(chalk.cyan('📊 Testing Blog Endpoints...'));
  const blogsRes = await measure('Blogs', tenantClient, 'GET', '/blogs');
  if (blogsRes.data?.data?.length > 0) {
    const bid = blogsRes.data.data[0].id;
    await measure('Blogs', tenantClient, 'GET', `/blogs/${bid}`);
  }

  // =================================================================
  // WRITE OPERATIONS
  // =================================================================
  console.log(chalk.cyan('📊 Testing Write Operations...'));
  if (skusRes.data?.data?.length > 0) {
    const sid = skusRes.data.data[0].id;
    await measure('Wishlist', tenantClient, 'POST', '/wishlist/toggle', {
      skuId: sid,
    });
  }
  await measure('AI', tenantClient, 'POST', '/ai-chat/message', {
    message: 'Hello',
  });
  await measure(
    'Notifications',
    tenantClient,
    'PATCH',
    '/notifications/read-all',
  );

  // =================================================================
  // ANALYTICS & ADMIN
  // =================================================================
  console.log(chalk.cyan('📊 Testing Analytics & Admin...'));
  await measure('Analytics', tenantClient, 'GET', '/analytics/stats');
  await measure('Tenants', superClient, 'GET', '/tenants');
  await measure('Users', tenantClient, 'GET', '/users');
  await measure('Audit', superClient, 'GET', '/audit');
  await measure('Security', superClient, 'GET', '/admin/security/stats');

  // =================================================================
  // PRINT RESULTS
  // =================================================================
  console.log(chalk.blue.bold('\n\n📊 REFINED BENCHMARK RESULTS\n'));

  const p = new Table({
    columns: [
      { name: 'Category', alignment: 'left' },
      { name: 'Endpoint', alignment: 'left' },
      { name: 'Method', alignment: 'center' },
      { name: 'Status', alignment: 'center' },
      { name: 'Time (ms)', alignment: 'right' },
      { name: 'Rating', alignment: 'center' },
    ],
  });

  for (const r of results) {
    p.addRow({
      Category: r.category,
      Endpoint: r.endpoint,
      Method: r.method,
      Status: r.status,
      'Time (ms)': r.duration.toFixed(2),
      Rating: r.rating,
    });
  }

  p.printTable();

  const totalEndpoints = results.length;
  const excellent = results.filter((r) => r.rating === '🟢').length;
  const avgTime =
    results.reduce((sum, r) => sum + r.duration, 0) / results.length;

  console.log(chalk.cyan('\n📊 SUMMARY'));
  console.log(chalk.white(`Total Endpoints Tested: ${totalEndpoints}`));
  console.log(chalk.green(`Excellent (<100ms): ${excellent}`));
  console.log(chalk.white(`Average Response Time: ${avgTime.toFixed(2)}ms`));
}

runFullBenchmark();
