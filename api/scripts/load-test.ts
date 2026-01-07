import autocannon from 'autocannon';
import chalk from 'chalk';

async function runLoadTest() {
  console.log(
    chalk.blue.bold('\n💥 STARTING BACKEND STRESS TEST (LOAD TESTING)\n'),
  );

  const url = 'http://localhost:8080/api/v1/products';

  const instance = autocannon(
    {
      url,
      connections: 100, // 100 concurrent users
      duration: 10, // for 10 seconds
      pipelining: 1,
      title: 'Products API Load Test',
    },
    (err, result) => {
      if (err) console.error(err);
      printResult(result);
    },
  );

  // Track progress
  autocannon.track(instance, { renderProgressBar: true });
}

function printResult(result: any) {
  console.log(chalk.green.bold('\n📊 STRESS TEST RESULTS:'));
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(
    `${chalk.white('Total Requests :')} ${chalk.bold(result.requests.total)}`,
  );
  console.log(
    `${chalk.white('Requests/Sec   :')} ${chalk.bold(result.requests.average)}`,
  );
  console.log(
    `${chalk.white('Latency (Avg)  :')} ${chalk.bold(result.latency.average + 'ms')}`,
  );
  console.log(
    `${chalk.white('Throughput     :')} ${chalk.bold((result.throughput.average / 1024 / 1024).toFixed(2) + ' MB/s')}`,
  );
  console.log(
    `${chalk.white('Errors (Non-2xx):')} ${chalk.red.bold(result.non2xx)}`,
  );
  console.log(chalk.gray('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  if (result.non2xx > 0) {
    console.log(
      chalk.red(
        '⚠️ Warning: Server started failing under high load. Check logs.',
      ),
    );
  } else {
    console.log(
      chalk.green(
        '🚀 Excellent! Server handled 100 concurrent users with zero errors.',
      ),
    );
  }
}

runLoadTest();
