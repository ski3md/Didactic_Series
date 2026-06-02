#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const coverageMapPath = path.join(repoRoot, 'reports/curriculum/cp_worked_example_coverage_map_v1.json');
const outJsonPath = path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch005.json');
const outReportPath = path.join(repoRoot, 'reports/abpath_cp_material_batch_005.md');

const BATCH_ID = 'abpath-cp-material-batch-005';
const BATCH_VERSION = 'abpath-cp-material-batch.v1';
const SELECTED_QUEUE_ENTRY_IDS = [
  'cp-bb-bb-6-a-hemolytic-transfusion-reactions-996f19c838',
  'cp-bb-bb-6-b-febrile-allergic-and-non-immune-transfusion-reactions-cb4a881404',
  'cp-bb-bb-6-c-transfusion-associated-graft-versus-host-disease-333ee3be6d',
  'cp-bb-bb-6-d-transfusion-induced-iron-overload-95f7d58c4d',
  'cp-bb-bb-6-e-transfusion-related-acute-lung-injury-trali-162a4f5ae0',
  'cp-bb-bb-6-f-vasovagal-and-hypovolemic-reactions-5feb473467',
  'cp-bb-bb-8-infectious-hazards-of-transfusion-9d1cb8c135',
  'cp-bb-bb-8-a-septic-transfusion-reactions-7fd750f6a3',
  'cp-bb-bb-8-b-prion-disease-transmission-cjd-b3ccbfdb39',
  'cp-bb-bb-10-surgery-patients-04ac9abf8f',
];

