import axios from 'axios';

const API_URL = 'http://127.0.0.1:8080/api/v1';

const api = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

async function main() {
  console.log('Starting test...');

  // 1. Health
  try {
    console.log('Checking products...');
    const prod = await api.get('/products');
    console.log('Products status:', prod.status);
  } catch (e: any) {
    console.log('Products error:', e.message);
  }

  // 2. Auth
  try {
    console.log('Logging in...');
    const login = await api.post('/auth/login', {
      email: 'admin@example.com',
      password: '123456',
    });
    console.log('Login status:', login.status);
    if (login.status === 201 || login.status === 200) {
      console.log('Login success');
      const token = login.data.accessToken;

      // 3. Get Me
      const me = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Me status:', me.status);
    } else {
      console.log('Login failed data:', JSON.stringify(login.data));
    }
  } catch (e: any) {
    console.log('Login error:', e.message);
  }
}

main();
