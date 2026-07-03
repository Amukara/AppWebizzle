const { spawn } = require('child_process');
const fs = require('fs');
const log = fs.openSync('/tmp/next-out.log', 'a');

const child = spawn('node', ['node_modules/.bin/next', 'dev', '-p', '3000', '-H', '0.0.0.0'], {
  detached: true,
  stdio: ['ignore', log, log],
  cwd: '/home/z/my-project',
  env: { ...process.env }
});

child.unref();
console.log('Spawned PID:', child.pid);