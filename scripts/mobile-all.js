const qrcode = require('qrcode-terminal');
const address = require('address');
const { spawn } = require('child_process');
const path = require('path');

const ip = address.ip();
const frontendPort = 3000;
const backendPort = 5000;
const url = `http://${ip}:${frontendPort}`;

console.log('\n' + '🚀 '.repeat(10));
console.log('📱 MEDITRACK ALL-IN-ONE MOBILE MODE');
console.log('🚀 '.repeat(10) + '\n');

console.log(`1. BACKEND: http://${ip}:${backendPort}`);
console.log(`2. FRONTEND: ${url}`);
console.log(`\nScan this QR to open on your phone:`);

qrcode.generate(url, { small: true });

console.log('\nStarting servers... Please wait.');

// Start Backend
const backend = spawn('npm', ['start'], {
  cwd: path.join(__dirname, '../backend'),
  stdio: 'inherit',
  shell: true
});

// Start Frontend
const frontend = spawn('npm', ['run', 'start'], {
  cwd: path.join(__dirname, '../frontend'),
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, HOST: '0.0.0.0', WDS_SOCKET_HOST: ip } // Ensure HMR works over network
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
