#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const crosswalkPath = path.join(root, 'src/content/tutorials/tutorialAbpathSpecCrosswalk.json');
const manifestPath = path.join(root, 'reports/validated_mappings_manifest.json');
const governancePath = path.join(root, 'reports/cp_precision_governance_report.json');
const handoffPath = path.join(root, 'reports/cp_truth_handoff_summary.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const outJsonPath = path.join(root, 'reports/w02_cp_truth_baseline_packet.json');
const outMdPath = path.join(root, 'reports/w02_cp_truth_baseline_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const crosswalk = readJson(crosswalkPath);
const manifest = readJson(manifestPath);
const governance = readJson(governancePath);
const handoff = readJson(handoffPath);
const ledger = readJson(ledgerPath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T06');

if (!tranche) {
  throw new Error('Missing T06 tranche in full_1000_execution_ledger.json');
}

const crosswalkRows = Array.isArray(crosswalk.crosswalk) ? crosswalk.crosswalk : [];
const manifestRows = Array.isArray(manifest.rows) ? manifest.rows : [];
const reviewedRows = manifestRows.filter((row) => row.validatedForPromotion === true);
const notReviewedRows = manifestRows.filter((row) => row.validatedForPromotion !== true);
const cpReviewedRows = reviewedRows.filter((row) => row.abpathDomain === 'CP');
const cpExceptionRows = manifestRows.filter((row) =>
  ['cross-domain-governed', 'nearest-valid-deep'].includes(row.abpathPrecisionMode)
);

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T06 W02 CP Truth',
  source: {
    crosswalk: 'src/content/tutorials/tutorialAbpathSpecCrosswalk.json',
    validatedManifest: 'reports/validated_mappings_manifest.json',
    cpGovernanceReport: 'reports/cp_precision_governance_report.json',
    cpTruthHandoff: 'reports/cp_truth_handoff_summary.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
  },
  baseline: {
    rawCrosswalkTutorialCount: crosswalk.counts?.tutorials ?? crosswalkRows.length,
    rawCrosswalkMappedCount: crosswalk.counts?.mapped ?? crosswalkRows.filter((row) => row.abpathPrimaryPath).length,
    manifestTotalRows: manifest.summary?.totalRows ?? manifestRows.length,
    reviewedForPromotionRows: reviewedRows.length,
    notYetReviewedRows: notReviewedRows.length,
    cpReviewedRows: cpReviewedRows.length,
    cpGovernedTutorials: governance.tutorialCount,
    cpGovernedModules: governance.moduleCount,
    sourceFingerprint: manifest.sourceFingerprint,
  },
  reconciliationGap: {
    rawVsReviewedGap: (crosswalk.counts?.tutorials ?? crosswalkRows.length) - reviewedRows.length,
    currentNotReviewedIds: notReviewedRows.map((row) => row.id),
    cpGovernedExceptionCount: cpExceptionRows.length,
    cpGovernedExceptionIds: cpExceptionRows.map((row) => row.id),
  },
  execution: {
    completedStepIds: tranche.completionEvidence.completedStepIds,
    proofCommands: [
      'npm run cp:precision:validate',
      'node scripts/validate_validated_mappings_manifest.cjs',
      'npx vitest run scripts/validate_w02_cp_truth_baseline_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      (crosswalk.counts?.tutorials ?? crosswalkRows.length) === 493 &&
      reviewedRows.length === 487 &&
      notReviewedRows.length === 6 &&
      governance.tutorialCount === 13 &&
      governance.moduleCount === 7,
    staleWhen: [
      'the crosswalk, validated manifest, or CP governance report changes without regenerating this packet',
      'the reviewed-versus-raw row counts change without regenerating this packet',
      'the tranche ledger status or completed step list changes without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 CP Truth Baseline Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Baseline',
  '',
  `- Raw crosswalk tutorials: ${payload.baseline.rawCrosswalkTutorialCount}`,
  `- Raw crosswalk mapped rows: ${payload.baseline.rawCrosswalkMappedCount}`,
  `- Manifest total rows: ${payload.baseline.manifestTotalRows}`,
  `- Reviewed-for-promotion rows: ${payload.baseline.reviewedForPromotionRows}`,
  `- Not-yet-reviewed rows: ${payload.baseline.notYetReviewedRows}`,
  `- CP reviewed rows: ${payload.baseline.cpReviewedRows}`,
  `- CP governed tutorials: ${payload.baseline.cpGovernedTutorials}`,
  `- CP governed modules: ${payload.baseline.cpGovernedModules}`,
  `- Source fingerprint: ${payload.baseline.sourceFingerprint}`,
  '',
  '## Reconciliation Gap',
  '',
  `- Raw vs reviewed gap: ${payload.reconciliationGap.rawVsReviewedGap}`,
  `- Not-yet-reviewed ids: ${payload.reconciliationGap.currentNotReviewedIds.join(', ')}`,
  `- CP governed exception count: ${payload.reconciliationGap.cpGovernedExceptionCount}`,
  `- CP governed exception ids: ${payload.reconciliationGap.cpGovernedExceptionIds.join(', ')}`,
  '',
  '## Execution',
  '',
  `- Completed step ids: ${payload.execution.completedStepIds.join(', ')}`,
  `- Proof commands: ${payload.execution.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Completion Gate',
  '',
  `- Baseline green: ${payload.completionGate.baselineGreen ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-CP-TRUTH-BASELINE] Wrote baseline packet for ${payload.tranche}.`);
