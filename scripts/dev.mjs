import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const childEnv = { ...process.env };
delete childEnv.DEBUG;
delete childEnv.NEXT_TEST_MODE;
delete childEnv.__NEXT_TEST_MODE;

const port = process.env.STEP_STYLE_DEV_PORT || '3001';
const nextCli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
childEnv.NODE_OPTIONS = `${childEnv.NODE_OPTIONS || ''} --max-old-space-size=4096`.trim();
const child = spawn(process.execPath, [nextCli, 'dev', '-p', port], {
  env: childEnv,
  stdio: 'inherit',
});

child.on('exit', (code) => {
  process.exit(code ?? 1);
});