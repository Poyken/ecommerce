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

let base = GHN_API_BASE_URL;
if (base.includes('/v2')) {
  base = base.split('/v2')[0];
}
if (!base.endsWith('/')) base += '/';
const URL_V2 = `${base}v2/`;

async function main() {
  console.log('Finding latest order...');
  const order = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { items: { include: { sku: { include: { product: true } } } } },
  });

  if (!order) {
    console.error('No orders found in database.');
    return;
  }

  console.log(
    `Found order ${order.id}. Status: ${order.status}, AddressId: ${order.addressId}`,
  );

  if (!order.addressId) {
    console.error('Order has no addressId');
    return;
  }

  const address = await prisma.address.findUnique({
    where: { id: order.addressId },
  });

  if (!address) {
    console.error('Address not found');
    return;
  }

  console.log('Address Data:', {
    districtId: address.districtId,
    provinceId: address.provinceId,
    wardCode: address.wardCode,
  });

  if (!address.districtId || !address.wardCode) {
    console.error('Order address is missing GHN IDs/Codes. Cannot sync.');
    return;
  }

  const ghnOrderData = {
    payment_type_id: 2,
    note: `Don hang #${order.id.slice(-8)}`,
    required_note: 'CHOXEMHANGKHONGTHU',
    return_phone: '0388888888',
    return_address: address.street,
    to_name: order.recipientName,
    to_phone: '0388888888',
    to_address: order.shippingAddress,
    to_ward_code: address.wardCode as string,
    to_district_id: address.districtId as number,
    cod_amount:
      order.paymentStatus === 'PAID'
        ? 0
        : Math.round(Number(order.totalAmount)),
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
    from_district_id: 1442, // District 1, HCM
    from_ward_code: '20109',
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

    const response = await axios.post(createUrl, ghnOrderData, { headers });
    console.log('✅ GHN Success:', response.data);

    if (response.data.data && response.data.data.order_code) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          shippingCode: response.data.data.order_code,
        },
      });
      console.log(
        '✅ DB Updated with shippingCode:',
        response.data.data.order_code,
      );
    }
  } catch (error: any) {
    if (error.response) {
      console.error(
        '❌ GHN Sync Failed (API Error):',
        JSON.stringify(error.response.data, null, 2),
      );
    } else {
      console.error('❌ GHN Sync Failed (Network/Other):', error.message);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
