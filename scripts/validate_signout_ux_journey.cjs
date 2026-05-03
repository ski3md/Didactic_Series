const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const AP_CONTRACT_PATH = path.join(ROOT, 'src', 'content', 'ap_signout', 'ap_signout_masterclass_contract.json');
const BREAST_CURRICULUM_PATH = path.join(ROOT, 'src', 'content', 'breast', 'breast_signout_curriculum.enhanced.json');
const BREAST_ASSETS_PATH = path.join(ROOT, 'src', 'content', 'breast', 'breast_signout_acquired_assets.json');
const GU_SIM_PATH = path.join(ROOT, 'src', 'content', 'gu', 'gu_signout_sims.json');
const SPECIALTY_SIM_DIR = path.join(ROOT, 'src', 'content', 'signout_sims');
const REPORT_PATH = path.join(ROOT, 'src', 'content', 'ap_signout', 'signout_ux_journey_report.json');

const readJson = (filePath, fallback = undefined) => {
  if (!fs.existsSync(filePath)) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing JSON file: ${path.relative(ROOT, filePath)}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const failures = [];
const warnings = [];
const caseReports = [];

const fail = (caseId, message) => failures.push({ caseId, message });
const warn = (caseId, message) => warnings.push({ caseId, message });

const expectedRevealOrder = [
  'image',
  'clinical header',
  'learner observation',
  'diagnostic reasoning',
  'ancillary studies if indicated',
  'final report language',
];

const workflowForBreastCase = (item) => {
  if (item.caseTrack === 'implant-reconstruction') return 'resection';
  if (item.caseTrack === 'neoadjuvant-resection') return 'resection';
  if (item.caseTrack === 'resection-synoptic') return 'resection';
  if (/lumpectomy|mastectomy|resection|orchiectomy|node/i.test(item.title)) return 'resection';
  return 'biopsy';
};

const defaultBreastUxJourney = (item) => {
  const workflow = workflowForBreastCase(item);
  return {
    targetStandard: 'commercial-grade-training-product',
    entryPath: ['persistent sidebar Breast Sign-Out', 'case rail', 'focused case workspace'],
    maxClicksToImage: 2,
    maxClicksToFinalReport: 6,
    requiredStates: [
      'case-selected',
      'image-visible-before-diagnosis',
      'clinical-header-visible',
      'observation-prompts-visible',
      'diagnostic-reasoning-hidden-until-reveal',
      'final-report-hidden-until-reveal',
      workflow === 'resection' ? 'synoptic-field-practice' : 'report-language',
    ],
    primaryActions: [
      { label: 'Select case', result: 'focused case workspace opens without page-length search' },
      { label: 'Reveal next step', result: 'only the next diagnostic reasoning step appears' },
      { label: 'Reveal final diagnosis', result: 'report-ready language appears after observation sequence' },
    ],
    secondaryActions: [
      { label: 'Reset case', result: 'case returns to image-first state' },
      { label: 'Open source/provenance', result: 'source opens without interrupting the case state' },
    ],
    accessibilityAndPolish: {
      stableTestIds: [
        `case-button-${item.id}`,
        `image-stage-${item.id}`,
        `observation-sequence-${item.id}`,
        `report-panel-${item.id}`,
      ],
      keyboardReachable: true,
      visibleFocusRequired: true,
      mobileNoOverlapRequired: true,
      noNestedCards: true,
      noDecorativeNoise: true,
      clinicalLanguageOnly: true,
    },
  };
};

const defaultSpecialtyUxJourney = (item, namespace = 'specialty') => ({
  targetStandard: 'commercial-grade-training-product',
  entryPath: ['persistent sidebar Specialty Sign-Out', 'specialty tab', 'case rail', 'focused case workspace'],
  maxClicksToImage: 2,
  maxClicksToFinalReport: 6,
  requiredStates: [
    'case-selected',
    'image-visible-before-diagnosis',
    'clinical-header-visible',
    'observation-prompts-visible',
    'diagnostic-reasoning-hidden-until-reveal',
    'final-report-hidden-until-reveal',
    item.workflow === 'resection' ? 'synoptic-field-practice' : item.workflow === 'gross-only' ? 'gross-only-checklist' : 'report-language',
  ],
  primaryActions: [
    { label: 'Select case', result: 'focused GU case workspace opens' },
    { label: 'Reveal next step', result: 'only the next diagnostic reasoning step appears' },
    { label: 'Submit sign-out', result: 'case-specific attending feedback appears' },
  ],
  secondaryActions: [
    { label: 'Reset case', result: 'case returns to image-first state' },
    { label: 'Open image source', result: 'source opens after report submission' },
  ],
  accessibilityAndPolish: {
    stableTestIds: [
      `gu-case-button-${item.id}`,
      `gu-image-stage-${item.id}`,
      `gu-observation-sequence-${item.id}`,
      `gu-report-panel-${item.id}`,
      `${namespace}-case-button-${item.id}`,
      `${namespace}-image-stage-${item.id}`,
      `${namespace}-observation-sequence-${item.id}`,
      `${namespace}-report-panel-${item.id}`,
    ],
    keyboardReachable: true,
    visibleFocusRequired: true,
    mobileNoOverlapRequired: true,
    noNestedCards: true,
    noDecorativeNoise: true,
    clinicalLanguageOnly: true,
  },
});

const countClicksToFinalReport = (uxJourney, diagnosticStepCount) => {
  // Select case + reveal each diagnostic step + reveal final report.
  return 1 + diagnosticStepCount + 1;
};

const hasNonClinicalLanguage = (value) => {
  const text = JSON.stringify(value).toLowerCase();
  return [
    'web-development',
    'placeholder',
    'lorem',
    'todo',
    'click here to learn',
    'infinite scroll',
    'dev note',
    'debug',
  ].some((pattern) => text.includes(pattern));
};

const validateCase = ({ namespace, subspecialtyId, item, workflow, displayFormatting, uxJourney, evidenceCount, hasLocalAsset }) => {
  const caseId = item.id;
  const diagnosticSteps = Array.isArray(item.diagnosticSteps) ? item.diagnosticSteps : [];
  const report = {
    namespace,
    subspecialtyId,
    caseId,
    title: item.title,
    workflow,
    clickPath: uxJourney?.entryPath || [],
    estimatedClicksToImage: Math.min(uxJourney?.maxClicksToImage || 99, 3),
    estimatedClicksToFinalReport: countClicksToFinalReport(uxJourney, diagnosticSteps.length),
    passed: true,
    findings: [],
  };

  const addFailure = (message) => {
    report.passed = false;
    report.findings.push({ severity: 'failure', message });
    fail(caseId, message);
  };
  const addWarning = (message) => {
    report.findings.push({ severity: 'warning', message });
    warn(caseId, message);
  };

  if (!displayFormatting) addFailure('Missing display formatting contract.');
  if (displayFormatting?.requiredNavigation !== 'case-list-to-single-case-page-or-panel') {
    addFailure('Navigation must open a focused case page/panel rather than relying on scroll discovery.');
  }
  if (displayFormatting?.imageSizing !== 'uniform-large-contain') {
    addFailure('Image stage must use uniform large contain sizing.');
  }
  const revealOrder = displayFormatting?.revealOrder || [];
  for (const step of expectedRevealOrder) {
    if (!revealOrder.includes(step)) addFailure(`Reveal order missing: ${step}`);
  }

  if (!uxJourney) addFailure('Missing UX journey contract.');
  if ((uxJourney?.maxClicksToImage || 99) > 3) addFailure('Image must be reachable within three clicks.');
  if (report.estimatedClicksToFinalReport > (uxJourney?.maxClicksToFinalReport || 0)) {
    addFailure(`Estimated final-report click count ${report.estimatedClicksToFinalReport} exceeds budget ${uxJourney?.maxClicksToFinalReport}.`);
  }
  for (const state of [
    'case-selected',
    'image-visible-before-diagnosis',
    'observation-prompts-visible',
    'final-report-hidden-until-reveal',
  ]) {
    if (!(uxJourney?.requiredStates || []).includes(state)) addFailure(`UX state missing: ${state}`);
  }

  if (!Array.isArray(uxJourney?.primaryActions) || uxJourney.primaryActions.length < 3) {
    addFailure('Primary actions must cover selecting a case, revealing reasoning, and revealing final report.');
  }
  if (!uxJourney?.accessibilityAndPolish?.keyboardReachable) addFailure('Keyboard reachability is required.');
  if (!uxJourney?.accessibilityAndPolish?.visibleFocusRequired) addFailure('Visible focus states are required.');
  if (!uxJourney?.accessibilityAndPolish?.mobileNoOverlapRequired) addFailure('Mobile no-overlap requirement is missing.');
  if (!uxJourney?.accessibilityAndPolish?.clinicalLanguageOnly) addFailure('Clinical language only requirement is missing.');
  if (!Array.isArray(uxJourney?.accessibilityAndPolish?.stableTestIds) || uxJourney.accessibilityAndPolish.stableTestIds.length < 4) {
    addFailure('Stable test IDs are required for commercial-grade journey testing.');
  }

  if (diagnosticSteps.length < 3) addFailure('Every case needs at least three staged diagnostic steps for a complete journey.');
  if (!item.reportingTarget || typeof item.reportingTarget !== 'string') addFailure('Final report language is required.');
  if (evidenceCount < 1) addFailure('Every case needs at least one visual evidence slot.');
  if (namespace === 'breast' && !hasLocalAsset) addWarning('Breast case currently has no acquired local image; image stage will show missing-evidence state.');

  if (workflow === 'resection' && (!Array.isArray(item.synopticChecklist) || item.synopticChecklist.length === 0)) {
    addFailure('Resection workflow requires synoptic field practice.');
  }
  if (workflow === 'gross-only' && (!Array.isArray(item.grossOnlyChecklist) || item.grossOnlyChecklist.length === 0)) {
    addFailure('Gross-only workflow requires gross-only checklist.');
  }
  if (hasNonClinicalLanguage(item)) addFailure('Case contains nonclinical placeholder or development language.');

  caseReports.push(report);
};

const validateAp = () => {
  const contract = readJson(AP_CONTRACT_PATH);
  for (const subspecialty of contract.subspecialties || []) {
    for (const item of subspecialty.cases || []) {
      validateCase({
        namespace: 'ap',
        subspecialtyId: subspecialty.id,
        item,
        workflow: item.workflow,
        displayFormatting: item.displayFormatting,
        uxJourney: item.uxJourney,
        evidenceCount: item.imageAcquisition?.requiredEvidence?.length || 0,
        hasLocalAsset: false,
      });
    }
  }
};

const validateBreast = () => {
  const curriculum = readJson(BREAST_CURRICULUM_PATH);
  const assets = readJson(BREAST_ASSETS_PATH, { assets: [] }).assets || [];
  const assetsByCase = new Map();
  for (const asset of assets) {
    const current = assetsByCase.get(asset.caseId) || 0;
    assetsByCase.set(asset.caseId, current + 1);
  }

  for (const item of curriculum.cases || []) {
    const workflow = workflowForBreastCase(item);
    validateCase({
      namespace: 'breast',
      subspecialtyId: 'breast',
      item,
      workflow,
      displayFormatting: {
        firstPanel: 'histology-image-first',
        secondPanel: 'observation-sequence',
        thirdPanel: workflow === 'resection' ? 'synoptic-field-practice' : 'report-language',
        revealOrder: expectedRevealOrder,
        imageSizing: 'uniform-large-contain',
        requiredNavigation: 'case-list-to-single-case-page-or-panel',
      },
      uxJourney: defaultBreastUxJourney(item),
      evidenceCount: item.visualEvidenceRequirements?.length || 0,
      hasLocalAsset: assetsByCase.has(item.id),
    });
  }
};

const validateSpecialtyCurriculum = (curriculum, namespace, subspecialtyId) => {
  for (const item of curriculum.cases || []) {
    const imagePath = item.image?.src ? path.join(ROOT, 'public', item.image.src) : '';
    validateCase({
      namespace,
      subspecialtyId,
      item,
      workflow: item.workflow,
      displayFormatting: {
        firstPanel: 'histology-image-first',
        secondPanel: 'observation-sequence',
        thirdPanel: item.workflow === 'resection' ? 'synoptic-field-practice' : item.workflow === 'gross-only' ? 'gross-only-checklist' : 'report-language',
        revealOrder: expectedRevealOrder,
        imageSizing: 'uniform-large-contain',
        requiredNavigation: 'case-list-to-single-case-page-or-panel',
      },
      uxJourney: defaultSpecialtyUxJourney(item, namespace),
      evidenceCount: item.image?.src && fs.existsSync(imagePath) ? 1 : 0,
      hasLocalAsset: Boolean(item.image?.src && fs.existsSync(imagePath)),
    });
  }
};

const validateSpecialtySims = () => {
  validateSpecialtyCurriculum(readJson(GU_SIM_PATH, { cases: [] }), 'gu', 'genitourinary');
  if (!fs.existsSync(SPECIALTY_SIM_DIR)) return;
  for (const file of fs.readdirSync(SPECIALTY_SIM_DIR).filter((item) => item.endsWith('_signout_sims.json'))) {
    const curriculum = readJson(path.join(SPECIALTY_SIM_DIR, file), { cases: [] });
    const namespace = file.replace(/_signout_sims\.json$/, '').replace(/[^a-z0-9]+/gi, '_');
    validateSpecialtyCurriculum(curriculum, namespace, namespace);
  }
};

validateAp();
validateBreast();
validateSpecialtySims();

const summary = {
  generatedAt: new Date().toISOString(),
  targetStandard: 'commercial-grade-training-product',
  totalCases: caseReports.length,
  passedCases: caseReports.filter((item) => item.passed).length,
  failedCases: caseReports.filter((item) => !item.passed).length,
  warnings: warnings.length,
  failures: failures.length,
  namespaces: caseReports.reduce((acc, item) => {
    acc[item.namespace] = (acc[item.namespace] || 0) + 1;
    return acc;
  }, {}),
  workflowCounts: caseReports.reduce((acc, item) => {
    acc[item.workflow] = (acc[item.workflow] || 0) + 1;
    return acc;
  }, {}),
};

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, `${JSON.stringify({ summary, failures, warnings, cases: caseReports }, null, 2)}\n`);

console.log(JSON.stringify(summary, null, 2));
for (const warning of warnings.slice(0, 30)) console.warn(`WARN ${warning.caseId}: ${warning.message}`);
if (warnings.length > 30) console.warn(`WARN: ${warnings.length - 30} additional warnings written to ${path.relative(ROOT, REPORT_PATH)}`);
for (const failure of failures.slice(0, 50)) console.error(`FAIL ${failure.caseId}: ${failure.message}`);
if (failures.length > 50) console.error(`FAIL: ${failures.length - 50} additional failures written to ${path.relative(ROOT, REPORT_PATH)}`);
if (failures.length > 0) process.exitCode = 1;