const PROMOTION_GUARDRAILS = [
  'Rows in this batch are unreviewed review-queue items, not authoritative teaching truth.',
  'Do not overwrite source-truth mappings, reviewed CP anchors, AP files, prior CP batch files, queue generators, or shared validators from this batch.',
  'Promotion requires source path retention, worked-example artifact evidence, faculty review, and explicit reviewer action.',
  'A generated worked example must show the clinical question, representative lab artifact, interpretation path, safety stop, and review checklist before promotion.',
];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const markdownTable = (headers, rows) =>
  [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');

function buildBatch(queue, coverageMap) {
  const queueById = new Map(queue.entries.map((entry) => [entry.id, entry]));
  const coverageById = new Map(coverageMap.rows.map((row) => [row.queueEntryId, row]));
  const missingQueueIds = SELECTED_QUEUE_ENTRY_IDS.filter((id) => !queueById.has(id));
  const missingCoverageIds = SELECTED_QUEUE_ENTRY_IDS.filter((id) => !coverageById.has(id));

  if (missingQueueIds.length > 0) {
    throw new Error(`Missing CP queue ID(s): ${missingQueueIds.join(', ')}`);
  }
  if (missingCoverageIds.length > 0) {
    throw new Error(`Missing CP worked-example coverage ID(s): ${missingCoverageIds.join(', ')}`);
  }

  const rows = SELECTED_QUEUE_ENTRY_IDS.map((queueEntryId, index) => {
    const entry = queueById.get(queueEntryId);
    const coverage = coverageById.get(queueEntryId);

    return {
      batchRowId: `${BATCH_ID}-row-${String(index + 1).padStart(2, '0')}`,
      queueEntryId: entry.id,
      domain: entry.domain,
      subject: entry.subject,
      categoryId: entry.categoryId,
      materialKind: entry.materialKind,
      title: entry.title,
      difficulty: entry.difficulty,
      path: entry.path,
      pathHierarchy: entry.path.join(' > '),
      source: {
        sourcePath: entry.source.sourcePath,
        rawSourcePath: entry.source.rawSourcePath,
        sourceTopicId: entry.source.sourceTopicId,
        sourceLine: entry.source.sourceLine,
      },
      requiredMaterialSet: entry.generator.requiredMaterialSet,
      workedExampleCoverage: {
        coverageMap: 'reports/curriculum/cp_worked_example_coverage_map_v1.json',
        workedExampleDomain: coverage.workedExampleDomain,
        workedExampleRequired: coverage.workedExampleRequired,
        requiredExampleShape: coverage.requiredExampleShape,
        currentCoverageStatus: coverage.currentCoverageStatus,
      },
      review: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        sourceQueuePromotionStatus: entry.expansionStatus.promotionStatus,
        reviewerRequired: true,
        promotionAllowed: false,
      },
      batchPromotionGuardrails: PROMOTION_GUARDRAILS,
    };
  });

  return {
    version: BATCH_VERSION,
    batchId: BATCH_ID,
    generatedAt: new Date().toISOString(),
    purpose:
      'Fifth bounded CP materialization slice from the worked-example coverage map; review-queue only, not promoted teaching truth.',
    selection: {
      sourceQueuePath: 'src/content/materials/abpathMaterialExpansionQueue.json',
      sourceCoverageMapPath: 'reports/curriculum/cp_worked_example_coverage_map_v1.json',
      sourceQueueVersion: queue.version,
      domain: 'CP',
      selectionRationale:
        'Next ten unmaterialized CP worked-example coverage rows after CP batch 004.',
      queueEntryIds: SELECTED_QUEUE_ENTRY_IDS,
      excludedPriorBatchIds: [
        'abpath-cp-material-batch-001',
        'abpath-cp-material-batch-002',
        'abpath-cp-material-batch-003',
        'abpath-cp-material-batch-004',
      ],
    },
    totals: {
      rows: rows.length,
      reviewStatus: { unreviewed: rows.length },
      promotionStatus: { 'review-queue': rows.length },
      workedExampleDomains: rows.reduce((acc, row) => {
        const key = row.workedExampleCoverage.workedExampleDomain;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {}),
    },
    promotionGuardrails: PROMOTION_GUARDRAILS,
    rows,
  };
}

function buildReport(batch) {
  return [
    '# ABPath CP Material Batch 005',
    '',
    `Generated: ${batch.generatedAt}`,
    '',
    '## Slice',
    '',
    `- Batch: ${batch.batchId}`,
    `- Source queue: ${batch.selection.sourceQueuePath}`,
    `- Coverage map: ${batch.selection.sourceCoverageMapPath}`,
    `- Domain: ${batch.selection.domain}`,
    `- Rows: ${batch.totals.rows}`,
    `- Review state: unreviewed / review-queue`,
    `- Prior batches excluded: ${batch.selection.excludedPriorBatchIds.join(', ')}`,
    '',
    '## Selection Rationale',
    '',
    batch.selection.selectionRationale,
    '',
    '## Promotion Guardrails',
    '',
    ...batch.promotionGuardrails.map((guardrail) => `- ${guardrail}`),
    '',
    '## Batch Rows',
    '',
    markdownTable(
      ['Row', 'Source topic', 'Kind', 'Path hierarchy', 'Worked-example domain', 'Required example shape'],
      batch.rows.map((row) => [
        row.batchRowId,
        row.source.sourceTopicId,
        row.materialKind,
        row.pathHierarchy,
        row.workedExampleCoverage.workedExampleDomain,
        row.workedExampleCoverage.requiredExampleShape.join('; '),
      ]),
    ),
    '',
    '## Review Rule',
    '',
    'Every row remains unreviewed and in the review queue until a human reviewer attaches evidence and explicitly promotes it.',
  ].join('\n');
}

function main() {
  const queue = readJson(queuePath);
  const coverageMap = readJson(coverageMapPath);
  const batch = buildBatch(queue, coverageMap);
  const report = buildReport(batch);

  ensureDir(outJsonPath);
  ensureDir(outReportPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(batch, null, 2)}\n`);
  fs.writeFileSync(outReportPath, `${report}\n`);

  console.log(`[ABPATH-CP-MATERIAL-BATCH-005] Wrote ${batch.totals.rows} rows to ${path.relative(repoRoot, outJsonPath)}.`);
}

main();
