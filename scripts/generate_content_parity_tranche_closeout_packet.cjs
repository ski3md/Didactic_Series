#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const journeyPath = path.join(root, 'reports/content_consumption_journey_evaluation.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const outJsonPath = path.join(root, 'reports/content_parity_tranche_closeout_packet.json');
const outMdPath = path.join(root, 'reports/content_parity_tranche_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const journey = readJson(journeyPath);
const ledger = readJson(ledgerPath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T02');

if (!tranche) {
  throw new Error('Missing T02 tranche in full_1000_execution_ledger.json');
}

const baseline = journey.contentBaseline;
const curriculum = baseline.curriculumSnapshot;
const cpTutorials = baseline.tutorialLibrarySnapshot.clinicalPathInteractiveTutorials;
const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T02 W01 Content Parity',
  source: {
    journeyReport: 'reports/content_consumption_journey_evaluation.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
  },
  baseline: {
    totalModules: curriculum.totalModules,
    canonicalModules: curriculum.promotionStates.canonical,
    stagedModules: curriculum.promotionStates.staged,
    clinicalPathCanonicalModules: curriculum.clinicalPathology.canonicalModules,
    clinicalPathStagedModules: curriculum.clinicalPathology.stagedModules,
    clinicalPathTutorials: cpTutorials.totalTutorials,
    clinicalPathInteractiveAssets: cpTutorials.interactiveAssetCount,
    clinicalPathRootTopics: cpTutorials.rootTopicCount,
  },
  parity: {
    visibleClusterCount: Object.keys(baseline.visibleClusterParity).length,
    normalizedSourceLinkGroups: Object.keys(baseline.sourceLinkNormalization).length,
    parityRisks: baseline.parityRisks,
    nextParityMoves: baseline.nextParityMoves,
  },
  execution: {
    completedStepIds: tranche.completionEvidence.completedStepIds,
    proofCommands: [
      'npm run cp:precision:validate',
      'npm run test -- src/utils/tutorialLibraryCatalog.test.ts',
      'npx vitest run scripts/validate_content_parity_tranche_closeout_packet.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      curriculum.clinicalPathology.canonicalModules === 7 &&
      curriculum.clinicalPathology.stagedModules === 0 &&
      cpTutorials.totalTutorials === 13 &&
      cpTutorials.interactiveAssetCount === 16 &&
      cpTutorials.rootTopicCount === 6,
    staleWhen: [
      'the curriculum or clinical-path tutorial baseline counts change without regenerating this packet',
      'the visible cluster parity map changes without regenerating this packet',
      'the normalized source-link groups change without regenerating this packet',
    ],
  },
};

const md = [
  '# Content Parity Tranche Closeout Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Baseline',
  '',
  `- Total curriculum modules: ${payload.baseline.totalModules}`,
  `- Canonical modules: ${payload.baseline.canonicalModules}`,
  `- Staged modules: ${payload.baseline.stagedModules}`,
  `- Clinical Pathology canonical modules: ${payload.baseline.clinicalPathCanonicalModules}`,
  `- Clinical Pathology staged modules: ${payload.baseline.clinicalPathStagedModules}`,
  `- Clinical Pathology tutorials: ${payload.baseline.clinicalPathTutorials}`,
  `- Clinical Pathology interactive assets: ${payload.baseline.clinicalPathInteractiveAssets}`,
  `- Clinical Pathology root topics: ${payload.baseline.clinicalPathRootTopics}`,
  '',
  '## Parity',
  '',
  `- Visible cluster parity groups: ${payload.parity.visibleClusterCount}`,
  `- Normalized source-link groups: ${payload.parity.normalizedSourceLinkGroups}`,
  ...payload.parity.parityRisks.map((entry) => `- parity risk: ${entry}`),
  ...payload.parity.nextParityMoves.map((entry) => `- next parity move: ${entry}`),
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

console.log(`[CONTENT-PARITY-CLOSEOUT] Wrote closeout packet for ${payload.tranche}.`);
