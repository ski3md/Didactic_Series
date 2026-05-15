#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/competency/apGapClosureQueue.ts');
const batchPath = path.join(repoRoot, 'src/content/competency/apP0EntityCardBatch.ts');
const reportsDir = path.join(repoRoot, 'reports');
const mdPath = path.join(reportsDir, 'ap_p0_batch_status_report.md');
const jsonPath = path.join(reportsDir, 'ap_p0_batch_status_report.json');

function readExportedObject(filePath, exportName) {
  const source = fs.readFileSync(filePath, 'utf8');
  const exportMarker = `export const ${exportName} =`;
  const exportIndex = source.indexOf(exportMarker);
  if (exportIndex === -1) {
    throw new Error(`Could not find exported object "${exportName}" in ${filePath}`);
  }
  const objectStart = source.indexOf('{', exportIndex + exportMarker.length);
  if (objectStart === -1) {
    throw new Error(`Could not find object literal for "${exportName}" in ${filePath}`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  let objectEnd = -1;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        objectEnd = index + 1;
        break;
      }
    }
  }

  if (objectEnd === -1) {
    throw new Error(`Could not locate closing brace for "${exportName}" in ${filePath}`);
  }

  const objectLiteral = source.slice(objectStart, objectEnd);
  return JSON.parse(objectLiteral);
}

