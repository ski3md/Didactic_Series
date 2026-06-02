#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const sourceMapPath = path.join(root, 'reports/curriculum/ap_local_source_map_v1.json');
const triagePath = path.join(root, 'reports/curriculum/ap_category_only_source_map_triage_v1.json');
const reportPath = path.join(root, 'reports/curriculum/ap_category_only_source_map_triage.md');

const failures = [];
const passes = [];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensure = (condition, passMessage, failMessage) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

ensure(fs.existsSync(sourceMapPath), 'source map exists', `missing source map: ${sourceMapPath}`);
ensure(fs.existsSync(triagePath), 'triage artifact exists', `missing triage artifact: ${triagePath}`);
ensure(fs.existsSync(reportPath), 'triage report exists', `missing triage report: ${reportPath}`);

const sourceMap = readJson(sourceMapPath);
const triage = readJson(triagePath);
const report = fs.readFileSync(reportPath, 'utf8');
const categoryOnlyRows = sourceMap.candidate_rows.filter((row) => row.best_candidate_specificity === 'category_only');
const categoryOnlyIds = new Set(categoryOnlyRows.map((row) => row.id));
const triageIds = new Set();

ensure(
  triage.contract_version === 'ap-category-only-source-map-triage.v1',
  'contract version matches',
  `unexpected contract_version: ${triage.contract_version}`
);
ensure(
  triage.source_map_ref === 'reports/curriculum/ap_local_source_map_v1.json',
  'source map ref matches',
  `unexpected source_map_ref: ${triage.source_map_ref}`
);
ensure(triage.triage_scope?.discipline === 'AP', 'discipline is AP', 'triage_scope.discipline must be AP');
ensure(
  triage.triage_scope?.source_specificity === 'category_only',
  'source specificity is category_only',
  'triage_scope.source_specificity must be category_only'
);
ensure(
  triage.triage_scope?.mode === 'triage_inventory_only',
  'mode is triage inventory only',
  'triage_scope.mode must be triage_inventory_only'
);
ensure(triage.triage_scope?.internet_crawling === false, 'internet crawling disabled', 'internet_crawling must be false');
ensure(triage.triage_scope?.source_ingestion === false, 'source ingestion disabled', 'source_ingestion must be false');
ensure(
  triage.triage_scope?.teaching_content_generation === false,
  'teaching generation disabled',
  'teaching_content_generation must be false'
);
ensure(triage.triage_scope?.promotion_allowed === false, 'promotion blocked', 'promotion_allowed must be false');

ensure(Array.isArray(triage.rows), 'rows array exists', 'triage.rows must be an array');
ensure(
  triage.rows.length === categoryOnlyRows.length,
  'triage row count matches source map category-only rows',
  `expected ${categoryOnlyRows.length} triage rows, found ${triage.rows.length}`
);
ensure(
  triage.summary?.rows === triage.rows.length,
  'summary rows match triage row count',
  'summary.rows must match rows.length'
);
ensure(
  triage.summary?.source_map_category_only_rows === sourceMap.summary.rows_with_category_only_best_candidate,
  'source map category-only summary matches',
  'summary.source_map_category_only_rows must match source map summary'
);

for (const [index, row] of triage.rows.entries()) {
  ensure(categoryOnlyIds.has(row.sourceMapId), `row ${index} references category-only source map id`, `row ${index} references non-category-only id: ${row.sourceMapId}`);
  ensure(!triageIds.has(row.sourceMapId), `row ${index} sourceMapId unique`, `duplicate sourceMapId: ${row.sourceMapId}`);
  triageIds.add(row.sourceMapId);
  ensure(
    row.bestCandidateSpecificity === 'category_only',
    `row ${index} best specificity is category_only`,
    `row ${index} bestCandidateSpecificity must be category_only`
  );
  ensure(
    row.triageStatus === 'category-only-needs-topic-specific-evidence',
    `row ${index} triage status explicit`,
    `row ${index} has unexpected triageStatus: ${row.triageStatus}`
  );
  ensure(row.promotion?.allowed === false, `row ${index} promotion blocked`, `row ${index} promotion.allowed must be false`);
  ensure(Boolean(row.recommendedNextAction), `row ${index} next action present`, `row ${index} missing recommendedNextAction`);
  ensure(
    !/https?:\/\//i.test(row.primaryCandidate?.filePath || ''),
    `row ${index} primary candidate path is local`,
    `row ${index} primary candidate path must not be URL`
  );
  ensure(
    row.primaryCandidate?.specificityClass === 'category_only',
    `row ${index} primary candidate specificity is category_only`,
    `row ${index} primary candidate specificity must be category_only`
  );
}

ensure(
  [...categoryOnlyIds].every((id) => triageIds.has(id)),
  'all category-only source map rows are triaged',
  'triage artifact must include every category-only source map row'
);
ensure(report.includes('AP Category-Only Source-Map Triage'), 'markdown report title present', 'triage report title missing');
ensure(report.includes('Promotion allowed: false'), 'markdown report blocks promotion', 'triage report must state promotion is blocked');
ensure(report.includes('Category-only rows:'), 'markdown report row count present', 'triage report must include category-only row count');

if (failures.length > 0) {
  console.error(`AP category-only source-map triage validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[AP-CATEGORY-ONLY-TRIAGE] Validation passed with ${passes.length} checks.`);
console.log(
  JSON.stringify(
    {
      triage_rows: triage.rows.length,
      category_only_source_map_rows: categoryOnlyRows.length,
      promotion_allowed: triage.triage_scope.promotion_allowed,
    },
    null,
    2
  )
);
