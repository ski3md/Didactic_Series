#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const tutorialPath = path.join(root, 'src/content/tutorials/clinicalPathInteractiveTutorials.json');
const modulePath = path.join(root, 'src/content/clinical_pathology/cpGovernanceModules.json');
const curriculumTsPath = path.join(root, 'src/content/curriculum/activeCurriculum.ts');
const tutorialsUiPath = path.join(root, 'src/components/DidacticTutorials.tsx');

const reportJsonPath = path.join(root, 'reports/cp_precision_governance_report.json');
const reportMdPath = path.join(root, 'reports/cp_precision_governance_report.md');
const reportCsvPath = path.join(root, 'reports/cp_precision_governance_report.csv');

const OFFICIAL_SOURCE = 'https://abpath.org/wp-content/uploads/2026/04/Content-Specifications-CP_final_04102026.pdf';
const ROOT_ALLOWLIST = new Set([
  'Blood Banking/Transfusion Medicine',
  'Hematopathology',
  'Hematopathology for Clinical Pathology',
  'Microbiology',
  'Medical Microbiology',
  'Chemical Pathology',
  'HLA Antigens and Alleles',
]);

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const ensureDir = (file) => fs.mkdirSync(path.dirname(file), { recursive: true });
const csv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
const toRoots = (anchorSet) =>
  Array.from(new Set((anchorSet || []).map((item) => item.split(' > ')[0].trim()).filter(Boolean)));

const failures = [];

const tutorials = readJson(tutorialPath);
const modules = readJson(modulePath);
const curriculumTs = fs.readFileSync(curriculumTsPath, 'utf8');
const tutorialsUi = fs.readFileSync(tutorialsUiPath, 'utf8');

const validateGovernance = (ownerType, ownerId, governance) => {
  if (!governance) {
    failures.push(`${ownerType}:${ownerId} missing cpGovernance`);
    return;
  }

  if (governance.abpathSpecVersion !== 'CP_2026_04_10') {
    failures.push(`${ownerType}:${ownerId} has unexpected abpathSpecVersion`);
  }
  if (!governance.abpathSourceUrl || governance.abpathSourceUrl !== OFFICIAL_SOURCE) {
    failures.push(`${ownerType}:${ownerId} missing or nonstandard abpathSourceUrl`);
  }
  if (!governance.abpathPrimaryPath || !governance.abpathPrimaryPath.includes('>')) {
    failures.push(`${ownerType}:${ownerId} lacks deep abpathPrimaryPath`);
  }
  if (!governance.abpathAnchorSet || governance.abpathAnchorSet.length === 0) {
    failures.push(`${ownerType}:${ownerId} missing abpathAnchorSet`);
  }
  if (!governance.abpathTestableTask || governance.abpathTestableTask.length === 0) {
    failures.push(`${ownerType}:${ownerId} lacks abpathTestableTask`);
  }
  if (!governance.boardMasteryFocusTitle) {
    failures.push(`${ownerType}:${ownerId} missing boardMasteryFocusTitle`);
  }
  if (!governance.mustKnowConcepts?.length) {
    failures.push(`${ownerType}:${ownerId} missing mustKnowConcepts`);
  }
  if (!governance.mustNotMissPitfalls?.length) {
    failures.push(`${ownerType}:${ownerId} missing mustNotMissPitfalls`);
  }
  if (!governance.classicBoardStemPatterns?.length) {
    failures.push(`${ownerType}:${ownerId} missing classicBoardStemPatterns`);
  }
  if (!governance.calculationOrInterpretationTasks?.length) {
    failures.push(`${ownerType}:${ownerId} missing calculationOrInterpretationTasks`);
  }
  if (!governance.commonWrongAnswerTraps?.length) {
    failures.push(`${ownerType}:${ownerId} missing commonWrongAnswerTraps`);
  }
  if (governance.abpathPrecisionMode === 'nearest-valid-deep' && !governance.nearestValidReason) {
    failures.push(`${ownerType}:${ownerId} nearest-valid-deep lacks nearestValidReason`);
  }
  if (governance.abpathPrecisionMode === 'cross-domain-governed' && !governance.crossDomainJustification) {
    failures.push(`${ownerType}:${ownerId} cross-domain-governed lacks crossDomainJustification`);
  }
  if (governance.abpathPrecisionMode === 'local-teaching-only' && !governance.facultyReviewReason) {
    failures.push(`${ownerType}:${ownerId} local-teaching-only lacks facultyReviewReason`);
  }
  if (governance.abpathReviewStatus === 'confirmed' && governance.abpathAnchorConfidence === 'low') {
    failures.push(`${ownerType}:${ownerId} cannot be confirmed with low anchor confidence`);
  }

  const roots = toRoots(governance.abpathAnchorSet);
  if (roots.some((rootName) => !ROOT_ALLOWLIST.has(rootName))) {
    failures.push(`${ownerType}:${ownerId} contains unrecognized CP root in abpathAnchorSet`);
  }
  if (roots.length > 1 && governance.abpathPrecisionMode !== 'cross-domain-governed') {
    failures.push(`${ownerType}:${ownerId} mixes CP roots without cross-domain-governed status`);
  }
};

