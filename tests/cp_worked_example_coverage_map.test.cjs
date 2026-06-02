const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = process.cwd();
const queuePath = path.join(root, 'src/content/materials/abpathMaterialExpansionQueue.json');
const mapPath = path.join(root, 'reports/curriculum/cp_worked_example_coverage_map_v1.json');
const validatorPath = path.join(root, 'scripts/validate_cp_worked_example_coverage_map.cjs');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

test('CP worked-example coverage map artifact exists', () => {
  assert.equal(fs.existsSync(mapPath), true);
});

test('CP worked-example coverage map validates through the local validator', () => {
  assert.doesNotThrow(() => execFileSync('node', [validatorPath], { cwd: root, stdio: 'pipe' }));
});

test('CP worked-example coverage map covers every CP queue row exactly once', () => {
  const queue = readJson(queuePath);
  const coverageMap = readJson(mapPath);
  const cpIds = new Set(queue.entries.filter((entry) => entry.domain === 'CP').map((entry) => entry.id));
  const mapIds = new Set(coverageMap.rows.map((row) => row.queueEntryId));

  assert.equal(coverageMap.rows.length, cpIds.size);
  assert.equal(mapIds.size, cpIds.size);
  for (const id of cpIds) {
    assert.equal(mapIds.has(id), true);
  }
});

test('CP worked-example coverage map remains non-promotional and local-source first', () => {
  const coverageMap = readJson(mapPath);

  assert.equal(coverageMap.coverage_scope.internet_crawling, false);
  assert.equal(coverageMap.coverage_scope.source_ingestion, false);
  assert.equal(coverageMap.coverage_scope.teaching_content_generation, false);
  assert.equal(coverageMap.coverage_scope.promotion_allowed, false);
  assert.ok(coverageMap.source_order.indexOf('Existing curriculum') < coverageMap.source_order.indexOf('Open-access online sources later only'));

  for (const row of coverageMap.rows) {
    assert.equal(row.workedExampleRequired, true);
    assert.equal(row.promotion.allowed, false);
    assert.equal(/https?:\/\//i.test(row.sourcePath), false);
  }
});
