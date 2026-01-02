import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

const GHN_TOKEN = process.env.GHN_TOKEN;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;
const GHN_API_BASE_URL =
  process.env.GHN_API_BASE_URL ||
  'https://online-gateway.ghn.vn/shiip/public-api/';

// Helper to handle V2 url logic same as service
let base = GHN_API_BASE_URL;
if (base.includes('/v2')) {
  base = base.split('/v2')[0];
}
if (!base.endsWith('/')) base += '/';
const URL_V2 = `${base}v2/`;

const ORDER_ID = 'a77ca22a-73a4-4219-8672-dfb52fae9459';

/**
 * =====================================================================
 * MANUAL SYNC ORDER SCRIPT - Đồng bộ đơn hàng sang GHN (Thủ công)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. KHI NÀO DÙNG?
 * - Khi webhook tự động bị lỗi hoặc Dev muốn test logic đẩy đơn sang Giao Hàng Nhanh (GHN)
 *   mà không cần thực hiện quy trình đặt hàng trên Web.
 *
 * 2. QUY TRÌNH:
 * - Lấy Order từ DB -> Lấy thông tin Address -> Validate dữ liệu.
 * - Mapping dữ liệu sang format của GHN (required_note, weight, dimensions...).
 * - Gọi API `shipping-order/create` của GHN.
 * - Nếu thành công: Cập nhật `shippingCode` (mã vận đơn) vào DB.
 *
 * ⚠️ LƯU Ý: Thay đổi `ORDER_ID` ở trên thành ID đơn hàng bạn muốn test.
 * =====================================================================
 */

async function main() {
  console.log(`Finding order ${ORDER_ID}...`);
  const order = await prisma.order.findUnique({
    where: { id: ORDER_ID },
    include: { items: { include: { sku: { include: { product: true } } } } },
  });

  if (!order) {
    console.error('Order not found');
    return;
  }

  if (!order.addressId) {
    console.error('Order has no addressId');
    return;
  }

  const address = await prisma.address.findUnique({
    where: { id: order.addressId },
  });

  if (!address || !address.districtId || !address.wardCode) {
    console.error('Missing address info in DB:', address);
    return;
  }

  const ghnOrderData = {
    payment_type_id: order.paymentMethod === 'COD' ? 2 : 1,
    note: `Don hang ${ORDER_ID.slice(-8)}`,
    required_note: 'CHOXEMHANGKHONGTHU',
    return_phone: address.phoneNumber,
    return_address: address.street,
    to_name: order.recipientName,
    to_phone: order.phoneNumber,
    to_address: order.shippingAddress,
    to_ward_code: address.wardCode,
    to_district_id: address.districtId,
    cod_amount: order.paymentStatus === 'PAID' ? 0 : Number(order.totalAmount),
    content: `Don hang tu Poyken E-commerce`,
    weight: 1000,
    length: 10,
    width: 10,
    height: 10,
    service_type_id: 2,
    items: order.items.map((item: any) => ({
      name: item.sku.product.name,
      code: item.sku.skuCode,
      quantity: item.quantity,
      price: Math.round(Number(item.priceAtPurchase)),
    })),
    from_district_id: 1454,
    from_ward_code: '21012',
  };

  console.log('--- Payload ---');
  console.log(JSON.stringify(ghnOrderData, null, 2));

  console.log('\n--- Sending to GHN ---');
  try {
    const createUrl = `${URL_V2}shipping-order/create`;
    const headers = {
      'Content-Type': 'application/json',
      Token: GHN_TOKEN,
      ShopId: GHN_SHOP_ID,
    };
    console.log('Headers:', headers);

    const response = await axios.post(createUrl, ghnOrderData, { headers });
    console.log('✅ GHN Success:', response.data);

    // Update DB
    if (response.data.data && response.data.data.order_code) {
      await prisma.order.update({
        where: { id: ORDER_ID },
        data: {
          shippingCode: response.data.data.order_code,
          ghnStatus: 'ready_to_pick', // Assume initial status
        },
      });
      console.log(
        '✅ DB Updated with shippingCode:',
        response.data.data.order_code,
      );
    }
  } catch (error: any) {
    console.error('❌ GHN Sync Failed:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error(
        'Full Error Details:',
        JSON.stringify(error.response.data, null, 2),
      );
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
