const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = process.cwd();
const sourceMapPath = path.join(root, 'reports/curriculum/ap_local_source_map_v1.json');
const triagePath = path.join(root, 'reports/curriculum/ap_category_only_source_map_triage_v1.json');
const validatorPath = path.join(root, 'scripts/validate_ap_category_only_source_map_triage.cjs');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

test('AP category-only triage artifact exists', () => {
  assert.equal(fs.existsSync(triagePath), true);
});

test('AP category-only triage validates through the local validator', () => {
  assert.doesNotThrow(() => execFileSync('node', [validatorPath], { cwd: root, stdio: 'pipe' }));
});

test('AP category-only triage includes every category-only source-map row and no topic-specific rows', () => {
  const sourceMap = readJson(sourceMapPath);
  const triage = readJson(triagePath);
  const categoryOnlyIds = new Set(
    sourceMap.candidate_rows.filter((row) => row.best_candidate_specificity === 'category_only').map((row) => row.id),
  );

  assert.equal(triage.rows.length, categoryOnlyIds.size);
  for (const row of triage.rows) {
    assert.equal(categoryOnlyIds.has(row.sourceMapId), true);
    assert.equal(row.bestCandidateSpecificity, 'category_only');
    assert.equal(row.primaryCandidate.specificityClass, 'category_only');
  }
});

test('AP category-only triage remains non-promotional and local-source only', () => {
  const triage = readJson(triagePath);

  assert.equal(triage.triage_scope.internet_crawling, false);
  assert.equal(triage.triage_scope.source_ingestion, false);
  assert.equal(triage.triage_scope.teaching_content_generation, false);
  assert.equal(triage.triage_scope.promotion_allowed, false);

  for (const row of triage.rows) {
    assert.equal(row.promotion.allowed, false);
    assert.equal(/https?:\/\//i.test(row.primaryCandidate.filePath), false);
  }
});
