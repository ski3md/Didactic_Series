#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const manifestPath = path.join(root, 'reports/validated_mappings_manifest.json');
const governancePath = path.join(root, 'reports/cp_precision_governance_report.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const outJsonPath = path.join(root, 'reports/w02_cp_truth_mapping_coverage_packet.json');
const outMdPath = path.join(root, 'reports/w02_cp_truth_mapping_coverage_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const countBy = (rows, getKey) =>
  rows.reduce((counts, row) => {
    const key = getKey(row) || 'missing';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

const manifest = readJson(manifestPath);
const governance = readJson(governancePath);
const ledger = readJson(ledgerPath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T06');

if (!tranche) {
  throw new Error('Missing T06 tranche in full_1000_execution_ledger.json');
}

const rows = Array.isArray(manifest.rows) ? manifest.rows : [];
const validatedCpRows = rows.filter((row) => row.validatedForPromotion === true && row.abpathDomain === 'CP');
const governedCpRows = validatedCpRows.filter((row) =>
  ['cp-governance', 'interactive-cp'].includes(row.sourceType)
);
const crosswalkCpRows = validatedCpRows.filter((row) => row.sourceType === 'crosswalk');
const duplicateShadowRows = rows.filter((row) =>
  (row.conflictFlags || []).includes('duplicate-shadowed-by-canonical-source')
);
const roots = countBy(validatedCpRows, (row) => row.abpathRoot);
const precisionModes = countBy(validatedCpRows, (row) => row.abpathPrecisionMode);
const sourceTypes = countBy(validatedCpRows, (row) => row.sourceType);
const reviewStatuses = countBy(validatedCpRows, (row) => row.abpathReviewStatus);
const missingReviewOwnerRows = validatedCpRows.filter((row) => !row.reviewOwner || !row.reviewAction);
const unmappedRows = validatedCpRows.filter((row) => !row.abpathRoot || !row.abpathPrimaryPath);

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T06 W02 CP Truth',
  source: {
    validatedManifest: 'reports/validated_mappings_manifest.json',
    cpGovernanceReport: 'reports/cp_precision_governance_report.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
  },
  coverage: {
    cpDomainValidatedRows: validatedCpRows.length,
    cpGovernedRows: governedCpRows.length,
    cpCrosswalkRows: crosswalkCpRows.length,
    cpRootCount: Object.keys(roots).length,
    roots,
    sourceTypes,
    precisionModes,
    reviewStatuses,
  },
  reviewability: {
    missingReviewOwnerCount: missingReviewOwnerRows.length,
    missingReviewOwnerIds: missingReviewOwnerRows.map((row) => row.id),
    unmappedValidatedCpCount: unmappedRows.length,
    unmappedValidatedCpIds: unmappedRows.map((row) => row.id),
    duplicateShadowCount: duplicateShadowRows.length,
  },
  driftRisks: {
    governedExceptionCount: governedCpRows.filter((row) =>
      ['cross-domain-governed', 'nearest-valid-deep'].includes(row.abpathPrecisionMode)
    ).length,
    crosswalkRowsWithoutExplicitReviewStatus: crosswalkCpRows.filter((row) => !row.abpathReviewStatus).length,
    sourceFingerprint: manifest.sourceFingerprint,
  },
  execution: {
    completedStepIds: tranche.completionEvidence.completedStepIds,
    proofCommands: [
      'npm run cp:precision:validate',
      'node scripts/validate_validated_mappings_manifest.cjs',
      'npx vitest run scripts/validate_w02_cp_truth_mapping_coverage_packet.test.ts scripts/validate_w02_cp_truth_checks.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    targetedMappingCoverageGreen:
      validatedCpRows.length === manifest.summary?.cpDomainValidatedCount &&
      Object.keys(roots).length === 6 &&
      missingReviewOwnerRows.length === 0 &&
      unmappedRows.length === 0 &&
      governance.tutorialCount === 13 &&
      duplicateShadowRows.length === 6,
    staleWhen: [
      'the validated mappings manifest changes without regenerating this packet',
      'the CP governance report changes without regenerating this packet',
      'the T06 completed step list changes without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 CP Truth Mapping Coverage Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Coverage',
  '',
  `- CP-domain validated rows: ${payload.coverage.cpDomainValidatedRows}`,
  `- CP-governed rows: ${payload.coverage.cpGovernedRows}`,
  `- CP crosswalk rows: ${payload.coverage.cpCrosswalkRows}`,
  `- CP root count: ${payload.coverage.cpRootCount}`,
  `- Roots: ${Object.entries(payload.coverage.roots).map(([rootLabel, count]) => `${rootLabel} (${count})`).join(', ')}`,
  `- Source types: ${Object.entries(payload.coverage.sourceTypes).map(([sourceType, count]) => `${sourceType}: ${count}`).join(', ')}`,
  '',
  '## Reviewability',
  '',
  `- Missing review owner/action rows: ${payload.reviewability.missingReviewOwnerCount}`,
  `- Unmapped validated CP rows: ${payload.reviewability.unmappedValidatedCpCount}`,
  `- Duplicate-shadow rows: ${payload.reviewability.duplicateShadowCount}`,
  '',
  '## Drift Risks',
  '',
  `- Governed exception count: ${payload.driftRisks.governedExceptionCount}`,
  `- Crosswalk CP rows without explicit review status: ${payload.driftRisks.crosswalkRowsWithoutExplicitReviewStatus}`,
  `- Source fingerprint: ${payload.driftRisks.sourceFingerprint}`,
  '',
  '## Execution',
  '',
  `- Completed step ids: ${payload.execution.completedStepIds.join(', ')}`,
  `- Proof commands: ${payload.execution.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Completion Gate',
  '',
  `- Targeted mapping coverage green: ${payload.completionGate.targetedMappingCoverageGreen ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-CP-TRUTH-MAPPING-COVERAGE] Wrote mapping coverage packet for ${payload.tranche}.`);
