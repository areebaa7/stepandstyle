import { spawnSync } from 'node:child_process';

const suites = [
  'typecheck',
  'qa:operations-lint',
  'backup:check',
  'qa:operations',
  'qa:admin',
  'qa:order-security',
  'qa:auth-rate-limit',
  'qa:reviews',
  'qa:uploads',
  'qa:conversions',
];

const npmCli = process.env.npm_execpath;
if (!npmCli) {
  throw new Error('Run the unified suite through npm run qa:all so npm_execpath is available.');
}
const failures = [];
const startedAt = Date.now();

for (const suite of suites) {
  const suiteStartedAt = Date.now();
  console.log(`\n[RUN] ${suite}`);
  const result = spawnSync(process.execPath, [npmCli, 'run', suite], { stdio: 'inherit', env: process.env });
  const seconds = ((Date.now() - suiteStartedAt) / 1_000).toFixed(1);
  if (result.status === 0) console.log(`[PASS] ${suite} (${seconds}s)`);
  else {
    failures.push(suite);
    if (result.error) console.error(result.error.message);
    console.error(`[FAIL] ${suite} (${seconds}s)`);
  }
}

const totalSeconds = ((Date.now() - startedAt) / 1_000).toFixed(1);
if (failures.length) {
  console.error(`\nQA failed after ${totalSeconds}s: ${failures.join(', ')}`);
  process.exit(1);
}
console.log(`\nAll ${suites.length} QA suites passed in ${totalSeconds}s.`);
