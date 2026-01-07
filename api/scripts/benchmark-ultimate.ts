import axios from 'axios';
import chalk from 'chalk';
import { Table } from 'console-table-printer';

const API_PORT = 8080;
const API_URL = `http://localhost:${API_PORT}/api/v1`;
const SWAGGER_JSON = `http://localhost:${API_PORT}/docs-json`;
const CONCURRENCY_LIMIT = 20;

interface Endpoint {
  path: string;
  method: string;
  level: string;
  tags: string[];
}

class UltimateBenchmarker {
  private results: any[] = [];
  private tokens: { [key: string]: string } = {};
  private dataPool: any = {
    id: '',
    userId: '',
    productId: '',
    skuId: '',
    orderId: '',
    categoryId: '',
    brandId: '',
    couponId: '',
    reviewId: '',
    addressId: '',
    roleId: '',
    permissionId: '',
    tenantId: 'default-tenant-id',
    slug: 'demo',
    domain: 'localhost',
    token: '000000',
    secret: 'secret',
  };

  private payloads: any = {
    productName: 'Premium Table',
    features: ['Wood', 'Modern'],
    content: 'Great product!',
    rating: 5,
    quantity: 1,
    email: 'bench@test.com',
    password: 'password',
    firstName: 'Bench',
    lastName: 'Test',
    productIds: [],
    plan: 'PRO',
    frequency: 'MONTHLY',
    status: 'ACTIVE',
    usageDurationDays: 30,
    tenantName: 'Bench Shop',
  };

  async init() {
    console.log(
      chalk.blue.bold(
        '\n🚀 INITIALIZING ULTIMATE BENCHMARK (204+ ENDPOINTS)\n',
      ),
    );

    const publicClient = axios.create({
      baseURL: API_URL,
      headers: { 'x-tenant-domain': 'localhost' },
      validateStatus: () => true,
    });

    try {
      console.log(chalk.gray('  Obtaining Auth Tokens...'));
      const sRes = await publicClient.post('/auth/login', {
        email: 'super@platform.com',
        password: '123456',
      });
      if (sRes.data?.data?.accessToken)
        this.tokens.SUPER = sRes.data.data.accessToken;

      const aRes = await publicClient.post('/auth/login', {
        email: 'admin@localhost.com',
        password: '123456',
      });
      if (aRes.data?.data?.accessToken)
        this.tokens.ADMIN = aRes.data.data.accessToken;

      const uRes = await publicClient
        .post('/auth/login', { email: 'user@gmail.com', password: 'password' })
        .catch(async () => {
          return await publicClient.post('/auth/register', {
            email: 'user@gmail.com',
            password: 'password',
            firstName: 'B',
            lastName: 'U',
          });
        });
      if (uRes.data?.data?.accessToken)
        this.tokens.USER = uRes.data.data.accessToken;
    } catch (e: any) {
      console.error(chalk.red('  Auth Init Failed:'), e.message);
    }

    try {
      console.log(chalk.gray('  Hydrating Dynamic Data Pool...'));
      const admin = this.getClient('ADMIN');
      const [u, p, c, b, o, r] = await Promise.all([
        this.getClient('SUPER').get('/users'),
        admin.get('/products'),
        admin.get('/categories'),
        admin.get('/brands'),
        admin.get('/orders'),
        admin.get('/roles'),
      ]);

      this.dataPool.userId = u.data?.data?.data?.[0]?.id || '';
      this.dataPool.id = this.dataPool.userId;
      this.dataPool.productId = p.data?.data?.[0]?.id || '';
      this.dataPool.skuId = p.data?.data?.[0]?.skus?.[0]?.id || '';
      this.dataPool.slug = p.data?.data?.[0]?.slug || 'demo';
      this.dataPool.categoryId = c.data?.data?.[0]?.id || '';
      this.dataPool.brandId = b.data?.data?.[0]?.id || '';
      this.dataPool.orderId = o.data?.data?.data?.[0]?.id || '';
      this.dataPool.roleId = r.data?.data?.data?.[0]?.id || '';
      this.payloads.productIds = [this.dataPool.productId];
    } catch (e) {
      console.log(
        chalk.yellow('  Data hydration partial. Result quality may vary.'),
      );
    }
    console.log(chalk.green('  Initialization Complete.\n'));
  }

  getClient(level: string) {
    return axios.create({
      baseURL: API_URL,
      headers: {
        Authorization: this.tokens[level] ? `Bearer ${this.tokens[level]}` : '',
        'x-tenant-domain': 'localhost',
      },
      validateStatus: () => true,
      timeout: 5000,
    });
  }

