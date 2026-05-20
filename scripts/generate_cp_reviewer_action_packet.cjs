#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const handoffPath = path.join(root, 'reports/cp_truth_handoff_summary.json');
const reviewerPacketPath = path.join(root, 'reports/cp_governed_exception_reviewer_packet.json');
const outJsonPath = path.join(root, 'reports/cp_reviewer_action_packet.json');
const outMdPath = path.join(root, 'reports/cp_reviewer_action_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const handoff = readJson(handoffPath);
const reviewerPacket = readJson(reviewerPacketPath);
const reviewerIds = new Set(handoff.governedExceptionQueue.reviewerActionRequired);
const rows = reviewerPacket.rows.filter((row) => reviewerIds.has(row.id));

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
    reviewerActionCount: rows.length,
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
  '# CP Reviewer Action Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  '## Summary',
  '',
  `- Tutorials requiring reviewer action: ${payload.summary.reviewerActionCount}`,
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
  '- Keep this packet bounded to the current `reviewerActionRequired` queue from the CP truth handoff summary.',
  '- Remove an item only when the handoff summary no longer marks it as reviewer action required.',
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[CP-REVIEWER-ACTION] Wrote ${rows.length} reviewer-action tutorials across ${Object.keys(grouped).length} CP roots.`);
