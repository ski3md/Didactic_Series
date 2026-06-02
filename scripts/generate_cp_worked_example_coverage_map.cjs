#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const queuePath = path.join(root, 'src/content/materials/abpathMaterialExpansionQueue.json');
const gapInventoryPath = path.join(root, 'reports/curriculum/gap_inventory_v1.json');
const outJsonPath = path.join(root, 'reports/curriculum/cp_worked_example_coverage_map_v1.json');
const outReportPath = path.join(root, 'reports/curriculum/cp_worked_example_coverage_map.md');
const cpBatchPaths = [
  'src/content/materials/abpathCpMaterialBatch001.json',
  'src/content/materials/abpathCpMaterialBatch002.json',
  'src/content/materials/abpathCpMaterialBatch003.json',
  'src/content/materials/abpathCpMaterialBatch004.json',
];

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

function classifyWorkedExampleDomain(entry) {
  const text = `${entry.subject} ${entry.title} ${entry.path.join(' ')}`.toLowerCase();

  if (/blood banking|transfusion|apheresis|plasma exchange|blood product|red blood cell|compatibility/.test(text)) {
    return 'transfusion_medicine';
  }
  if (/chemical pathology|chemistry|nephelometry|analytical|amr|carryover|coefficient of variation|method validation|qc/.test(text)) {
    return /coefficient of variation|validation|qc|amr|carryover/.test(text)
      ? 'clinical_chemistry_quality_statistics'
      : 'clinical_chemistry';
  }
  if (/hematopathology|hemoglobinopathy|hemoglobin/.test(text)) {
    return 'hematopathology_lab_interpretation';
  }
  if (/microbiology|parasitology|bacteriology|mycology|virology/.test(text)) {
    return 'microbiology_lab_interpretation';
  }

  return 'cp_bench_workflow';
}

function exampleShapeFor(entry, domain) {
  const common = [
    'bench-facing clinical question',
    'representative laboratory artifact',
    'stepwise interpretation path',
    'safety or escalation stop',
    'faculty review checklist',
  ];

  if (domain === 'clinical_chemistry_quality_statistics') {
    return [...common, 'formula or measurement rule', 'variables with units', 'acceptance or rejection decision'];
  }
  if (domain === 'clinical_chemistry') {
    return [...common, 'method or analyte context', 'preanalytic variable', 'interpretive caveat'];
  }
  if (domain === 'transfusion_medicine') {
    return [...common, 'product or procedure decision', 'compatibility or indication check', 'handoff trigger'];
  }
  if (domain === 'hematopathology_lab_interpretation') {
    return [...common, 'hemoglobin or smear result pattern', 'confirmatory test decision', 'clinical correlation'];
  }
  if (domain === 'microbiology_lab_interpretation') {
    return [...common, 'organism or syndrome branch', 'test selection decision', 'reporting consequence'];
  }

  return common;
}

function loadBatchRefs() {
  const refs = new Map();

  for (const relativePath of cpBatchPaths) {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      continue;
    }
    const batch = readJson(absolutePath);
    for (const row of batch.rows || []) {
      refs.set(row.queueEntryId, {
        batchId: batch.batchId,
        path: relativePath,
        reviewStatus: row.review?.reviewStatus || 'unknown',
        promotionStatus: row.review?.promotionStatus || 'unknown',
      });
    }
  }

  return refs;
}

