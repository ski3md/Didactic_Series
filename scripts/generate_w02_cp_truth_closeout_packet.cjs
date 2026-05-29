#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const baselinePath = path.join(root, 'reports/w02_cp_truth_baseline_packet.json');
const duplicatePath = path.join(root, 'reports/w02_cp_truth_duplicate_shadow_packet.json');
const coveragePath = path.join(root, 'reports/w02_cp_truth_mapping_coverage_packet.json');
const outJsonPath = path.join(root, 'reports/w02_cp_truth_closeout_packet.json');
const outMdPath = path.join(root, 'reports/w02_cp_truth_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const ledger = readJson(ledgerPath);
const baseline = readJson(baselinePath);
const duplicate = readJson(duplicatePath);
const coverage = readJson(coveragePath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T06');

if (!tranche) {
  throw new Error('Missing T06 tranche in full_1000_execution_ledger.json');
}

const completedStepIds = tranche.completionEvidence.completedStepIds;
const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T06 W02 CP Truth',
  status: tranche.status,
  statusBasis: tranche.statusBasis,
  source: {
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
    baselinePacket: 'reports/w02_cp_truth_baseline_packet.json',
    duplicateShadowPacket: 'reports/w02_cp_truth_duplicate_shadow_packet.json',
    mappingCoveragePacket: 'reports/w02_cp_truth_mapping_coverage_packet.json',
  },
  completedStepIds,
  remainingStepIds: tranche.completionEvidence.remainingStepIds,
  proofBundle: {
    baselineGreen: baseline.completionGate.baselineGreen,
    duplicateShadowQueueUnderstood: duplicate.completionGate.duplicateShadowQueueUnderstood,
    targetedMappingCoverageGreen: coverage.completionGate.targetedMappingCoverageGreen,
    sourceMapReviewCount: duplicate.summary.sourceMapReviewCount,
    cpDomainValidatedRows: coverage.coverage.cpDomainValidatedRows,
    cpRootCount: coverage.coverage.cpRootCount,
  },
  handoffToNextTranche: {
    nextTranche: 'T07 W02 Content Parity',
    nextAction:
      'Start W02 content parity from the reviewed CP truth baseline, duplicate-shadow exclusions, and targeted CP mapping coverage packet.',
    requiredGuard:
      'Do not change source-truth mappings inside T07 unless T06 proof packets are regenerated first.',
  },
  completionGate: {
    t06Closed:
      tranche.status === 'completed' &&
      completedStepIds.length === 10 &&
      tranche.completionEvidence.remainingStepIds.length === 0 &&
      baseline.completionGate.baselineGreen === true &&
      duplicate.completionGate.duplicateShadowQueueUnderstood === true &&
      coverage.completionGate.targetedMappingCoverageGreen === true,
    staleWhen: [
      'the T06 ledger status changes without regenerating this packet',
      'any W02 CP truth proof packet changes without regenerating this packet',
      'T07 begins before this packet reports a closed T06 handoff',
    ],
  },
};

const md = [
  '# W02 CP Truth Closeout Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  `Status: ${payload.status}`,
  `Status basis: ${payload.statusBasis}`,
  '',
  '## Completed Steps',
  '',
  ...payload.completedStepIds.map((stepId) => `- ${stepId}`),
  '',
  '## Proof Bundle',
  '',
  `- Baseline green: ${payload.proofBundle.baselineGreen ? 'yes' : 'no'}`,
  `- Duplicate-shadow queue understood: ${payload.proofBundle.duplicateShadowQueueUnderstood ? 'yes' : 'no'}`,
  `- Targeted mapping coverage green: ${payload.proofBundle.targetedMappingCoverageGreen ? 'yes' : 'no'}`,
  `- Source-map review count: ${payload.proofBundle.sourceMapReviewCount}`,
  `- CP-domain validated rows: ${payload.proofBundle.cpDomainValidatedRows}`,
  `- CP root count: ${payload.proofBundle.cpRootCount}`,
  '',
  '## Handoff',
  '',
  `- Next tranche: ${payload.handoffToNextTranche.nextTranche}`,
  `- Next action: ${payload.handoffToNextTranche.nextAction}`,
  `- Guard: ${payload.handoffToNextTranche.requiredGuard}`,
  '',
  '## Completion Gate',
  '',
  `- T06 closed: ${payload.completionGate.t06Closed ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-CP-TRUTH-CLOSEOUT] Wrote closeout packet for ${payload.tranche}.`);
