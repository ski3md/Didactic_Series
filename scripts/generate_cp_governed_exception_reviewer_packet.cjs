#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const manifestPath = path.join(root, 'reports/validated_mappings_manifest.json');
const outJsonPath = path.join(root, 'reports/cp_governed_exception_reviewer_packet.json');
const outMdPath = path.join(root, 'reports/cp_governed_exception_reviewer_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const sortObject = (entries) =>
  Object.fromEntries(Array.from(entries.entries()).sort(([a], [b]) => String(a).localeCompare(String(b))));

const manifest = readJson(manifestPath);
const rows = (manifest.rows || []).filter(
  (row) =>
    row.validatedForPromotion &&
    (row.abpathDomain === 'CP' || row.track === 'clinical-path') &&
    (
      row.nearestValidReason ||
      row.crossDomainJustification ||
      row.facultyReviewReason ||
      row.abpathAnchorConfidence === 'moderate' ||
      row.abpathPrecisionMode === 'nearest-valid-deep' ||
      row.abpathPrecisionMode === 'cross-domain-governed' ||
      row.abpathPrecisionMode === 'local-teaching-only'
    ),
);

const byPrecisionMode = new Map();
const byRoot = new Map();
for (const row of rows) {
  byPrecisionMode.set(row.abpathPrecisionMode, (byPrecisionMode.get(row.abpathPrecisionMode) || 0) + 1);
  byRoot.set(row.abpathRoot, (byRoot.get(row.abpathRoot) || 0) + 1);
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'reports/validated_mappings_manifest.json',
  summary: {
    exceptionCount: rows.length,
    byPrecisionMode: sortObject(byPrecisionMode),
    byRoot: sortObject(byRoot),
    actionBuckets: {
      promoteUnderGovernedAnchor: rows
        .filter((row) => !/Complete CP governance review before promotion/i.test(row.reviewAction || ''))
        .map((row) => row.id),
      reviewerActionRequired: rows
        .filter((row) => /Complete CP governance review before promotion/i.test(row.reviewAction || ''))
        .map((row) => row.id),
    },
  },
  rows: rows.map((row) => ({
    id: row.id,
    key: row.key,
    track: row.track,
    abpathDomain: row.abpathDomain,
    abpathRoot: row.abpathRoot,
    abpathPrimaryPath: row.abpathPrimaryPath,
    abpathPrecisionMode: row.abpathPrecisionMode,
    abpathAnchorConfidence: row.abpathAnchorConfidence,
    reviewOwner: row.reviewOwner || '',
    reviewAction: row.reviewAction || '',
    rationale:
      row.nearestValidReason ||
      row.crossDomainJustification ||
      row.facultyReviewReason ||
      '',
  })),
};

const markdown = [
  '# CP Governed Exception Reviewer Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Source: \`${payload.source}\``,
  '',
  '## Summary',
  '',
  `- Exception tutorials: ${payload.summary.exceptionCount}`,
  `- Precision modes: ${Object.entries(payload.summary.byPrecisionMode).map(([k, v]) => `${k} (${v})`).join(', ')}`,
  `- Roots covered: ${Object.entries(payload.summary.byRoot).map(([k, v]) => `${k} (${v})`).join(', ')}`,
  `- Promote under current governed anchor: ${payload.summary.actionBuckets.promoteUnderGovernedAnchor.length}`,
  `- Reviewer action still required: ${payload.summary.actionBuckets.reviewerActionRequired.length}`,
  '',
  '## Review Queue',
  '',
  '| Tutorial | Root | Primary path | Precision mode | Confidence | Review owner | Review action | Rationale |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...payload.rows.map((row) =>
    `| ${row.id} | ${row.abpathRoot} | ${row.abpathPrimaryPath} | ${row.abpathPrecisionMode} | ${row.abpathAnchorConfidence} | ${row.reviewOwner || '-'} | ${row.reviewAction || '-'} | ${row.rationale || '-'} |`,
  ),
  '',
  '## Completion Gate',
  '',
  '- Do not remove a tutorial from this packet unless the manifest no longer treats it as a governed CP exception.',
  '- Do not widen this packet to AP review drift; this surface is only for the current CP-truth exception queue.',
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${markdown}\n`);

console.log(
  `[CP-EXCEPTION-PACKET] Wrote ${payload.summary.exceptionCount} governed exception tutorials to reviewer packet.`,
);
