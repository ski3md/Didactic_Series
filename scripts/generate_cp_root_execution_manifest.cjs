#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const handoffPath = path.join(root, 'reports/cp_truth_handoff_summary.json');
const checklistPath = path.join(root, 'reports/cp_root_execution_checklist.json');
const outJsonPath = path.join(root, 'reports/cp_root_execution_manifest.json');
const outMdPath = path.join(root, 'reports/cp_root_execution_manifest.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const handoff = readJson(handoffPath);
const checklist = readJson(checklistPath);

const payload = {
  generatedAt: new Date().toISOString(),
  source: {
    handoff: 'reports/cp_truth_handoff_summary.json',
    checklist: 'reports/cp_root_execution_checklist.json',
  },
  truthBaseline: {
    sourceFingerprint: handoff.baseline.sourceFingerprint,
    cpGovernedTutorials: handoff.baseline.cpGovernedTutorials,
    cpGovernedModules: handoff.baseline.cpGovernedModules,
    validatedTutorials: handoff.baseline.validatedTutorials,
    governancePendingTutorials: handoff.baseline.governancePendingTutorials,
  },
  executionView: {
    rootCount: checklist.summary.rootCount,
    topPriorityRoot: checklist.summary.topPriorityRoot,
    proofCommands: checklist.summary.proofCommands,
  },
  staleWhen: [
    'the source fingerprint no longer matches the current CP truth handoff summary',
    'the root count no longer matches the current CP root execution checklist',
    'the top priority root changes without regenerating this manifest',
  ],
};

const md = [
  '# CP Root Execution Manifest',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  '## Truth Baseline',
  '',
  `- Source fingerprint: \`${payload.truthBaseline.sourceFingerprint}\``,
  `- CP-governed tutorials: ${payload.truthBaseline.cpGovernedTutorials}`,
  `- CP-governed modules: ${payload.truthBaseline.cpGovernedModules}`,
  `- Validated tutorials: ${payload.truthBaseline.validatedTutorials}`,
  `- Governance-pending tutorials: ${payload.truthBaseline.governancePendingTutorials}`,
  '',
  '## Execution View',
  '',
  `- Root count: ${payload.executionView.rootCount}`,
  `- Top priority root: ${payload.executionView.topPriorityRoot}`,
  `- Proof commands: ${payload.executionView.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Stale When',
  '',
  ...payload.staleWhen.map((line) => `- ${line}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[CP-ROOT-MANIFEST] Wrote execution manifest for ${payload.executionView.rootCount} CP roots.`);
