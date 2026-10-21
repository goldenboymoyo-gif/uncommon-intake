// Starts the dev server for Expo Go on any OS: `npm run go` (extra flags pass through, e.g. -- --tunnel).
import { spawn } from 'node:child_process';

const flags = process.argv.slice(2).join(' ');
const child = spawn(`npx expo start --go ${flags}`.trim(), {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, EXPO_GO: '1' },
});
child.on('exit', (code) => process.exit(code ?? 0));
