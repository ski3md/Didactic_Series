const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTRACT_PATH = path.join(ROOT, 'src', 'content', 'ap_signout', 'ap_signout_masterclass_contract.json');
const REQUIREMENTS_PATH = path.join(ROOT, 'src', 'content', 'ap_signout', 'ap_signout_image_requirements.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const failures = [];
const warnings = [];
const fail = (message) => failures.push(message);
const warn = (message) => warnings.push(message);

const contract = readJson(CONTRACT_PATH);
const requirements = readJson(REQUIREMENTS_PATH);

if (!Array.isArray(contract.subspecialties) || contract.subspecialties.length < 12) {
  fail('Contract must cover at least 12 non-breast AP subspecialties.');
}

if ((contract.excludes || []).includes('breast') !== true) {
  fail('Contract must explicitly exclude breast because breast has its own implemented framework.');
}

const requiredWorkflows = new Set(contract.globalRequirements?.requiredWorkflows || ['biopsy', 'resection', 'gross-only']);
let totalCases = 0;
let totalImageSlots = 0;

for (const subspecialty of contract.subspecialties || []) {
  if (!isNonEmptyString(subspecialty.id) || !isNonEmptyString(subspecialty.title)) {
    fail('Every subspecialty needs id and title.');
    continue;
  }
  const cases = Array.isArray(subspecialty.cases) ? subspecialty.cases : [];
  totalCases += cases.length;
  if (cases.length < 30) {
    fail(`${subspecialty.id} has ${cases.length} cases; minimum is 30.`);
  }
  const workflows = new Set(cases.map((item) => item.workflow));
  for (const workflow of requiredWorkflows) {
    if (!workflows.has(workflow)) fail(`${subspecialty.id} is missing workflow: ${workflow}`);
  }
  if (!Array.isArray(subspecialty.protocolAnchors) || subspecialty.protocolAnchors.length === 0) {
    warn(`${subspecialty.id} has no protocol anchors.`);
  }

  for (const item of cases) {
    if (!isNonEmptyString(item.id)) fail(`${subspecialty.id} has a case without id.`);
    if (!isNonEmptyString(item.title)) fail(`${item.id} is missing title.`);
    if (!requiredWorkflows.has(item.workflow)) fail(`${item.id} has unsupported workflow: ${item.workflow}`);
    if (!item.displayFormatting?.firstPanel || !item.displayFormatting?.imageSizing) {
      fail(`${item.id} is missing display formatting contract.`);
    }
    if (!Array.isArray(item.diagnosticSteps) || item.diagnosticSteps.length < 3) {
      fail(`${item.id} needs at least three diagnostic steps.`);
    }
    if (!isNonEmptyString(item.reportingTarget)) fail(`${item.id} is missing report target.`);
    const evidence = item.imageAcquisition?.requiredEvidence;
    if (!Array.isArray(evidence) || evidence.length === 0) {
      fail(`${item.id} has no image acquisition requirements.`);
    } else {
      totalImageSlots += evidence.length;
    }
    if (item.workflow === 'resection' && (!Array.isArray(item.synopticChecklist) || item.synopticChecklist.length === 0)) {
      fail(`${item.id} is a resection case without synoptic checklist.`);
    }
    if (item.workflow === 'gross-only' && (!Array.isArray(item.grossOnlyChecklist) || item.grossOnlyChecklist.length === 0)) {
      fail(`${item.id} is a gross-only case without gross-only checklist.`);
    }
  }
}

const requirementSlots = Array.isArray(requirements.sourcesRequiredBeforeRelease)
  ? requirements.sourcesRequiredBeforeRelease
  : [];
const caseEvidenceSlots = new Set(
  (contract.subspecialties || []).flatMap((subspecialty) =>
    (subspecialty.cases || []).flatMap((item) => (item.imageAcquisition?.requiredEvidence || []).map((slot) => slot.slot))
  )
);
for (const slot of caseEvidenceSlots) {
  if (!requirementSlots.some((item) => item.id === slot)) {
    fail(`Image requirement manifest is missing slot ${slot}.`);
  }
}

console.log(JSON.stringify({
  subspecialties: contract.subspecialties?.length || 0,
  cases: totalCases,
  imageSlots: totalImageSlots,
  requirementSlots: requirementSlots.length,
  failures: failures.length,
  warnings: warnings.length,
}, null, 2));
for (const warning of warnings) console.warn(`WARN: ${warning}`);
for (const failure of failures) console.error(`FAIL: ${failure}`);
if (failures.length > 0) process.exitCode = 1;
