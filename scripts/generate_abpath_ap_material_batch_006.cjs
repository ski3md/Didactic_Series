#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const sourceMapPath = path.join(repoRoot, 'reports/curriculum/ap_local_source_map_v1.json');
const priorBatchPaths = [
  'src/content/materials/abpathApMaterialBatch001.json',
  'src/content/materials/abpathApMaterialBatch002.json',
  'src/content/materials/abpathApMaterialBatch003.json',
  'src/content/materials/abpathApMaterialBatch004.json',
  'src/content/materials/abpathApMaterialBatch005.json',
];
const outJsonPath = path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch006.json');
const outReportPath = path.join(repoRoot, 'reports/abpath_ap_material_batch_006.md');

const BATCH_ID = 'abpath-ap-material-batch-006';
const BATCH_SIZE = 4;
const TARGET_PRIORITY = 'P0 core board/sign-out gap';
const TARGET_PHASE = 'Phase 1: core resident coverage';

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const countBy = (entries, keyFn) =>
  entries.reduce((acc, entry) => {
    const key = keyFn(entry);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const markdownTable = (headers, rows) =>
  [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');

const sourceMapKey = (entry) => `${entry.categoryId}-${entry.source.sourceTopicId}`;

const loadPriorBatches = () =>
  priorBatchPaths.map((relativePath) => ({
    relativePath,
    batch: readJson(path.join(repoRoot, relativePath)),
  }));

function materializeRow(entry, sourceMapRow, index) {
  const primaryCandidate = sourceMapRow.local_candidates[0];

  return {
    batchRow: index + 1,
    queueId: entry.id,
    sourceMapId: sourceMapRow.id,
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
    sourceMapEvidence: {
      sourceMapReport: 'reports/curriculum/ap_local_source_map_v1.json',
      bestCandidateSpecificity: sourceMapRow.best_candidate_specificity,
      bestCandidateScore: sourceMapRow.best_candidate_score,
      localCandidateCount: sourceMapRow.local_candidate_count,
      primaryCandidatePath: primaryCandidate?.file_path || null,
      primaryCandidateReuseTarget: primaryCandidate?.reuse_target || null,
      primaryCandidateSpecificity: primaryCandidate?.specificity_class || null,
      primaryCandidateRationale: primaryCandidate?.specificity_rationale || null,
      matchReasons: primaryCandidate?.match_reasons || [],
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

function buildPayload(queue, sourceMap, priorBatches) {
  const priorQueueIds = new Set(priorBatches.flatMap(({ batch }) => batch.rows.map((row) => row.queueId)));
  const queueBySourceMapId = new Map(queue.entries.map((entry) => [sourceMapKey(entry), entry]));
  const topicSpecificRows = sourceMap.candidate_rows.filter(
    (row) => row.best_candidate_specificity === 'topic_specific' && row.priority === TARGET_PRIORITY,
  );

  const rows = topicSpecificRows
    .map((sourceMapRow) => ({
      sourceMapRow,
      queueEntry: queueBySourceMapId.get(sourceMapRow.id),
    }))
    .filter(({ queueEntry }) => queueEntry && !priorQueueIds.has(queueEntry.id))
    .filter(
      ({ queueEntry }) =>
        queueEntry.domain === 'AP' &&
        queueEntry.expansionStatus?.reviewStatus === 'unreviewed' &&
        queueEntry.expansionStatus?.gapPlanPriority === TARGET_PRIORITY &&
        queueEntry.expansionStatus?.gapPlanPhase === TARGET_PHASE,
    )
    .slice(0, BATCH_SIZE)
    .map(({ queueEntry, sourceMapRow }, index) => materializeRow(queueEntry, sourceMapRow, index));

  if (rows.length !== BATCH_SIZE) {
    throw new Error(`Expected ${BATCH_SIZE} topic-specific AP P0 rows for ${BATCH_ID}, found ${rows.length}`);
  }

  return {
    version: 'abpath-ap-material-batch.v1',
    batchId: BATCH_ID,
    generatedAt: new Date().toISOString(),
    sourceQueue: 'src/content/materials/abpathMaterialExpansionQueue.json',
    sourceMap: {
      path: 'reports/curriculum/ap_local_source_map_v1.json',
      contractVersion: sourceMap.contract_version,
      topicSpecificRows: sourceMap.summary.rows_with_topic_specific_best_candidate,
      categoryOnlyRows: sourceMap.summary.rows_with_category_only_best_candidate,
    },
    priorBatches: priorBatches.map(({ relativePath, batch }) => ({
      batchId: batch.batchId,
      path: relativePath,
      excludedQueueIds: batch.rows.map((row) => row.queueId),
    })),
    purpose:
      'Final partial AP core-resident materialization batch from remaining topic-specific local source-map rows; review-queue only, not promoted teaching truth.',
    selectionCriteria: {
      domain: 'AP',
      priority: TARGET_PRIORITY,
      phase: TARGET_PHASE,
      reviewStatus: 'unreviewed',
      batchSize: BATCH_SIZE,
      ordering: 'AP local source map order after excluding AP material batches 001, 002, 003, 004, and 005',
      specificity: 'topic_specific',
      duplicatePolicy: 'exclude queue IDs already present in prior AP material batches',
    },
    guardrails: [
      'Every row remains unreviewed until faculty or owner review is attached.',
      'Batch rows are review-queue materialization candidates, not promoted curriculum.',
      'Batch 006 is the final partial AP tranche and may use only remaining topic-specific local source-map rows.',
      'Category-only source-map rows are intentionally excluded from this batch.',
      'Do not overwrite source-truth mappings, CP files, reviewed curriculum, UI files, or shared generators from this batch.',
      'Promotion requires source path, source-map evidence, local/licensed image evidence or explicit no-image rationale, and reviewer evidence.',
      'Any downstream learner-facing promotion must preserve queueId, sourceTopicId, sourcePath, sourceMapId, review status, and promotion decision.',
    ],
    totals: {
      rows: rows.length,
      reviewStatus: countBy(rows, (row) => row.review.reviewStatus),
      promotionStatus: countBy(rows, (row) => row.review.promotionStatus),
      subjects: countBy(rows, (row) => row.subject),
      materialKinds: countBy(rows, (row) => row.materialKind),
      sourceMapSpecificity: countBy(rows, (row) => row.sourceMapEvidence.bestCandidateSpecificity),
      requiredMaterialSetItems: Array.from(new Set(rows.flatMap((row) => row.requiredMaterialSet))).length,
    },
    rows,
  };
}

function buildReport(payload) {
  return [
    '# ABPath AP Material Batch 006',
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
    `- Source map: ${payload.sourceMap.path}`,
    `- Topic-specific source-map rows available: ${payload.sourceMap.topicSpecificRows}`,
    `- Category-only source-map rows excluded: ${payload.sourceMap.categoryOnlyRows}`,
    `- Prior batches excluded: ${payload.priorBatches.map((batch) => `${batch.batchId} (${batch.excludedQueueIds.length})`).join(', ')}`,
    `- Domain: ${payload.selectionCriteria.domain}`,
    `- Priority: ${payload.selectionCriteria.priority}`,
    `- Specificity: ${payload.selectionCriteria.specificity}`,
    `- Batch size: ${payload.selectionCriteria.batchSize}`,
    '',
    '## Totals',
    '',
    `- Rows: ${payload.totals.rows}`,
    `- Review status: ${Object.entries(payload.totals.reviewStatus).map(([status, count]) => `${status}=${count}`).join(', ')}`,
    `- Promotion status: ${Object.entries(payload.totals.promotionStatus).map(([status, count]) => `${status}=${count}`).join(', ')}`,
    `- Source-map specificity: ${Object.entries(payload.totals.sourceMapSpecificity).map(([status, count]) => `${status}=${count}`).join(', ')}`,
    '',
    '## Batch Promotion Guardrails',
    '',
    ...payload.guardrails.map((item) => `- ${item}`),
    '',
    '## Rows',
    '',
    markdownTable(
      ['#', 'Queue ID', 'Subject', 'Kind', 'Title', 'Path hierarchy', 'Primary local candidate', 'Specificity', 'Review', 'Promotion'],
      payload.rows.map((row) => [
        String(row.batchRow),
        row.queueId,
        row.subject,
        row.materialKind,
        row.title,
        row.pathHierarchy.join(' > '),
        row.sourceMapEvidence.primaryCandidatePath || 'none',
        row.sourceMapEvidence.bestCandidateSpecificity,
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
  const sourceMap = readJson(sourceMapPath);
  const priorBatches = loadPriorBatches();
  const payload = buildPayload(queue, sourceMap, priorBatches);
  const report = buildReport(payload);

  ensureDir(outJsonPath);
  ensureDir(outReportPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(outReportPath, `${report}\n`);

  console.log(`[ABPATH-AP-MATERIAL-BATCH-006] Wrote ${payload.totals.rows} rows to ${path.relative(repoRoot, outJsonPath)}.`);
}

main();
