import axios from 'axios';

const API_URL = 'http://localhost:8080/api';
const WEB_URL = 'http://localhost:3000';

async function main() {
  console.log('🚀 Starting System Verification...');

  // 1. Check Web App
  try {
    console.log(`\nChecking Web App at ${WEB_URL}...`);
    const webRes = await axios.get(WEB_URL);
    if (webRes.status === 200) {
      console.log('✅ Web App is running!');
    } else {
      console.log(`❌ Web App returned status: ${webRes.status}`);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Web App Check Failed: ${error.message}`);
    } else {
      console.log('❌ Web App Check Failed: Unknown error');
    }
  }

  // 2. Check API Health
  try {
    console.log(`\nChecking API Health at ${API_URL}/health...`);
    const healthRes = await axios.get(`${API_URL}/health`);
    console.log(
      `✅ API Health Check: Status ${healthRes.status}, Data:`,
      healthRes.data,
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log('⚠️ /api/health not found. Trying /api/products...');
    } else {
      if (axios.isAxiosError(error)) {
        console.log(`❌ API Health Check Failed: ${error.message}`);
      }
    }
  }

  // 3. Login as Admin
  let token = '';
  try {
    console.log('\n🔐 Attempting Admin Login...');
    const loginRes = await axios.post(`${API_URL}/v1/auth/login`, {
      email: 'admin@example.com',
      password: '123456',
    });

    if (loginRes.data.accessToken) {
      token = loginRes.data.accessToken;
      console.log('✅ Admin Login Successful!');
      console.log('Logged in user:', loginRes.data.user?.email);
    } else {
      console.log('❌ Login failed: No access token received.');
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Login Failed: ${error.message}`);
      if (error.response) {
        console.log('Response data:', error.response.data);
      }
    }
  }

  // 4. Test Protected Endpoint (Get Users)
  if (token) {
    try {
      console.log('\n👥 Fetching Users (Protected Endpoint)...');
      const usersRes = await axios.get(`${API_URL}/v1/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log(`✅ Fetched ${usersRes.data.length || 'some'} users.`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.log(`❌ Fetch Users Failed: ${error.message}`);
      }
    }
  }

  // 5. Test Public Endpoint (Get Products)
  try {
    console.log('\n📦 Fetching Products (Public Endpoint)...');
    const productsRes = await axios.get(`${API_URL}/v1/products`);
    console.log(`✅ Fetched products. Status: ${productsRes.status}`);
    // console.log('Products sample:', productsRes.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.log(`❌ Fetch Products Failed: ${error.message}`);
    }
  }
}

main();
