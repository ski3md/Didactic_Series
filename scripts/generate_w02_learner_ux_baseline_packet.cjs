#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const t07CloseoutPath = path.join(root, 'reports/w02_content_parity_closeout_packet.json');
const uxReportPath = path.join(root, 'reports/didactics_learning_ux_report.json');
const outJsonPath = path.join(root, 'reports/w02_learner_ux_baseline_packet.json');
const outMdPath = path.join(root, 'reports/w02_learner_ux_baseline_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const t07Closeout = readJson(t07CloseoutPath);
const uxReport = readJson(uxReportPath);

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T08 W02 Learner UX',
  status: 'in_progress',
  source: {
    t07Closeout: 'reports/w02_content_parity_closeout_packet.json',
    didacticsUxReport: 'reports/didactics_learning_ux_report.json',
  },
  authority: {
    t07Closed: t07Closeout.tranche === 'T07 W02 Content Parity' && t07Closeout.status === 'completed',
    t07NextTranche: t07Closeout.handoffToNextTranche.nextTranche,
    t07Guard: t07Closeout.handoffToNextTranche.requiredGuard,
    sourceLinkNormalizationGroups: t07Closeout.proofBundle.sourceLinkNormalizationGroups,
    visibleClusterCount: t07Closeout.proofBundle.visibleClusterCount,
    cpRootCount: t07Closeout.proofBundle.cpRootCount,
  },
  baseline: {
    contractVersion: uxReport.contractVersion,
    passCount: uxReport.passes.length,
    failureCount: uxReport.failures.length,
    ownedSurfaces: [
      'src/components/Home.tsx',
      'src/components/PathologyCurriculum.tsx',
      'src/components/ReferenceLibrary.tsx',
      'src/components/CompetencyMatrix.tsx',
    ],
    learnerUxFocus:
      'Improve orientation and plain wording while preserving the T07 source-link map and reviewed CP truth lock.',
    learnerPathClarity: [
      'Home frames CP as a source-linked pathway rather than a generic tutorial shelf.',
      'Pathology Curriculum tells learners to use the linked CP tutorial or operational studio before supporting review.',
      'Reference Library keeps CP review anchored to source-linked tutorials or operational studios.',
      'Competency Matrix tells learners to keep reviewed CP source links attached to each next study action.',
    ],
    plainWordingGuard:
      'Learner-facing wording may clarify orientation and next action, but must not alter CP source-link normalization, CP root counts, or source-truth mappings.',
  },
  execution: {
    completedStepIds: [
      'W02-L3_LEARNER_UX-C01',
      'W02-L3_LEARNER_UX-C02',
      'W02-L3_LEARNER_UX-C03',
      'W02-L3_LEARNER_UX-C04',
    ],
    remainingStepIds: [
      'W02-L3_LEARNER_UX-C05',
      'W02-L3_LEARNER_UX-C06',
      'W02-L3_LEARNER_UX-C07',
      'W02-L3_LEARNER_UX-C08',
      'W02-L3_LEARNER_UX-C09',
      'W02-L3_LEARNER_UX-C10',
    ],
    proofCommands: [
      'npm run didactics:ux:validate',
      'npm run test -- src/components/Home.test.tsx src/components/PathologyCurriculum.test.tsx',
      'npx vitest run scripts/validate_w02_learner_ux_baseline_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      t07Closeout.status === 'completed' &&
      t07Closeout.handoffToNextTranche.nextTranche === 'T08 W02 Learner UX' &&
      t07Closeout.proofBundle.missingSourceLinkGroups === 0 &&
      uxReport.failures.length === 0,
    staleWhen: [
      'T07 closeout changes without regenerating this packet',
      'didactics_learning_ux_report.json changes without regenerating this packet',
      'T08 learner-UX owned surfaces change without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 Learner UX Baseline Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  `Status: ${payload.status}`,
  '',
  '## Authority',
  '',
  `- T07 closed: ${payload.authority.t07Closed ? 'yes' : 'no'}`,
  `- T07 next tranche: ${payload.authority.t07NextTranche}`,
  `- Guard: ${payload.authority.t07Guard}`,
  `- Visible cluster count: ${payload.authority.visibleClusterCount}`,
  `- Source-link normalization groups: ${payload.authority.sourceLinkNormalizationGroups}`,
  `- CP root count: ${payload.authority.cpRootCount}`,
  '',
  '## Baseline',
  '',
  `- Contract version: ${payload.baseline.contractVersion}`,
  `- UX pass count: ${payload.baseline.passCount}`,
  `- UX failure count: ${payload.baseline.failureCount}`,
  `- Learner UX focus: ${payload.baseline.learnerUxFocus}`,
  `- Plain wording guard: ${payload.baseline.plainWordingGuard}`,
  ...payload.baseline.learnerPathClarity.map((item) => `- Learner path clarity: ${item}`),
  ...payload.baseline.ownedSurfaces.map((surface) => `- Owned surface: ${surface}`),
  '',
  '## Execution',
  '',
  `- Completed step ids: ${payload.execution.completedStepIds.join(', ')}`,
  `- Remaining step ids: ${payload.execution.remainingStepIds.join(', ')}`,
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

console.log(`[W02-LEARNER-UX-BASELINE] Wrote ${path.relative(root, outJsonPath)}.`);
