#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportPath = path.join(root, 'reports/didactics_learning_ux_report.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const learningUxContractMdPath = path.join(root, 'docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md');
const learningUxContractJsonPath = path.join(root, 'src/content/contracts/pthfndrDidacticsLearningUxContract.json');
const codexAlignmentContractPath = path.join(root, 'docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md');
const validatorPath = path.join(root, 'scripts/validate_didactics_learning_ux.cjs');
const outJsonPath = path.join(root, 'reports/contracts_proof_tranche_closeout_packet.json');
const outMdPath = path.join(root, 'reports/contracts_proof_tranche_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readText = (filePath) => fs.readFileSync(filePath, 'utf8');
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const report = readJson(reportPath);
const ledger = readJson(ledgerPath);
const learningUxContractMd = readText(learningUxContractMdPath);
const learningUxContractJson = readJson(learningUxContractJsonPath);
const codexAlignmentContractMd = readText(codexAlignmentContractPath);
const validatorSource = readText(validatorPath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T05');

if (!tranche) {
  throw new Error('Missing T05 tranche in full_1000_execution_ledger.json');
}

const contractPasses = report.passes.filter(
  (entry) =>
    entry.startsWith('AGENTS ') ||
    entry.startsWith('Codex system alignment contract') ||
    entry.startsWith('Learning UX markdown contract') ||
    entry.startsWith('Machine-readable UX contract') ||
    entry.startsWith('Adapter ')
);

const governedWorkupsLabels = learningUxContractJson.semanticClarity?.intentionalClicks?.allowedGovernedLabels || [];
const workupsGovernedEntry = governedWorkupsLabels.find((entry) => entry?.label === 'Workups') || null;

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T05 W01 Contracts and Proof',
  source: {
    uxReport: 'reports/didactics_learning_ux_report.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
    ownedSurfaces: [
      'docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md',
      'docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md',
      'src/content/contracts/pthfndrDidacticsLearningUxContract.json',
      'scripts/validate_didactics_learning_ux.cjs',
    ],
  },
  validator: {
    passCount: report.passes.length,
    failureCount: report.failures.length,
    contractPassCount: contractPasses.length,
  },
  contractBaseline: {
    learningUxMarkdownHasWorkupsException:
      learningUxContractMd.includes('the governed workspace label `Workups` is allowed only when it truthfully names the active diagnostic-workup lane') &&
      learningUxContractMd.includes('`Workups` must not be reused as a generic CTA'),
    learningUxJsonHasGovernedWorkupsException:
      workupsGovernedEntry?.label === 'Workups' &&
      Array.isArray(workupsGovernedEntry?.allowedOnlyWhen) &&
      workupsGovernedEntry.allowedOnlyWhen.includes('workspace_switcher') &&
      workupsGovernedEntry.allowedOnlyWhen.includes('breadcrumb') &&
      workupsGovernedEntry.allowedOnlyWhen.includes('destination_heading'),
    codexAlignmentHasAutonomousExecutionRule:
      codexAlignmentContractMd.includes('## Autonomous Execution Rule') &&
      codexAlignmentContractMd.includes('continue through logically connected repo steps without repeatedly asking for `proceed`, `continue`, or equivalent confirmations'),
    codexAlignmentHasAutomationRule:
      codexAlignmentContractMd.includes('## Automation Rule') &&
      codexAlignmentContractMd.includes('prefer a heartbeat automation when the request is to resume or revisit the current thread') &&
      codexAlignmentContractMd.includes('prefer a cron automation when the request is a detached recurring workspace job'),
    codexAlignmentHasOpenClawRule:
      codexAlignmentContractMd.includes('## OpenClaw Execution Rule') &&
      codexAlignmentContractMd.includes('## Parallel Lane Rule') &&
      codexAlignmentContractMd.includes('treat OpenClaw as a local execution surface, not as the canonical truth owner'),
    validatorChecksContractAlignment:
      validatorSource.includes('evaluateContractAlignmentSemantics') &&
      validatorSource.includes('Codex system alignment contract captures autonomous execution, automation posture, public-text truth, OpenClaw posture, and parallel-lane ownership.') &&
      validatorSource.includes('Machine-readable UX contract preserves the governed Workups-label exception.'),
  },
  execution: {
    completedStepIds: tranche.completionEvidence.completedStepIds,
    proofCommands: [
      'npm run didactics:ux:validate',
      'npm run resource:contracts:validate',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts scripts/validate_contracts_proof_tranche_closeout_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      report.failures.length === 0 &&
      contractPasses.length >= 7 &&
      learningUxContractMd.includes('## Plain-Language Contract') &&
      Boolean(workupsGovernedEntry) &&
      codexAlignmentContractMd.includes('## Autonomous Execution Rule') &&
      codexAlignmentContractMd.includes('## Automation Rule') &&
      codexAlignmentContractMd.includes('## OpenClaw Execution Rule'),
    staleWhen: [
      'the didactics learner UX report changes without regenerating this packet',
      'the contract markdown, contract JSON, or contract-alignment validator changes without regenerating this packet',
      'the tranche ledger status or completed step list changes without regenerating this packet',
    ],
  },
};

const md = [
  '# Contracts and Proof Tranche Closeout Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Validator',
  '',
  `- Pass count: ${payload.validator.passCount}`,
  `- Failure count: ${payload.validator.failureCount}`,
  `- Contract-alignment pass count: ${payload.validator.contractPassCount}`,
  '',
  '## Contract Baseline',
  '',
  `- Learning UX markdown has governed Workups exception: ${payload.contractBaseline.learningUxMarkdownHasWorkupsException ? 'yes' : 'no'}`,
  `- Learning UX JSON has governed Workups exception: ${payload.contractBaseline.learningUxJsonHasGovernedWorkupsException ? 'yes' : 'no'}`,
  `- Codex alignment has autonomous execution rule: ${payload.contractBaseline.codexAlignmentHasAutonomousExecutionRule ? 'yes' : 'no'}`,
  `- Codex alignment has automation rule: ${payload.contractBaseline.codexAlignmentHasAutomationRule ? 'yes' : 'no'}`,
  `- Codex alignment has OpenClaw rule: ${payload.contractBaseline.codexAlignmentHasOpenClawRule ? 'yes' : 'no'}`,
  `- Validator checks contract alignment: ${payload.contractBaseline.validatorChecksContractAlignment ? 'yes' : 'no'}`,
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

console.log(`[CONTRACTS-PROOF-CLOSEOUT] Wrote closeout packet for ${payload.tranche}.`);
