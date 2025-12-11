/**
 * Update SKU pricing after products are created
 */

const API_URL = 'http://localhost:8080/api/v1';
let accessToken = '';

async function login() {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: '123456' })
  });
  const data = await response.json();
  if (data.data?.accessToken) {
    accessToken = data.data.accessToken;
    console.log('✅ Logged in');
    return true;
  }
  return false;
}

async function updateSkus() {
  // Get all SKUs
  const response = await fetch(`${API_URL}/skus?limit=200`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });
  const data = await response.json();
  const skus = data.data?.items || [];
  
  console.log(`\n💰 Found ${skus.length} SKUs to update`);
  
  // Price map
  const prices = {
    'headphones': [2500000, 3000000, 3500000],
    'watch': [5000000, 6000000, 7000000],
    't-shirt':  [250000, 300000, 350000, 400000],
    'jeans': [800000, 900000, 1000000],
    'lamp': [700000, 800000, 900000],
    'pot': [400000, 500000, 600000, 700000]
  };
  
  // Image URLs
  const images = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&q=80',
    'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&q=80'
  ];
  
  let updated = 0;
  for (let i = 0; i < skus.length; i++) {
    const sku = skus[i];
    const code = sku.skuCode?.toLowerCase() || '';
    
    //  Determine price
    let price = 500000;
    for (const [key, priceList] of Object.entries(prices)) {
      if (code.includes(key)) {
        price = priceList[Math.floor(Math.random() * priceList.length)];
        break;
      }
    }
    
    // Stock
    const stock = Math.floor(Math.random() * 81) + 20;
    
    // Image
    const imageUrl = images[i % images.length];
    
    try {
      const updateResponse = await fetch(`${API_URL}/skus/${sku.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `bearer ${accessToken}`
        },
        body: JSON.stringify({
          price,
          stock,
          imageUrl,
          status: 'ACTIVE'
        })
      });
      
      if (updateResponse.ok) {
        updated++;
        console.log(`  ✅ ${sku.skuCode}: ${price}đ, stock: ${stock}`);
      } else {
        const error = await updateResponse.json();
        console.log(`  ❌ ${sku.skuCode}: ${error.message}`);
      }
    } catch (error) {
      console.log(`  ❌ ${sku.skuCode}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Updated ${updated}/${skus.length} SKUs`);
}

(async () => {
  if (await login()) {
    await updateSkus();
  }
})();
