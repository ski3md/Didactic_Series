#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const queuePath = path.join(root, 'src/content/materials/abpathMaterialExpansionQueue.json');
const gapInventoryPath = path.join(root, 'reports/curriculum/gap_inventory_v1.json');
const mapPath = path.join(root, 'reports/curriculum/cp_worked_example_coverage_map_v1.json');
const reportPath = path.join(root, 'reports/curriculum/cp_worked_example_coverage_map.md');

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

ensure(fs.existsSync(queuePath), 'queue exists', `missing queue: ${queuePath}`);
ensure(fs.existsSync(gapInventoryPath), 'gap inventory exists', `missing gap inventory: ${gapInventoryPath}`);
ensure(fs.existsSync(mapPath), 'coverage map exists', `missing coverage map: ${mapPath}`);
ensure(fs.existsSync(reportPath), 'coverage report exists', `missing coverage report: ${reportPath}`);

const queue = readJson(queuePath);
const gapInventory = readJson(gapInventoryPath);
const coverageMap = readJson(mapPath);
const report = fs.readFileSync(reportPath, 'utf8');
const cpEntries = queue.entries.filter((entry) => entry.domain === 'CP');
const cpEntryIds = new Set(cpEntries.map((entry) => entry.id));
const gap = gapInventory.gap_items.find((item) => item.gap_id === 'GAP-CP-WORKED-EXAMPLES-001');
const rowIds = new Set();

ensure(Boolean(gap), 'CP worked-example gap exists', 'gap inventory must include GAP-CP-WORKED-EXAMPLES-001');
ensure(
  coverageMap.contract_version === 'cp-worked-example-coverage-map.v1',
  'contract version matches',
  `unexpected contract_version: ${coverageMap.contract_version}`
);
ensure(
  coverageMap.source_refs?.gap_id === 'GAP-CP-WORKED-EXAMPLES-001',
  'gap reference matches',
  'source_refs.gap_id must reference GAP-CP-WORKED-EXAMPLES-001'
);
ensure(
  coverageMap.coverage_scope?.mode === 'worked_example_coverage_mapping_only',
  'coverage mode is mapping only',
  'coverage_scope.mode must be worked_example_coverage_mapping_only'
);
ensure(coverageMap.coverage_scope?.discipline === 'CP', 'discipline is CP', 'coverage_scope.discipline must be CP');
ensure(coverageMap.coverage_scope?.internet_crawling === false, 'internet crawling disabled', 'internet_crawling must be false');
ensure(coverageMap.coverage_scope?.source_ingestion === false, 'source ingestion disabled', 'source_ingestion must be false');
ensure(
  coverageMap.coverage_scope?.teaching_content_generation === false,
  'teaching generation disabled',
  'teaching_content_generation must be false'
);
ensure(coverageMap.coverage_scope?.promotion_allowed === false, 'promotion blocked', 'promotion_allowed must be false');
ensure(
  Array.isArray(coverageMap.source_order) &&
    coverageMap.source_order.indexOf('Existing curriculum') < coverageMap.source_order.indexOf('Open-access online sources later only'),
  'local source order precedes online sources',
  'source_order must prioritize local sources before online sources'
);

ensure(Array.isArray(coverageMap.rows), 'rows array exists', 'coverageMap.rows must be an array');
ensure(
  coverageMap.rows.length === cpEntries.length,
  'coverage map row count matches CP queue',
  `expected ${cpEntries.length} CP rows, found ${coverageMap.rows.length}`
);
ensure(
  coverageMap.summary?.rows === coverageMap.rows.length,
  'summary rows match',
  'summary.rows must match rows.length'
);
ensure(
  coverageMap.summary?.worked_example_required_rows === coverageMap.rows.length,
  'all mapped rows require worked examples',
  'worked_example_required_rows must equal rows.length'
);

for (const [index, row] of coverageMap.rows.entries()) {
  ensure(cpEntryIds.has(row.queueEntryId), `row ${index} references CP queue entry`, `row ${index} references non-CP queue entry: ${row.queueEntryId}`);
  ensure(!rowIds.has(row.queueEntryId), `row ${index} queueEntryId unique`, `duplicate queueEntryId: ${row.queueEntryId}`);
  rowIds.add(row.queueEntryId);
  ensure(row.workedExampleRequired === true, `row ${index} requires worked example`, `row ${index} workedExampleRequired must be true`);
  ensure(Boolean(row.workedExampleDomain), `row ${index} domain present`, `row ${index} missing workedExampleDomain`);
  ensure(
    Array.isArray(row.requiredExampleShape) && row.requiredExampleShape.length >= 5,
    `row ${index} example shape present`,
    `row ${index} requiredExampleShape must contain at least five entries`
  );
  ensure(row.promotion?.allowed === false, `row ${index} promotion blocked`, `row ${index} promotion.allowed must be false`);
  ensure(Boolean(row.sourcePath), `row ${index} source path present`, `row ${index} missing sourcePath`);
  ensure(
    !/https?:\/\//i.test(row.sourcePath || ''),
    `row ${index} source path is local`,
    `row ${index} sourcePath must not be a URL`
  );
}

ensure(
  coverageMap.summary.coverage_statuses['materialized-review-queue'] > 0,
  'existing CP batches are reflected',
  'coverage statuses must include materialized-review-queue rows'
);
ensure(
  coverageMap.summary.coverage_statuses['unmaterialized-generation-queue'] > 0,
  'unmaterialized CP rows are reflected',
  'coverage statuses must include unmaterialized-generation-queue rows'
);
ensure(report.includes('CP Worked-Example Coverage Map'), 'markdown report title present', 'coverage report title missing');
ensure(report.includes('Promotion allowed: false'), 'markdown report blocks promotion', 'coverage report must state promotion is blocked');
ensure(report.includes('Worked-example required rows:'), 'markdown report required row count present', 'coverage report must include required row count');

if (failures.length > 0) {
  console.error(`CP worked-example coverage validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[CP-WORKED-EXAMPLE-COVERAGE] Validation passed with ${passes.length} checks.`);
console.log(
  JSON.stringify(
    {
      cp_rows: coverageMap.rows.length,
      materialized_review_queue_rows: coverageMap.summary.materialized_review_queue_rows,
      unmaterialized_generation_queue_rows: coverageMap.summary.unmaterialized_generation_queue_rows,
      promotion_allowed: coverageMap.coverage_scope.promotion_allowed,
    },
    null,
    2
  )
);
