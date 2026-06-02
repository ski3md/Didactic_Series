#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const sourceMapPath = path.join(root, 'reports/curriculum/ap_local_source_map_v1.json');
const outJsonPath = path.join(root, 'reports/curriculum/ap_category_only_source_map_triage_v1.json');
const outReportPath = path.join(root, 'reports/curriculum/ap_category_only_source_map_triage.md');

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

function buildPayload(sourceMap) {
  const rows = sourceMap.candidate_rows
    .filter((row) => row.best_candidate_specificity === 'category_only')
    .map((row, index) => {
      const primaryCandidate = row.local_candidates[0] || null;

      return {
        triageRow: index + 1,
        sourceMapId: row.id,
        categoryId: row.categoryId,
        category: row.category,
        title: row.title,
        path: row.path,
        priority: row.priority,
        sourceLine: row.sourceLine,
        topicId: row.topicId,
        localCandidateCount: row.local_candidate_count,
        bestCandidateScore: row.best_candidate_score,
        bestCandidateSpecificity: row.best_candidate_specificity,
        triageStatus: 'category-only-needs-topic-specific-evidence',
        promotion: {
          allowed: false,
          reason: 'Category-only local evidence cannot promote curriculum material without topic-specific evidence and human review.',
        },
        recommendedNextAction: row.recommended_next_action,
        primaryCandidate: primaryCandidate
          ? {
              filePath: primaryCandidate.file_path,
              reuseTarget: primaryCandidate.reuse_target,
              organSystem: primaryCandidate.organ_system,
              status: primaryCandidate.status,
              confidence: primaryCandidate.confidence,
              specificityClass: primaryCandidate.specificity_class,
              specificityRationale: primaryCandidate.specificity_rationale,
              matchReasons: primaryCandidate.match_reasons,
              provenanceSource: primaryCandidate.provenance_source,
            }
          : null,
      };
    });

  return {
    contract_version: 'ap-category-only-source-map-triage.v1',
    generated_at: new Date().toISOString(),
    source_map_ref: 'reports/curriculum/ap_local_source_map_v1.json',
    triage_scope: {
      discipline: 'AP',
      source_specificity: 'category_only',
      mode: 'triage_inventory_only',
      internet_crawling: false,
      source_ingestion: false,
      teaching_content_generation: false,
      promotion_allowed: false,
    },
    summary: {
      rows: rows.length,
      source_map_category_only_rows: sourceMap.summary.rows_with_category_only_best_candidate,
      source_map_topic_specific_rows: sourceMap.summary.rows_with_topic_specific_best_candidate,
      categories: countBy(rows, (row) => row.category),
      primary_reuse_targets: countBy(rows, (row) => row.primaryCandidate?.reuseTarget || 'none'),
      primary_statuses: countBy(rows, (row) => row.primaryCandidate?.status || 'none'),
    },
    guardrails: [
      'This artifact is triage inventory, not generated curriculum.',
      'Rows must remain blocked from promotion until topic-specific local evidence is found.',
      'Do not crawl the internet for these rows before local curriculum, local hard-drive corpus, indexed local knowledge, and internal ontology tiers are exhausted.',
      'Category-only rows may guide review work but cannot satisfy ABPath topic coverage on their own.',
      'Any future material batch must preserve sourceMapId, topicId, categoryId, review status, and promotion decision.',
    ],
    review_status: 'triage_unreviewed',
    rows,
  };
}

function buildReport(payload) {
  const categories = Object.entries(payload.summary.categories).sort((a, b) => b[1] - a[1]);

  return [
    '# AP Category-Only Source-Map Triage',
    '',
    `Generated: ${payload.generated_at}`,
    '',
    '## Scope',
    '',
    `- Source map: ${payload.source_map_ref}`,
    `- Mode: ${payload.triage_scope.mode}`,
    `- Internet crawling: ${payload.triage_scope.internet_crawling}`,
    `- Teaching content generation: ${payload.triage_scope.teaching_content_generation}`,
    `- Promotion allowed: ${payload.triage_scope.promotion_allowed}`,
    '',
    '## Summary',
    '',
    `- Category-only rows: ${payload.summary.rows}`,
    `- Topic-specific source-map rows already separated: ${payload.summary.source_map_topic_specific_rows}`,
    '',
    '## Category Counts',
    '',
    markdownTable(['Category', 'Rows'], categories.map(([category, count]) => [category, String(count)])),
    '',
    '## Guardrails',
    '',
    ...payload.guardrails.map((guardrail) => `- ${guardrail}`),
    '',
    '## First 25 Triage Rows',
    '',
    markdownTable(
      ['#', 'Source Map ID', 'Category', 'Title', 'Primary candidate', 'Reuse target', 'Status', 'Triage'],
      payload.rows.slice(0, 25).map((row) => [
        String(row.triageRow),
        row.sourceMapId,
        row.category,
        row.title,
        row.primaryCandidate?.filePath || 'none',
        row.primaryCandidate?.reuseTarget || 'none',
        row.primaryCandidate?.status || 'none',
        row.triageStatus,
      ]),
    ),
  ].join('\n');
}

function main() {
  const sourceMap = readJson(sourceMapPath);
  const payload = buildPayload(sourceMap);
  const report = buildReport(payload);

  ensureDir(outJsonPath);
  ensureDir(outReportPath);
  fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
  fs.writeFileSync(outReportPath, `${report}\n`);

  console.log(`[AP-CATEGORY-ONLY-TRIAGE] Wrote ${payload.summary.rows} rows to ${path.relative(root, outJsonPath)}.`);
}

main();
