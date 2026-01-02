import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 8080;
const BASE_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const API_URL =
  process.env.WEBHOOK_URL || `${BASE_URL}/api/v1/shipping/webhook`;

/**
 * =====================================================================
 * SIMULATE GHN WEBHOOK - Giả lập Callbacks từ Giao Hàng Nhanh
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WEBHOOK LÀ GÌ?
 * - Là cách GHN thông báo ngược lại cho Server của ta mỗi khi trạng thái đơn vận chuyển thay đổi
 *   (vd: Đang giao -> Đã giao).
 * - Ở localhost, GHN không gọi được API của ta (do không có Public IP), nên ta dùng script này
 *   để giả lập request đó.
 *
 * 2. CÁCH DÙNG:
 * - Chạy lệnh với OrderCode và Status mong muốn.
 * - Ví dụ: `npx ts-node scripts/simulate-ghn-webhook.ts L8CC208P delivered`
 *
 * 3. LOGIC:
 * - Script gửi POST request có cấu trúc y hệt GHN (OrderCode, Status, Type...) vào API local.
 * =====================================================================
 */

async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(
      'Usage: npx ts-node scripts/simulate-ghn-webhook.ts <OrderCode> <Status> [ExpectedDeliveryTime]',
    );
    console.log(
      'Example: npx ts-node scripts/simulate-ghn-webhook.ts L8CC208P picked',
    );
    console.log(
      'Statuses: ready_to_pick, picking, picked, delivering, delivered, cancel, return, returned',
    );
    return;
  }

  const [orderCode, status, expectedTime] = args;

  const payload: any = {
    OrderCode: orderCode,
    Status: status,
    Type: 'switch_status', // GHN sends 'switch_status' type usually
  };

  if (expectedTime) {
    payload.ExpectedDeliveryTime = expectedTime;
  }

  console.log(`🚀 Sending Webhook to ${API_URL}`);
  console.log('📦 Payload:', payload);

  try {
    const response = await axios.post(API_URL, payload);
    console.log('✅ Response:', response.data);
  } catch (error: any) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

main();
