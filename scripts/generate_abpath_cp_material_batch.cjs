#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const outJsonPath = path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch001.json');
const outReportPath = path.join(repoRoot, 'reports/abpath_cp_material_batch_001.md');

const BATCH_ID = 'abpath-cp-material-batch-001';
const BATCH_VERSION = 'abpath-cp-material-batch.v1';
const SELECTED_SOURCE_TOPIC_IDS = [
  'bb-3',
  'bb-3-d',
  'bb-3-e',
  'bb-3-f',
  'bb-3-g',
  'bb-3-h',
  'bb-3-i',
  'bb-3-j',
  'bb-3-k',
];

const PROMOTION_GUARDRAILS = [
  'Rows in this batch are unreviewed review-queue items, not authoritative teaching truth.',
  'Do not overwrite source-truth mappings, reviewed CP anchors, AP files, or shared validators from this batch.',
  'Promotion requires source path retention, bench-facing artifact evidence, faculty review, and explicit reviewer action.',
  'A generated bench artifact must show the clinical question, next lab check, interpretation path, and safety stop before promotion.',
];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function artifactRequirementsFor(entry) {
  const title = `${entry.title} ${entry.path.join(' ')}`.toLowerCase();
  const common = [
    'Start with a bench-facing clinical question, not an encyclopedic topic summary.',
    'Include a representative laboratory artifact that a resident could inspect at signout or on call.',
    'Show the next-test or interpretation pathway and the decision point it resolves.',
    'Make the critical-result, incompatibility, or patient-safety stop visible when applicable.',
  ];

  if (/genotyping/.test(title)) {
    return [
      ...common,
      'Use an RBC genotype-to-antigen phenotype interpretation card with transfusion-service consequence.',
    ];
  }

  if (/compatibility|immunology/.test(title)) {
    return [
      ...common,
      'Use an antibody screen, crossmatch, or compatibility-testing worksheet with the safest next check marked.',
    ];
  }

  if (/abh|rh|lw|kell|duffy|kidd|p1|blood group|antigen|antibodies/.test(title)) {
    return [
      ...common,
      'Use a blood-group antigen/antibody interpretation table tied to component selection or escalation.',
    ];
  }

  if (/cold reactive/.test(title)) {
    return [
      ...common,
      'Use a temperature-reactivity or prewarm-method decision card tied to compatibility testing.',
    ];
  }

  return [
    ...common,
    'Use an RBC component selection or compatibility workflow card tied to transfusion-service action.',
  ];
}

function markdownTable(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

function buildBatch(queue) {
  const selectedIdSet = new Set(SELECTED_SOURCE_TOPIC_IDS);
  const queueRows = queue.entries.filter((entry) => selectedIdSet.has(entry.source.sourceTopicId));
  const foundIds = new Set(queueRows.map((entry) => entry.source.sourceTopicId));
  const missing = SELECTED_SOURCE_TOPIC_IDS.filter((id) => !foundIds.has(id));

  if (missing.length > 0) {
    throw new Error(`Missing CP queue sourceTopicId(s): ${missing.join(', ')}`);
  }

  const rows = SELECTED_SOURCE_TOPIC_IDS.map((sourceTopicId, index) => {
    const entry = queueRows.find((candidate) => candidate.source.sourceTopicId === sourceTopicId);
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
      benchFacingArtifactRequirements: artifactRequirementsFor(entry),
      review: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        sourceQueuePromotionStatus: entry.expansionStatus.promotionStatus,
        reviewerRequired: true,
      },
      batchPromotionGuardrails: PROMOTION_GUARDRAILS,
    };
  });

  return {
    version: BATCH_VERSION,
    batchId: BATCH_ID,
    generatedAt: new Date().toISOString(),
    purpose:
      'First bounded CP bench-facing materialization slice from the ABPath material expansion queue.',
    selection: {
      sourceQueuePath: 'src/content/materials/abpathMaterialExpansionQueue.json',
      sourceQueueVersion: queue.version,
      domain: 'CP',
      subject: 'Blood Banking/Transfusion Medicine',
      pathPrefix: ['Blood Banking/Transfusion Medicine', 'RBCs and RBC Components'],
      selectionRationale:
        'Bounded RBC component and compatibility-testing slice with clear bench-facing artifacts and safety decisions.',
      sourceTopicIds: SELECTED_SOURCE_TOPIC_IDS,
    },
    totals: {
      rows: rows.length,
      reviewStatus: { unreviewed: rows.length },
      promotionStatus: { 'review-queue': rows.length },
    },
    promotionGuardrails: PROMOTION_GUARDRAILS,
    rows,
  };
}

function buildReport(batch) {
  return [
    '# ABPath CP Material Batch 001',
    '',
    `Generated: ${batch.generatedAt}`,
    '',
    '## Slice',
    '',
    `- Batch: ${batch.batchId}`,
    `- Source queue: ${batch.selection.sourceQueuePath}`,
    `- Domain: ${batch.selection.domain}`,
    `- Subject: ${batch.selection.subject}`,
    `- Path prefix: ${batch.selection.pathPrefix.join(' > ')}`,
    `- Rows: ${batch.totals.rows}`,
    `- Review state: unreviewed / review-queue`,
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
      ['Row', 'Source topic', 'Kind', 'Difficulty', 'Path hierarchy', 'Required artifact focus'],
      batch.rows.map((row) => [
        row.batchRowId,
        row.source.sourceTopicId,
        row.materialKind,
        row.difficulty,
        row.pathHierarchy,
        row.benchFacingArtifactRequirements[row.benchFacingArtifactRequirements.length - 1],
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
  const batch = buildBatch(queue);
  const report = buildReport(batch);

  ensureDir(outJsonPath);
  ensureDir(outReportPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(batch, null, 2)}\n`);
  fs.writeFileSync(outReportPath, `${report}\n`);

  console.log(
    `[ABPATH-CP-MATERIAL-BATCH] Wrote ${batch.totals.rows} rows to ${path.relative(repoRoot, outJsonPath)}.`,
  );
}

main();
