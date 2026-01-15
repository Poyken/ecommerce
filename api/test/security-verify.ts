/**
 * =====================================================================
 * DATA SECURITY VERIFY - Script kiểm thử bảo mật nâng cao
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MULTI-TENANT ISOLATION:
 * - Kiểm tra xem Tenant A có xem trộm được dữ liệu của Tenant B không?
 * - Đây là yếu tố SỐNG CÒN của hệ thống SaaS. Nếu lộ -> Kiện tụng, Sập tiệm.
 *
 * 2. RBAC BOUNDARIES:
 * - Kiểm tra xem User thường có gọi được API của Admin (VD: Xóa sản phẩm) không?
 *
 * 3. SESSION PINNING:
 * - Kiểm tra cơ chế chống trộm Token. Token bị đánh cắp nhưng dùng trên
 *   User-Agent (Trình duyệt) khác thì phải bị chặn ngay (Status 401). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import axios from 'axios';
import { randomUUID } from 'crypto';

const API_URL = 'http://127.0.0.1:8080/api/v1';

const log = (msg: string, type: string = 'INFO') => {
  const emoji =
    type === 'SUCCESS'
      ? '✅'
      : type === 'ERROR'
        ? '❌'
        : type === 'WARN'
          ? '⚠️'
          : 'ℹ️';
  console.log(`${emoji} [${type}] ${msg}`);
};

const baseHeaders = {
  'Content-Type': 'application/json',
};

const createSession = (name: string, tenant: string = 'localhost') => {
  const csrfToken = randomUUID();
  const tokenObj = { value: '' };

  const session = axios.create({
    baseURL: API_URL,
    headers: {
      ...baseHeaders,
      'x-tenant-domain': tenant,
      'x-csrf-token': csrfToken,
      Cookie: `csrf-token=${csrfToken}`,
    },
    withCredentials: true,
    validateStatus: () => true,
  });

  session.interceptors.request.use((config) => {
    if (tokenObj.value) {
      config.headers['Authorization'] = `Bearer ${tokenObj.value}`;
    }
    return config;
  });

  return { session, token: tokenObj, name, tenant };
};

async function main() {
  log('STARTING DEEP SECURITY & ISOLATION VERIFICATION...');

  const sa = createSession('Super Admin');
  const tenantA = createSession('Tenant A Admin', 'localhost');
  const tenantB = createSession('Tenant B Admin', 'tenant-b.localhost');
  const userA = createSession('Regular User A', 'localhost');

  // 1. Setup
  log('--- 1. SETUP & AUTH ---');
  const saLogin = await sa.session.post('/auth/login', {
    email: 'super@platform.com',
    password: '123456',
  });
  if (saLogin.status === 200 || saLogin.status === 201) {
    sa.token.value = saLogin.data.accessToken;
    log('Super Admin logged in', 'SUCCESS');
  } else {
    log(`Super Admin Login Failed: ${saLogin.status}`, 'ERROR');
  }

  // Ensure Tenant B exists
  const createB = await sa.session.post('/tenants', {
    name: 'Tenant B',
    domain: 'tenant-b.localhost',
    plan: 'FREE',
    adminEmail: 'admin@tenant-b.com',
    adminPassword: 'Password123!',
  });
  if (createB.status === 201 || createB.status === 200) {
    log('Tenant B ensured successfully', 'SUCCESS');
  }

  const bLogin = await tenantB.session.post('/auth/login', {
    email: 'admin@tenant-b.com',
    password: 'Password123!',
  });
  if (bLogin.status === 200 || bLogin.status === 201) {
    tenantB.token.value = bLogin.data.accessToken;
    log('Tenant B Admin logged in', 'SUCCESS');
  }

  const aLogin = await tenantA.session.post('/auth/login', {
    email: 'admin@localhost.com',
    password: '123456',
  });
  if (aLogin.status === 200 || aLogin.status === 201) {
    tenantA.token.value = aLogin.data.accessToken;
    log('Tenant A Admin logged in', 'SUCCESS');
  }

  const uEmail = `user.a.${Date.now()}@example.com`;
  await userA.session.post('/auth/register', {
    email: uEmail,
    password: 'Password123!',
    firstName: 'User',
    lastName: 'A',
  });
  const uLogin = await userA.session.post('/auth/login', {
    email: uEmail,
    password: 'Password123!',
  });
  if (uLogin.status === 200 || uLogin.status === 201) {
    userA.token.value = uLogin.data.accessToken;
    log('Regular User A logged in', 'SUCCESS');
  }

  // 2. Multi-Tenant Isolation
  log('--- 2. MULTI-TENANT ISOLATION ---');
  const myProdsA = await tenantA.session.get('/products');
  if (myProdsA.data.data && myProdsA.data.data.length > 0) {
    const secretId = myProdsA.data.data[0].id;
    log(`Tenant A has product: ${secretId}`);

    const accessByB = await tenantB.session.get(`/products/${secretId}`);
    if (accessByB.status === 404 || accessByB.status === 403) {
      log('CROSS-TENANT ACCESS DENIED (Correct Behavior)', 'SUCCESS');
    } else {
      log(
        `VULNERABILITY: Tenant B accessed Tenant A product! Status: ${accessByB.status}`,
        'ERROR',
      );
    }

    const crossingUser = await axios.get(`${API_URL}/products/${secretId}`, {
      headers: {
        ...baseHeaders,
        'x-tenant-domain': 'tenant-b.localhost',
        Authorization: `Bearer ${userA.token.value}`,
      },
      validateStatus: () => true,
    });
    if (crossingUser.status === 403 || crossingUser.status === 404) {
      log(
        `Isolation bypass blocked (Correct Behavior) Status: ${crossingUser.status}`,
        'SUCCESS',
      );
    }
  }

  // 3. RBAC Boundaries
  log('--- 3. RBAC BOUNDARIES ---');
  if (userA.token.value) {
    const deleteAttempt = await axios.delete(`${API_URL}/products/any-id`, {
      headers: {
        ...baseHeaders,
        'x-tenant-domain': 'localhost',
        Authorization: `Bearer ${userA.token.value}`,
      },
      validateStatus: () => true,
    });
    if (deleteAttempt.status === 403) {
      log('USER cannot delete product (Correct Behavior)', 'SUCCESS');
    } else {
      log(`RBAC Result: Status ${deleteAttempt.status}`, 'INFO');
    }
  }

  // 4. Data Integrity
  log('--- 4. DATA INTEGRITY ---');
  const dupRegister = await userA.session.post('/auth/register', {
    email: uEmail,
    password: 'Password123!',
    firstName: 'User',
    lastName: 'A',
  });
  if (dupRegister.status === 409 || dupRegister.status === 400) {
    log('Duplicate email registration blocked (Correct Behavior)', 'SUCCESS');
  }

  // 5. Session Pinning (Fingerprint)
  log('--- 5. SESSION BINDING (FINGERPRINT) ---');
  if (userA.token.value) {
    const hijackedMe = await axios.get(`${API_URL}/auth/me`, {
      headers: {
        ...baseHeaders,
        Authorization: `Bearer ${userA.token.value}`,
        'User-Agent': 'Evil-Hacker-Browser/1.0',
        'x-tenant-domain': 'localhost',
      },
      validateStatus: () => true,
    });
    if (hijackedMe.status === 401) {
      log(
        'Fingerprint mismatch blocked hijacked session (Correct Behavior)',
        'SUCCESS',
      );
    }
  }

  log('--- VERIFICATION COMPLETE ---');
}

main();
