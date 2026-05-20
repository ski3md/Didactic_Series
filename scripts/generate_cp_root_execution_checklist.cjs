#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const prioritySummaryPath = path.join(root, 'reports/cp_root_priority_summary.json');
const outJsonPath = path.join(root, 'reports/cp_root_execution_checklist.json');
const outMdPath = path.join(root, 'reports/cp_root_execution_checklist.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const prioritySummary = readJson(prioritySummaryPath);

const proofCommands = [
  'npm run cp:precision:validate',
  'npx vitest run scripts/validate_cp_truth_baseline_outputs.test.ts',
  'git diff --check',
];

const reviewerMove = (rootName) => `Complete CP governance review for ${rootName}.`;
const promoteMove = (rootName) => `Promote governed-ready ${rootName} tutorials under the current CP anchor.`;

const checklist = prioritySummary.rankedRoots.map((entry, index) => ({
  rank: index + 1,
  root: entry.root,
  reviewerActionCount: entry.reviewerActionCount,
  promoteCount: entry.promoteCount,
  totalCount: entry.totalCount,
  nextMoves: [
    ...(entry.reviewerActionCount > 0 ? [reviewerMove(entry.root)] : []),
    ...(entry.promoteCount > 0 ? [promoteMove(entry.root)] : []),
  ],
  reviewerIds: entry.reviewerActionRequired.map((row) => row.id),
  promoteIds: entry.promoteUnderGovernedAnchor.map((row) => row.id),
  proofCommands,
}));

const payload = {
  generatedAt: new Date().toISOString(),
  source: 'reports/cp_root_priority_summary.json',
  summary: {
    rootCount: checklist.length,
    topPriorityRoot: checklist[0]?.root || null,
    proofCommands,
  },
  checklist,
};

const md = [
  '# CP Root Execution Checklist',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  '## Summary',
  '',
  `- Roots in execution queue: ${payload.summary.rootCount}`,
  `- Top priority root: ${payload.summary.topPriorityRoot}`,
  `- Shared proof commands: ${proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Ranked Checklist',
  '',
  ...payload.checklist.flatMap((entry) => [
    `### ${entry.rank}. ${entry.root}`,
    '',
    `- Reviewer action required: ${entry.reviewerActionCount}`,
    `- Promote under governed anchor: ${entry.promoteCount}`,
    `- Total queue size: ${entry.totalCount}`,
    `- Next moves: ${entry.nextMoves.join(' Then ') || 'none'}`,
    `- Proof commands: ${entry.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
    ...(entry.reviewerIds.length ? [`- Reviewer IDs: ${entry.reviewerIds.join(', ')}`] : []),
    ...(entry.promoteIds.length ? [`- Governed-promotion IDs: ${entry.promoteIds.join(', ')}`] : []),
    '',
  ]),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[CP-ROOT-CHECKLIST] Wrote checklist for ${payload.summary.rootCount} CP roots.`);
