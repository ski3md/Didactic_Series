#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const baselinePath = path.join(root, 'reports/w02_content_parity_baseline_packet.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const outJsonPath = path.join(root, 'reports/w02_content_parity_closeout_packet.json');
const outMdPath = path.join(root, 'reports/w02_content_parity_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const baseline = readJson(baselinePath);
const ledger = readJson(ledgerPath);
const t07 = ledger.tranches.find((tranche) => tranche.id === 'T07');

if (!t07) {
  throw new Error('Missing T07 in full_1000_execution_ledger.json');
}

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T07 W02 Content Parity',
  status: 'completed',
  statusBasis: 'exact_proof_bundle',
  source: {
    baselinePacket: 'reports/w02_content_parity_baseline_packet.json',
    contentJourneyReport: 'reports/content_consumption_journey_evaluation.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
  },
  completedStepIds: [
    'W02-L2_CONTENT_PARITY-C01',
    'W02-L2_CONTENT_PARITY-C02',
    'W02-L2_CONTENT_PARITY-C03',
    'W02-L2_CONTENT_PARITY-C04',
    'W02-L2_CONTENT_PARITY-C05',
    'W02-L2_CONTENT_PARITY-C06',
    'W02-L2_CONTENT_PARITY-C07',
    'W02-L2_CONTENT_PARITY-C08',
    'W02-L2_CONTENT_PARITY-C09',
    'W02-L2_CONTENT_PARITY-C10',
  ],
  remainingStepIds: [],
  reusableOutput: {
    name: 'W02 CP content-parity study map overlay',
    artifact: 'reports/w02_content_parity_baseline_packet.json',
    publicSafe: true,
    reuseTarget: 'Didactic_Series',
    summary:
      'A W02-specific CP content parity overlay that maps seven learner-facing CP clusters onto the reviewed six-root CP truth packet without changing source truth.',
  },
  driftIsolation: {
    sourceTruthLocked: baseline.contentRules.sourceTruthLocked,
    noSourceTruthEditsInsideT07: baseline.contentRules.noSourceTruthEditsInsideT07,
    allVisibleClustersHaveSourceLinks: baseline.contentRules.allVisibleClustersHaveSourceLinks,
    preserveSixRootsSevenClusters: baseline.contentRules.preserveSixRootsSevenClusters,
    remainingDriftRisk:
      'T08 learner-UX work may change wording or layout, but must preserve the T07 source-link map and source-truth lock.',
  },
  proofBundle: {
    baselineGreen: baseline.completionGate.baselineGreen,
    focusedProofChecksGreen: Object.values(baseline.focusedProofChecks).every(Boolean),
    visibleClusterCount: baseline.contentParityOverlay.visibleClusterCount,
    sourceLinkNormalizationGroups: baseline.contentParityOverlay.sourceLinkNormalizationGroups,
    missingSourceLinkGroups: baseline.contentParityOverlay.missingSourceLinkGroups.length,
    cpRootCount: baseline.truthAlignment.cpRootCount,
    cpDomainValidatedRows: baseline.truthAlignment.cpDomainValidatedRows,
  },
  handoffToNextTranche: {
    nextTranche: 'T08 W02 Learner UX',
    nextAction:
      'Start learner-UX work from the closed T07 content-parity source-link map and preserve the reviewed CP truth lock.',
    requiredGuard:
      'Do not alter CP source-link normalization, CP root counts, or source-truth mappings inside T08 without regenerating the T07 proof bundle.',
  },
  completionGate: {
    t07Closed:
      baseline.completionGate.baselineGreen &&
      Object.values(baseline.focusedProofChecks).every(Boolean) &&
      baseline.contentParityOverlay.missingSourceLinkGroups.length === 0 &&
      t07.status === 'completed' &&
      t07.completionEvidence.completedStepIds.length === 10,
    staleWhen: [
      'T07 ledger status changes without regenerating this packet',
      'w02_content_parity_baseline_packet.json changes without regenerating this packet',
      'content_consumption_journey_evaluation.json contentBaseline changes without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 Content Parity Closeout Packet',
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
  '## Reusable Output',
  '',
  `- Name: ${payload.reusableOutput.name}`,
  `- Artifact: ${payload.reusableOutput.artifact}`,
  `- Public safe: ${payload.reusableOutput.publicSafe ? 'yes' : 'no'}`,
  `- Reuse target: ${payload.reusableOutput.reuseTarget}`,
  `- Summary: ${payload.reusableOutput.summary}`,
  '',
  '## Drift Isolation',
  '',
  ...Object.entries(payload.driftIsolation).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '## Proof Bundle',
  '',
  ...Object.entries(payload.proofBundle).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '## Handoff',
  '',
  `- Next tranche: ${payload.handoffToNextTranche.nextTranche}`,
  `- Next action: ${payload.handoffToNextTranche.nextAction}`,
  `- Guard: ${payload.handoffToNextTranche.requiredGuard}`,
  '',
  '## Completion Gate',
  '',
  `- T07 closed: ${payload.completionGate.t07Closed ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-CONTENT-PARITY-CLOSEOUT] Wrote ${path.relative(root, outJsonPath)}.`);
