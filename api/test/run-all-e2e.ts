import { execSync } from 'child_process';
import * as net from 'net';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  bold: '\x1b[1m',
};

async function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function runCommand(command: string, name: string) {
  console.log(`${colors.yellow}➤ Running: ${name}...${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`${colors.green}✅ ${name} PASSED${colors.reset}\n`);
    return true;
  } catch (error) {
    console.error(`${colors.red}❌ ${name} FAILED${colors.reset}\n`);
    return false;
  }
}

async function main() {
  console.log(`${colors.bold}🚀 STARTING AUTOMATED E2E SUITE${colors.reset}\n`);

  // 1. Health Check
  console.log('1. Environment Health Check...');
  const dbUp = await checkPort(5433);
  const redisUp = await checkPort(6380);
  const apiUp = await checkPort(8080);

  if (!dbUp || !redisUp) {
    console.error(
      `${colors.red}❌ CRITICAL: Database (5433) or Redis (6380) is DOWN.${colors.reset}`,
    );
    console.error(`   Please run: docker compose up -d`);
    process.exit(1);
  }

  if (!apiUp) {
    console.error(
      `${colors.red}❌ CRITICAL: API (8080) is DOWN.${colors.reset}`,
    );
    console.error(`   Please run: npm run dev`);
    process.exit(1);
  }
  console.log(
    `${colors.green}✅ Environment is Healthy (DB, Redis, API)${colors.reset}\n`,
  );

  // 2. Run Suites
  console.log('2. Executing Test Features...');

  // Seed first
  const seedSuccess = await runCommand(
    'npx tsx test/seed-tenant.ts',
    'Seed Data',
  );
  if (!seedSuccess) process.exit(1);

  // Flows
  await runCommand('npx tsx test/b2b2c-full-flow.ts', 'B2B2C Full Flow');
  await runCommand(
    'npx tsx test/saas-onboarding-flow.ts',
    'SaaS Onboarding Flow',
  );
  await runCommand(
    'npx tsx test/tenant-purchase-flow.ts',
    'Tenant Purchase Flow',
  );
  await runCommand('npx tsx test/happy-path-flow.ts', 'Legacy Happy Path');

  console.log(`${colors.bold}🎉 ALL TESTS COMPLETED${colors.reset}`);
}

main();
