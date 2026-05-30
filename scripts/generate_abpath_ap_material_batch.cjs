#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const outJsonPath = path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch001.json');
const outReportPath = path.join(repoRoot, 'reports/abpath_ap_material_batch_001.md');

const BATCH_ID = 'abpath-ap-material-batch-001';
const BATCH_SIZE = 12;
const TARGET_PRIORITY = 'P0 core board/sign-out gap';
const TARGET_PHASE = 'Phase 1: core resident coverage';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function countBy(entries, keyFn) {
  return entries.reduce((acc, entry) => {
    const key = keyFn(entry);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function materializeRow(entry, index) {
  return {
    batchRow: index + 1,
    queueId: entry.id,
    domain: entry.domain,
    subject: entry.subject,
    categoryId: entry.categoryId,
    materialKind: entry.materialKind,
    title: entry.title,
    difficulty: entry.difficulty,
    learnerLevel: 'PGY1-PGY2 core resident',
    pathHierarchy: entry.path,
    source: {
      sourcePath: entry.source.sourcePath,
      rawSourcePath: entry.source.rawSourcePath,
      sourceTopicId: entry.source.sourceTopicId,
      sourceLine: entry.source.sourceLine,
    },
    requiredMaterialSet: entry.generator.requiredMaterialSet,
    generatorProfile: entry.generator.profile,
    review: {
      reviewStatus: 'unreviewed',
      promotionStatus: 'review-queue',
      reviewerRequired: true,
      promotionAllowed: false,
    },
    sourceQueueStatus: {
      reviewStatus: entry.expansionStatus.reviewStatus,
      promotionStatus: entry.expansionStatus.promotionStatus,
      gapPlanPriority: entry.expansionStatus.gapPlanPriority,
      gapPlanPhase: entry.expansionStatus.gapPlanPhase,
    },
  };
}

function buildPayload(queue) {
  const rows = queue.entries
    .filter(
      (entry) =>
        entry.domain === 'AP' &&
        entry.expansionStatus?.reviewStatus === 'unreviewed' &&
        entry.expansionStatus?.gapPlanPriority === TARGET_PRIORITY &&
        entry.expansionStatus?.gapPlanPhase === TARGET_PHASE,
    )
    .slice(0, BATCH_SIZE)
    .map(materializeRow);

  if (rows.length !== BATCH_SIZE) {
    throw new Error(`Expected ${BATCH_SIZE} AP P0 rows, found ${rows.length}`);
  }

  return {
    version: 'abpath-ap-material-batch.v1',
    batchId: BATCH_ID,
    generatedAt: new Date().toISOString(),
    sourceQueue: 'src/content/materials/abpathMaterialExpansionQueue.json',
    purpose:
      'First bounded AP core-resident materialization batch from the ABPath expansion queue; review-queue only, not promoted teaching truth.',
    selectionCriteria: {
      domain: 'AP',
      priority: TARGET_PRIORITY,
      phase: TARGET_PHASE,
      reviewStatus: 'unreviewed',
      batchSize: BATCH_SIZE,
      ordering: 'existing expansion queue order',
    },
    guardrails: [
      'Every row remains unreviewed until faculty or owner review is attached.',
      'Batch rows are review-queue materialization candidates, not promoted curriculum.',
      'Do not overwrite source-truth mappings, CP files, reviewed curriculum, or shared validators from this batch.',
      'Promotion requires source path, path hierarchy, required material set completion, local/licensed image evidence or explicit no-image rationale, and reviewer evidence.',
      'Any downstream learner-facing promotion must preserve queueId, sourceTopicId, sourcePath, review status, and promotion decision.',
    ],
    totals: {
      rows: rows.length,
      reviewStatus: countBy(rows, (row) => row.review.reviewStatus),
      promotionStatus: countBy(rows, (row) => row.review.promotionStatus),
      subjects: countBy(rows, (row) => row.subject),
      materialKinds: countBy(rows, (row) => row.materialKind),
      requiredMaterialSetItems: Array.from(new Set(rows.flatMap((row) => row.requiredMaterialSet))).length,
    },
    rows,
  };
}

function buildReport(payload) {
  return [
    '# ABPath AP Material Batch 001',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Purpose',
    '',
    payload.purpose,
    '',
    '## Selection',
    '',
    `- Source queue: ${payload.sourceQueue}`,
    `- Domain: ${payload.selectionCriteria.domain}`,
    `- Priority: ${payload.selectionCriteria.priority}`,
    `- Phase: ${payload.selectionCriteria.phase}`,
    `- Review status: ${payload.selectionCriteria.reviewStatus}`,
    `- Batch size: ${payload.selectionCriteria.batchSize}`,
    '',
    '## Totals',
    '',
    `- Rows: ${payload.totals.rows}`,
    `- Review status: ${Object.entries(payload.totals.reviewStatus)
      .map(([status, count]) => `${status}=${count}`)
      .join(', ')}`,
    `- Promotion status: ${Object.entries(payload.totals.promotionStatus)
      .map(([status, count]) => `${status}=${count}`)
      .join(', ')}`,
    `- Subjects: ${Object.entries(payload.totals.subjects)
      .map(([subject, count]) => `${subject}=${count}`)
      .join(', ')}`,
    '',
    '## Batch Promotion Guardrails',
    '',
    ...payload.guardrails.map((item) => `- ${item}`),
    '',
    '## Rows',
    '',
    markdownTable(
      ['#', 'Subject', 'Kind', 'Title', 'Path', 'Source path', 'Review', 'Promotion'],
      payload.rows.map((row) => [
        String(row.batchRow),
        row.subject,
        row.materialKind,
        row.title,
        row.pathHierarchy.join(' > '),
        row.source.sourcePath,
        row.review.reviewStatus,
        row.review.promotionStatus,
      ]),
    ),
    '',
    '## Required Material Set',
    '',
    ...Array.from(new Set(payload.rows.flatMap((row) => row.requiredMaterialSet))).map((item) => `- ${item}`),
  ].join('\n');
}

function main() {
  const queue = readJson(queuePath);
  const payload = buildPayload(queue);
  const report = buildReport(payload);

  ensureDir(outJsonPath);
  ensureDir(outReportPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(outReportPath, `${report}\n`);

  console.log(`[ABPATH-AP-MATERIAL-BATCH] Wrote ${payload.totals.rows} rows to ${path.relative(repoRoot, outJsonPath)}.`);
}

main();
