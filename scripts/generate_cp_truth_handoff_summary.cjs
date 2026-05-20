#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const cpGovernanceReportPath = path.join(root, 'reports/cp_precision_governance_report.json');
const validatedManifestPath = path.join(root, 'reports/validated_mappings_manifest.json');
const exceptionPacketPath = path.join(root, 'reports/cp_governed_exception_reviewer_packet.json');
const outJsonPath = path.join(root, 'reports/cp_truth_handoff_summary.json');
const outMdPath = path.join(root, 'reports/cp_truth_handoff_summary.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const cpGovernance = readJson(cpGovernanceReportPath);
const validatedManifest = readJson(validatedManifestPath);
const exceptionPacket = readJson(exceptionPacketPath);

const payload = {
  generatedAt: new Date().toISOString(),
  source: {
    cpGovernanceReport: 'reports/cp_precision_governance_report.json',
    validatedManifest: 'reports/validated_mappings_manifest.json',
    exceptionPacket: 'reports/cp_governed_exception_reviewer_packet.json',
  },
  baseline: {
    cpGovernedTutorials: cpGovernance.baselineSnapshot.tutorialsValidated,
    cpGovernedModules: cpGovernance.baselineSnapshot.modulesValidated,
    validatedTutorials: validatedManifest.baselineSnapshot.validatedTutorialCount,
    governancePendingTutorials: validatedManifest.baselineSnapshot.governancePendingTutorialCount,
    sourceFingerprint: validatedManifest.baselineSnapshot.sourceFingerprint,
  },
  governedExceptionQueue: {
    total: exceptionPacket.summary.exceptionCount,
    byPrecisionMode: exceptionPacket.summary.byPrecisionMode,
    rootsCovered: exceptionPacket.summary.byRoot,
    promoteUnderGovernedAnchor: exceptionPacket.summary.actionBuckets.promoteUnderGovernedAnchor,
    reviewerActionRequired: exceptionPacket.summary.actionBuckets.reviewerActionRequired,
  },
  currentStatus: {
    baselineGreen: cpGovernance.failureCount === 0 && validatedManifest.summary.governancePendingRowCount === 0,
    nextReviewSurface: 'reports/cp_governed_exception_reviewer_packet.md',
    tranche: 'T01 W01 CP Truth',
  },
};

const markdown = [
  '# CP Truth Handoff Summary',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  '## Baseline',
  '',
  `- CP-governed tutorials: ${payload.baseline.cpGovernedTutorials}`,
  `- CP-governed modules: ${payload.baseline.cpGovernedModules}`,
  `- Validated tutorials: ${payload.baseline.validatedTutorials}`,
  `- Governance-pending tutorials: ${payload.baseline.governancePendingTutorials}`,
  `- Source fingerprint: \`${payload.baseline.sourceFingerprint}\``,
  '',
  '## Governed Exception Queue',
  '',
  `- Total governed exceptions: ${payload.governedExceptionQueue.total}`,
  `- Precision modes: ${Object.entries(payload.governedExceptionQueue.byPrecisionMode).map(([k, v]) => `${k} (${v})`).join(', ')}`,
  `- Promote under governed anchor: ${payload.governedExceptionQueue.promoteUnderGovernedAnchor.length}`,
  `- Reviewer action required: ${payload.governedExceptionQueue.reviewerActionRequired.length}`,
  '',
  '### Promote Under Current Governed Anchor',
  '',
  ...payload.governedExceptionQueue.promoteUnderGovernedAnchor.map((id) => `- ${id}`),
  '',
  '### Reviewer Action Required',
  '',
  ...payload.governedExceptionQueue.reviewerActionRequired.map((id) => `- ${id}`),
  '',
  '## Current Status',
  '',
  `- Baseline green: ${payload.currentStatus.baselineGreen ? 'yes' : 'no'}`,
  `- Tranche: ${payload.currentStatus.tranche}`,
  `- Next review surface: \`${payload.currentStatus.nextReviewSurface}\``,
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${markdown}\n`);

console.log(
  `[CP-TRUTH-HANDOFF] Wrote handoff summary with ${payload.governedExceptionQueue.total} governed exceptions.`,
);
