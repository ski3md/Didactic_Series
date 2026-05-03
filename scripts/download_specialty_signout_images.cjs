const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = process.cwd();
const PLAN_PATH = path.join(ROOT, 'src', 'content', 'signout_sims', 'image_acquisition_plan.json');
const plan = JSON.parse(fs.readFileSync(PLAN_PATH, 'utf8'));

const failures = [];
let downloaded = 0;
let alreadyPresent = 0;

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const REQUEST_DELAY_MS = Number(process.env.SIGNOUT_IMAGE_DELAY_MS || 2500);
const RETRIES = Number(process.env.SIGNOUT_IMAGE_RETRIES || 3);
const USER_AGENT =
  'DidacticSeriesPathologyTraining/1.0 (local educational reference library acquisition; contact: local-user)';

for (const [index, item] of (plan.acquisitions || []).entries()) {
  const outPath = path.join(ROOT, 'public', item.localPath);
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 0) {
    alreadyPresent += 1;
    continue;
  }
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  console.error(`FETCH ${index + 1}/${plan.acquisitions.length}: ${item.caseId}`);

  let result = null;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    if (attempt > 1) sleep(REQUEST_DELAY_MS * attempt);
    result = spawnSync(
      'curl',
      [
        '-fsSL',
        '--connect-timeout',
        '10',
        '--max-time',
        '45',
        '--retry',
        '1',
        '--retry-delay',
        '2',
        '-A',
        USER_AGENT,
        '-o',
        outPath,
        item.directUrl,
      ],
      {
        cwd: ROOT,
        encoding: 'utf8',
      }
    );
    if (result.status === 0) break;
  }

  if (result.status !== 0) {
    if (fs.existsSync(outPath) && fs.statSync(outPath).size === 0) fs.unlinkSync(outPath);
    failures.push({
      caseId: item.caseId,
      url: item.directUrl,
      error: result.stderr || result.stdout || `curl exited ${result.status}`,
    });
    continue;
  }
  if (!fs.existsSync(outPath) || fs.statSync(outPath).size === 0) {
    failures.push({
      caseId: item.caseId,
      url: item.directUrl,
      error: 'Downloaded file is empty.',
    });
    continue;
  }
  downloaded += 1;
  sleep(REQUEST_DELAY_MS);
}

const summary = {
  acquisitions: plan.acquisitions?.length || 0,
  downloaded,
  alreadyPresent,
  failures: failures.length,
};

console.log(JSON.stringify(summary, null, 2));
for (const failure of failures) console.error(`FAIL ${failure.caseId}: ${failure.error}`);
if (failures.length > 0) process.exitCode = 1;
