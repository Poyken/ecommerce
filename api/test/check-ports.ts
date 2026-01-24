import * as net from 'net';

const ports = [5433, 6380, 8080];

async function checkPort(port: number) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      console.log(`✅ Port ${port} is OPEN`);
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      console.log(`❌ Port ${port} TIMEOUT`);
      socket.destroy();
      resolve(false);
    });
    socket.on('error', (err) => {
      console.log(`❌ Port ${port} CLOSED/ERROR (${err.message})`);
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function main() {
  console.log('Checking critical ports...');
  for (const port of ports) {
    await checkPort(port);
  }
}

main();
