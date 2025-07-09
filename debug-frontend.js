console.log('Starting frontend...');

import { spawn } from 'child_process';
import { join } from 'path';

const frontendPath = '/Users/bandisanjay/student-feedback-system/frontend';

const child = spawn('npm', ['run', 'dev'], {
  cwd: frontendPath,
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'development' }
});

child.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

child.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

child.on('close', (code) => {
  console.log(`Process exited with code ${code}`);
});

process.on('SIGINT', () => {
  child.kill();
  process.exit();
});
