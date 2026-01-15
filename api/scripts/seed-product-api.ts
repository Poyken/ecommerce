import axios from 'axios';

const API_URL = 'http://localhost:8080/api';
const ADMIN_EMAIL = 'super@platform.com';
const ADMIN_PASS = 'Password123!';

async function main() {
  console.log('🚀 Starting API Seeding...');

  // 1. Login
  let token = '';
  try {
    console.log('1. Logging in as Admin...');
    const res = await axios.post(`${API_URL}/v1/auth/login`, {
      email: ADMIN_EMAIL,
      password: ADMIN_PASS,
    });
    token = res.data.data.accessToken;
    console.log('   ✅ Logged in.');
  } catch (error: any) {
    console.error('   ❌ Login Failed:', error.response?.data || error.message);
    process.exit(1);
  }

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  // 1.b Setup Tenant Settings
  try {
    console.log('1.b Checking Tenant Settings...');
    const settingsRes = await axios.get(
      `${API_URL}/v1/tenant-settings`,
      headers,
    );
    console.log('   ✅ Settings found/created.');

    // Update settings to enable loyalty and set ratio
    await axios.patch(
      `${API_URL}/v1/tenant-settings`,
      {
        loyaltyPointRatio: 1000,
        isLoyaltyEnabled: true,
        defaultShippingFee: 30000,
        freeShippingThreshold: 500000,
      },
      headers,
    );
    console.log('   ✅ Settings updated (Loyalty enabled, 1000đ/pt).');
  } catch (error: any) {
    console.warn('   ⚠️ Tenant Settings setup skipped:', error.message);
  }

  // 2. Category
  let categoryId = '';
  try {
    console.log('2. Checking Categories...');
    const res = await axios.get(`${API_URL}/v1/categories?limit=1`, headers);
    const cats = res.data.data;
    if (cats.length > 0) {
      categoryId = cats[0].id;
      console.log(`   ✅ Setup: Found existing category ${cats[0].name}`);
    } else {
      console.log('   creating new category...');
      const createRes = await axios.post(
        `${API_URL}/v1/categories`,
        {
          name: 'Furniture',
          slug: 'furniture-' + Date.now(),
        },
        headers,
      );
      categoryId = createRes.data.data.id;
      console.log(`   ✅ Created Category: ${categoryId}`);
    }
  } catch (error: any) {
    console.error(
      '   ❌ Category check failed:',
      error.response?.data || error.message,
    );
    // Proceed if possible? No.
    // Maybe try creating anyway?
  }

  // 3. Brand
  let brandId = '';
  try {
    console.log('3. Checking Brands...');
    const res = await axios.get(`${API_URL}/v1/brands?limit=1`, headers);
    const brands = res.data.data;
    if (brands.length > 0) {
      brandId = brands[0].id;
      console.log(`   ✅ Setup: Found existing brand ${brands[0].name}`);
    } else {
      console.log('   creating new brand...');
      const createRes = await axios.post(
        `${API_URL}/v1/brands`,
        {
          name: 'Luxe Brand',
          slug: 'luxe-brand-' + Date.now(),
        },
        headers,
      );
      brandId = createRes.data.data.id;
      console.log(`   ✅ Created Brand: ${brandId}`);
    }
  } catch (error: any) {
    console.error(
      '   ❌ Brand check failed:',
      error.response?.data || error.message,
    );
  }

  // 3.b Ensure Warehouse
  let warehouseId = '';
  try {
    console.log('3.b Checking Warehouses...');
    const res = await axios.get(`${API_URL}/v1/inventory/warehouses`, headers);
    const warehouses = res.data;
    if (warehouses && warehouses.length > 0) {
      warehouseId = warehouses[0].id;
      console.log(
        `   ✅ Setup: Found existing warehouse ${warehouses[0].name}`,
      );
    } else {
      console.log('   creating new warehouse...');
      const createRes = await axios.post(
        `${API_URL}/v1/inventory/warehouses`,
        {
          name: 'Kho Tổng',
          address: 'Hà Nội, Việt Nam',
          isDefault: true,
        },
        headers,
      );
      warehouseId = createRes.data.id;
      console.log(`   ✅ Created Warehouse: ${warehouseId}`);
    }
  } catch (error: any) {
    console.warn('   ⚠️ Warehouse setup failed:', error.message);
  }

  // 4. Create Product
  if (categoryId && brandId) {
    try {
      console.log('4. Creating Product...');
      const payload = {
        name: 'Test Sofa API',
        slug: 'test-sofa-api-' + Date.now(),
        description: 'Created via API Seeder',
        categoryIds: [categoryId],
        brandId: brandId,
        options: [{ name: 'Color', values: ['Red', 'Blue'] }],
        // If supported in root? Usually option values have prices.
        // Wait, CreateProductDto didn't show price.
        // SKUs get prices.
        // Controller doc said 'Auto-generate SKUs'.
        // We'll see if defaults are applied.
      };
      const res = await axios.post(`${API_URL}/v1/products`, payload, headers);
      console.log(`   ✅ Product Created: ${res.data.data.id}`);

      // Verify SKUs
      const p = res.data.data;
      // Usually API returns full object.
      // If not, fetch detail.
      const detail = await axios.get(`${API_URL}/v1/products/${p.id}`, headers);
      const skus = detail.data.data.skus;
      if (skus && skus.length > 0) {
        console.log(`   ✅ SKUs generated: ${skus.length}`);
        // Update price/stock if 0?
        // Assume default is 0/0 and inactive?
        // Should update them?
        // Bulk update?
        // Or happy path test works with price 0?
        // Happy path adds to cart.
        // If price is 0, total is 0.
        // COD requires total > 0? Maybe.
        // Update first SKU price/stock.
        const skuId = skus[0].id;
        console.log(`   Updating SKU ${skuId} price/stock...`);
        // Use bulk update or single patch?
        // PATCH /products/:id/skus/bulk
        // Payload: { skus: [{ id: ..., price: 100000, stock: 10 }] }
        await axios.patch(
          `${API_URL}/v1/products/${p.id}/skus/bulk`,
          {
            skus: [{ id: skuId, price: 500000, stock: 100 }],
          },
          headers,
        );
        console.log(`   ✅ SKU Updated.`);

        // Add initial stock via inventory API
        if (warehouseId) {
          console.log(
            `   Adding 100 units of stock to warehouse ${warehouseId}...`,
          );
          await axios.post(
            `${API_URL}/v1/inventory/stock`,
            {
              warehouseId,
              skuId,
              quantity: 100,
              reason: 'Seeding initial stock',
            },
            headers,
          );
          console.log(`   ✅ Stock Added.`);
        }
      } else {
        console.warn('   ⚠️ No SKUs generated.');
      }
    } catch (error: any) {
      console.error('   ❌ Product Create Failed:');
      if (error.response) {
        console.error('      Status:', error.response.status);
        console.error(
          '      Data:',
          JSON.stringify(error.response.data, null, 2),
        );
      } else {
        console.error('      Message:', error.message);
      }
      process.exit(1);
    }
  } else {
    console.error('   ❌ Cannot create product: Missing Category or Brand');
    process.exit(1);
  }
}

main();
