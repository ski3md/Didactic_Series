#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reviewerActionPath = path.join(root, 'reports/cp_reviewer_action_packet.json');
const governedPromotionPath = path.join(root, 'reports/cp_governed_promotion_packet.json');
const outJsonPath = path.join(root, 'reports/cp_root_priority_summary.json');
const outMdPath = path.join(root, 'reports/cp_root_priority_summary.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const reviewerAction = readJson(reviewerActionPath);
const governedPromotion = readJson(governedPromotionPath);

const rootMap = new Map();

const ensureRoot = (rootName) => {
  if (!rootMap.has(rootName)) {
    rootMap.set(rootName, {
      root: rootName,
      reviewerActionRequired: [],
      promoteUnderGovernedAnchor: [],
    });
  }
  return rootMap.get(rootName);
};

for (const [rootName, rows] of Object.entries(reviewerAction.groupedQueue)) {
  const entry = ensureRoot(rootName);
  entry.reviewerActionRequired.push(...rows);
}

for (const [rootName, rows] of Object.entries(governedPromotion.groupedQueue)) {
  const entry = ensureRoot(rootName);
  entry.promoteUnderGovernedAnchor.push(...rows);
}

const rankedRoots = Array.from(rootMap.values())
  .map((entry) => ({
    ...entry,
    reviewerActionCount: entry.reviewerActionRequired.length,
    promoteCount: entry.promoteUnderGovernedAnchor.length,
    totalCount: entry.reviewerActionRequired.length + entry.promoteUnderGovernedAnchor.length,
  }))
  .sort((a, b) => {
    if (b.reviewerActionCount !== a.reviewerActionCount) return b.reviewerActionCount - a.reviewerActionCount;
    if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount;
    return a.root.localeCompare(b.root);
  });

const payload = {
  generatedAt: new Date().toISOString(),
  source: {
    reviewerActionPacket: 'reports/cp_reviewer_action_packet.json',
    governedPromotionPacket: 'reports/cp_governed_promotion_packet.json',
  },
  summary: {
    rootCount: rankedRoots.length,
    totalReviewerActionRequired: rankedRoots.reduce((sum, entry) => sum + entry.reviewerActionCount, 0),
    totalPromoteUnderGovernedAnchor: rankedRoots.reduce((sum, entry) => sum + entry.promoteCount, 0),
  },
  rankedRoots,
};

const md = [
  '# CP Root Priority Summary',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  '## Summary',
  '',
  `- CP roots in queue: ${payload.summary.rootCount}`,
  `- Reviewer action required: ${payload.summary.totalReviewerActionRequired}`,
  `- Promote under governed anchor: ${payload.summary.totalPromoteUnderGovernedAnchor}`,
  '',
  '## Ranked Root Queue',
  '',
  ...payload.rankedRoots.flatMap((entry, index) => [
    `### ${index + 1}. ${entry.root}`,
    '',
    `- Reviewer action required: ${entry.reviewerActionCount}`,
    `- Promote under governed anchor: ${entry.promoteCount}`,
    `- Total queue size: ${entry.totalCount}`,
    '',
    ...(entry.reviewerActionRequired.length
      ? [
          '#### Reviewer Action Required',
          '',
          ...entry.reviewerActionRequired.map(
            (row) => `- \`${row.id}\` | ${row.abpathPrecisionMode} | ${row.reviewAction} | ${row.rationale}`,
          ),
          '',
        ]
      : []),
    ...(entry.promoteUnderGovernedAnchor.length
      ? [
          '#### Promote Under Governed Anchor',
          '',
          ...entry.promoteUnderGovernedAnchor.map(
            (row) => `- \`${row.id}\` | ${row.abpathPrecisionMode} | ${row.reviewAction} | ${row.rationale}`,
          ),
          '',
        ]
      : []),
  ]),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[CP-ROOT-PRIORITY] Wrote ranked summary for ${payload.summary.rootCount} CP roots.`);
