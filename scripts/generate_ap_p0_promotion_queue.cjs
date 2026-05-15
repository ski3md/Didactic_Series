#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const batchDir = path.join(repoRoot, 'src/content/competency');
const reportsDir = path.join(repoRoot, 'reports');
const jsonPath = path.join(reportsDir, 'ap_p0_promotion_queue.json');
const mdPath = path.join(reportsDir, 'ap_p0_promotion_queue.md');
const csvPath = path.join(reportsDir, 'ap_p0_promotion_queue.csv');

const BATCH_FILE_PATTERN = /^apP0.*CardBatch\d*\.ts$/;
const GATE_ORDER = [
  'taxonomy',
  'content',
  'visual',
  'retrieval',
  'faculty',
];

const LEARNING_QUALITY_STANDARDS = [
  {
    id: 'contrastive-comparator',
    label: 'Contrastive normal-to-abnormal encoding',
    requirement: 'Add a normal/reactive comparator plus one high-yield mimic discriminator.',
  },
  {
    id: 'retrieval-before-reveal',
    label: 'Retrieval before explanation',
    requirement: 'Attach a faculty-reviewed answer key for diagnosis, required feature, mimic, and report consequence prompts.',
  },
  {
    id: 'spaced-consolidation',
    label: 'Spaced consolidation',
    requirement: 'Preserve same-session, 1 day, 3 day, 7 day, and 21 day review prompts with escalating autonomy.',
  },
  {
    id: 'dual-coding',
    label: 'Dual coding without image over-reliance',
    requirement: 'Pair each visual anchor with low-power, high-power, and report-consequence inspection tasks.',
  },
  {
    id: 'faculty-calibrated-safety',
    label: 'Faculty-calibrated safety',
    requirement: 'Complete provenance, reviewer, citation, asset/license, safety pitfall, and last-reviewed metadata.',
  },
];

function findBatchFiles(dir) {
  const found = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findBatchFiles(absolutePath));
    } else if (entry.isFile() && BATCH_FILE_PATTERN.test(entry.name)) {
      found.push(absolutePath);
    }
  }
  return found.sort((a, b) => path.relative(repoRoot, a).localeCompare(path.relative(repoRoot, b)));
}

function findExportedObjectText(source, filePath) {
  const exportMatch = source.match(/export\s+const\s+(apP0\w*CardBatch\d*)\s*=/);
  if (!exportMatch) {
    throw new Error(`Could not find AP P0 card batch export in ${path.relative(repoRoot, filePath)}`);
  }

  const objectStart = source.indexOf('{', exportMatch.index + exportMatch[0].length);
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(objectStart, index + 1);
    }
  }

  throw new Error(`Could not find closing batch object in ${path.relative(repoRoot, filePath)}`);
}

