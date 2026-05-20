#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();

const crosswalkPath = path.join(root, 'src/content/tutorials/tutorialAbpathSpecCrosswalk.json');
const cpGovernanceReportPath = path.join(root, 'reports/cp_precision_governance_report.json');
const cpModulesPath = path.join(root, 'src/content/clinical_pathology/cpGovernanceModules.json');
const cpInteractiveTutorialsPath = path.join(root, 'src/content/tutorials/clinicalPathInteractiveTutorials.json');
const tutorialLabelValidationPath = path.join(root, 'reports/tutorial_label_validation.json');
const manifestReportPath = path.join(root, 'reports/validated_mappings_manifest.json');
const manifestSourcePath = path.join(root, 'src/content/tutorials/validatedMappingsManifest.json');

const CP_SPEC_URL = 'https://abpath.org/wp-content/uploads/2026/04/Content-Specifications-CP_final_04102026.pdf';
const KNOWN_CONFLICT_IDS = new Set(['topic-mol-1', 'topic-mol-2', 'topic-mol-3']);

const MANUAL_TUTORIAL_OVERRIDES = {
  'cardiac-markers-troponin-bnp': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Chemical Pathology',
    abpathPrimaryPath:
      'Chemical Pathology > Cardiac Function > Cardiac Troponin I and T > Brain Natriuretic Peptide and NT-proBNP',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'literal',
    abpathAnchorConfidence: 'high',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'manage-critical-result'],
    reviewOwner: 'Didactics governance review',
    reviewAction: 'Promote under the CP cardiac-marker anchor rather than the AP infarct noun match.',
  },
  'respiratory-viruses': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Medical Microbiology',
    abpathPrimaryPath: 'Medical Microbiology > Viruses and Prions > Specific Viruses',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'nearest-valid-deep',
    abpathAnchorConfidence: 'moderate',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'quality-regulatory'],
    nearestValidReason:
      'respiratory-virus teaching spans multiple organism nodes, so the validated microbiology umbrella is safer than an AP pulmonary infection match',
    reviewOwner: 'Didactics governance review',
    reviewAction: 'Keep respiratory virus teaching under CP microbiology unless a narrower governed virus cluster is added later.',
  },
  'topic-mol-1': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Hematopathology for Clinical Pathology',
    abpathPrimaryPath: 'Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'nearest-valid-deep',
    abpathAnchorConfidence: 'moderate',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'troubleshoot'],
    nearestValidReason: 'workflow concept distributed across multiple spec nodes',
    reviewOwner: 'CP governance review',
    reviewAction: 'Keep molecular methods teaching subordinate to the validated CP testing anchor.',
  },
  'topic-mol-2': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Hematopathology for Clinical Pathology',
    abpathPrimaryPath: 'Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'cross-domain-governed',
    abpathAnchorConfidence: 'moderate',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'medium-yield',
    abpathTestableTask: ['interpret', 'select-next-test', 'troubleshoot', 'quality-regulatory'],
    crossDomainJustification:
      'This tutorial teaches method-centered molecular interpretation across disease sites; ABPath CP supports a governed testing anchor, but not a literal solid-tumor molecular node.',
    reviewOwner: 'CP governance review',
    reviewAction: 'Present the disease-site labels as board-mastery teaching focus under the CP molecular testing frame.',
  },
  'topic-mol-3': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Hematopathology for Clinical Pathology',
    abpathPrimaryPath: 'Hematopathology for Clinical Pathology > Testing in Hematology and Hematopathology > Molecular Testing',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'nearest-valid-deep',
    abpathAnchorConfidence: 'high',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'troubleshoot'],
    nearestValidReason: 'disease narrower than CP spec',
    reviewOwner: 'CP governance review',
    reviewAction: 'Promote under the CP hematopathology testing frame and keep entity-specific molecular labels subordinate.',
  },
  'topic-cp-4-b': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Chemical Pathology',
    abpathPrimaryPath:
      'Chemical Pathology > Cardiac Function > Cardiac Troponin I and T > Brain Natriuretic Peptide and NT-proBNP',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'literal',
    abpathAnchorConfidence: 'high',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'manage-critical-result'],
    reviewOwner: 'Didactics governance review',
    reviewAction: 'Promote under the CP cardiac-marker anchor rather than the AP infarct noun match.',
  },
  'topic-cp-8-a': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Chemical Pathology',
    abpathPrimaryPath: 'Chemical Pathology > Thyroid > Thyroid Dysfunction',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'literal',
    abpathAnchorConfidence: 'high',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'quality-regulatory'],
    reviewOwner: 'Didactics governance review',
    reviewAction: 'Promote under CP thyroid-function testing rather than the AP organ-system noun match.',
  },
  'topic-mb-3-a': {
    track: 'clinical-path',
    abpathDomain: 'CP',
    abpathRoot: 'Medical Microbiology',
    abpathPrimaryPath: 'Medical Microbiology > Viruses and Prions > Specific Viruses',
    abpathSpecVersion: 'CP_2026_04_10',
    abpathPrecisionMode: 'nearest-valid-deep',
    abpathAnchorConfidence: 'moderate',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret', 'select-next-test', 'quality-regulatory'],
    nearestValidReason:
      'respiratory-virus teaching spans multiple organism nodes, so the validated microbiology umbrella is safer than an AP pulmonary infection match',
    reviewOwner: 'Didactics governance review',
    reviewAction: 'Keep respiratory virus teaching under CP microbiology unless a narrower governed virus cluster is added later.',
  },
  'topic-AP_ROOT': {
    track: 'surgical-path',
    abpathDomain: 'AP',
    abpathRoot: 'Neuropathology',
    abpathPrimaryPath:
      'Neuropathology Topics for Anatomic Pathology Residents > General: Neuroanatomy, Histology, Pathologic Responses, and Diagnostic Considerations > Neuroanatomy > Apoptosis',
    abpathPrecisionMode: 'literal',
    abpathAnchorConfidence: 'high',
    abpathReviewStatus: 'confirmed',
    abpathExamRisk: 'high-yield',
    abpathTestableTask: ['recognize', 'interpret'],
    reviewOwner: 'Didactics governance review',
    reviewAction: 'Treat this import as AP fundamentals until the upstream normalized track metadata is corrected.',
  },
};

