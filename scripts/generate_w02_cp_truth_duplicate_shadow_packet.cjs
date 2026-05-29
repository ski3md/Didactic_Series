#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const manifestPath = path.join(root, 'reports/validated_mappings_manifest.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const outJsonPath = path.join(root, 'reports/w02_cp_truth_duplicate_shadow_packet.json');
const outMdPath = path.join(root, 'reports/w02_cp_truth_duplicate_shadow_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const manifest = readJson(manifestPath);
const ledger = readJson(ledgerPath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T06');

if (!tranche) {
  throw new Error('Missing T06 tranche in full_1000_execution_ledger.json');
}

const rows = Array.isArray(manifest.rows) ? manifest.rows : [];
const duplicateShadowRows = rows.filter((row) =>
  (row.conflictFlags || []).includes('duplicate-shadowed-by-canonical-source')
);

const duplicatePairs = duplicateShadowRows.map((row) => {
  const canonical = rows.find((candidate) => candidate.key === row.canonicalSourceKey);
  if (!canonical) {
    throw new Error(`Missing canonical row for duplicate-shadow key ${row.key}`);
  }

  const mismatchNotes = [];
  if (row.track !== canonical.track) {
    mismatchNotes.push(`track ${row.track} -> ${canonical.track}`);
  }
  if (row.abpathDomain !== canonical.abpathDomain) {
    mismatchNotes.push(`domain ${row.abpathDomain} -> ${canonical.abpathDomain}`);
  }
  if (row.abpathRoot !== canonical.abpathRoot) {
    mismatchNotes.push(`root ${row.abpathRoot} -> ${canonical.abpathRoot}`);
  }
  if (row.abpathPrimaryPath !== canonical.abpathPrimaryPath) {
    mismatchNotes.push('path changed');
  }

  return {
    id: row.id,
    shadowKey: row.key,
    canonicalKey: canonical.key,
    shadowFile: row.file,
    canonicalFile: canonical.file,
    shadowTrack: row.track,
    canonicalTrack: canonical.track,
    shadowDomain: row.abpathDomain,
    canonicalDomain: canonical.abpathDomain,
    shadowPath: row.abpathPrimaryPath,
    canonicalPath: canonical.abpathPrimaryPath,
    shadowValidated: row.validatedForPromotion,
    canonicalValidated: canonical.validatedForPromotion,
    requiresSourceMapReview: mismatchNotes.length > 0,
    mismatchNotes,
  };
});

const sourceMapReviewPairs = duplicatePairs.filter((pair) => pair.requiresSourceMapReview);

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T06 W02 CP Truth',
  source: {
    validatedManifest: 'reports/validated_mappings_manifest.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
  },
  summary: {
    duplicateShadowCount: duplicatePairs.length,
    canonicalValidatedCount: duplicatePairs.filter((pair) => pair.canonicalValidated === true).length,
    sourceMapReviewCount: sourceMapReviewPairs.length,
    allDuplicatesHaveCanonicalValidatedPair: duplicatePairs.every((pair) => pair.canonicalValidated === true),
  },
  actionBuckets: {
    safeDuplicateExclusions: duplicatePairs
      .filter((pair) => pair.requiresSourceMapReview === false)
      .map((pair) => pair.id),
    sourceMapReviewRequired: sourceMapReviewPairs.map((pair) => pair.id),
  },
  duplicatePairs,
  execution: {
    completedStepIds: tranche.completionEvidence.completedStepIds,
    proofCommands: [
      'npm run cp:precision:validate',
      'node scripts/validate_validated_mappings_manifest.cjs',
      'npx vitest run scripts/validate_w02_cp_truth_duplicate_shadow_packet.test.ts scripts/validate_w02_cp_truth_checks.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    duplicateShadowQueueUnderstood:
      duplicatePairs.length === 6 &&
      duplicatePairs.every((pair) => pair.canonicalValidated === true),
    staleWhen: [
      'the validated mappings manifest changes without regenerating this packet',
      'the T06 completed step list changes without regenerating this packet',
      'any duplicate-shadow row loses its canonical validated pair without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 CP Truth Duplicate Shadow Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Summary',
  '',
  `- Duplicate-shadow rows: ${payload.summary.duplicateShadowCount}`,
  `- Canonical validated pairs: ${payload.summary.canonicalValidatedCount}`,
  `- Source-map review required: ${payload.summary.sourceMapReviewCount}`,
  `- All duplicates have canonical validated pairs: ${payload.summary.allDuplicatesHaveCanonicalValidatedPair ? 'yes' : 'no'}`,
  '',
  '## Action Buckets',
  '',
  `- Safe duplicate exclusions: ${payload.actionBuckets.safeDuplicateExclusions.join(', ') || 'none'}`,
  `- Source-map review required: ${payload.actionBuckets.sourceMapReviewRequired.join(', ') || 'none'}`,
  '',
  '## Duplicate Pairs',
  '',
  ...payload.duplicatePairs.flatMap((pair) => [
    `- ${pair.id}`,
    `  - shadow: ${pair.shadowKey}`,
    `  - canonical: ${pair.canonicalKey}`,
    `  - review required: ${pair.requiresSourceMapReview ? 'yes' : 'no'}`,
    `  - mismatch notes: ${pair.mismatchNotes.length ? pair.mismatchNotes.join('; ') : 'none'}`,
  ]),
  '',
  '## Execution',
  '',
  `- Completed step ids: ${payload.execution.completedStepIds.join(', ')}`,
  `- Proof commands: ${payload.execution.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Completion Gate',
  '',
  `- Duplicate-shadow queue understood: ${payload.completionGate.duplicateShadowQueueUnderstood ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-CP-TRUTH-DUPLICATE-SHADOW] Wrote duplicate shadow packet for ${payload.tranche}.`);
