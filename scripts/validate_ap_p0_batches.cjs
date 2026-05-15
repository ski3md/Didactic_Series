#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const batchDir = path.join(repoRoot, 'src/content/competency');
const reportsDir = path.join(repoRoot, 'reports');
const jsonReportPath = path.join(reportsDir, 'ap_p0_multi_batch_validation.json');
const mdReportPath = path.join(reportsDir, 'ap_p0_multi_batch_validation.md');

const REQUIRED_BATCH_FIELDS = [
  'generatedAt',
  'sourcePlan',
  'facultyPacketPath',
  'batchName',
  'batchStrategy',
  'status',
  'batchReadiness',
  'readinessLegend',
  'cards',
];

const REQUIRED_CARD_FIELDS = [
  'id',
  'sourceQueueId',
  'editorialStatus',
  'priority',
  'title',
  'category',
  'rotation',
  'apSpecPath',
  'learnerLevel',
  'sourceLine',
  'specimenContext',
  'visualAnchorPlan',
  'reportingConsequencePrompt',
  'entityCardSections',
  'retrievalPrompts',
  'spacingSchedule',
  'facultyReviewChecklist',
  'completionGate',
  'gateStatuses',
  'readiness',
];

const REQUIRED_GATE_FIELDS = ['id', 'label', 'status', 'evidence'];
const REQUIRED_READINESS_FIELDS = [
  'completedGates',
  'reviewReadyGates',
  'missingGates',
  'totalGates',
  'percentComplete',
  'percentReviewReady',
];
const EXPECTED_GATE_COUNT = 5;
const BATCH_FILE_PATTERN = /^apP0.*CardBatch\d*\.ts$/;

function isBlank(value) {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function getMissingFields(record, requiredFields) {
  if (!record || typeof record !== 'object') return requiredFields;
  return requiredFields.filter((field) => isBlank(record[field]));
}

function findBatchFiles(dir) {
  if (!fs.existsSync(dir)) return [];

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
    throw new Error(`Could not find an apP0*CardBatch export in ${path.relative(repoRoot, filePath)}`);
  }

  const exportName = exportMatch[1];
  const searchStart = exportMatch.index + exportMatch[0].length;
  const objectStart = source.indexOf('{', searchStart);
  if (objectStart === -1) {
    throw new Error(`Could not find object literal for ${exportName} in ${path.relative(repoRoot, filePath)}`);
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

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
        return {
          exportName,
          objectText: source.slice(objectStart, index + 1),
        };
      }
    }
  }

  throw new Error(`Could not find closing brace for ${exportName} in ${path.relative(repoRoot, filePath)}`);
}

function loadBatch(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const { exportName, objectText } = findExportedObjectText(source, filePath);
  try {
    return {
      exportName,
      batch: JSON.parse(objectText),
    };
  } catch (error) {
    throw new Error(`Failed to parse ${exportName} as JSON in ${path.relative(repoRoot, filePath)}: ${error.message}`);
  }
}

