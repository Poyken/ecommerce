import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const PORT = process.env.PORT || 8088;
const API_URL = `http://localhost:${PORT}/api/v1/shipping/webhook`;

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
