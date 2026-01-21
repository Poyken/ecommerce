/**
 * Seed products for a specific tenant - để test customer purchase flow
 */
import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';
const TENANT = {
  domain: 'demoshop2026.localhost',
  adminEmail: 'admin2026@example.com',
  adminPassword: 'Password123!',
};

async function seedTenant() {
  console.log(`\n🌱 Seeding data for tenant: ${TENANT.domain}\n`);

  // Step 1: Login as tenant admin
  console.log('1. Logging in as admin...');
  const loginRes = await axios.post(
    `${API_URL}/auth/login`,
    { email: TENANT.adminEmail, password: TENANT.adminPassword },
    { headers: { 'x-tenant-domain': TENANT.domain } }
  );
  const token = loginRes.data.data.accessToken;
  console.log('   ✅ Login successful');

  const headers = {
    Authorization: `Bearer ${token}`,
    'x-tenant-domain': TENANT.domain,
    'Content-Type': 'application/json',
  };

  // Step 2: Create category
  console.log('2. Creating category...');
  let categoryId: string;
  try {
    const catRes = await axios.post(
      `${API_URL}/categories`,
      { name: 'Furniture', slug: 'furniture' },
      { headers }
    );
    categoryId = catRes.data.data?.id || catRes.data.id;
    console.log(`   ✅ Category created: ${categoryId}`);
  } catch (e: any) {
    if (e.response?.status === 409) {
      // Already exists, fetch it
      const catsRes = await axios.get(`${API_URL}/categories`, { headers });
      categoryId = catsRes.data.data[0].id;
      console.log(`   ⚠️ Category already exists: ${categoryId}`);
    } else {
      throw e;
    }
  }

  // Step 3: Create brand
  console.log('3. Creating brand...');
  let brandId: string;
  try {
    const brandRes = await axios.post(
      `${API_URL}/brands`,
      { name: 'DemoShop Brand', slug: 'demoshop-brand' },
      { headers }
    );
    brandId = brandRes.data.data?.id || brandRes.data.id;
    console.log(`   ✅ Brand created: ${brandId}`);
  } catch (e: any) {
    console.log(`   ⚠️ Brand creation failed, fetching existing...`);
    try {
      const brandsRes = await axios.get(`${API_URL}/brands`, { headers });
      if (brandsRes.data.data?.length > 0) {
        brandId = brandsRes.data.data[0].id;
        console.log(`   ⚠️ Using existing brand: ${brandId}`);
      } else {
        // No brands, try one more time with simpler payload
        console.log(`   ⚠️ No existing brands, creating minimal...`);
        const minBrand = await axios.post(
          `${API_URL}/brands`,
          { name: 'Generic', slug: 'generic' },
          { headers }
        );
        brandId = minBrand.data.data?.id || minBrand.data.id;
        console.log(`   ✅ Created minimal brand: ${brandId}`);
      }
    } catch (e2: any) {
      console.log(`   ❌ Brand error: ${e2.response?.data?.message || e2.message}`);
      throw e2;
    }
  }

  // Step 4: Create product
  console.log('4. Creating product...');
  let productId: string;
  try {
    const prodRes = await axios.post(
      `${API_URL}/products`,
      {
        name: 'Premium Sofa 2026',
        slug: 'premium-sofa-2026',
        description: 'A beautiful premium sofa for your living room',
        categoryIds: [categoryId],
        brandId,
        options: [{ name: 'Color', values: ['Gray', 'Blue', 'White'] }],
      },
      { headers }
    );
    productId = prodRes.data.data?.id || prodRes.data.id;
    console.log(`   ✅ Product created: ${productId}`);
  } catch (e: any) {
    console.log(`   ❌ Product error details:`, JSON.stringify(e.response?.data || e.message, null, 2));
    // Try to get existing
    const prodsRes = await axios.get(`${API_URL}/products?limit=1`, { headers });
    if (prodsRes.data.data?.length > 0) {
      productId = prodsRes.data.data[0].id;
      console.log(`   ⚠️ Using existing product: ${productId}`);
    } else {
      throw e;
    }
  }

  // Step 5: Create SKU
  console.log('5. Creating SKU...');
  try {
    const skuRes = await axios.post(
      `${API_URL}/skus`,
      {
        skuCode: 'SOFA-GRAY-2026',
        productId,
        price: 8000000,
        stock: 50,
        status: 'ACTIVE',
        options: [{ name: 'Color', value: 'Gray' }],
      },
      { headers }
    );
    const skuId = skuRes.data.data?.id || skuRes.data.id;
    console.log(`   ✅ SKU created: ${skuId}`);
    console.log(`   📦 Price: 8,000,000 VND, Stock: 50`);
  } catch (e: any) {
    console.log(`   ❌ SKU error: ${e.response?.data?.message || e.message}`);
  }

  // Verify
  console.log('\n6. Verifying products on tenant...');
  const finalProds = await axios.get(`${API_URL}/products`, { headers });
  console.log(`   📊 Total products: ${finalProds.data.data?.length || 0}`);
  finalProds.data.data?.forEach((p: any) => {
    console.log(`   - ${p.name} (SKUs: ${p.skus?.length || 0})`);
  });

  console.log('\n✅ Tenant seeding complete!');
  console.log(`\n🌐 Customer can now shop at: http://${TENANT.domain}:3000/en/shop\n`);
}

seedTenant().catch((err) => {
  console.error('❌ Seeding failed:', err.response?.data?.message || err.message);
  process.exit(1);
});
