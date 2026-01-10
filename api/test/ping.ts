/**
 * =====================================================================
 * PING TEST - Kiểm tra kết nối API cơ bản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SMOKE TEST:
 * - Script này chạy đơn giản để xem Backend có đang "sống" (alive) không.
 * - Test 2 endpoints:
 *   + `/health`: Endpoint nhẹ nhất, chỉ trả về "OK".
 *   + `/products`: Test kết nối Database (vì phải query sản phẩm).
 *
 * 2. CÁCH CHẠY:
 * - Dùng `ts-node` hoặc `bun` để chạy file này từ terminal.
 * - Hữu ích khi deploy xong hoặc trước khi chạy E2E tests.
 * =====================================================================
 */
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
