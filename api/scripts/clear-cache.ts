import Redis from 'ioredis';

async function clearCache() {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  console.log('🧹 Clearing Redis cache...');

  // Get all keys matching categories pattern
  const categoryKeys = await redis.keys('categories:*');
  console.log(`Found ${categoryKeys.length} category cache keys`);

  if (categoryKeys.length > 0) {
    await redis.del(...categoryKeys);
    console.log('✅ Category cache cleared');
  }

  // Get all keys matching brands pattern
  const brandKeys = await redis.keys('brands:*');
  console.log(`Found ${brandKeys.length} brand cache keys`);

  if (brandKeys.length > 0) {
    await redis.del(...brandKeys);
    console.log('✅ Brand cache cleared');
  }

  // Also clear products cache
  const productKeys = await redis.keys('products:*');
  console.log(`Found ${productKeys.length} product cache keys`);

  if (productKeys.length > 0) {
    await redis.del(...productKeys);
    console.log('✅ Product cache cleared');
  }

  await redis.quit();
  console.log('🎉 All cache cleared successfully!');
}

clearCache().catch(console.error);
