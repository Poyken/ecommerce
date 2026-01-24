import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:8080/api';

async function check(path: string) {
  const url = `${BASE_URL}${path}`;
  try {
    console.log(`Checking ${url}...`);
    const res = await axios.get(url);
    console.log(`✅ [${res.status}] ${url}`);
    return true;
  } catch (error: any) {
    console.log(
      `❌ [${error.response?.status || 'ERR'}] ${url}: ${error.message}`,
    );
    return false;
  }
}

async function main() {
  console.log('🚀 Checking API Connectivity (IPv4)...');

  await check('/health');
  await check('/v1/health');
}

main();
