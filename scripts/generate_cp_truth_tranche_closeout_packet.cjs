#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const handoffPath = path.join(root, 'reports/cp_truth_handoff_summary.json');
const reviewerActionPath = path.join(root, 'reports/cp_reviewer_action_packet.json');
const governedPromotionPath = path.join(root, 'reports/cp_governed_promotion_packet.json');
const rootPriorityPath = path.join(root, 'reports/cp_root_priority_summary.json');
const checklistPath = path.join(root, 'reports/cp_root_execution_checklist.json');
const manifestPath = path.join(root, 'reports/cp_root_execution_manifest.json');
const outJsonPath = path.join(root, 'reports/cp_truth_tranche_closeout_packet.json');
const outMdPath = path.join(root, 'reports/cp_truth_tranche_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const handoff = readJson(handoffPath);
const reviewerAction = readJson(reviewerActionPath);
const governedPromotion = readJson(governedPromotionPath);
const rootPriority = readJson(rootPriorityPath);
const checklist = readJson(checklistPath);
const manifest = readJson(manifestPath);

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T01 W01 CP Truth',
  source: {
    handoff: 'reports/cp_truth_handoff_summary.json',
    reviewerAction: 'reports/cp_reviewer_action_packet.json',
    governedPromotion: 'reports/cp_governed_promotion_packet.json',
    rootPriority: 'reports/cp_root_priority_summary.json',
    checklist: 'reports/cp_root_execution_checklist.json',
    manifest: 'reports/cp_root_execution_manifest.json',
  },
  baseline: handoff.baseline,
  queue: {
    total: handoff.governedExceptionQueue.total,
    reviewerActionRequired: reviewerAction.summary.reviewerActionCount,
    promoteUnderGovernedAnchor: governedPromotion.summary.promoteCount,
    rootsRepresented: rootPriority.summary.rootCount,
  },
  execution: {
    topPriorityRoot: checklist.summary.topPriorityRoot,
    proofCommands: checklist.summary.proofCommands,
    sourceFingerprint: manifest.truthBaseline.sourceFingerprint,
  },
  completionGate: {
    baselineGreen: handoff.currentStatus.baselineGreen,
    staleWhen: manifest.staleWhen,
  },
};

const md = [
  '# CP Truth Tranche Closeout Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Baseline',
  '',
  `- CP-governed tutorials: ${payload.baseline.cpGovernedTutorials}`,
  `- CP-governed modules: ${payload.baseline.cpGovernedModules}`,
  `- Validated tutorials: ${payload.baseline.validatedTutorials}`,
  `- Governance-pending tutorials: ${payload.baseline.governancePendingTutorials}`,
  `- Source fingerprint: \`${payload.baseline.sourceFingerprint}\``,
  '',
  '## Queue',
  '',
  `- Total governed exceptions: ${payload.queue.total}`,
  `- Reviewer action required: ${payload.queue.reviewerActionRequired}`,
  `- Promote under governed anchor: ${payload.queue.promoteUnderGovernedAnchor}`,
  `- Roots represented: ${payload.queue.rootsRepresented}`,
  '',
  '## Execution',
  '',
  `- Top priority root: ${payload.execution.topPriorityRoot}`,
  `- Proof commands: ${payload.execution.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Completion Gate',
  '',
  `- Baseline green: ${payload.completionGate.baselineGreen ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((line) => `- stale when: ${line}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[CP-TRUTH-CLOSEOUT] Wrote closeout packet for ${payload.tranche}.`);