function countBy(items, getKey) {
  return items.reduce((counts, item) => {
    const key = getKey(item) || 'Unspecified';
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function sortEntriesByCountThenName(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function markdownTable(headers, rows) {
  const headerLine = `| ${headers.join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;
  const bodyLines = rows.map((row) => `| ${row.join(' | ')} |`);
  return [headerLine, separatorLine, ...bodyLines].join('\n');
}

function gateCounts(cards) {
  const statusCounts = {};
  const missingByLabel = {};
  const labelStatusCounts = {};

  for (const card of cards) {
    for (const gate of card.gateStatuses || []) {
      statusCounts[gate.status] = (statusCounts[gate.status] || 0) + 1;
      labelStatusCounts[gate.label] ||= {};
      labelStatusCounts[gate.label][gate.status] = (labelStatusCounts[gate.label][gate.status] || 0) + 1;

      if (gate.status === 'missing') {
        missingByLabel[gate.label] = (missingByLabel[gate.label] || 0) + 1;
      }
    }
  }

  return { statusCounts, missingByLabel, labelStatusCounts };
}

function buildNextActions(queue, batch, gateSummary) {
  const cards = batch.cards || [];
  const p0Categories = Object.values(queue.categorySummary || {})
    .filter((category) => category.p0 > 0)
    .sort((a, b) => b.p0 - a.p0 || a.category.localeCompare(b.category));
  const firstBatchCategories = countBy(cards, (card) => card.category);
  const uncoveredTopCategories = p0Categories
    .map((category) => ({
      category: category.category,
      p0: category.p0,
      firstBatchCards: firstBatchCategories[category.category] || 0,
    }))
    .filter((category) => category.firstBatchCards === 0)
    .slice(0, 5);

  const missingLabels = sortEntriesByCountThenName(gateSummary.missingByLabel).map(([label, count]) => ({
    label,
    count,
  }));

  return [
    {
      action: 'Assign the highest-volume missing gate work first.',
      rationale: missingLabels.length
        ? `${missingLabels[0].label} is missing on ${missingLabels[0].count} first-batch cards.`
        : 'No missing gates are currently present in the first batch.',
    },
    {
      action: 'Convert ready taxonomy gates into reviewed gates.',
      rationale: 'Every first-batch card currently has a structured taxonomy QA scaffold; faculty confirmation is the fastest route to measurable progress.',
    },
    {
      action: 'Add source-backed content and answer keys before visual-only expansion.',
      rationale: 'Learner-facing cards should not expose prompts without faculty-reviewed definitions, discriminators, pitfalls, and reveal answers.',
    },
    {
      action: 'Plan the next P0 batch against uncovered high-count categories.',
      rationale: uncoveredTopCategories.length
        ? `Top uncovered P0 categories include ${uncoveredTopCategories.map((item) => `${item.category} (${item.p0})`).join(', ')}.`
        : 'The first batch touches all current P0 categories.',
    },
  ];
}

function main() {
  const queue = readExportedObject(queuePath, 'apGapClosureQueue');
  const batch = readExportedObject(batchPath, 'apP0EntityCardBatch');
  const cards = batch.cards || [];
  const gateSummary = gateCounts(cards);
  const batchCategories = countBy(cards, (card) => card.category);
  const editorialStatuses = countBy(cards, (card) => card.editorialStatus);
  const learnerLevels = countBy(cards, (card) => card.learnerLevel);
  const categoryRows = Object.values(queue.categorySummary || {})
    .filter((category) => category.p0 > 0)
    .sort((a, b) => b.p0 - a.p0 || a.category.localeCompare(b.category))
    .map((category) => ({
      categoryId: Object.entries(queue.categorySummary || {}).find(([, value]) => value === category)?.[0],
      category: category.category,
      missing: category.missing,
      p0: category.p0,
      firstBatchCards: batchCategories[category.category] || 0,
    }));
  const batchReadiness = {
    completedGates: gateSummary.statusCounts.complete || 0,
    reviewReadyGates: gateSummary.statusCounts['ready-for-review'] || 0,
    missingGates: gateSummary.statusCounts.missing || 0,
    totalGates: Object.values(gateSummary.statusCounts).reduce((sum, count) => sum + count, 0),
  };
  batchReadiness.percentComplete = percent(batchReadiness.completedGates, batchReadiness.totalGates);
  batchReadiness.percentReviewReady = percent(batchReadiness.reviewReadyGates, batchReadiness.totalGates);
  batchReadiness.percentMissing = percent(batchReadiness.missingGates, batchReadiness.totalGates);

  const report = {
    generatedAt: new Date().toISOString(),
    sourceFiles: {
      queue: path.relative(repoRoot, queuePath),
      firstBatch: path.relative(repoRoot, batchPath),
    },
    queue: {
      definition: queue.definition,
      totals: queue.totals,
      p0CategoryCounts: categoryRows,
    },
    firstBatch: {
      batchName: batch.batchName,
      status: batch.status,
      strategy: batch.batchStrategy,
      facultyPacketPath: batch.facultyPacketPath,
      cardCount: cards.length,
      categoryCounts: Object.fromEntries(sortEntriesByCountThenName(batchCategories)),
      editorialStatusCounts: Object.fromEntries(sortEntriesByCountThenName(editorialStatuses)),
      learnerLevelCounts: Object.fromEntries(sortEntriesByCountThenName(learnerLevels)),
      readiness: batchReadiness,
      missingGatesByLabel: Object.fromEntries(sortEntriesByCountThenName(gateSummary.missingByLabel)),
      gateStatusByLabel: gateSummary.labelStatusCounts,
    },
    nextActions: buildNextActions(queue, batch, gateSummary),
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  const md = [
    '# AP P0 Batch Status Report',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '## Source Files',
    '',
    `- Queue: \`${report.sourceFiles.queue}\``,
    `- First batch: \`${report.sourceFiles.firstBatch}\``,
    '',
    '## P0 Queue Summary',
    '',
    queue.definition,
    '',
    markdownTable(
      ['Metric', 'Count'],
      [
        ['All missing AP rows', String(queue.totals.allMissing)],
        ['P0 core rows', String(queue.totals.p0)],
        ['P1 rows', String(queue.totals.p1)],
        ['P2 rows', String(queue.totals.p2)],
        ['P3 rows', String(queue.totals.p3)],
      ],
    ),
    '',
    '## P0 Category Counts',
    '',
    markdownTable(
      ['Category', 'Missing rows', 'P0 rows', 'First-batch cards'],
      categoryRows.map((row) => [
        row.category,
        String(row.missing),
        String(row.p0),
        String(row.firstBatchCards),
      ]),
    ),
    '',
    '## First-Batch Card Summary',
    '',
    `Batch: ${batch.batchName}`,
    '',
    `Status: ${batch.status}`,
    '',
    `Strategy: ${batch.batchStrategy}`,
    '',
    markdownTable(
      ['Metric', 'Count'],
      [
        ['Cards', String(cards.length)],
        ['Completed gates', String(batchReadiness.completedGates)],
        ['Review-ready gates', String(batchReadiness.reviewReadyGates)],
        ['Missing gates', String(batchReadiness.missingGates)],
        ['Total gates', String(batchReadiness.totalGates)],
        ['Percent complete', `${batchReadiness.percentComplete}%`],
        ['Percent review-ready', `${batchReadiness.percentReviewReady}%`],
        ['Percent missing', `${batchReadiness.percentMissing}%`],
      ],
    ),
    '',
    '## First-Batch Categories',
    '',
    markdownTable(
      ['Category', 'Cards'],
      sortEntriesByCountThenName(batchCategories).map(([category, count]) => [category, String(count)]),
    ),
    '',
    '## Gate Readiness',
    '',
    markdownTable(
      ['Gate label', 'Complete', 'Ready for review', 'Missing'],
      Object.entries(gateSummary.labelStatusCounts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([label, counts]) => [
          label,
          String(counts.complete || 0),
          String(counts['ready-for-review'] || 0),
          String(counts.missing || 0),
        ]),
    ),
    '',
    '## Missing Gates By Label',
    '',
    markdownTable(
      ['Gate label', 'Missing count'],
      sortEntriesByCountThenName(gateSummary.missingByLabel).map(([label, count]) => [label, String(count)]),
    ),
    '',
    '## Next Actions',
    '',
    ...report.nextActions.flatMap((item) => [
      `- ${item.action}`,
      `  Rationale: ${item.rationale}`,
    ]),
    '',
  ].join('\n');

  fs.writeFileSync(mdPath, md);

  console.log(`Wrote ${path.relative(repoRoot, mdPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
  console.log(`P0 rows: ${queue.totals.p0}`);
  console.log(`First-batch cards: ${cards.length}`);
  console.log(`Gates: ${batchReadiness.completedGates} complete, ${batchReadiness.reviewReadyGates} ready-for-review, ${batchReadiness.missingGates} missing of ${batchReadiness.totalGates}`);
}

main();