function loadBatch(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(findExportedObjectText(source, filePath));
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function gateRank(gate) {
  const id = `${gate.id || ''} ${gate.label || ''}`.toLowerCase();
  const order = GATE_ORDER.findIndex((needle) => id.includes(needle));
  return order === -1 ? GATE_ORDER.length : order;
}

function nextGateFor(card) {
  const gates = [...(card.gateStatuses || [])].sort((a, b) => {
    if (a.status === b.status) return gateRank(a) - gateRank(b);
    if (a.status === 'missing') return -1;
    if (b.status === 'missing') return 1;
    if (a.status === 'ready-for-review') return -1;
    if (b.status === 'ready-for-review') return 1;
    return 0;
  });
  return gates.find((gate) => gate.status === 'missing') || gates.find((gate) => gate.status === 'ready-for-review') || gates[0] || null;
}

function gateStatusCounts(cards) {
  const counts = { complete: 0, 'ready-for-review': 0, missing: 0 };
  for (const card of cards) {
    for (const gate of card.gateStatuses || []) {
      counts[gate.status] = (counts[gate.status] || 0) + 1;
    }
  }
  return counts;
}

function standardIdsForGate(gate) {
  const text = `${gate?.id || ''} ${gate?.label || ''} ${gate?.evidence || ''}`.toLowerCase();
  const standards = [];
  if (text.includes('taxonomy') || text.includes('content') || text.includes('mimic') || text.includes('comparator')) {
    standards.push('contrastive-comparator');
  }
  if (text.includes('retrieval') || text.includes('answer key') || text.includes('prompt')) {
    standards.push('retrieval-before-reveal');
    standards.push('spaced-consolidation');
  }
  if (text.includes('visual') || text.includes('image') || text.includes('gross') || text.includes('diagram')) {
    standards.push('dual-coding');
  }
  if (text.includes('faculty') || text.includes('reviewer') || text.includes('citation') || text.includes('license')) {
    standards.push('faculty-calibrated-safety');
  }
  return [...new Set(standards.length ? standards : ['faculty-calibrated-safety'])];
}

function buildReport() {
  const batchFiles = findBatchFiles(batchDir);
  const batches = batchFiles.map((filePath) => {
    const batch = loadBatch(filePath);
    const cards = batch.cards || [];
    const counts = gateStatusCounts(cards);
    return {
      file: path.relative(repoRoot, filePath),
      batchName: batch.batchName,
      facultyPacketPath: batch.facultyPacketPath,
      cardCount: cards.length,
      gateCounts: counts,
      cards,
    };
  });

  const cardRows = batches.flatMap((batch) =>
    batch.cards.map((card, index) => {
      const nextGate = nextGateFor(card);
      const missingGates = (card.gateStatuses || []).filter((gate) => gate.status === 'missing');
      const readyGates = (card.gateStatuses || []).filter((gate) => gate.status === 'ready-for-review');
      return {
        rank: 0,
        batchName: batch.batchName,
        file: batch.file,
        facultyPacketPath: batch.facultyPacketPath,
        cardIndex: index + 1,
        cardId: card.id,
        sourceQueueId: card.sourceQueueId,
        title: card.title,
        category: card.category,
        rotation: card.rotation,
        learnerLevel: card.learnerLevel,
        editorialStatus: card.editorialStatus,
        missingGateCount: missingGates.length,
        readyForReviewGateCount: readyGates.length,
        completeGateCount: (card.gateStatuses || []).filter((gate) => gate.status === 'complete').length,
        nextGateId: nextGate?.id || '',
        nextGateLabel: nextGate?.label || '',
        nextGateStatus: nextGate?.status || '',
        nextGateEvidence: nextGate?.evidence || '',
        learningStandardIds: standardIdsForGate(nextGate),
        facultyAction: nextGate
          ? `Resolve ${nextGate.label}: ${nextGate.evidence}`
          : 'No remaining gate action detected.',
      };
    }),
  ).sort((a, b) =>
    b.missingGateCount - a.missingGateCount ||
    b.readyForReviewGateCount - a.readyForReviewGateCount ||
    a.batchName.localeCompare(b.batchName) ||
    a.cardIndex - b.cardIndex,
  ).map((row, index) => ({ ...row, rank: index + 1 }));

  const gateBacklog = {};
  for (const row of cardRows) {
    const key = row.nextGateLabel || 'No next gate';
    gateBacklog[key] ||= { label: key, cards: 0, missing: 0, readyForReview: 0, complete: 0 };
    gateBacklog[key].cards += 1;
    if (row.nextGateStatus === 'ready-for-review') gateBacklog[key].readyForReview += 1;
    else if (row.nextGateStatus === 'complete') gateBacklog[key].complete += 1;
    else gateBacklog[key].missing += 1;
  }

  const totals = batches.reduce(
    (summary, batch) => {
      summary.batchCount += 1;
      summary.cardCount += batch.cardCount;
      summary.completeGates += batch.gateCounts.complete || 0;
      summary.readyForReviewGates += batch.gateCounts['ready-for-review'] || 0;
      summary.missingGates += batch.gateCounts.missing || 0;
      return summary;
    },
    { batchCount: 0, cardCount: 0, completeGates: 0, readyForReviewGates: 0, missingGates: 0 },
  );
  totals.totalGates = totals.completeGates + totals.readyForReviewGates + totals.missingGates;

  return {
    generatedAt: new Date().toISOString(),
    sourcePattern: 'src/content/competency/apP0*CardBatch.ts',
    summary: totals,
    learningQualityStandards: LEARNING_QUALITY_STANDARDS,
    gateBacklog: Object.values(gateBacklog).sort((a, b) => b.missing - a.missing || b.readyForReview - a.readyForReview || a.label.localeCompare(b.label)),
    batches: batches.map(({ cards, ...batch }) => batch),
    cardRows,
  };
}

function writeReports(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);

  const csvHeaders = [
    'rank',
    'batchName',
    'facultyPacketPath',
    'cardId',
    'sourceQueueId',
    'title',
    'category',
    'rotation',
    'learnerLevel',
    'editorialStatus',
    'missingGateCount',
    'readyForReviewGateCount',
    'nextGateLabel',
    'nextGateStatus',
    'learningStandardIds',
    'facultyAction',
  ];
  const csvRows = [
    csvHeaders.map(csvEscape).join(','),
    ...report.cardRows.map((row) => csvHeaders.map((header) => csvEscape(Array.isArray(row[header]) ? row[header].join('; ') : row[header])).join(',')),
  ];
  fs.writeFileSync(csvPath, `${csvRows.join('\n')}\n`);

  const lines = [
    '# AP P0 Promotion Queue',
    '',
    `Generated: ${report.generatedAt}`,
    `Source pattern: \`${report.sourcePattern}\``,
    '',
    '## Summary',
    '',
    markdownTable(
      ['Metric', 'Count'],
      [
        ['Batches', String(report.summary.batchCount)],
        ['Cards', String(report.summary.cardCount)],
        ['Complete gates', String(report.summary.completeGates)],
        ['Ready-for-review gates', String(report.summary.readyForReviewGates)],
        ['Missing gates', String(report.summary.missingGates)],
        ['Total gates', String(report.summary.totalGates)],
      ],
    ),
    '',
    '## Learning Quality Standards',
    '',
    markdownTable(
      ['Standard', 'Requirement'],
      report.learningQualityStandards.map((standard) => [standard.label, standard.requirement]),
    ),
    '',
    '## Gate Backlog',
    '',
    markdownTable(
      ['Next gate', 'Cards', 'Missing', 'Ready for review', 'Complete'],
      report.gateBacklog.map((row) => [
        row.label,
        String(row.cards),
        String(row.missing),
        String(row.readyForReview),
        String(row.complete),
      ]),
    ),
    '',
    '## Top 40 Faculty Actions',
    '',
    markdownTable(
      ['Rank', 'Batch', 'Card', 'Category', 'Next gate', 'Learning standard', 'Action'],
      report.cardRows.slice(0, 40).map((row) => [
        String(row.rank),
        row.batchName,
        row.title,
        row.category,
        `${row.nextGateLabel} (${row.nextGateStatus})`,
        row.learningStandardIds.join(', '),
        row.facultyAction,
      ]),
    ),
    '',
    '## Batch Promotion Queue',
    '',
    markdownTable(
      ['Batch', 'Cards', 'Complete gates', 'Ready for review', 'Missing gates', 'Faculty packet'],
      report.batches.map((batch) => [
        batch.batchName,
        String(batch.cardCount),
        String(batch.gateCounts.complete || 0),
        String(batch.gateCounts['ready-for-review'] || 0),
        String(batch.gateCounts.missing || 0),
        `\`${batch.facultyPacketPath}\``,
      ]),
    ),
    '',
  ];

  fs.writeFileSync(mdPath, `${lines.join('\n')}\n`);
}

function main() {
  const report = buildReport();
  writeReports(report);
  console.log('AP P0 promotion queue generated.');
  console.log(`Batches: ${report.summary.batchCount}`);
  console.log(`Cards: ${report.summary.cardCount}`);
  console.log(`Gates: ${report.summary.completeGates} complete, ${report.summary.readyForReviewGates} ready-for-review, ${report.summary.missingGates} missing of ${report.summary.totalGates}`);
  console.log(`Wrote ${path.relative(repoRoot, mdPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, csvPath)}`);
}

main();
