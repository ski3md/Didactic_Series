const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const GU_PATH = path.join(ROOT, 'src', 'content', 'gu', 'gu_signout_sims.json');
const SIM_DIR = path.join(ROOT, 'src', 'content', 'signout_sims');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const files = [
  GU_PATH,
  ...(fs.existsSync(SIM_DIR)
    ? fs
        .readdirSync(SIM_DIR)
        .filter((file) => file.endsWith('_signout_sims.json'))
        .map((file) => path.join(SIM_DIR, file))
    : []),
];

const failures = [];
const fail = (id, message) => failures.push(`${id}: ${message}`);

const summaries = [];
let totalCases = 0;

for (const filePath of files) {
  const data = readJson(filePath);
  const cases = data.cases || [];
  const specialty = data.specialty || data.title || path.basename(filePath);
  const siteCounts = {};
  const workflowCounts = {};
  totalCases += cases.length;

  if (cases.length === 0) fail(path.relative(ROOT, filePath), 'No cases found.');

  for (const item of cases) {
    siteCounts[item.site] = (siteCounts[item.site] || 0) + 1;
    workflowCounts[item.workflow] = (workflowCounts[item.workflow] || 0) + 1;

    if (!item.id || !item.title) fail(item.id || 'unknown', 'Missing id or title.');
    if (!['biopsy', 'resection', 'gross-only'].includes(item.workflow)) fail(item.id, `Invalid workflow: ${item.workflow}`);
    if (!item.specimenType) fail(item.id, 'Specimen type is required.');
    if (!item.clinicalHistory) fail(item.id, 'Clinical history is required.');
    if (!Array.isArray(item.diagnosticSteps) || item.diagnosticSteps.length < 3) fail(item.id, 'At least three diagnostic steps are required.');
    if (!Array.isArray(item.ancillaryOptions) || item.ancillaryOptions.length < 2) fail(item.id, 'At least two ancillary decision options are required.');
    if (!item.ancillaryOptions?.some((option) => option.recommended)) fail(item.id, 'At least one recommended ancillary option is required.');
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
    if (!item.image?.caption || !item.image?.sourceUrl) fail(item.id, 'Image caption and source URL are required.');

    const text = JSON.stringify(item).toLowerCase();
    for (const forbidden of ['placeholder', 'todo', 'dev note', 'lorem', 'web-development']) {
      if (text.includes(forbidden)) fail(item.id, `Nonclinical language detected: ${forbidden}`);
    }
  }

  summaries.push({
    file: path.relative(ROOT, filePath),
    specialty,
    cases: cases.length,
    siteCounts,
    workflowCounts,
  });
}

const summary = {
  files: files.length,
  cases: totalCases,
  failures: failures.length,
  specialties: summaries,
};

console.log(JSON.stringify(summary, null, 2));
for (const failure of failures) console.error(`FAIL ${failure}`);
if (failures.length > 0) process.exitCode = 1;
