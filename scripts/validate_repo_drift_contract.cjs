#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = process.cwd();
const contractPath = path.join(root, 'src/content/contracts/repoDriftContract.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const rel = (filePath) => path.relative(root, filePath);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const toSortedUnique = (values) => Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
const sameOrderedValues = (left, right) => JSON.stringify(left) === JSON.stringify(right);

const contract = readJson(contractPath);
const failures = [];
const passes = [];

const ensure = (condition, passMessage, failMessage) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

for (const pair of contract.mirroredArtifacts || []) {
  const authoritativePath = path.join(root, pair.authoritative);
  const mirrorPath = path.join(root, pair.mirror);
  const authoritative = fs.readFileSync(authoritativePath, 'utf8');
  const mirror = fs.readFileSync(mirrorPath, 'utf8');
  ensure(
    authoritative === mirror,
    `${pair.label} mirror matches authoritative artifact`,
    `${pair.label} mirror drifted: ${pair.authoritative} != ${pair.mirror}`
  );
}

const provenanceContract = contract.provenanceContract;
const provenanceReport = readJson(path.join(root, provenanceContract.report));
const workstationIndex = readJson(path.join(root, provenanceContract.workstationIndex));
const assetRegistry = readJson(path.join(root, provenanceContract.assetRegistry));

const reportPaths = provenanceReport.records.map((record) => record.file_path);
const workstationPaths = workstationIndex.records.map((record) => record.file_path);
const registryPaths = assetRegistry.assets.map((record) => record.file_path);

ensure(
  provenanceReport.summary.total_files === provenanceReport.records.length,
  'corpus report total_files matches record count',
  'corpus report total_files does not match record count'
);
ensure(
  workstationIndex.summary.total_files === workstationIndex.records.length,
  'workstation index total_files matches record count',
  'workstation index total_files does not match record count'
);
ensure(
  assetRegistry.assets.length === provenanceReport.records.length,
  'asset registry length matches corpus report',
  'asset registry length does not match corpus report'
);
ensure(
  JSON.stringify(reportPaths) === JSON.stringify(workstationPaths),
  'corpus report and workstation index path ordering align',
  'corpus report and workstation index path ordering drifted'
);
ensure(
  JSON.stringify(reportPaths) === JSON.stringify(registryPaths),
  'corpus report and asset registry path ordering align',
  'corpus report and asset registry path ordering drifted'
);
ensure(
  provenanceReport.records.every((record) => record.provenance?.source === provenanceContract.requiredProvenanceSource),
  'all corpus records carry the required provenance source',
  'one or more corpus records are missing the required provenance source'
);

const forbiddenFragments = provenanceContract.forbiddenPathFragments || [];
const badPaths = reportPaths.filter((filePath) =>
  forbiddenFragments.some((fragment) => new RegExp(`(?:^|/)${fragment}(?:/|$)`, 'i').test(filePath))
);
ensure(
  badPaths.length === 0,
  'corpus report excludes forbidden path fragments',
  `corpus report contains forbidden path fragments: ${badPaths.slice(0, 10).join(', ')}`
);

const allowedSelfRefs = new Set(provenanceContract.allowedSelfReferenceFiles || []);
const presentSelfRefs = reportPaths.filter((filePath) => allowedSelfRefs.has(filePath));
ensure(
  presentSelfRefs.every((filePath) => allowedSelfRefs.has(filePath)),
  'present corpus self-references are allowlisted',
  'corpus contains non-allowlisted self-references'
);

const imageCount = provenanceReport.records.filter((record) => record.file_type === 'image').length;
ensure(
  provenanceReport.summary.counts_by_file_type.image === imageCount,
  'image file_type summary matches realized records',
  'image file_type summary drifted from realized records'
);

const reportFingerprint = sha256(JSON.stringify(reportPaths));
const workstationFingerprint = sha256(JSON.stringify(workstationPaths));
const registryFingerprint = sha256(JSON.stringify(registryPaths));
ensure(
  reportFingerprint === workstationFingerprint && reportFingerprint === registryFingerprint,
  'provenance path fingerprints align across all three artifacts',
  'provenance path fingerprints drifted across artifacts'
);

const tutorialContract = contract.validatedTutorialContract;
const validatedManifest = readJson(path.join(root, tutorialContract.report));
const canonicalRows = validatedManifest.rows.filter((row) => row.canonicalForId);
const canonicalIds = canonicalRows.map((row) => row.id);
const duplicateCanonicalIds = canonicalIds.filter((id, index) => canonicalIds.indexOf(id) !== index);
ensure(
  !tutorialContract.requireCanonicalSourcePerTutorialId || duplicateCanonicalIds.length === 0,
  'validated tutorial manifest resolves to one canonical row per tutorial id',
  `validated tutorial manifest has duplicate canonical ids: ${Array.from(new Set(duplicateCanonicalIds)).join(', ')}`
);

const validatedRows = canonicalRows.filter((row) => row.validatedForPromotion);
ensure(
  !tutorialContract.requireValidatedRowsToCarryScope ||
    validatedRows.every((row) => Boolean(row.abpathRoot && row.abpathPrimaryPath)),
  'validated tutorial rows all carry ABPath scope',
  'one or more validated tutorial rows are missing ABPath scope'
);
ensure(
  !tutorialContract.requireClinicalPathRowsToUseCpDomain ||
    validatedRows
      .filter((row) => row.track === 'clinical-path')
      .every((row) => row.abpathDomain === 'CP'),
  'validated clinical-path tutorial rows use CP domain',
  'one or more validated clinical-path tutorial rows are not CP-domain anchored'
);

const deniedFlags = new Set(tutorialContract.denyConflictFlagsOnValidatedRows || []);
const validatedRowsWithDeniedFlags = validatedRows.filter((row) =>
  (row.conflictFlags || []).some((flag) => deniedFlags.has(flag))
);
ensure(
  validatedRowsWithDeniedFlags.length === 0,
  'validated tutorial rows are free of denied conflict flags',
  `validated tutorial rows carry denied conflict flags: ${validatedRowsWithDeniedFlags
    .slice(0, 10)
    .map((row) => row.id)
    .join(', ')}`
);

const validatedKeySet = canonicalRows.filter((row) => row.validatedForPromotion).map((row) => row.key);
const validatedIdSet = canonicalRows.filter((row) => row.validatedForPromotion).map((row) => row.id);
const blockedKeySet = canonicalRows.filter((row) => row.governancePending).map((row) => row.key);
const blockedIdSet = canonicalRows.filter((row) => row.governancePending).map((row) => row.id);

ensure(
  !tutorialContract.requireKeySetParity ||
    sameOrderedValues(validatedManifest.tutorialKeysValidated, validatedKeySet),
  'validated manifest tutorialKeysValidated matches canonical validated rows',
  'validated manifest tutorialKeysValidated drifted from canonical validated rows'
);
ensure(
  !tutorialContract.requireKeySetParity ||
    sameOrderedValues(validatedManifest.tutorialIdsValidated, validatedIdSet),
  'validated manifest tutorialIdsValidated matches canonical validated rows',
  'validated manifest tutorialIdsValidated drifted from canonical validated rows'
);
ensure(
  !tutorialContract.requireKeySetParity ||
    sameOrderedValues(validatedManifest.blockedTutorialKeys, blockedKeySet),
  'validated manifest blockedTutorialKeys matches canonical governance-pending rows',
  'validated manifest blockedTutorialKeys drifted from canonical governance-pending rows'
);
ensure(
  !tutorialContract.requireKeySetParity ||
    sameOrderedValues(validatedManifest.blockedTutorialIds, blockedIdSet),
  'validated manifest blockedTutorialIds matches canonical governance-pending rows',
  'validated manifest blockedTutorialIds drifted from canonical governance-pending rows'
);

ensure(
  !tutorialContract.requireKeySetParity ||
    validatedManifest.tutorialKeysValidated.length === toSortedUnique(validatedManifest.tutorialKeysValidated).length,
  'validated manifest tutorialKeysValidated is duplicate-free',
  'validated manifest tutorialKeysValidated contains duplicates'
);
ensure(
  !tutorialContract.requireKeySetParity ||
    validatedManifest.blockedTutorialKeys.length === toSortedUnique(validatedManifest.blockedTutorialKeys).length,
  'validated manifest blockedTutorialKeys is duplicate-free',
  'validated manifest blockedTutorialKeys contains duplicates'
);

const manifestSummary = validatedManifest.summary || {};
ensure(
  !tutorialContract.requireSummaryAlignment || manifestSummary.totalRows === validatedManifest.rows.length,
  'validated manifest summary totalRows matches rows length',
  'validated manifest summary totalRows drifted from rows length'
);
ensure(
  !tutorialContract.requireSummaryAlignment || manifestSummary.canonicalRowCount === canonicalRows.length,
  'validated manifest summary canonicalRowCount matches canonical rows',
  'validated manifest summary canonicalRowCount drifted from canonical rows'
);
ensure(
  !tutorialContract.requireSummaryAlignment || manifestSummary.validatedRowCount === validatedKeySet.length,
  'validated manifest summary validatedRowCount matches validated rows',
  'validated manifest summary validatedRowCount drifted from validated rows'
);
ensure(
  !tutorialContract.requireSummaryAlignment || manifestSummary.governancePendingRowCount === blockedKeySet.length,
  'validated manifest summary governancePendingRowCount matches blocked rows',
  'validated manifest summary governancePendingRowCount drifted from blocked rows'
);
ensure(
  !tutorialContract.requireSummaryAlignment ||
    manifestSummary.excludedRowCount === canonicalRows.filter((row) => row.promotionStatus === 'excluded').length,
  'validated manifest summary excludedRowCount matches excluded canonical rows',
  'validated manifest summary excludedRowCount drifted from excluded canonical rows'
);
ensure(
  !tutorialContract.requireSummaryAlignment ||
    manifestSummary.clinicalPathValidatedCount ===
      canonicalRows.filter((row) => row.validatedForPromotion && row.track === 'clinical-path').length,
  'validated manifest summary clinicalPathValidatedCount matches validated clinical-path rows',
  'validated manifest summary clinicalPathValidatedCount drifted from validated clinical-path rows'
);
ensure(
  !tutorialContract.requireSummaryAlignment ||
    manifestSummary.cpDomainValidatedCount ===
      canonicalRows.filter((row) => row.validatedForPromotion && row.abpathDomain === 'CP').length,
  'validated manifest summary cpDomainValidatedCount matches CP-domain validated rows',
  'validated manifest summary cpDomainValidatedCount drifted from CP-domain validated rows'
);

ensure(
  !(tutorialContract.requiredSourceArtifacts || []).length ||
    (tutorialContract.requiredSourceArtifacts || []).every((sourcePath) =>
      Object.values(validatedManifest.source || {}).includes(sourcePath)
    ),
  'validated manifest source block lists every required source artifact',
  'validated manifest source block is missing one or more required source artifacts'
);

if (failures.length > 0) {
  console.error(`[REPO-DRIFT] Validation failed with ${failures.length} issue(s).`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`[REPO-DRIFT] Validation passed with ${passes.length} checks.`);