  async run() {
    const { data: swagger } = await axios
      .get(SWAGGER_JSON)
      .catch(() => ({ data: { paths: {} } }));
    const endpoints: Endpoint[] = [];

    for (const [path, methods] of Object.entries(swagger.paths)) {
      for (const [method, config] of Object.entries(methods as any)) {
        let level = 'PUBLIC';
        const tags = (config as any).tags || [];
        const isSecurity =
          (config as any).security && (config as any).security.length > 0;

        if (isSecurity) {
          if (
            tags.some((t: string) => t.includes('Admin') || t.includes('Super'))
          )
            level = 'ADMIN';
          else if (tags.some((t: string) => t.includes('Platform')))
            level = 'SUPER';
          else level = 'USER';
        }

        endpoints.push({
          path: path as string,
          method: method.toUpperCase(),
          level,
          tags,
        });
      }
    }

    console.log(
      chalk.cyan(`🔥 Executing Stress Test on ${endpoints.length} Routes...\n`),
    );

    const chunks: Endpoint[][] = [];
    for (let i = 0; i < endpoints.length; i += CONCURRENCY_LIMIT) {
      chunks.push(endpoints.slice(i, i + CONCURRENCY_LIMIT));
    }

    const startTotal = Date.now();
    for (const chunk of chunks) {
      await Promise.all(chunk.map((ep) => this.testEndpoint(ep)));
    }
    const endTotal = Date.now();

    this.printSummary(endTotal - startTotal);
  }

  async testEndpoint(ep: Endpoint) {
    let url = ep.path.replace('/api/v1', '');
    Object.keys(this.dataPool).forEach((key) => {
      url = url.replace(`{${key}}`, this.dataPool[key]);
    });

    const client = this.getClient(ep.level);
    const start = Date.now();
    let res;
    try {
      if (ep.method === 'GET') res = await client.get(url);
      else {
        // Attempt to send a valid-ish body
        res = await client({
          method: ep.method,
          url: url,
          data: this.payloads,
        });
      }
    } catch (e: any) {
      res = { status: 500 };
    }
    const duration = Date.now() - start;

    this.results.push({
      Method: ep.method,
      Path: url.substring(0, 45),
      Level: ep.level,
      Status: res?.status || 0,
      Time: duration,
      Category: ep.tags[0] || 'Uncategorized',
    });
  }

  printSummary(totalTime: number) {
    const table = new Table({
      columns: [
        { name: 'Method', alignment: 'left' },
        { name: 'Path', alignment: 'left' },
        { name: 'Category', alignment: 'left' },
        { name: 'Status', alignment: 'center' },
        { name: 'Time', alignment: 'right', title: 'ms' },
        { name: 'Res', alignment: 'center' },
      ],
    });

    const sorted = [...this.results].sort((a, b) => b.Time - a.Time);
    sorted.slice(0, 40).forEach((r) => {
      const icon =
        r.Status >= 200 && r.Status < 300
          ? '🟢'
          : r.Status >= 500
            ? '🔴'
            : r.Status === 404
              ? '⚪'
              : '🟡';
      table.addRow({ ...r, Res: icon });
    });

    console.log(chalk.bold('Top 40 Latency Outliers:'));
    table.printTable();

    // Stats
    const avg =
      this.results.reduce((s, r) => s + r.Time, 0) / this.results.length;
    const errors = this.results.filter((r) => r.Status >= 500).length;
    const authErrs = this.results.filter(
      (r) => r.Status === 401 || r.Status === 403,
    ).length;

    console.log('\n' + chalk.blue.bold('🏁 BENCHMARK SUMMARY'));
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
    console.log(
      `${chalk.white('Total Endpoints :')} ${chalk.bold(this.results.length)}`,
    );
    console.log(
      `${chalk.white('Average Latency :')} ${chalk.bold(avg.toFixed(2) + 'ms')}`,
    );
    console.log(
      `${chalk.white('Total Test Time :')} ${chalk.bold((totalTime / 1000).toFixed(2) + 's')}`,
    );
    console.log(
      `${chalk.white('Critical Errors :')} ${errors > 0 ? chalk.red.bold(errors) : chalk.green.bold('0')}`,
    );
    console.log(
      `${chalk.white('Auth Failures   :')} ${chalk.yellow.bold(authErrs)} (Checks ACLs)`,
    );
    console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
  }
}

const runner = new UltimateBenchmarker();
runner.init().then(() => runner.run());
