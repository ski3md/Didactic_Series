#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const batchPath = path.join(ROOT, 'src/content/competency/apP0EntityCardBatch.ts');
const reportJsonPath = path.join(ROOT, 'reports/ap_p0_entity_card_validation.json');
const reportMdPath = path.join(ROOT, 'reports/ap_p0_entity_card_validation.md');

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
const EXPECTED_GATE_COUNT = 5;

function readBatchSource() {
  if (!fs.existsSync(batchPath)) {
    throw new Error(`Missing batch file: ${path.relative(ROOT, batchPath)}`);
  }
  return fs.readFileSync(batchPath, 'utf8');
}

function findExportedObjectText(source, exportName) {
  const exportNeedle = `export const ${exportName}`;
  const exportIndex = source.indexOf(exportNeedle);
  if (exportIndex === -1) {
    throw new Error(`Could not find ${exportNeedle}`);
  }

  const equalsIndex = source.indexOf('=', exportIndex);
  if (equalsIndex === -1) {
    throw new Error(`Could not find assignment for ${exportName}`);
  }

  const objectStart = source.indexOf('{', equalsIndex);
  if (objectStart === -1) {
    throw new Error(`Could not find object literal start for ${exportName}`);
  }

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let index = objectStart; index < source.length; index += 1) {
    const char = source[index];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (inString) {
      if (char === '\\') {
        escapeNext = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(objectStart, index + 1);
      }
    }
  }

  throw new Error(`Could not find object literal end for ${exportName}`);
}

function loadBatch() {
  const source = readBatchSource();
  const objectText = findExportedObjectText(source, 'apP0EntityCardBatch');
  try {
    return JSON.parse(objectText);
  } catch (error) {
    throw new Error(`Failed to parse exported object as JSON: ${error.message}`);
  }
}

