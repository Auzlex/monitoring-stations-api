const { spawn, execSync } = require('child_process');

console.log('Starting PostgreSQL container for local development...');
try {
  execSync('docker compose up -d db', { stdio: 'inherit' });
} catch (err) {
  console.error('Failed to start PostgreSQL container:', err);
  process.exit(1);
}

console.log('Synchronizing database schema with Prisma...');
try {
  execSync('pnpm prisma:push', { stdio: 'inherit' });
} catch (err) {
  console.warn('Prisma schema sync warning (db might not be fully ready yet, retrying...):');
  // Wait a brief moment and retry in case DB is still starting up
  try {
    execSync('pnpm prisma:push', { stdio: 'inherit' });
  } catch (secondErr) {
    console.error('Failed to sync Prisma schema:', secondErr);
    cleanup();
    process.exit(1);
  }
}

console.log('Starting dev server with nodemon...');
const nodemonProcess = spawn('npx', ['nodemon', '--watch', 'src', '--ext', 'ts', '--exec', 'ts-node', 'src/server.ts'], {
  stdio: 'inherit',
  shell: true
});

let isCleaningUp = false;
function cleanup() {
  if (isCleaningUp) return;
  isCleaningUp = true;
  console.log('\nStopping and removing PostgreSQL container...');
  try {
    execSync('docker compose down db', { stdio: 'inherit' });
  } catch (err) {
    console.error('Error stopping container:', err);
  }
}

// Hook into terminal exit signals to ensure database cleanup
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});

process.on('exit', () => {
  cleanup();
});
