import autocannon from 'autocannon';
import axios from 'axios';
import chalk from 'chalk';

const API_URL = 'http://localhost:8080/api/v1';

async function runCompoundStressTest() {
  console.log(
    chalk.blue.bold('\n🌪️ STARTING COMPOUND STRESS TEST (MIXED SCENARIOS)\n'),
  );

  // 1. Get Auth Token
  let token = '';
  try {
    const login = await axios.post(
      `${API_URL}/auth/login`,
      {
        email: 'admin@localhost.com',
        password: '123456',
      },
      { headers: { 'x-tenant-domain': 'localhost' } },
    );
    token = login.data.data.accessToken;
    console.log(chalk.green('✅ Auth Token Obtained for Secure Endpoints'));
  } catch (e) {
    console.error(
      chalk.red('❌ Failed to get auth token. Running public tests only.'),
    );
  }

  // 2. Get Product ID for Dynamic URLs
  let productId = 'non-existent';
  try {
    const p = await axios.get(`${API_URL}/products`, {
      headers: { 'x-tenant-domain': 'localhost' },
    });
    productId = p.data.data[0]?.id || productId;
  } catch {}

  // 3. Define Scenarios
  const scenarios = [
    {
      name: '🛍️ Public Browsing (Category/Home)',
      url: `${API_URL}/products?page=1&limit=20`,
      connections: 50,
      method: 'GET',
    },
    {
      name: '🔍 Product Detail (Heavy Read + Cache)',
      url: `${API_URL}/products/${productId}`,
      connections: 50,
      method: 'GET',
    },
    {
      name: '👤 User Profile & Auth (CPU Intensive)',
      url: `${API_URL}/auth/me`,
      connections: 20,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
    {
      name: '❤️ Wishlist Check (Private DB Access)',
      url: `${API_URL}/wishlist`,
      connections: 20,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    },
  ];

  console.log(
    chalk.yellow(
      `🚀 Launching ${scenarios.length} concurrent attack vectors...\n`,
    ),
  );

  const results = await Promise.all(scenarios.map((s) => runScenario(s)));

  printAggregateReport(results);
}

function runScenario(config: any): Promise<any> {
  return new Promise((resolve) => {
    const instance = autocannon(
      {
        url: config.url,
        connections: config.connections,
        duration: 10,
        method: config.method,
        headers: config.headers || { 'x-tenant-domain': 'localhost' },
        title: config.name,
        pipelining: 1,
      },
      (err, result) => {
        resolve({ config, result });
      },
    );

    // Minimal log to show it's running
    console.log(chalk.gray(`   ▶ Started: ${config.name}`));
  });
}

function printAggregateReport(results: any[]) {
  console.log(chalk.blue.bold('\n📊 COMPOUND STRESS TEST REPORT\n'));

  let totalReq = 0;
  let totalErrors = 0;

  results.forEach(({ config, result }) => {
    // console.log(result); // Debug if needed

    const avgLat = result.latency.average?.toFixed(1) || '0.0';
    const reqSec = result.requests.average?.toFixed(0) || '0';
    const errs = result.non2xx;
    const color = errs > 0 ? chalk.red : chalk.green;
    const icon = errs > 0 ? '⚠️' : '✅';

    console.log(chalk.bold.white(`Scenario: ${config.name}`));
    console.log(`  ${icon} Status:      ${color(errs + ' errors')} (Non-2xx)`);
    console.log(`  🚀 Throughput:  ${reqSec} req/sec`);
    console.log(`  ⏱️ Latency:     ${avgLat} ms`);
    console.log(chalk.gray('  ----------------------------------------'));

    totalReq += result.requests.total;
    totalErrors += result.non2xx;
  });

  console.log(
    chalk.bold(`\nGRAND TOTAL: ${totalReq} requests processed in 10s.`),
  );
  if (totalErrors > 0) {
    console.log(
      chalk.red.bold(`SYSTEM INSTABILITY DETECTED: ${totalErrors} failures.`),
    );
  } else {
    console.log(
      chalk.green.bold(
        'SYSTEM STABILITY CONFIRMED: 100% Success Rate across all scenarios.',
      ),
    );
  }
}

runCompoundStressTest();
