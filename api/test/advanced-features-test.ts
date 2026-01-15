import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://127.0.0.1:8080/api/v1';

const log = (msg: string, type: string = 'INFO') => {
  console.log(`[${type}] ${msg}`);
};

const baseHeaders = {
  'Content-Type': 'application/json',
  'x-tenant-domain': 'localhost',
};

const createSession = (name: string) => {
  const csrfToken = randomUUID();
  const session = axios.create({
    baseURL: API_URL,
    headers: {
      ...baseHeaders,
      'x-csrf-token': csrfToken,
      Cookie: `csrf-token=${csrfToken}`,
    },
    withCredentials: true,
    validateStatus: () => true,
  });

  const token = { value: '' };

  session.interceptors.request.use((config) => {
    if (token.value) {
      config.headers.Authorization = `Bearer ${token.value}`;
    }
    return config;
  });

  return { session, token, name };
};

async function main() {
  log('STARTING ADVANCED FEATURES TEST...');

  const admin = createSession('Admin');
  const user = createSession('User');

  // 1. Login Admin & User
  // 1. Login Admin
  let adminToken = '';
  // Try Super Admin first
  try {
    const saLogin = await admin.session.post('/auth/login', {
      email: 'super@platform.com',
      password: '123456',
    });
    if (saLogin.status === 201 || saLogin.status === 200) {
      adminToken = saLogin.data.accessToken;
      admin.token.value = adminToken;
      log('Super Admin Login Successful', 'SUCCESS');
    }
  } catch (e) {
    // Ignore initial attempt if it fails
  }

  if (!adminToken) {
    try {
      console.log('Attempting Admin Login...');
      const res = await admin.session.post('/auth/login', {
        email: 'admin@test.com',
        password: '123456',
      });
      console.log('Admin Login Status:', res.status);
      if (res.status === 201 || res.status === 200) {
        let access = res.data.accessToken;
        if (!access && res.data.data) {
          access = res.data.data.accessToken;
        }

        adminToken = access;
        admin.token.value = adminToken;

        if (adminToken) {
          log('Admin Login Successful and Token Set', 'SUCCESS');
        } else {
          log('Admin Login Sucessful BUT TOKEN EMPTY', 'ERROR');
        }
      }
    } catch (e: any) {
      console.log('Admin Login Exception:', e.message);
      if (e.response) {
        console.log('Response data:', e.response.data);
      }
    }
  }

  // if (adminToken) {
  //   admin.token.value = adminToken;
  // } else {
  //   log('Cannot login as Admin or Super Admin. Aborting.', 'ERROR');
  //   return;
  // }

  const randomEmail = `test.adv.${Date.now()}@example.com`;
  await user.session.post('/auth/register', {
    email: randomEmail,
    password: 'Password123!',
    firstName: 'Test',
    lastName: 'Adv',
  });
  const userLogin = await user.session.post('/auth/login', {
    email: randomEmail,
    password: 'Password123!',
  });
  if (userLogin.status === 201 || userLogin.status === 200) {
    user.token.value = userLogin.data.accessToken;
    log('User Login Successful', 'SUCCESS');
  }

  // =================================================================
  // 1. PROMOTIONS
  // =================================================================
  log('--- 1. PROMOTIONS ---');
  // Create Promotion
  const promoCode = 'TESTPROMO' + Date.now();
  const createPromo = await admin.session.post('/promotions', {
    name: 'Test Promotion 10%',
    code: promoCode,
    description: '10% off for orders > 100k',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isActive: true,
    rules: [{ type: 'MIN_ORDER_VALUE', operator: 'GTE', value: '100000' }],
    actions: [
      { type: 'DISCOUNT_PERCENT', value: '10', maxDiscountAmount: '50000' },
    ],
  });

  if (createPromo.status === 201) {
    log('Create Promotion Successful', 'SUCCESS');
  } else {
    log(
      `Create Promotion Failed: ${JSON.stringify(createPromo.data)}`,
      'ERROR',
    );
  }

  // Validate Promotion
  const validatePromo = await user.session.get('/promotions/validate', {
    params: { code: promoCode, amount: 200000 },
  });
  if (validatePromo.status === 200 && validatePromo.data.valid) {
    // changed isValid to valid from service response
    log(
      `Validate Promotion Successful: Discount = ${validatePromo.data.discountAmount}`,
      'SUCCESS',
    );
  } else {
    log(
      `Validate Promotion Failed: ${JSON.stringify(validatePromo.data)}`,
      'ERROR',
    );
  }

  // =================================================================
  // 2. INVENTORY & WAREHOUSE
  // =================================================================
  log('--- 2. INVENTORY ---');
  // Create Warehouse
  const createWarehouse = await admin.session.post('/inventory/warehouses', {
    name: 'Test Warehouse Hanoi',
    address: 'Cau Giay, Hanoi',
    isDefault: true,
  });

  let warehouseId = '';
  if (createWarehouse.status === 201) {
    warehouseId = createWarehouse.data.id || createWarehouse.data.data?.id; // Handle wrapping
    log('Create Warehouse Successful ' + warehouseId, 'SUCCESS');
  }

  // Get SKU to update stock
  // Assuming there is at least one SKU from previous tests or seed
  const skus = await admin.session.get('/skus?limit=1');
  if (skus.data.data && skus.data.data.length > 0) {
    const skuId = skus.data.data[0].id;

    // Update Stock
    const updateStock = await admin.session.post('/inventory/stock', {
      warehouseId: warehouseId,
      skuId: skuId,
      quantity: 50,
      reason: 'Initial Import',
    });

    if (updateStock.status === 201) {
      log('Update Stock Successful', 'SUCCESS');
    } else {
      log(`Update Stock Failed: ${JSON.stringify(updateStock.data)}`, 'ERROR');
    }
  }

  // =================================================================
  // 3. MEDIA
  // =================================================================
  log('--- 3. MEDIA ---');
  const createMedia = await admin.session.post('/media', {
    url: 'https://example.com/image.jpg',
    type: 'IMAGE',
    fileName: 'test-image.jpg',
    mimeType: 'image/jpeg',
  });
  if (createMedia.status === 201) {
    log('Create Media Successful', 'SUCCESS');
  } else {
    log(`Create Media Failed: ${JSON.stringify(createMedia.data)}`, 'ERROR');
  }

  // =================================================================
  // 4. CUSTOMER GROUPS
  // =================================================================
  log('--- 4. CUSTOMER GROUPS ---');
  const createGroup = await admin.session.post('/customer-groups', {
    name: 'VIP Members ' + Date.now(),
    description: 'For loyal customers',
  });
  if (createGroup.status === 201) {
    log('Create Customer Group Successful', 'SUCCESS');
  } else {
    log(
      `Create Customer Group Failed: ${JSON.stringify(createGroup.data)}`,
      'ERROR',
    );
  }
}

main();