const splitGovernanceTasks = (value) =>
  Array.isArray(value)
    ? value
    : String(value || '')
        .split('|')
        .map((part) => part.trim())
        .filter(Boolean);

const normalizeGovernanceOverride = (row) => {
  if (!row) return null;

  const precisionMode = row.precisionMode || row.abpathPrecisionMode;
  const reason = row.reason || '';

  return {
    track: row.track,
    abpathDomain: row.abpathDomain,
    abpathRoot: row.officialRoot || row.abpathRoot || row.abpathRootTopic,
    abpathPrimaryPath: row.officialPrimaryPath || row.abpathPrimaryPath,
    abpathSpecVersion: row.abpathSpecVersion || 'CP_2026_04_10',
    abpathPrecisionMode: precisionMode,
    abpathAnchorConfidence: row.anchorConfidence || row.abpathAnchorConfidence,
    abpathReviewStatus: row.reviewStatus || row.abpathReviewStatus,
    abpathExamRisk: row.examRisk || row.abpathExamRisk,
    abpathTestableTask: splitGovernanceTasks(row.testableTasks || row.abpathTestableTask),
    nearestValidReason:
      precisionMode === 'nearest-valid-deep' && reason ? reason : row.nearestValidReason,
    crossDomainJustification:
      precisionMode === 'cross-domain-governed' && reason
        ? reason
        : row.crossDomainJustification,
    facultyReviewReason:
      precisionMode === 'local-teaching-only' && reason ? reason : row.facultyReviewReason,
    reviewOwner: row.reviewOwner,
    reviewAction: row.reviewAction,
  };
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const sourcePriority = (entry) => {
  const sourceRepo = String(entry.tutorial.sourceRepo || '');
  const file = String(entry.tutorial.file || '');
  if (file.includes('clinicalPathInteractiveTutorials.json')) return 500;
  if (sourceRepo.includes('cp-content-specification')) return 400;
  if (file.includes('downloads_imports/normalized')) return 300;
  if (sourceRepo === 'board_prep') return 200;
  if (file.includes('tutorials.normalized.json')) return 150;
  return 100;
};

const hasRequiredPrecisionRationale = (row) => {
  if (row.abpathPrecisionMode === 'nearest-valid-deep') {
    return Boolean(row.nearestValidReason);
  }
  if (row.abpathPrecisionMode === 'cross-domain-governed') {
    return Boolean(row.crossDomainJustification);
  }
  if (row.abpathPrecisionMode === 'local-teaching-only') {
    return Boolean(row.facultyReviewReason);
  }
  return true;
};

const crosswalkData = readJson(crosswalkPath);
const cpGovernanceReport = readJson(cpGovernanceReportPath);
const cpModules = readJson(cpModulesPath);
const cpInteractiveTutorials = readJson(cpInteractiveTutorialsPath);
const tutorialLabelValidation = readJson(tutorialLabelValidationPath);

const labelValidationById = new Map(
  (tutorialLabelValidation.validations || []).map((row) => [row.id, row])
);
const interactiveGovernanceById = new Map(
  cpInteractiveTutorials
    .filter((row) => row.cpGovernance)
    .map((row) => [row.id, row.cpGovernance])
);
const cpGovernanceRowsById = new Map(
  (cpGovernanceReport.rows || [])
    .filter((row) => row.ownerType === 'tutorial')
    .map((row) => [row.id, row])
);

const tutorialRows = [];
const manifestFailures = [];

for (const entry of crosswalkData.crosswalk || []) {
  const tutorialId = entry.tutorial.id;
  const labelRow = labelValidationById.get(tutorialId);
  const interactiveGovernance = interactiveGovernanceById.get(tutorialId);
  const cpGovernanceRow = cpGovernanceRowsById.get(tutorialId);
  const override =
    normalizeGovernanceOverride(cpGovernanceRow) ||
    MANUAL_TUTORIAL_OVERRIDES[tutorialId];

  const crosswalkPrimaryPath = Array.isArray(entry.primaryMapping?.path)
    ? entry.primaryMapping.path.join(' > ')
    : '';
  const sourceAnchorExists = Boolean(entry.primaryMapping?.root && crosswalkPrimaryPath);
  const hasKnownConflict = KNOWN_CONFLICT_IDS.has(tutorialId) && !override;

  const cpLikeSource = Boolean(interactiveGovernance || override?.abpathDomain === 'CP');
  const track = override?.track || entry.tutorial.track || labelRow?.track || 'surgical-path';
  const abpathDomain =
    override?.abpathDomain ||
    (override?.abpathSpecVersion ? 'CP' : interactiveGovernance ? 'CP' : entry.primaryMapping?.domain || 'AP');
  const abpathRoot = override?.abpathRoot || interactiveGovernance?.abpathRootTopic || entry.primaryMapping?.root || '';
  const abpathPrimaryPath =
    override?.abpathPrimaryPath || interactiveGovernance?.abpathPrimaryPath || crosswalkPrimaryPath;
  const abpathSpecVersion = override?.abpathSpecVersion || interactiveGovernance?.abpathSpecVersion;
  const abpathPrecisionMode = override?.abpathPrecisionMode || interactiveGovernance?.abpathPrecisionMode;
  const abpathAnchorConfidence =
    override?.abpathAnchorConfidence ||
    interactiveGovernance?.abpathAnchorConfidence ||
    entry.primaryMapping?.confidence ||
    'low';
  const abpathReviewStatus = override?.abpathReviewStatus || interactiveGovernance?.abpathReviewStatus;
  const abpathExamRisk = override?.abpathExamRisk || interactiveGovernance?.abpathExamRisk;
  const abpathTestableTask = override?.abpathTestableTask || interactiveGovernance?.abpathTestableTask;
  const nearestValidReason = override?.nearestValidReason || interactiveGovernance?.nearestValidReason;
  const crossDomainJustification =
    override?.crossDomainJustification || interactiveGovernance?.crossDomainJustification;
  const facultyReviewReason = override?.facultyReviewReason || interactiveGovernance?.facultyReviewReason;
  const reviewOwner = override?.reviewOwner || 'Didactics governance review';
  const reviewAction =
    override?.reviewAction ||
    (cpLikeSource
      ? 'Complete CP governance review before promotion.'
      : 'Confirm the ABPath anchor before promoting this route.');

  const conflictFlags = [];
  if (KNOWN_CONFLICT_IDS.has(tutorialId)) {
    conflictFlags.push('molecular-remap-reviewed');
  }
  if (!cpLikeSource && track === 'clinical-path' && entry.primaryMapping?.domain !== 'CP') {
    conflictFlags.push('cp-track-domain-mismatch');
  }
  if (!sourceAnchorExists) {
    conflictFlags.push('missing-source-anchor');
  }
  if (cpLikeSource && !abpathReviewStatus) {
    conflictFlags.push('missing-review-status');
  }
  if (cpLikeSource && !hasRequiredPrecisionRationale({
    abpathPrecisionMode,
    nearestValidReason,
    crossDomainJustification,
    facultyReviewReason,
  })) {
    conflictFlags.push('missing-precision-rationale');
  }
  if (hasKnownConflict) {
    conflictFlags.push('known-bad-mapping');
  }
  if (cpLikeSource && abpathReviewStatus === 'confirmed' && abpathAnchorConfidence === 'low') {
    conflictFlags.push('confirmed-low-confidence');
  }

  const validatedForPromotion = cpLikeSource
    ? sourceAnchorExists &&
      abpathReviewStatus === 'confirmed' &&
      hasRequiredPrecisionRationale({
        abpathPrecisionMode,
        nearestValidReason,
        crossDomainJustification,
        facultyReviewReason,
      }) &&
      conflictFlags.every((flag) => !['missing-source-anchor', 'missing-review-status', 'missing-precision-rationale', 'confirmed-low-confidence', 'known-bad-mapping'].includes(flag))
    : sourceAnchorExists &&
      entry.status === 'mapped' &&
      entry.primaryMapping?.confidence === 'high' &&
      !hasKnownConflict &&
      !conflictFlags.includes('cp-track-domain-mismatch');

  const governancePending = !validatedForPromotion;

  tutorialRows.push({
    key: entry.tutorial.key,
    id: tutorialId,
    title: entry.tutorial.title,
    file: entry.tutorial.file,
    track,
    sourceType: interactiveGovernance ? 'interactive-cp' : cpLikeSource ? 'cp-governance' : 'crosswalk',
    abpathDomain,
    sourceAnchorExists,
    validatedForPromotion,
    governancePending,
    promotionStatus: validatedForPromotion ? 'validated' : governancePending ? 'governance-pending' : 'excluded',
    canonicalForId: false,
    canonicalSourceKey: '',
    abpathRoot,
    abpathPrimaryPath,
    abpathSpecVersion,
    abpathPrecisionMode,
    abpathAnchorConfidence,
    abpathReviewStatus,
    abpathExamRisk,
    abpathTestableTask,
    nearestValidReason,
    crossDomainJustification,
    facultyReviewReason,
    reviewOwner,
    reviewAction,
    conflictFlags,
  });

  if (cpLikeSource && !validatedForPromotion) {
    manifestFailures.push(`tutorial:${tutorialId} failed validated-only CP gate`);
  }
  if (validatedForPromotion && (!abpathRoot || !abpathPrimaryPath)) {
    manifestFailures.push(`tutorial:${tutorialId} is validated but missing ABPath scope`);
  }
  if (validatedForPromotion && track === 'clinical-path' && abpathDomain !== 'CP') {
    manifestFailures.push(`tutorial:${tutorialId} is validated as clinical-path with non-CP domain`);
  }
}

const rowsById = tutorialRows.reduce((acc, row) => {
  acc[row.id] ||= [];
  acc[row.id].push(row);
  return acc;
}, {});

for (const [tutorialId, rows] of Object.entries(rowsById)) {
  const canonical = rows
    .slice()
    .sort((left, right) => {
      const validationDelta = Number(right.validatedForPromotion) - Number(left.validatedForPromotion);
      if (validationDelta !== 0) return validationDelta;
      const leftEntry = { tutorial: { sourceRepo: (crosswalkData.crosswalk || []).find((entry) => entry.tutorial.key === left.key)?.tutorial.sourceRepo, file: left.file } };
      const rightEntry = { tutorial: { sourceRepo: (crosswalkData.crosswalk || []).find((entry) => entry.tutorial.key === right.key)?.tutorial.sourceRepo, file: right.file } };
      const priorityDelta = sourcePriority(rightEntry) - sourcePriority(leftEntry);
      if (priorityDelta !== 0) return priorityDelta;
      const domainDelta = Number(right.abpathDomain === 'CP') - Number(left.abpathDomain === 'CP');
      if (domainDelta !== 0) return domainDelta;
      return left.key.localeCompare(right.key);
    })[0];

  for (const row of rows) {
    row.canonicalSourceKey = canonical.key;
    row.canonicalForId = row.key === canonical.key;
    if (!row.canonicalForId) {
      row.validatedForPromotion = false;
      row.governancePending = false;
      row.promotionStatus = 'excluded';
      row.conflictFlags = Array.from(new Set([...(row.conflictFlags || []), 'duplicate-shadowed-by-canonical-source']));
    }
  }

  const canonicalRows = rows.filter((row) => row.canonicalForId);
  if (canonicalRows.length !== 1) {
    manifestFailures.push(`tutorial:${tutorialId} did not resolve to exactly one canonical row`);
  }
}

const moduleRows = Object.entries(cpModules).map(([moduleId, governance]) => {
  const sourceAnchorExists = Boolean(governance.abpathRootTopic && governance.abpathPrimaryPath);
  const validatedForPromotion =
    sourceAnchorExists &&
    governance.abpathReviewStatus === 'confirmed' &&
    hasRequiredPrecisionRationale(governance) &&
    !(governance.abpathReviewStatus === 'confirmed' && governance.abpathAnchorConfidence === 'low');

  if (!validatedForPromotion) {
    manifestFailures.push(`module:${moduleId} failed validated-only CP gate`);
  }

  return {
    moduleId,
    abpathRoot: governance.abpathRootTopic,
    abpathPrimaryPath: governance.abpathPrimaryPath,
    abpathSpecVersion: governance.abpathSpecVersion,
    abpathPrecisionMode: governance.abpathPrecisionMode,
    abpathAnchorConfidence: governance.abpathAnchorConfidence,
    abpathReviewStatus: governance.abpathReviewStatus,
    validatedForPromotion,
  };
});

const tutorialRowsCanonical = tutorialRows.filter((row) => row.canonicalForId);
const tutorialKeysValidated = tutorialRowsCanonical.filter((row) => row.validatedForPromotion).map((row) => row.key);
const tutorialIdsValidated = tutorialRowsCanonical.filter((row) => row.validatedForPromotion).map((row) => row.id);
const blockedTutorialKeys = tutorialRowsCanonical.filter((row) => row.governancePending).map((row) => row.key);
const blockedTutorialIds = tutorialRowsCanonical.filter((row) => row.governancePending).map((row) => row.id);
const overlap = tutorialIdsValidated.filter((id) => blockedTutorialIds.includes(id));
if (overlap.length > 0) {
  manifestFailures.push(`validated and blocked overlap: ${overlap.join(', ')}`);
}

const summary = {
  totalRows: tutorialRows.length,
  canonicalRowCount: tutorialRowsCanonical.length,
  validatedRowCount: tutorialKeysValidated.length,
  governancePendingRowCount: blockedTutorialKeys.length,
  excludedRowCount: tutorialRowsCanonical.filter((row) => row.promotionStatus === 'excluded').length,
  clinicalPathValidatedCount: tutorialRowsCanonical.filter(
    (row) => row.validatedForPromotion && row.track === 'clinical-path'
  ).length,
  cpDomainValidatedCount: tutorialRowsCanonical.filter(
    (row) => row.validatedForPromotion && row.abpathDomain === 'CP'
  ).length,
};

const sourceFingerprint = sha256(
  [
    fs.readFileSync(crosswalkPath, 'utf8'),
    fs.readFileSync(cpGovernanceReportPath, 'utf8'),
    fs.readFileSync(cpModulesPath, 'utf8'),
    fs.readFileSync(cpInteractiveTutorialsPath, 'utf8'),
    fs.readFileSync(tutorialLabelValidationPath, 'utf8'),
  ].join('\n---\n')
);

const baselineSnapshot = {
  sourceFingerprint,
  crosswalkTutorialCount: crosswalkData.counts?.tutorials ?? tutorialRows.length,
  crosswalkMappedCount: crosswalkData.counts?.mapped ?? tutorialRowsCanonical.length,
  cpGovernedTutorialCount: cpGovernanceReport.tutorialCount ?? 0,
  cpGovernedModuleCount: cpGovernanceReport.moduleCount ?? 0,
  validatedTutorialCount: tutorialIdsValidated.length,
  governancePendingTutorialCount: blockedTutorialIds.length,
  clinicalPathValidatedCount: summary.clinicalPathValidatedCount,
  cpDomainValidatedCount: summary.cpDomainValidatedCount,
};

const cpGovernedExceptionRows = tutorialRowsCanonical.filter(
  (row) =>
    row.validatedForPromotion &&
    (row.abpathDomain === 'CP' || row.track === 'clinical-path') &&
    (
      row.nearestValidReason ||
      row.crossDomainJustification ||
      row.facultyReviewReason ||
      row.abpathAnchorConfidence === 'moderate' ||
      row.abpathPrecisionMode === 'nearest-valid-deep' ||
      row.abpathPrecisionMode === 'cross-domain-governed' ||
      row.abpathPrecisionMode === 'local-teaching-only'
    ),
);

baselineSnapshot.cpGovernedExceptionSnapshot = {
  count: cpGovernedExceptionRows.length,
  ids: cpGovernedExceptionRows.map((row) => row.id),
  byPrecisionMode: Object.fromEntries(
    Array.from(
      cpGovernedExceptionRows.reduce((map, row) => {
        const key = row.abpathPrecisionMode || 'literal-or-unspecified';
        map.set(key, (map.get(key) || 0) + 1);
        return map;
      }, new Map()).entries(),
    ).sort(([a], [b]) => String(a).localeCompare(String(b))),
  ),
};

const validatedManifest = {
  generatedAt: new Date().toISOString(),
  sourceFingerprint,
  source: {
    crosswalk: 'src/content/tutorials/tutorialAbpathSpecCrosswalk.json',
    cpGovernanceReport: 'reports/cp_precision_governance_report.json',
    cpModules: 'src/content/clinical_pathology/cpGovernanceModules.json',
    cpInteractiveTutorials: 'src/content/tutorials/clinicalPathInteractiveTutorials.json',
    tutorialLabelValidation: 'reports/tutorial_label_validation.json',
  },
  summary,
  baselineSnapshot,
  tutorialKeysValidated,
  tutorialIdsValidated,
  blockedTutorialKeys,
  blockedTutorialIds,
  rows: tutorialRows,
  modules: moduleRows,
};

ensureDir(manifestReportPath);
ensureDir(manifestSourcePath);
fs.writeFileSync(manifestReportPath, JSON.stringify(validatedManifest, null, 2) + '\n');
fs.writeFileSync(manifestSourcePath, JSON.stringify(validatedManifest, null, 2) + '\n');

if (fs.readFileSync(manifestReportPath, 'utf8') !== fs.readFileSync(manifestSourcePath, 'utf8')) {
  manifestFailures.push('report and source manifest drifted during write');
}

if ((cpGovernanceReport.failures || []).length > 0) {
  manifestFailures.push('cp_precision_governance_report.json contains failures');
}

if (manifestFailures.length > 0) {
  console.error(`[VALIDATED-MAPPINGS] Validation failed with ${manifestFailures.length} issue(s).`);
  manifestFailures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(
  `[VALIDATED-MAPPINGS] Wrote ${validatedManifest.tutorialIdsValidated.length} validated tutorials and ${validatedManifest.blockedTutorialIds.length} governance-pending tutorials.`
);
