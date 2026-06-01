const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = process.cwd();
const reportPath = path.join(root, 'reports/curriculum/ap_local_source_map_v1.json');
const next100Path = path.join(root, 'reports/curriculum/next_100_highest_priority_topics.json');
const validatorPath = path.join(root, 'scripts/validate_ap_local_source_map.cjs');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

test('AP local source map artifacts exist', () => {
  assert.equal(fs.existsSync(reportPath), true);
  assert.equal(fs.existsSync(next100Path), true);
});

test('AP local source map validates through the local validator', () => {
  assert.doesNotThrow(() => execFileSync('node', [validatorPath], { cwd: root, stdio: 'pipe' }));
});

test('AP local source map stays bounded to AP P0 queue rows', () => {
  const report = readJson(reportPath);
  assert.equal(report.mapping_scope.priority_band, 'P0');
  for (const row of report.candidate_rows) {
    assert.match(row.priority, /^P0\b/);
  }
});

test('next 100 topics are sourced from the AP local source map', () => {
  const report = readJson(reportPath);
  const next100 = readJson(next100Path);
  const ids = new Set(report.candidate_rows.map((row) => row.id));

  assert.ok(next100.topics.length <= 100);
  for (const topic of next100.topics) {
    assert.equal(ids.has(topic.id), true);
  }
});

test('AP local source map classifies candidate specificity', () => {
  const report = readJson(reportPath);
  const allowed = new Set(['topic_specific', 'category_only', 'weak_match']);

  assert.equal(
    report.summary.rows_with_topic_specific_best_candidate +
      report.summary.rows_with_category_only_best_candidate +
      report.summary.rows_with_weak_best_candidate,
    report.summary.candidate_rows
  );

  for (const row of report.candidate_rows) {
    assert.equal(allowed.has(row.best_candidate_specificity), true);
    for (const candidate of row.local_candidates) {
      assert.equal(allowed.has(candidate.specificity_class), true);
      assert.equal(typeof candidate.specificity_rationale, 'string');
      assert.notEqual(candidate.specificity_rationale.length, 0);
    }
  }
});

test('next 100 prioritizes topic-specific local evidence before weaker matches', () => {
  const next100 = readJson(next100Path);
  let sawWeakerMatch = false;

  for (const topic of next100.topics) {
    if (topic.best_candidate_specificity !== 'topic_specific') {
      sawWeakerMatch = true;
    }
    assert.equal(sawWeakerMatch && topic.best_candidate_specificity === 'topic_specific', false);
  }
});
