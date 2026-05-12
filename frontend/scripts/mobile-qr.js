const qrcode = require('qrcode-terminal');
const address = require('address');
const { spawn } = require('child_process');

// Get local IP address
const ip = address.ip();
const port = process.env.PORT || 3000;
const url = `http://${ip}:${port}`;

console.log('\n' + '='.repeat(40));
console.log('📱 MEDITRACK MOBILE ACCESS');
console.log('='.repeat(40));
console.log(`\nScan this QR code to open the app on your mobile device:`);
console.log(`URL: ${url}\n`);

// Generate QR code in terminal
qrcode.generate(url, { small: true });

console.log('\nMake sure your phone is on the same Wi-Fi network as this computer.');
console.log('='.repeat(40) + '\n');

// Start the react-scripts server
const start = spawn('npm', ['run', 'start'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, HOST: '0.0.0.0' } // Bind to all interfaces for mobile access
});

start.on('close', (code) => {
  process.exit(code);
});
