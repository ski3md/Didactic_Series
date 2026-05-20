#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const handoffPath = path.join(root, 'reports/cp_truth_handoff_summary.json');
const reviewerPacketPath = path.join(root, 'reports/cp_governed_exception_reviewer_packet.json');
const outJsonPath = path.join(root, 'reports/cp_governed_promotion_packet.json');
const outMdPath = path.join(root, 'reports/cp_governed_promotion_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const handoff = readJson(handoffPath);
const reviewerPacket = readJson(reviewerPacketPath);
const governedIds = new Set(handoff.governedExceptionQueue.promoteUnderGovernedAnchor);
const rows = reviewerPacket.rows.filter((row) => governedIds.has(row.id));

const grouped = {};
for (const row of rows) {
  if (!grouped[row.abpathRoot]) grouped[row.abpathRoot] = [];
  grouped[row.abpathRoot].push({
    id: row.id,
    abpathPrecisionMode: row.abpathPrecisionMode,
    abpathAnchorConfidence: row.abpathAnchorConfidence,
    reviewOwner: row.reviewOwner,
    reviewAction: row.reviewAction,
    rationale: row.rationale,
  });
}

const payload = {
  generatedAt: new Date().toISOString(),
  source: {
    handoff: 'reports/cp_truth_handoff_summary.json',
    reviewerPacket: 'reports/cp_governed_exception_reviewer_packet.json',
  },
  summary: {
    promoteCount: rows.length,
    groupedRootCount: Object.keys(grouped).length,
    roots: Object.fromEntries(
      Object.entries(grouped)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([rootName, entries]) => [rootName, entries.length]),
    ),
  },
  groupedQueue: grouped,
};

const md = [
  '# CP Governed Promotion Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  '## Summary',
  '',
  `- Tutorials ready to promote under current governed anchors: ${payload.summary.promoteCount}`,
  `- CP roots represented: ${payload.summary.groupedRootCount}`,
  `- Root buckets: ${Object.entries(payload.summary.roots).map(([k, v]) => `${k} (${v})`).join(', ')}`,
  '',
  '## Queue by CP Root',
  '',
  ...Object.entries(payload.groupedQueue)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([rootName, entries]) => [
      `### ${rootName}`,
      '',
      ...entries.map(
        (entry) =>
          `- \`${entry.id}\` | ${entry.abpathPrecisionMode} | ${entry.abpathAnchorConfidence} | ${entry.reviewOwner} | ${entry.reviewAction} | ${entry.rationale}`,
      ),
      '',
    ]),
  '## Completion Gate',
  '',
  '- Keep this packet bounded to the current `promoteUnderGovernedAnchor` queue from the CP truth handoff summary.',
  '- Remove an item only when the handoff summary no longer marks it as promotable under the current governed anchor.',
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[CP-GOVERNED-PROMOTION] Wrote ${rows.length} governed-promotion tutorials across ${Object.keys(grouped).length} CP roots.`);
