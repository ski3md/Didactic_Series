#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = process.cwd();
const schemaPath = path.join(root, 'schemas/ap-local-source-map.schema.json');
const reportPath = path.join(root, 'reports/curriculum/ap_local_source_map_v1.json');
const next100Path = path.join(root, 'reports/curriculum/next_100_highest_priority_topics.json');

const failures = [];
const passes = [];

const ensure = (condition, passMessage, failMessage) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

ensure(fs.existsSync(schemaPath), 'schema exists', `missing schema file: ${schemaPath}`);
ensure(fs.existsSync(reportPath), 'source map report exists', `missing source map report: ${reportPath}`);
ensure(fs.existsSync(next100Path), 'next 100 report exists', `missing next 100 report: ${next100Path}`);

const schema = readJson(schemaPath);
const report = readJson(reportPath);
const next100 = readJson(next100Path);
const allowedSpecificity = new Set(['topic_specific', 'category_only', 'weak_match']);

const requiredReportFields = schema.required || [];
for (const field of requiredReportFields) {
  ensure(Object.prototype.hasOwnProperty.call(report, field), `report field present: ${field}`, `missing report field: ${field}`);
}

ensure(report.mapping_scope?.discipline === 'AP', 'discipline is AP', 'mapping_scope.discipline must be AP');
ensure(report.mapping_scope?.priority_band === 'P0', 'priority band is P0', 'mapping_scope.priority_band must be P0');
ensure(
  report.mapping_scope?.row_count === report.candidate_rows?.length,
  'row count matches candidate_rows length',
  'mapping_scope.row_count must match candidate_rows length'
);

ensure(Array.isArray(report.local_infrastructure_search), 'infrastructure search is an array', 'local_infrastructure_search must be an array');
for (const [index, entry] of (report.local_infrastructure_search || []).entries()) {
  for (const field of schema.$defs.infrastructure_search_entry.required) {
    ensure(
      Object.prototype.hasOwnProperty.call(entry, field),
      `infrastructure entry ${index} field present: ${field}`,
      `local_infrastructure_search[${index}] missing field: ${field}`
    );
  }
}

const candidateIds = new Set();
const topicSpecificIds = new Set();
for (const [index, row] of (report.candidate_rows || []).entries()) {
  ensure(Boolean(row.id), `candidate row ${index} id present`, `candidate_rows[${index}] missing id`);
  ensure(!candidateIds.has(row.id), `candidate row ${index} id unique`, `duplicate candidate row id: ${row.id}`);
  candidateIds.add(row.id);
  ensure(
    row.mapping_status === 'mapped_local_candidates' || row.mapping_status === 'needs_external_local_search',
    `candidate row ${index} mapping status valid`,
    `candidate_rows[${index}] invalid mapping_status: ${row.mapping_status}`
  );
  ensure(
    row.local_candidate_count === row.local_candidates.length,
    `candidate row ${index} candidate count matches`,
    `candidate_rows[${index}] local_candidate_count does not match local_candidates length`
  );
  ensure(
    allowedSpecificity.has(row.best_candidate_specificity),
    `candidate row ${index} best specificity is valid`,
    `candidate_rows[${index}] invalid best_candidate_specificity: ${row.best_candidate_specificity}`
  );
  if (row.best_candidate_specificity === 'topic_specific') {
    topicSpecificIds.add(row.id);
  }
  for (const [candidateIndex, candidate] of row.local_candidates.entries()) {
    ensure(
      !/https?:\/\//i.test(candidate.file_path || ''),
      `candidate row ${index} candidate ${candidateIndex} is local path`,
      `candidate_rows[${index}].local_candidates[${candidateIndex}] must not use web URLs`
    );
    ensure(
      allowedSpecificity.has(candidate.specificity_class),
      `candidate row ${index} candidate ${candidateIndex} specificity is valid`,
      `candidate_rows[${index}].local_candidates[${candidateIndex}] invalid specificity_class: ${candidate.specificity_class}`
    );
    ensure(
      Boolean(candidate.specificity_rationale),
      `candidate row ${index} candidate ${candidateIndex} specificity rationale present`,
      `candidate_rows[${index}].local_candidates[${candidateIndex}] missing specificity_rationale`
    );
  }
}

ensure(
  report.summary.rows_with_topic_specific_best_candidate === topicSpecificIds.size,
  'topic-specific summary count matches candidate rows',
  'summary.rows_with_topic_specific_best_candidate must match candidate row count'
);
ensure(
  report.summary.rows_with_topic_specific_best_candidate +
    report.summary.rows_with_category_only_best_candidate +
    report.summary.rows_with_weak_best_candidate ===
    report.summary.candidate_rows,
  'specificity summary partitions all candidate rows',
  'specificity summary counts must add up to summary.candidate_rows'
);

ensure(next100.row_count <= 100, 'next 100 row_count bounded', 'next_100_highest_priority_topics row_count must be <= 100');
ensure(
  Array.isArray(next100.topics) && next100.topics.length === next100.row_count,
  'next 100 topics length matches row_count',
  'next_100_highest_priority_topics topics length must match row_count'
);

let sawNonTopicSpecific = false;
const next100Ids = new Set();
for (const [index, topic] of (next100.topics || []).entries()) {
  ensure(candidateIds.has(topic.id), `next 100 topic ${index} references known candidate row`, `next_100 topic ${index} references unknown id: ${topic.id}`);
  next100Ids.add(topic.id);
  ensure(
    allowedSpecificity.has(topic.best_candidate_specificity),
    `next 100 topic ${index} specificity is valid`,
    `next_100 topic ${index} invalid best_candidate_specificity: ${topic.best_candidate_specificity}`
  );
  if (topic.best_candidate_specificity !== 'topic_specific') {
    sawNonTopicSpecific = true;
  }
  ensure(
    !(sawNonTopicSpecific && topic.best_candidate_specificity === 'topic_specific'),
    `next 100 topic ${index} preserves specificity sort order`,
    'next_100 must list all topic-specific local-evidence rows before category-only or weak rows'
  );
}

const omittedTopicSpecificIds = [...topicSpecificIds].filter((id) => !next100Ids.has(id));
const next100ContainsNonTopicSpecific = (next100.topics || []).some((topic) => topic.best_candidate_specificity !== 'topic_specific');
ensure(
  !(next100ContainsNonTopicSpecific && omittedTopicSpecificIds.length > 0),
  'next 100 does not omit topic-specific rows in favor of weaker rows',
  `next_100 omitted topic-specific rows while including weaker rows: ${omittedTopicSpecificIds.slice(0, 10).join(', ')}`
);

if (failures.length > 0) {
  console.error(`AP local source map validation failed with ${failures.length} issue(s):`);
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`[AP-LOCAL-SOURCE-MAP] Validation passed with ${passes.length} checks.`);
console.log(
  JSON.stringify(
    {
      candidate_rows: report.candidate_rows.length,
      next_100_topics: next100.topics.length,
      rows_with_candidates: report.summary.rows_with_candidates,
      rows_without_candidates: report.summary.rows_without_candidates,
      rows_with_topic_specific_best_candidate: report.summary.rows_with_topic_specific_best_candidate,
      rows_with_category_only_best_candidate: report.summary.rows_with_category_only_best_candidate
    },
    null,
    2
  )
);