function countBy(values) {
  const counts = {};
  for (const value of values) {
    const key = isBlank(value) ? 'blank' : String(value);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function sortEntries(counts) {
  return Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function collectDuplicateLocations(items, keyName) {
  const locationsByValue = new Map();
  for (const item of items) {
    const value = item[keyName];
    if (isBlank(value)) continue;
    if (!locationsByValue.has(value)) locationsByValue.set(value, []);
    locationsByValue.get(value).push({
      file: item.file,
      batchName: item.batchName,
      cardId: item.id || null,
      sourceQueueId: item.sourceQueueId || null,
      title: item.title || null,
    });
  }

  return Array.from(locationsByValue.entries())
    .filter(([, locations]) => locations.length > 1)
    .map(([value, locations]) => ({ value, count: locations.length, locations }));
}

function validateBatchFile(filePath) {
  const relativePath = path.relative(repoRoot, filePath);
  const issues = [];
  let exportName = null;
  let batch = null;

  try {
    const loaded = loadBatch(filePath);
    exportName = loaded.exportName;
    batch = loaded.batch;
  } catch (error) {
    return {
      file: relativePath,
      exportName,
      parsed: false,
      batchName: null,
      cardCount: 0,
      gateCount: 0,
      gateStatusCounts: {},
      missingBatchFields: REQUIRED_BATCH_FIELDS,
      cardsWithMissingRequiredFields: 0,
      cardsWithoutExpectedGateCount: 0,
      gatesWithMissingRequiredFields: 0,
      readinessMismatchCount: 0,
      facultyPacketPath: null,
      facultyPacketExists: false,
      cards: [],
      issues: [
        {
          severity: 'error',
          code: 'parse-failed',
          file: relativePath,
          message: error.message,
        },
      ],
    };
  }

  const cards = Array.isArray(batch.cards) ? batch.cards : [];
  const missingBatchFields = getMissingFields(batch, REQUIRED_BATCH_FIELDS);
  const facultyPacketPath = typeof batch.facultyPacketPath === 'string' ? batch.facultyPacketPath : '';
  const facultyPacketExists = Boolean(facultyPacketPath && fs.existsSync(path.join(repoRoot, facultyPacketPath)));

  if (missingBatchFields.length > 0) {
    issues.push({
      severity: 'error',
      code: 'missing-batch-fields',
      file: relativePath,
      message: `Missing batch fields: ${missingBatchFields.join(', ')}`,
    });
  }

  if (!Array.isArray(batch.cards)) {
    issues.push({
      severity: 'error',
      code: 'cards-not-array',
      file: relativePath,
      message: 'Batch cards field must be an array.',
    });
  }

  if (!facultyPacketPath) {
    issues.push({
      severity: 'error',
      code: 'missing-faculty-packet-path',
      file: relativePath,
      message: 'facultyPacketPath is missing or blank.',
    });
  } else if (!facultyPacketExists) {
    issues.push({
      severity: 'error',
      code: 'faculty-packet-file-not-found',
      file: relativePath,
      message: `facultyPacketPath does not exist: ${facultyPacketPath}`,
    });
  }

  const gateStatusCounts = {};
  const cardReports = cards.map((card, index) => {
    const gateStatuses = Array.isArray(card.gateStatuses) ? card.gateStatuses : [];
    const missingCardFields = getMissingFields(card, REQUIRED_CARD_FIELDS);
    const missingReadinessFields = getMissingFields(card.readiness, REQUIRED_READINESS_FIELDS);
    const gateIds = new Map();
    const gatesWithMissingFields = [];
    const duplicateGateIds = [];

    for (const [gateIndex, gate] of gateStatuses.entries()) {
      const status = gate && gate.status ? gate.status : 'blank';
      gateStatusCounts[status] = (gateStatusCounts[status] || 0) + 1;

      const missingGateFields = getMissingFields(gate, REQUIRED_GATE_FIELDS);
      if (missingGateFields.length > 0) {
        gatesWithMissingFields.push({
          index: gateIndex,
          id: gate?.id || null,
          missingFields: missingGateFields,
        });
      }

      if (!isBlank(gate?.id)) {
        if (gateIds.has(gate.id)) {
          duplicateGateIds.push(gate.id);
        }
        gateIds.set(gate.id, true);
      }
    }

    const readinessTotal = card.readiness && typeof card.readiness.totalGates === 'number'
      ? card.readiness.totalGates
      : null;
    const readinessMatchesGateCount = readinessTotal === gateStatuses.length;

    if (missingCardFields.length > 0) {
      issues.push({
        severity: 'error',
        code: 'missing-card-fields',
        file: relativePath,
        cardId: card.id || null,
        message: `Card ${card.id || index} missing fields: ${missingCardFields.join(', ')}`,
      });
    }

    if (missingReadinessFields.length > 0) {
      issues.push({
        severity: 'error',
        code: 'missing-readiness-fields',
        file: relativePath,
        cardId: card.id || null,
        message: `Card ${card.id || index} readiness missing fields: ${missingReadinessFields.join(', ')}`,
      });
    }

    if (gateStatuses.length !== EXPECTED_GATE_COUNT) {
      issues.push({
        severity: 'error',
        code: 'unexpected-gate-status-count',
        file: relativePath,
        cardId: card.id || null,
        message: `Card ${card.id || index} has ${gateStatuses.length} gateStatuses; expected ${EXPECTED_GATE_COUNT}.`,
      });
    }

    if (!readinessMatchesGateCount) {
      issues.push({
        severity: 'warning',
        code: 'readiness-total-gates-mismatch',
        file: relativePath,
        cardId: card.id || null,
        message: `Card ${card.id || index} readiness.totalGates does not match gateStatuses length.`,
      });
    }

    for (const gateId of duplicateGateIds) {
      issues.push({
        severity: 'error',
        code: 'duplicate-gate-id-within-card',
        file: relativePath,
        cardId: card.id || null,
        message: `Card ${card.id || index} has duplicate gate id ${gateId}.`,
      });
    }

    for (const gate of gatesWithMissingFields) {
      issues.push({
        severity: 'error',
        code: 'missing-gate-fields',
        file: relativePath,
        cardId: card.id || null,
        message: `Card ${card.id || index} gate ${gate.id || gate.index} missing fields: ${gate.missingFields.join(', ')}`,
      });
    }

    return {
      index,
      id: card.id || null,
      sourceQueueId: card.sourceQueueId || null,
      title: card.title || null,
      category: card.category || null,
      missingFields: missingCardFields,
      missingReadinessFields,
      gateStatusCount: gateStatuses.length,
      hasExpectedGateStatusCount: gateStatuses.length === EXPECTED_GATE_COUNT,
      gatesWithMissingFields,
      duplicateGateIds,
      readinessMatchesGateCount,
    };
  });

  const gateCount = Object.values(gateStatusCounts).reduce((sum, count) => sum + count, 0);

  return {
    file: relativePath,
    exportName,
    parsed: true,
    batchName: batch.batchName || null,
    status: batch.status || null,
    cardCount: cards.length,
    gateCount,
    gateStatusCounts,
    missingBatchFields,
    cardsWithMissingRequiredFields: cardReports.filter((card) => card.missingFields.length > 0).length,
    cardsWithoutExpectedGateCount: cardReports.filter((card) => !card.hasExpectedGateStatusCount).length,
    gatesWithMissingRequiredFields: cardReports.reduce((sum, card) => sum + card.gatesWithMissingFields.length, 0),
    readinessMismatchCount: cardReports.filter((card) => !card.readinessMatchesGateCount).length,
    facultyPacketPath: facultyPacketPath || null,
    facultyPacketExists,
    cards: cardReports,
    issues,
  };
}

function buildReport() {
  const batchFiles = findBatchFiles(batchDir);
  const batchReports = batchFiles.map(validateBatchFile);
  const allCards = batchReports.flatMap((batchReport) =>
    batchReport.cards.map((card) => ({
      ...card,
      file: batchReport.file,
      batchName: batchReport.batchName,
    })),
  );

  const duplicateCardIds = collectDuplicateLocations(allCards, 'id');
  const duplicateSourceQueueIds = collectDuplicateLocations(allCards, 'sourceQueueId');
  const crossBatchIssues = [];

  for (const duplicate of duplicateCardIds) {
    crossBatchIssues.push({
      severity: 'error',
      code: 'duplicate-card-id-across-batches',
      message: `Duplicate card id ${duplicate.value} appears ${duplicate.count} times across AP P0 batches.`,
      locations: duplicate.locations,
    });
  }

  for (const duplicate of duplicateSourceQueueIds) {
    crossBatchIssues.push({
      severity: 'warning',
      code: 'duplicate-source-queue-id-across-batches',
      message: `Duplicate sourceQueueId ${duplicate.value} appears ${duplicate.count} times across AP P0 batches.`,
      locations: duplicate.locations,
    });
  }

  const allIssues = [
    ...batchReports.flatMap((batchReport) => batchReport.issues),
    ...crossBatchIssues,
  ];
  const totalCards = batchReports.reduce((sum, batchReport) => sum + batchReport.cardCount, 0);
  const totalGates = batchReports.reduce((sum, batchReport) => sum + batchReport.gateCount, 0);
  const gateStatusCounts = {};
  for (const batchReport of batchReports) {
    for (const [status, count] of Object.entries(batchReport.gateStatusCounts)) {
      gateStatusCounts[status] = (gateStatusCounts[status] || 0) + count;
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sourcePattern: 'src/content/competency/apP0*CardBatch.ts',
    expectedGateStatusCount: EXPECTED_GATE_COUNT,
    summary: {
      batchFileCount: batchReports.length,
      parsedBatchFileCount: batchReports.filter((batchReport) => batchReport.parsed).length,
      totalCards,
      totalGates,
      gateStatusCounts: Object.fromEntries(sortEntries(gateStatusCounts)),
      percentComplete: percent(gateStatusCounts.complete || 0, totalGates),
      percentReviewReady: percent(gateStatusCounts['ready-for-review'] || 0, totalGates),
      percentMissing: percent(gateStatusCounts.missing || 0, totalGates),
      batchesWithIssues: batchReports.filter((batchReport) => batchReport.issues.length > 0).length,
      cardsWithMissingRequiredFields: batchReports.reduce((sum, batchReport) => sum + batchReport.cardsWithMissingRequiredFields, 0),
      cardsWithoutExpectedGateCount: batchReports.reduce((sum, batchReport) => sum + batchReport.cardsWithoutExpectedGateCount, 0),
      gatesWithMissingRequiredFields: batchReports.reduce((sum, batchReport) => sum + batchReport.gatesWithMissingRequiredFields, 0),
      readinessMismatchCount: batchReports.reduce((sum, batchReport) => sum + batchReport.readinessMismatchCount, 0),
      duplicateCardIdCount: duplicateCardIds.length,
      duplicateSourceQueueIdCount: duplicateSourceQueueIds.length,
      issueCount: allIssues.length,
      errorCount: allIssues.filter((issue) => issue.severity === 'error').length,
      warningCount: allIssues.filter((issue) => issue.severity === 'warning').length,
    },
    duplicateCardIds,
    duplicateSourceQueueIds,
    batches: batchReports,
    issues: allIssues,
  };
}

function writeReports(report) {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(jsonReportPath, `${JSON.stringify(report, null, 2)}\n`);

  const batchRows = report.batches.map((batch) => [
    `\`${batch.file}\``,
    batch.batchName || 'Unspecified',
    String(batch.cardCount),
    String(batch.gateCount),
    Object.entries(batch.gateStatusCounts).map(([status, count]) => `${status}: ${count}`).join(', ') || 'none',
    String(batch.issues.length),
  ]);

  const lines = [
    '# AP P0 Multi-Batch Validation',
    '',
    `Generated: ${report.generatedAt}`,
    `Source pattern: \`${report.sourcePattern}\``,
    '',
    '## Summary',
    '',
    `- Batch files: ${report.summary.batchFileCount}`,
    `- Parsed batch files: ${report.summary.parsedBatchFileCount}`,
    `- Cards: ${report.summary.totalCards}`,
    `- Gate statuses: ${report.summary.totalGates}`,
    `- Gate counts by status: ${Object.entries(report.summary.gateStatusCounts).map(([status, count]) => `${status}: ${count}`).join(', ') || 'none'}`,
    `- Completion: ${report.summary.percentComplete}% complete, ${report.summary.percentReviewReady}% ready-for-review, ${report.summary.percentMissing}% missing`,
    `- Duplicate card IDs across batches: ${report.summary.duplicateCardIdCount}`,
    `- Duplicate sourceQueueIds across batches: ${report.summary.duplicateSourceQueueIdCount}`,
    `- Cards with missing required fields: ${report.summary.cardsWithMissingRequiredFields}`,
    `- Cards without ${report.expectedGateStatusCount} gateStatuses: ${report.summary.cardsWithoutExpectedGateCount}`,
    `- Gates with missing required fields: ${report.summary.gatesWithMissingRequiredFields}`,
    `- Readiness mismatches: ${report.summary.readinessMismatchCount}`,
    `- Issues: ${report.summary.issueCount} (${report.summary.errorCount} errors, ${report.summary.warningCount} warnings)`,
    '',
    '## Batch Files',
    '',
    report.batches.length
      ? markdownTable(['File', 'Batch', 'Cards', 'Gates', 'Gate status counts', 'Issues'], batchRows)
      : 'No files matched the AP P0 card batch pattern.',
    '',
    '## Cross-Batch Duplicates',
    '',
  ];

  if (report.duplicateCardIds.length === 0 && report.duplicateSourceQueueIds.length === 0) {
    lines.push('No duplicate card IDs or sourceQueueIds found across batches.');
  } else {
    for (const duplicate of report.duplicateCardIds) {
      lines.push(`- ERROR duplicate card id \`${duplicate.value}\` appears ${duplicate.count} times.`);
    }
    for (const duplicate of report.duplicateSourceQueueIds) {
      lines.push(`- WARNING duplicate sourceQueueId \`${duplicate.value}\` appears ${duplicate.count} times.`);
    }
  }

  lines.push('', '## Issues', '');
  if (report.issues.length === 0) {
    lines.push('No validation issues found.');
  } else {
    for (const issue of report.issues) {
      const location = issue.file ? ` (${issue.file}${issue.cardId ? ` / ${issue.cardId}` : ''})` : '';
      lines.push(`- ${issue.severity.toUpperCase()} \`${issue.code}\`${location}: ${issue.message}`);
    }
  }

  fs.writeFileSync(mdReportPath, `${lines.join('\n')}\n`);
}

function main() {
  const report = buildReport();
  writeReports(report);

  console.log('AP P0 multi-batch validation complete.');
  console.log(`Batch files: ${report.summary.batchFileCount}`);
  console.log(`Parsed batch files: ${report.summary.parsedBatchFileCount}`);
  console.log(`Cards: ${report.summary.totalCards}`);
  console.log(`Gate statuses: ${report.summary.totalGates}`);
  console.log(
    `Gate status counts: ${Object.entries(report.summary.gateStatusCounts)
      .map(([status, count]) => `${status}=${count}`)
      .join(', ') || 'none'}`,
  );
  console.log(`Duplicate card IDs: ${report.summary.duplicateCardIdCount}`);
  console.log(`Duplicate sourceQueueIds: ${report.summary.duplicateSourceQueueIdCount}`);
  console.log(`Issues: ${report.summary.issueCount} (${report.summary.errorCount} errors, ${report.summary.warningCount} warnings)`);
  console.log(`Wrote ${path.relative(repoRoot, jsonReportPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, mdReportPath)}`);

  if (report.summary.errorCount > 0) {
    process.exitCode = 1;
  }
}

main();
