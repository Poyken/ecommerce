import axios from 'axios';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load env from api root
dotenv.config({ path: path.join(__dirname, '../.env') });

const GHN_TOKEN = process.env.GHN_TOKEN;
const GHN_SHOP_ID = process.env.GHN_SHOP_ID;
const GHN_API_BASE_URL =
  process.env.GHN_API_BASE_URL ||
  'https://online-gateway.ghn.vn/shiip/public-api/';

const LOG_FILE = path.join(__dirname, 'ghn-debug.log');
function log(msg: string) {
  fs.appendFileSync(LOG_FILE, msg + '\n');
  console.log(msg);
}

// Clear log
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

// Helper to handle V2 url logic same as service
let base = GHN_API_BASE_URL;
if (base.includes('/v2')) {
  base = base.split('/v2')[0];
}
if (!base.endsWith('/')) base += '/';

const URL_MASTER = `${base}master-data/`;
const URL_V2 = `${base}v2/`;

log('--- GHN CONFIG ---');
log(`Token: ${GHN_TOKEN ? 'FOUND' : 'MISSING'}`);
log(`ShopID: ${GHN_SHOP_ID}`);
log(`BaseURL: ${base}`);

async function testConnection() {
  try {
    log('\n1. Testing Get Provinces (Check Token)...');
    const res = await axios.get(`${URL_MASTER}province`, {
      headers: {
        'Content-Type': 'application/json',
        Token: GHN_TOKEN,
      },
    });
    log(`✅ Province Success! Found ${res.data.data.length} provinces.`);
  } catch (e: any) {
    log(
      `❌ Get Province Failed: ${JSON.stringify(e.response?.data || e.message)}`,
    );
    return;
  }

  try {
    log('\n1.5. Testing Get Shops (Check authorized shops)...');
    const res = await axios.get(`${URL_V2}shop/all`, {
      headers: {
        'Content-Type': 'application/json',
        Token: GHN_TOKEN,
      },
    });
    log(`✅ Get Shops Raw Response: ${JSON.stringify(res.data, null, 2)}`);

    let shops = [];
    if (res.data.data && Array.isArray(res.data.data)) {
      shops = res.data.data;
    } else if (
      res.data.data &&
      res.data.data.shops &&
      Array.isArray(res.data.data.shops)
    ) {
      shops = res.data.data.shops;
    }

    if (shops.length > 0) {
      log(`✅ Get Shops Success! Found ${shops.length} shops.`);
      let shopInfo = '';
      shops.forEach((s: any) => {
        log(` - ID: ${s._id}, Name: ${s.name}`);
        shopInfo += `ID: ${s._id}, Name: ${s.name}\n`;
      });
      fs.writeFileSync(path.join(__dirname, 'shops.txt'), shopInfo);
    } else {
      log(`❓ Unexpected structure: ${JSON.stringify(res.data)}`);
    }
  } catch (e: any) {
    log(
      `❌ Get Shops Failed: ${JSON.stringify(e.response?.data || e.message)}`,
    );
  }

  try {
    log('\n2. Testing Fee Calculation (Check ShopID)...');
    // Dummy calculation
    const feePayload = {
      service_type_id: 2,
      insurance_value: 0,
      coupon: null,
      from_district_id: 1482, // Hanoi
      to_district_id: 1454, // HCM
      to_ward_code: '21012',
      height: 10,
      length: 10,
      weight: 1000,
      width: 10,
    };

    const res = await axios.post(`${URL_V2}shipping-order/fee`, feePayload, {
      headers: {
        'Content-Type': 'application/json',
        Token: GHN_TOKEN,
        ShopId: GHN_SHOP_ID,
      },
    });
    log(`✅ Calculate Fee Success: ${res.data.data.total}`);
  } catch (e: any) {
    log(
      `❌ Calculate Fee Failed: ${JSON.stringify(e.response?.data || e.message)}`,
    );
    // Don't return, try creation test
  }
}

testConnection();
