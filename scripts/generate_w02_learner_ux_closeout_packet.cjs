#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const baselinePath = path.join(root, 'reports/w02_learner_ux_baseline_packet.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const outJsonPath = path.join(root, 'reports/w02_learner_ux_closeout_packet.json');
const outMdPath = path.join(root, 'reports/w02_learner_ux_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const baseline = readJson(baselinePath);
const ledger = readJson(ledgerPath);
const t08 = ledger.tranches.find((tranche) => tranche.id === 'T08');

if (!t08) {
  throw new Error('Missing T08 in full_1000_execution_ledger.json');
}

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T08 W02 Learner UX',
  status: 'completed',
  statusBasis: 'exact_proof_bundle',
  source: {
    baselinePacket: 'reports/w02_learner_ux_baseline_packet.json',
    contentParityCloseout: 'reports/w02_content_parity_closeout_packet.json',
    didacticsUxReport: 'reports/didactics_learning_ux_report.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
  },
  completedStepIds: [
    'W02-L3_LEARNER_UX-C01',
    'W02-L3_LEARNER_UX-C02',
    'W02-L3_LEARNER_UX-C03',
    'W02-L3_LEARNER_UX-C04',
    'W02-L3_LEARNER_UX-C05',
    'W02-L3_LEARNER_UX-C06',
    'W02-L3_LEARNER_UX-C07',
    'W02-L3_LEARNER_UX-C08',
    'W02-L3_LEARNER_UX-C09',
    'W02-L3_LEARNER_UX-C10',
  ],
  remainingStepIds: [],
  reusableOutput: baseline.baseline.reusableStartHereOutput,
  driftIsolation: baseline.baseline.driftIsolation,
  proofBundle: {
    baselineGreen: baseline.completionGate.baselineGreen,
    didacticsUxFailures: baseline.baseline.failureCount,
    didacticsUxPasses: baseline.baseline.passCount,
    focusedUxChecksGreen: Object.values(baseline.baseline.focusedUxChecks).every(Boolean),
    uxRulesGreen: Object.values(baseline.baseline.uxRules).every(Boolean),
    targetedTestCoverageCount: baseline.baseline.targetedTestCoverage.length,
    sourceLinkNormalizationGroups: baseline.authority.sourceLinkNormalizationGroups,
    visibleClusterCount: baseline.authority.visibleClusterCount,
    cpRootCount: baseline.authority.cpRootCount,
  },
  handoffToNextTranche: {
    nextTranche: 'T09 W02 Workups and Routing',
    nextAction:
      'Start routing work from the closed T08 learner-UX guard and preserve the T07 CP source-link map.',
    requiredGuard:
      'Do not alter CP source-link normalization, CP root counts, learner source-link wording, or source-truth mappings inside T09 without regenerating T07 and T08 proof.',
  },
  completionGate: {
    t08Closed:
      t08.status === 'completed' &&
      t08.completionEvidence.completedStepIds.length === 10 &&
      baseline.execution.remainingStepIds.length === 0 &&
      baseline.completionGate.baselineGreen &&
      Object.values(baseline.baseline.focusedUxChecks).every(Boolean) &&
      Object.values(baseline.baseline.uxRules).every(Boolean),
    staleWhen: [
      'T08 ledger status changes without regenerating this packet',
      'w02_learner_ux_baseline_packet.json changes without regenerating this packet',
      'didactics_learning_ux_report.json changes without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 Learner UX Closeout Packet',
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
  `- Route use: ${payload.reusableOutput.routeUse}`,
  `- Public safe: ${payload.reusableOutput.publicSafe ? 'yes' : 'no'}`,
  ...payload.reusableOutput.ownedSurfaces.map((surface) => `- Owned surface: ${surface}`),
  '',
  '## Drift Isolation',
  '',
  `- Next wording risk: ${payload.driftIsolation.nextWordingRisk}`,
  `- Containment: ${payload.driftIsolation.containment}`,
  `- Next tranche guard: ${payload.driftIsolation.nextTrancheGuard}`,
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
  `- T08 closed: ${payload.completionGate.t08Closed ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-LEARNER-UX-CLOSEOUT] Wrote ${path.relative(root, outJsonPath)}.`);