function isBlank(value) {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

function getMissingFields(record, requiredFields) {
  return requiredFields.filter((field) => isBlank(record[field]));
}

function findDuplicates(values) {
  const counts = new Map();
  for (const value of values) {
    if (isBlank(value)) {
      continue;
    }
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([value, count]) => ({ value, count }));
}

function summarizeGateStatuses(cards) {
  const summary = {
    totalGates: 0,
    byStatus: {},
    byGateId: {},
  };

  for (const card of cards) {
    for (const gate of Array.isArray(card.gateStatuses) ? card.gateStatuses : []) {
      summary.totalGates += 1;
      summary.byStatus[gate.status] = (summary.byStatus[gate.status] || 0) + 1;
      summary.byGateId[gate.id] = (summary.byGateId[gate.id] || 0) + 1;
    }
  }

  return summary;
}

function validateBatch(batch) {
  const cards = Array.isArray(batch.cards) ? batch.cards : [];
  const missingBatchFields = getMissingFields(batch, REQUIRED_BATCH_FIELDS);
  const facultyPacketPath = typeof batch.facultyPacketPath === 'string' ? batch.facultyPacketPath : '';
  const facultyPacketAbsPath = facultyPacketPath ? path.join(ROOT, facultyPacketPath) : '';
  const facultyPacketExists = Boolean(facultyPacketAbsPath && fs.existsSync(facultyPacketAbsPath));

  const cardReports = cards.map((card, index) => {
    const gateStatuses = Array.isArray(card.gateStatuses) ? card.gateStatuses : [];
    const gateReports = gateStatuses.map((gate, gateIndex) => ({
      index: gateIndex,
      id: gate.id || null,
      status: gate.status || null,
      missingFields: getMissingFields(gate, REQUIRED_GATE_FIELDS),
    }));

    return {
      index,
      id: card.id || null,
      title: card.title || null,
      sourceQueueId: card.sourceQueueId || null,
      missingFields: getMissingFields(card, REQUIRED_CARD_FIELDS),
      gateStatusCount: gateStatuses.length,
      expectedGateStatusCount: EXPECTED_GATE_COUNT,
      hasExpectedGateStatusCount: gateStatuses.length === EXPECTED_GATE_COUNT,
      duplicateGateIds: findDuplicates(gateStatuses.map((gate) => gate.id)),
      gatesWithMissingFields: gateReports.filter((gate) => gate.missingFields.length > 0),
      readinessMatchesGateCount: card.readiness?.totalGates === gateStatuses.length,
    };
  });

  const duplicateCardIds = findDuplicates(cards.map((card) => card.id));
  const duplicateSourceQueueIds = findDuplicates(cards.map((card) => card.sourceQueueId));
  const gateSummary = summarizeGateStatuses(cards);

  const issues = [];
  if (missingBatchFields.length > 0) {
    issues.push({
      severity: 'error',
      code: 'missing-batch-fields',
      message: `Missing batch fields: ${missingBatchFields.join(', ')}`,
    });
  }
  if (!facultyPacketPath) {
    issues.push({
      severity: 'error',
      code: 'missing-faculty-packet-path',
      message: 'facultyPacketPath is missing or blank.',
    });
  } else if (!facultyPacketExists) {
    issues.push({
      severity: 'error',
      code: 'faculty-packet-file-not-found',
      message: `facultyPacketPath does not exist: ${facultyPacketPath}`,
    });
  }
  for (const duplicate of duplicateCardIds) {
    issues.push({
      severity: 'error',
      code: 'duplicate-card-id',
      message: `Duplicate card id ${duplicate.value} appears ${duplicate.count} times.`,
    });
  }
  for (const duplicate of duplicateSourceQueueIds) {
    issues.push({
      severity: 'warning',
      code: 'duplicate-source-queue-id',
      message: `Duplicate sourceQueueId ${duplicate.value} appears ${duplicate.count} times.`,
    });
  }
  for (const cardReport of cardReports) {
    if (cardReport.missingFields.length > 0) {
      issues.push({
        severity: 'error',
        code: 'missing-card-fields',
        cardId: cardReport.id,
        message: `Card ${cardReport.id || cardReport.index} missing fields: ${cardReport.missingFields.join(', ')}`,
      });
    }
    if (!cardReport.hasExpectedGateStatusCount) {
      issues.push({
        severity: 'error',
        code: 'unexpected-gate-status-count',
        cardId: cardReport.id,
        message: `Card ${cardReport.id || cardReport.index} has ${cardReport.gateStatusCount} gateStatuses; expected ${EXPECTED_GATE_COUNT}.`,
      });
    }
    if (!cardReport.readinessMatchesGateCount) {
      issues.push({
        severity: 'warning',
        code: 'readiness-total-gates-mismatch',
        cardId: cardReport.id,
        message: `Card ${cardReport.id || cardReport.index} readiness.totalGates does not match gateStatuses length.`,
      });
    }
    for (const duplicate of cardReport.duplicateGateIds) {
      issues.push({
        severity: 'error',
        code: 'duplicate-gate-id',
        cardId: cardReport.id,
        message: `Card ${cardReport.id || cardReport.index} has duplicate gate id ${duplicate.value}.`,
      });
    }
    for (const gate of cardReport.gatesWithMissingFields) {
      issues.push({
        severity: 'error',
        code: 'missing-gate-fields',
        cardId: cardReport.id,
        message: `Card ${cardReport.id || cardReport.index} gate ${gate.id || gate.index} missing fields: ${gate.missingFields.join(', ')}`,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, batchPath),
    facultyPacketPath: facultyPacketPath || null,
    facultyPacketExists,
    expectedGateStatusCount: EXPECTED_GATE_COUNT,
    summary: {
      cardCount: cards.length,
      cardsWithFiveGateStatuses: cardReports.filter((card) => card.hasExpectedGateStatusCount).length,
      cardsWithoutFiveGateStatuses: cardReports.filter((card) => !card.hasExpectedGateStatusCount).length,
      cardsWithMissingRequiredFields: cardReports.filter((card) => card.missingFields.length > 0).length,
      duplicateCardIdCount: duplicateCardIds.length,
      duplicateSourceQueueIdCount: duplicateSourceQueueIds.length,
      gatesWithMissingRequiredFields: cardReports.reduce(
        (count, card) => count + card.gatesWithMissingFields.length,
        0,
      ),
      issueCount: issues.length,
      errorCount: issues.filter((issue) => issue.severity === 'error').length,
      warningCount: issues.filter((issue) => issue.severity === 'warning').length,
      gateCounts: gateSummary,
    },
    duplicateCardIds,
    duplicateSourceQueueIds,
    missingBatchFields,
    cards: cardReports,
    issues,
  };
}

function writeJsonReport(report) {
  fs.mkdirSync(path.dirname(reportJsonPath), { recursive: true });
  fs.writeFileSync(reportJsonPath, `${JSON.stringify(report, null, 2)}\n`);
}

function writeMarkdownReport(report) {
  const lines = [
    '# AP P0 Entity Card Validation',
    '',
    `Generated: ${report.generatedAt}`,
    `Source: \`${report.source}\``,
    `Faculty packet: \`${report.facultyPacketPath || 'missing'}\` (${report.facultyPacketExists ? 'found' : 'missing'})`,
    '',
    '## Summary',
    '',
    `- Cards: ${report.summary.cardCount}`,
    `- Cards with 5 gateStatuses: ${report.summary.cardsWithFiveGateStatuses}`,
    `- Cards without 5 gateStatuses: ${report.summary.cardsWithoutFiveGateStatuses}`,
    `- Total gates: ${report.summary.gateCounts.totalGates}`,
    `- Gate counts by status: ${Object.entries(report.summary.gateCounts.byStatus)
      .map(([status, count]) => `${status}: ${count}`)
      .join(', ') || 'none'}`,
    `- Duplicate card IDs: ${report.summary.duplicateCardIdCount}`,
    `- Duplicate sourceQueueIds: ${report.summary.duplicateSourceQueueIdCount}`,
    `- Cards with missing required fields: ${report.summary.cardsWithMissingRequiredFields}`,
    `- Gates with missing required fields: ${report.summary.gatesWithMissingRequiredFields}`,
    `- Issues: ${report.summary.issueCount} (${report.summary.errorCount} errors, ${report.summary.warningCount} warnings)`,
    '',
    '## Issues',
    '',
  ];

  if (report.issues.length === 0) {
    lines.push('No validation issues found.');
  } else {
    for (const issue of report.issues) {
      lines.push(`- ${issue.severity.toUpperCase()} \`${issue.code}\`: ${issue.message}`);
    }
  }

  lines.push('', '## Cards Without 5 Gate Statuses', '');
  const cardsWithoutFiveGates = report.cards.filter((card) => !card.hasExpectedGateStatusCount);
  if (cardsWithoutFiveGates.length === 0) {
    lines.push('None.');
  } else {
    for (const card of cardsWithoutFiveGates) {
      lines.push(`- \`${card.id || `index-${card.index}`}\`: ${card.gateStatusCount}/${card.expectedGateStatusCount}`);
    }
  }

  fs.writeFileSync(reportMdPath, `${lines.join('\n')}\n`);
}

function main() {
  const batch = loadBatch();
  const report = validateBatch(batch);
  writeJsonReport(report);
  writeMarkdownReport(report);

  console.log('AP P0 entity card validation complete.');
  console.log(`Cards: ${report.summary.cardCount}`);
  console.log(`Gate statuses: ${report.summary.gateCounts.totalGates}`);
  console.log(
    `Gate status counts: ${Object.entries(report.summary.gateCounts.byStatus)
      .map(([status, count]) => `${status}=${count}`)
      .join(', ') || 'none'}`,
  );
  console.log(`Cards with 5 gateStatuses: ${report.summary.cardsWithFiveGateStatuses}`);
  console.log(`Cards without 5 gateStatuses: ${report.summary.cardsWithoutFiveGateStatuses}`);
  console.log(`Duplicate card IDs: ${report.summary.duplicateCardIdCount}`);
  console.log(`Duplicate sourceQueueIds: ${report.summary.duplicateSourceQueueIdCount}`);
  console.log(`Faculty packet: ${report.facultyPacketExists ? 'found' : 'missing'} (${report.facultyPacketPath || 'none'})`);
  console.log(`Issues: ${report.summary.issueCount} (${report.summary.errorCount} errors, ${report.summary.warningCount} warnings)`);
  console.log(`Wrote ${path.relative(ROOT, reportJsonPath)}`);
  console.log(`Wrote ${path.relative(ROOT, reportMdPath)}`);

  if (report.summary.errorCount > 0) {
    process.exitCode = 1;
  }
}

main();
