// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// SIMPLE API CONNECTIVITY TEST - KIỂM TRA KẾT NỐI CƠ BẢN
// =================================================================================================
//
// File này là một script đơn giản để kiểm tra nhanh kết nối tới Local API Server.
// Nó không phải là một bộ test đầy đủ (như Jest hay E2E), mà chỉ phục vụ mục đích "Smoke Test"
// để đảm bảo server đang chạy và các endpoint cơ bản (Health, Auth) phản hồi đúng.
//
// QUY TRÌNH THỰC HIỆN:
// 1. Health Check: Gọi endpoint công khai `/products` để xem server có phản hồi không.
// 2. Auth Flow:
//    - Đăng nhập với tài khoản admin mặc định.
//    - Lấy Access Token.
// 3. Protected Route: Sử dụng token vừa lấy để gọi endpoint `/auth/me`, xác minh token hoạt động.
//
// HƯỚNG DẪN SỬ DỤNG:
// - Cần đảm bảo API Server đang chạy (thường là port 8080).
// - Chạy bằng lệnh: `npx ts-node api/test/simple-test.ts`
//
// LƯU Ý:
// - Thông tin đăng nhập (email/pass) đang được hardcode cho môi trường dev local.
// - Script này sử dụng axios trực tiếp, bỏ qua các lớp wrapper của ứng dụng.
// =================================================================================================
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
