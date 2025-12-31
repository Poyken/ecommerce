import axios from 'axios';
import Redis from 'ioredis';

async function clearCache() {
  const redis = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL)
    : new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
      });

  console.log('🧹 [Layer 1] Clearing API Redis cache...');

  // Flush all data to be sure
  await redis.flushall();
  console.log('✅ Redis FLUSHALL completed.');

  await redis.quit();

  console.log('\n🧹 [Layer 2] Clearing Next.js Web cache...');

  // Try localhost:3000 (default) or FRONTEND_URL
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const revalidateUrl = `${frontendUrl}/api/revalidate?tag=all`;

  try {
    console.log(`   Calling: ${revalidateUrl}`);
    const response = await axios.get(revalidateUrl);
    console.log('✅ Web cache revalidated:', response.data);
  } catch (error) {
    console.error(
      '⚠️ Could not revalidate Web cache. Is the Web server running?',
    );
    console.error('   Error:', error.message);
    console.log(
      '   (If you are running locally, make sure "npm run dev" is running in /web)',
    );
  }

  // Try to delete .next folder (ONLY IN DEVELOPMENT)
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      '\n🧹 [Layer 3] Clearing Next.js Build cache (.next folder)...',
    );
    const path = require('path');
    const fs = require('fs');
    const nextPath = path.join(__dirname, '../../web/.next');

    try {
      if (fs.existsSync(nextPath)) {
        fs.rmSync(nextPath, { recursive: true, force: true });
        console.log('✅ Deleted .next folder');
        console.log(
          '⚠️  NOTE: You MUST restart the Web server for this to take effect!',
        );
      } else {
        console.log('ℹ️  .next folder not found, skipping.');
      }
    } catch (error) {
      console.warn(
        '⚠️  Could not delete .next folder. Is the Web server running and locking files?',
      );
      console.warn('   Error:', error.message);
      console.warn('   Try stopping the Web server first.');
    }
  } else {
    console.log(
      '\nℹ️  [Layer 3] Skipping .next deletion in production environment.',
    );
  }

  console.log('\n🎉 All layers cleared successfully!');
}

clearCache().catch(console.error);
