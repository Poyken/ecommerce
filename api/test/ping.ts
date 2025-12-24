import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1';

async function main() {
  console.log('Pinging...');
  try {
    const res = await axios.get('http://localhost:8080/api/health', {
      timeout: 2000,
    });
    console.log('Health:', res.status, res.data);
  } catch (e: any) {
    console.log('Health failed or timeout:', e.message);
  }

  try {
    const productRes = await axios.get(
      'http://localhost:8080/api/v1/products',
      { timeout: 2000 },
    );
    console.log('Products:', productRes.status);
  } catch (e: any) {
    console.log('Products failed:', e.message);
  }
}
main();
