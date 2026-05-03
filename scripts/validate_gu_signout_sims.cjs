const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const SIM_PATH = path.join(ROOT, 'src', 'content', 'gu', 'gu_signout_sims.json');
const data = JSON.parse(fs.readFileSync(SIM_PATH, 'utf8'));

const failures = [];
const fail = (id, message) => failures.push(`${id}: ${message}`);

const cases = data.cases || [];
if (cases.length < 16) failures.push(`Expected at least 16 GU sign-out simulations; found ${cases.length}.`);

const siteCounts = {};
const workflowCounts = {};

for (const item of cases) {
  siteCounts[item.site] = (siteCounts[item.site] || 0) + 1;
  workflowCounts[item.workflow] = (workflowCounts[item.workflow] || 0) + 1;

  if (!item.id || !item.title) fail(item.id || 'unknown', 'Missing id or title.');
  if (!item.clinicalHistory) fail(item.id, 'Clinical history is required.');
  if (!Array.isArray(item.diagnosticSteps) || item.diagnosticSteps.length < 3) fail(item.id, 'At least three diagnostic steps are required.');
  if (!Array.isArray(item.ancillaryOptions) || item.ancillaryOptions.length < 2) fail(item.id, 'At least two ancillary decision options are required.');
  if (!item.ancillaryOptions.some((option) => option.recommended)) fail(item.id, 'At least one recommended ancillary option is required.');
  if (!item.reportingTarget) fail(item.id, 'Expected sign-out language is required.');
  if (!Array.isArray(item.requiredReportElements) || item.requiredReportElements.length < 2) fail(item.id, 'Required report elements are required.');
  if (!Array.isArray(item.pitfalls) || item.pitfalls.length < 2) fail(item.id, 'At least two pitfalls are required.');

  if (item.workflow === 'resection' && (!Array.isArray(item.synopticChecklist) || item.synopticChecklist.length < 3)) {
    fail(item.id, 'Resection simulations require synoptic fields.');
  }
  if (item.workflow === 'gross-only' && (!Array.isArray(item.grossOnlyChecklist) || item.grossOnlyChecklist.length < 3)) {
    fail(item.id, 'Gross-only simulations require gross-only checklist fields.');
  }

  const localImage = item.image?.src ? path.join(ROOT, 'public', item.image.src) : '';
  if (!localImage || !fs.existsSync(localImage)) fail(item.id, `Missing local image ${item.image?.src || ''}`.trim());
}

for (const requiredSite of ['Prostate', 'Bladder', 'Kidney', 'Testis', 'Penis']) {
  if (!Object.keys(siteCounts).some((site) => site.includes(requiredSite))) {
    failures.push(`Missing required GU site coverage: ${requiredSite}`);
  }
}

for (const requiredWorkflow of ['biopsy', 'resection', 'gross-only']) {
  if (!workflowCounts[requiredWorkflow]) failures.push(`Missing required workflow: ${requiredWorkflow}`);
}

const summary = {
  cases: cases.length,
  siteCounts,
  workflowCounts,
  failures: failures.length,
};

console.log(JSON.stringify(summary, null, 2));
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length > 0) process.exitCode = 1;