tutorials.forEach((tutorial) => validateGovernance('tutorial', tutorial.id, tutorial.cpGovernance));
Object.entries(modules).forEach(([moduleId, governance]) => {
  validateGovernance('module', moduleId, governance);
  if (!curriculumTs.includes(`cpGovernanceModules['${moduleId}']`)) {
    failures.push(`module:${moduleId} governance exists but is not wired into activeCurriculum.ts`);
  }
});

const officialIndex = tutorialsUi.indexOf('Official ABPath Scope');
const boardIndex = tutorialsUi.indexOf('Board-Mastery Teaching Focus');
if (officialIndex === -1 || boardIndex === -1 || officialIndex > boardIndex) {
  failures.push('tutorial UI does not render Official ABPath Scope before Board-Mastery Teaching Focus');
}

const rows = [
  ...tutorials.map((tutorial) => ({
    ownerType: 'tutorial',
    id: tutorial.id,
    officialRoot: tutorial.cpGovernance.abpathRootTopic,
    officialPrimaryPath: tutorial.cpGovernance.abpathPrimaryPath,
    precisionMode: tutorial.cpGovernance.abpathPrecisionMode,
    anchorConfidence: tutorial.cpGovernance.abpathAnchorConfidence,
    examRisk: tutorial.cpGovernance.abpathExamRisk,
    testableTasks: tutorial.cpGovernance.abpathTestableTask.join(' | '),
    boardMasteryFocusTitle: tutorial.cpGovernance.boardMasteryFocusTitle,
    reviewStatus: tutorial.cpGovernance.abpathReviewStatus,
    reason:
      tutorial.cpGovernance.nearestValidReason ||
      tutorial.cpGovernance.crossDomainJustification ||
      tutorial.cpGovernance.facultyReviewReason ||
      '',
  })),
  ...Object.entries(modules).map(([id, governance]) => ({
    ownerType: 'module',
    id,
    officialRoot: governance.abpathRootTopic,
    officialPrimaryPath: governance.abpathPrimaryPath,
    precisionMode: governance.abpathPrecisionMode,
    anchorConfidence: governance.abpathAnchorConfidence,
    examRisk: governance.abpathExamRisk,
    testableTasks: governance.abpathTestableTask.join(' | '),
    boardMasteryFocusTitle: governance.boardMasteryFocusTitle,
    reviewStatus: governance.abpathReviewStatus,
    reason: governance.nearestValidReason || governance.crossDomainJustification || governance.facultyReviewReason || '',
  })),
];

ensureDir(reportJsonPath);
fs.writeFileSync(
  reportJsonPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      source: OFFICIAL_SOURCE,
      tutorialCount: tutorials.length,
      moduleCount: Object.keys(modules).length,
      failureCount: failures.length,
      failures,
      rows,
    },
    null,
    2,
  ) + '\n',
);

const md = [
  '# CP Precision Governance Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  `Source: ${OFFICIAL_SOURCE}`,
  '',
  `- Tutorials validated: ${tutorials.length}`,
  `- Modules validated: ${Object.keys(modules).length}`,
  `- Failures: ${failures.length}`,
  '',
  '## Rows',
  '',
  '| Type | ID | Official root | Primary path | Precision | Confidence | Exam risk | Review | Reason |',
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows.map((row) => `| ${row.ownerType} | ${row.id} | ${row.officialRoot} | ${row.officialPrimaryPath} | ${row.precisionMode} | ${row.anchorConfidence} | ${row.examRisk} | ${row.reviewStatus} | ${row.reason || '-'} |`),
  '',
  '## Failures',
  '',
  ...(failures.length ? failures.map((failure) => `- ${failure}`) : ['- None']),
  '',
];
fs.writeFileSync(reportMdPath, md.join('\n'));

const csvHeader = [
  'type',
  'id',
  'official_root',
  'official_primary_path',
  'precision_mode',
  'anchor_confidence',
  'exam_risk',
  'testable_tasks',
  'board_mastery_focus_title',
  'review_status',
  'reason',
];
const csvLines = [
  csvHeader.join(','),
  ...rows.map((row) =>
    [
      row.ownerType,
      row.id,
      row.officialRoot,
      row.officialPrimaryPath,
      row.precisionMode,
      row.anchorConfidence,
      row.examRisk,
      row.testableTasks,
      row.boardMasteryFocusTitle,
      row.reviewStatus,
      row.reason,
    ]
      .map(csv)
      .join(','),
  ),
];
fs.writeFileSync(reportCsvPath, csvLines.join('\n') + '\n');

if (failures.length > 0) {
  console.error(`[CP-GOVERNANCE] Validation failed with ${failures.length} issue(s).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`[CP-GOVERNANCE] Validated ${tutorials.length} tutorials and ${Object.keys(modules).length} modules.`);