function buildPayload(queue, gapInventory) {
  const gap = gapInventory.gap_items.find((item) => item.gap_id === 'GAP-CP-WORKED-EXAMPLES-001');
  const batchRefs = loadBatchRefs();
  const rows = queue.entries
    .filter((entry) => entry.domain === 'CP')
    .map((entry, index) => {
      const workedExampleDomain = classifyWorkedExampleDomain(entry);
      const existingBatchRef = batchRefs.get(entry.id) || null;

      return {
        mapRow: index + 1,
        queueEntryId: entry.id,
        sourceTopicId: entry.source.sourceTopicId,
        sourcePath: entry.source.sourcePath,
        subject: entry.subject,
        categoryId: entry.categoryId,
        materialKind: entry.materialKind,
        title: entry.title,
        path: entry.path,
        priority: entry.expansionStatus.gapPlanPriority || 'unprioritized-cp-queue',
        queueReviewStatus: entry.expansionStatus.reviewStatus,
        queuePromotionStatus: entry.expansionStatus.promotionStatus,
        workedExampleDomain,
        workedExampleRequired: true,
        requiredExampleShape: exampleShapeFor(entry, workedExampleDomain),
        currentCoverageStatus: existingBatchRef ? 'materialized-review-queue' : 'unmaterialized-generation-queue',
        existingBatchRef,
        promotion: {
          allowed: false,
          reason: 'Coverage mapping does not generate or promote worked examples.',
        },
        recommendedNextAction: existingBatchRef
          ? 'Review existing CP material batch row and attach faculty evidence before promotion.'
          : 'Create a bounded CP material batch row with a bench-facing worked example requirement.',
      };
    });

  return {
    contract_version: 'cp-worked-example-coverage-map.v1',
    generated_at: new Date().toISOString(),
    source_order: [
      'Existing curriculum',
      'Local hard-drive corpus',
      'Previously indexed local knowledge base',
      'Internal ontology/library',
      'Open-access online sources later only',
      'Licensed sources later only if available',
      'Human escalation',
    ],
    source_refs: {
      queue: 'src/content/materials/abpathMaterialExpansionQueue.json',
      gap_inventory: 'reports/curriculum/gap_inventory_v1.json',
      gap_id: gap?.gap_id || 'GAP-CP-WORKED-EXAMPLES-001',
      cp_batches: cpBatchPaths,
    },
    coverage_scope: {
      discipline: 'CP',
      mode: 'worked_example_coverage_mapping_only',
      internet_crawling: false,
      source_ingestion: false,
      teaching_content_generation: false,
      promotion_allowed: false,
    },
    summary: {
      rows: rows.length,
      worked_example_required_rows: rows.filter((row) => row.workedExampleRequired).length,
      materialized_review_queue_rows: rows.filter((row) => row.currentCoverageStatus === 'materialized-review-queue').length,
      unmaterialized_generation_queue_rows: rows.filter((row) => row.currentCoverageStatus === 'unmaterialized-generation-queue').length,
      subjects: countBy(rows, (row) => row.subject),
      worked_example_domains: countBy(rows, (row) => row.workedExampleDomain),
      coverage_statuses: countBy(rows, (row) => row.currentCoverageStatus),
    },
    guardrails: [
      'This artifact maps CP worked-example need; it does not generate teaching content.',
      'Every row remains blocked from promotion until a reviewer approves a worked example artifact.',
      'No online search is allowed before local curriculum, local corpus, local KB, and ontology tiers are exhausted.',
      'Future CP batches must preserve queueEntryId, sourceTopicId, sourcePath, review status, and promotion decision.',
    ],
    review_status: 'machine_inventory_only',
    rows,
  };
}

function buildReport(payload) {
  return [
    '# CP Worked-Example Coverage Map',
    '',
    `Generated: ${payload.generated_at}`,
    '',
    '## Scope',
    '',
    `- Queue: ${payload.source_refs.queue}`,
    `- Gap: ${payload.source_refs.gap_id}`,
    `- Mode: ${payload.coverage_scope.mode}`,
    `- Internet crawling: ${payload.coverage_scope.internet_crawling}`,
    `- Teaching content generation: ${payload.coverage_scope.teaching_content_generation}`,
    `- Promotion allowed: ${payload.coverage_scope.promotion_allowed}`,
    '',
    '## Summary',
    '',
    `- CP rows: ${payload.summary.rows}`,
    `- Worked-example required rows: ${payload.summary.worked_example_required_rows}`,
    `- Materialized review-queue rows: ${payload.summary.materialized_review_queue_rows}`,
    `- Unmaterialized generation-queue rows: ${payload.summary.unmaterialized_generation_queue_rows}`,
    '',
    '## Worked-Example Domains',
    '',
    markdownTable(
      ['Domain', 'Rows'],
      Object.entries(payload.summary.worked_example_domains)
        .sort((a, b) => b[1] - a[1])
        .map(([domain, count]) => [domain, String(count)]),
    ),
    '',
    '## Guardrails',
    '',
    ...payload.guardrails.map((guardrail) => `- ${guardrail}`),
    '',
    '## First 25 Rows',
    '',
    markdownTable(
      ['#', 'Queue ID', 'Subject', 'Title', 'Domain', 'Coverage', 'Next action'],
      payload.rows.slice(0, 25).map((row) => [
        String(row.mapRow),
        row.queueEntryId,
        row.subject,
        row.title,
        row.workedExampleDomain,
        row.currentCoverageStatus,
        row.recommendedNextAction,
      ]),
    ),
  ].join('\n');
}

function main() {
  const queue = readJson(queuePath);
  const gapInventory = readJson(gapInventoryPath);
  const payload = buildPayload(queue, gapInventory);
  const report = buildReport(payload);

  ensureDir(outJsonPath);
  ensureDir(outReportPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(outReportPath, `${report}\n`);

  console.log(`[CP-WORKED-EXAMPLE-COVERAGE] Wrote ${payload.summary.rows} rows to ${path.relative(root, outJsonPath)}.`);
}

main();
