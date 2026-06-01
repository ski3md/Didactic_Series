#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.resolve(__dirname, '..');
const reportsDir = path.join(repoRoot, 'reports');
const curriculumDir = path.join(reportsDir, 'curriculum');
const systemInventoryRoot = '/Users/ski_mini/SystemArchitectureInventory';

const gapReportPath = path.join(reportsDir, 'ap_spec_active_coverage_gap.json');
const closurePlanPath = path.join(reportsDir, 'ap_gap_closure_plan.json');
const workstationCorpusIndexPath = path.join(repoRoot, 'src/content/provenance/workstation_corpus_index.json');
const corpusManifestPath = path.join(repoRoot, 'src/content/provenance/corpus_manifest.json');
const outputPath = path.join(curriculumDir, 'ap_local_source_map_v1.json');
const next100Path = path.join(curriculumDir, 'next_100_highest_priority_topics.json');

const STOPWORDS = new Set([
  'and',
  'for',
  'from',
  'with',
  'without',
  'into',
  'onto',
  'the',
  'this',
  'that',
  'these',
  'those',
  'pathology',
  'normal',
  'anatomy',
  'histology',
  'disease',
  'changes',
  'change',
  'lesion',
  'lesions',
  'disorder',
  'disorders',
  'system',
  'cell',
  'cells',
  'tumor',
  'tumors',
  'entity',
  'entities',
  'report',
  'reporting'
]);

const CATEGORY_ALIASES = {
  ap_breast: ['breast', 'mammary'],
  ap_gu: ['gu', 'renal', 'kidney', 'genitourinary'],
  ap_male_repro: ['male', 'reproductive', 'prostate', 'testis', 'testicular', 'penis', 'scrotal'],
  ap_cv: ['cardiovascular', 'cardiac', 'heart', 'vascular', 'autopsy'],
  ap_hn: ['head', 'neck', 'thyroid', 'salivary', 'larynx'],
  ap_gi: ['gastrointestinal', 'gi', 'colon', 'bowel', 'stomach', 'esophagus', 'appendix'],
  ap_endo: ['endocrine', 'thyroid', 'adrenal', 'parathyroid', 'pituitary'],
  ap_placenta: ['placenta', 'placental', 'perinatal'],
  ap_resp: ['respiratory', 'thoracic', 'lung', 'pulmonary'],
  ap_soft: ['soft', 'tissue', 'bone', 'joint', 'sarcoma'],
  ap_cyto: ['cyto', 'cytopathology', 'cytology'],
  ap_dermpath: ['dermpath', 'skin', 'cutaneous'],
  ap_forensic: ['forensic', 'autopsy', 'medicolegal'],
  ap_neuro: ['neuro', 'neuropathology', 'brain', 'cns'],
  ap_pediatric: ['pediatric', 'perinatal', 'fetal', 'placenta', 'child']
};

const REUSE_TARGET_WEIGHT = {
  tutorial: 3,
  lecture: 3,
  image_atlas: 3,
  question: 2,
  algorithm: 2,
  unknown: 0
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function unique(values) {
  return [...new Set(values)];
}

function tokenize(value) {
  return unique(
    normalize(value)
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !STOPWORDS.has(token))
  );
}

function latestSystemInventorySnapshot(rootDir) {
  const entries = fs
    .readdirSync(rootDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();

  for (const entry of entries) {
    const snapshotDir = path.join(rootDir, entry);
    const sourceOfTruth = path.join(snapshotDir, 'SYSTEM_SOURCE_OF_TRUTH.md');
    const systemInventory = path.join(snapshotDir, 'system_inventory.json');
    if (fs.existsSync(sourceOfTruth) && fs.existsSync(systemInventory)) {
      return { snapshotDir, sourceOfTruth, systemInventory };
    }
  }

  throw new Error(`No system inventory snapshot found in ${rootDir}`);
}

function scoreRecord(row, record, coverageSources) {
  const rowTokens = tokenize(`${row.title} ${row.path}`);
  const titleTokens = tokenize(row.title);
  const searchable = normalize(
    `${record.file_path} ${record.title_guess} ${record.topic} ${record.searchable_text || ''} ${record.organ_system || ''} ${
      record.reuse_target || ''
    }`
  );

  const reasons = [];
  let score = 0;

  const organAliases = CATEGORY_ALIASES[row.categoryId] || [];
  const organMatch = organAliases.some((alias) => searchable.includes(alias));
  if (organMatch) {
    score += 5;
    reasons.push(`organ_match:${organAliases.find((alias) => searchable.includes(alias))}`);
  }

  const titleMatches = titleTokens.filter((token) => searchable.includes(token));
  if (titleMatches.length > 0) {
    score += titleMatches.length * 4;
    reasons.push(`title_tokens:${titleMatches.slice(0, 4).join(',')}`);
  }

  const rowMatches = rowTokens.filter((token) => searchable.includes(token));
  if (rowMatches.length > 0) {
    score += rowMatches.length;
    reasons.push(`path_tokens:${rowMatches.slice(0, 4).join(',')}`);
  }

  const relativePath = normalize(record.file_path);
  if (coverageSources.has(relativePath)) {
    score += 6;
    reasons.push('coverage_source_match');
  }

  const reuseWeight = REUSE_TARGET_WEIGHT[record.reuse_target] || 0;
  if (reuseWeight > 0) {
    score += reuseWeight;
    reasons.push(`reuse_target:${record.reuse_target}`);
  }

  if (record.status === 'promoted') {
    score += 3;
    reasons.push('status:promoted');
  } else if (record.status === 'mapped') {
    score += 2;
    reasons.push('status:mapped');
  } else if (record.status === 'parsed') {
    score += 1;
    reasons.push('status:parsed');
  }

  if ((record.confidence || 0) >= 0.8) {
    score += 1;
    reasons.push('confidence:high');
  }

  return { score, reasons: unique(reasons) };
}

function reasonPayload(reasons, prefix) {
  const reason = reasons.find((entry) => entry.startsWith(prefix));
  if (!reason) return [];
  return reason
    .slice(prefix.length)
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function classifySpecificity(reasons) {
  const titleTokens = reasonPayload(reasons, 'title_tokens:');
  if (titleTokens.length > 0) {
    return {
      specificity_class: 'topic_specific',
      specificity_rationale: `Matched topic title token(s): ${titleTokens.slice(0, 4).join(', ')}.`
    };
  }

  const hasOrganMatch = reasons.some((reason) => reason.startsWith('organ_match:'));
  const hasCoverageSource = reasons.includes('coverage_source_match');
  if (hasOrganMatch || hasCoverageSource) {
    return {
      specificity_class: 'category_only',
      specificity_rationale: 'Matched local organ/category or broad coverage source, but not the topic title.'
    };
  }

  return {
    specificity_class: 'weak_match',
    specificity_rationale: 'No topic-title, organ/category, or coverage-source match was detected.'
  };
}

function specificityRank(value) {
  if (value === 'topic_specific') return 0;
  if (value === 'category_only') return 1;
  return 2;
}

function buildInfrastructureSearch(snapshot, workstationIndex) {
  return [
    {
      infrastructure_tier_attempted: 'system_architecture_inventory',
      path_checked: snapshot.snapshotDir,
      mounted: fs.existsSync(snapshot.snapshotDir),
      result_count: 2,
      gap_status: 'authoritative_machine_map_available',
      skip_rationale: 'Used the latest dated snapshot instead of rediscovering machine paths manually.'
    },
    {
      infrastructure_tier_attempted: 'repo_local_content',
      path_checked: repoRoot,
      mounted: fs.existsSync(repoRoot),
      result_count: workstationIndex.summary?.total_files || 0,
      gap_status: 'repo_local_candidates_indexed',
      skip_rationale: 'Repo-local corpus index already captures reports, docs, assets, and content surfaces for this tranche.'
    },
    {
      infrastructure_tier_attempted: 'primary_external_hd',
      path_checked: '/Volumes/DB_External',
      mounted: fs.existsSync('/Volumes/DB_External'),
      result_count: workstationIndex.root_surfaces?.length || 0,
      gap_status: 'repo_local_subtree_already_on_primary_external_hd',
      skip_rationale: 'This tranche stayed inside the Didactic Series subtree on the mounted primary external drive before any wider external search.'
    },
    {
      infrastructure_tier_attempted: 'secondary_external_hd',
      path_checked: '/Volumes/Elements',
      mounted: fs.existsSync('/Volumes/Elements'),
      result_count: 0,
      gap_status: 'not_searched_yet',
      skip_rationale: 'Skipped because repo-local and primary-drive surfaces produced local candidates for the bounded P0 mapping tranche.'
    }
  ];
}

function main() {
  fs.mkdirSync(curriculumDir, { recursive: true });

  const snapshot = latestSystemInventorySnapshot(systemInventoryRoot);
  const gapReport = readJson(gapReportPath);
  const closurePlan = readJson(closurePlanPath);
  const workstationIndex = readJson(workstationCorpusIndexPath);
  const coverageSources = new Set((gapReport.coverageSources || []).map((source) => normalize(source)));

  const candidateRecords = (workstationIndex.records || []).filter((record) => {
    if (!record || !record.file_path) return false;
    if (!['AP', 'Molecular'].includes(record.source_domain)) return false;
    return !String(record.file_path).includes('node_modules');
  });

  const p0Rows = (closurePlan.rows || []).filter((row) => String(row.priority || '').startsWith('P0'));

  const candidateRows = p0Rows.map((row, sourceOrderIndex) => {
    const rowId = row.topicId ? `${row.categoryId}-${row.topicId}` : `${row.categoryId}-${normalize(row.title).replace(/\s+/g, '-')}`;
    const scored = candidateRecords
      .map((record) => {
        const { score, reasons } = scoreRecord(row, record, coverageSources);
        return {
          record,
          score,
          reasons
        };
      })
      .filter((entry) => entry.score >= 8)
      .sort((left, right) => right.score - left.score || left.record.file_path.localeCompare(right.record.file_path));

    const uniqueCandidates = [];
    const seenPaths = new Set();
    for (const entry of scored) {
      if (seenPaths.has(entry.record.file_path)) continue;
      seenPaths.add(entry.record.file_path);
      const specificity = classifySpecificity(entry.reasons);
      uniqueCandidates.push({
        file_path: entry.record.file_path,
        source_path: entry.record.source_path,
        title_guess: String(entry.record.title_guess || '').slice(0, 180),
        reuse_target: entry.record.reuse_target,
        organ_system: entry.record.organ_system,
        status: entry.record.status,
        confidence: entry.record.confidence,
        root_label: entry.record.root_label,
        score: entry.score,
        match_reasons: entry.reasons,
        specificity_class: specificity.specificity_class,
        specificity_rationale: specificity.specificity_rationale,
        provenance_source: entry.record.provenance?.source || 'local workstation corpus'
      });
      if (uniqueCandidates.length >= 5) break;
    }

    const mappingStatus = uniqueCandidates.length > 0 ? 'mapped_local_candidates' : 'needs_external_local_search';
    const bestScore = uniqueCandidates[0]?.score || 0;
    const bestSpecificity = uniqueCandidates[0]?.specificity_class || 'weak_match';

    return {
      id: rowId,
      source_order_index: sourceOrderIndex,
      categoryId: row.categoryId,
      category: row.category,
      title: row.title,
      path: row.path,
      difficulty: row.difficulty,
      learnerLevel: row.learnerLevel,
      priority: row.priority,
      sourceLine: row.sourceLine,
      topicId: row.topicId,
      mapping_status: mappingStatus,
      local_candidate_count: uniqueCandidates.length,
      best_candidate_score: bestScore,
      best_candidate_specificity: bestSpecificity,
      recommended_next_action:
        uniqueCandidates.length > 0
          ? bestSpecificity === 'topic_specific'
            ? `Review topic-specific local candidate(s) for ${row.title} before generating any new AP content.`
            : `Treat ${row.title} as category-only local evidence until a topic-specific local source is reviewed.`
          : `Escalate ${row.title} to wider local-drive search on /Volumes/Elements only after exhausting repo-local and /Volumes/DB_External evidence.`,
      local_candidates: uniqueCandidates
    };
  });

  const categorySummary = {};
  for (const row of candidateRows) {
    categorySummary[row.categoryId] ||= {
      category: row.category,
      rows: 0,
      rows_with_candidates: 0,
      rows_without_candidates: 0
    };
    categorySummary[row.categoryId].rows += 1;
    if (row.local_candidate_count > 0) {
      categorySummary[row.categoryId].rows_with_candidates += 1;
    } else {
      categorySummary[row.categoryId].rows_without_candidates += 1;
    }
  }

  const report = {
    contract_version: 'corpus-realization-contract.v1.ap-local-source-map',
    generated_at: new Date().toISOString(),
    source_inventory_ref: {
      system_source_of_truth: path.relative(repoRoot, snapshot.sourceOfTruth),
      system_inventory_json: path.relative(repoRoot, snapshot.systemInventory)
    },
    source_inputs: {
      gap_report: path.relative(repoRoot, gapReportPath),
      closure_plan: path.relative(repoRoot, closurePlanPath),
      workstation_corpus_index: path.relative(repoRoot, workstationCorpusIndexPath),
      corpus_manifest: path.relative(repoRoot, corpusManifestPath)
    },
    mapping_scope: {
      discipline: 'AP',
      priority_band: 'P0',
      selection_rule: 'All P0 rows from reports/ap_gap_closure_plan.json ordered by existing queue order.',
      row_count: candidateRows.length
    },
    local_infrastructure_search: buildInfrastructureSearch(snapshot, workstationIndex),
    summary: {
      candidate_rows: candidateRows.length,
      rows_with_candidates: candidateRows.filter((row) => row.local_candidate_count > 0).length,
      rows_without_candidates: candidateRows.filter((row) => row.local_candidate_count === 0).length,
      rows_with_strong_candidates: candidateRows.filter((row) => row.best_candidate_score >= 14).length,
      rows_with_topic_specific_best_candidate: candidateRows.filter((row) => row.best_candidate_specificity === 'topic_specific').length,
      rows_with_category_only_best_candidate: candidateRows.filter((row) => row.best_candidate_specificity === 'category_only').length,
      rows_with_weak_best_candidate: candidateRows.filter((row) => row.best_candidate_specificity === 'weak_match').length,
      max_candidates_per_row: Math.max(...candidateRows.map((row) => row.local_candidate_count), 0)
    },
    category_summary: categorySummary,
    candidate_rows: candidateRows,
    review_status: 'machine_mapped_local_only'
  };

  const prioritizedRows = [...candidateRows].sort(
    (left, right) =>
      specificityRank(left.best_candidate_specificity) - specificityRank(right.best_candidate_specificity) ||
      right.best_candidate_score - left.best_candidate_score ||
      left.source_order_index - right.source_order_index
  );

  const next100 = {
    contract_version: 'corpus-realization-contract.v1.next-100-highest-priority-topics',
    generated_at: report.generated_at,
    source_map_report: path.relative(repoRoot, outputPath),
    selection_rule: 'First 100 AP P0 rows from the local source map, prioritizing topic-specific local evidence before category-only evidence.',
    row_count: Math.min(100, prioritizedRows.length),
    review_status: 'machine_mapped_local_only',
    topics: prioritizedRows.slice(0, 100).map((row, index) => ({
      rank: index + 1,
      id: row.id,
      category: row.category,
      title: row.title,
      path: row.path,
      mapping_status: row.mapping_status,
      local_candidate_count: row.local_candidate_count,
      best_candidate_specificity: row.best_candidate_specificity,
      primary_candidate_path: row.local_candidates[0]?.file_path || null,
      recommended_next_action: row.recommended_next_action
    }))
  };

  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  fs.writeFileSync(next100Path, JSON.stringify(next100, null, 2));

  console.log(
    JSON.stringify(
      {
        report: path.relative(repoRoot, outputPath),
        next100: path.relative(repoRoot, next100Path),
        p0_rows: candidateRows.length,
        rows_with_candidates: report.summary.rows_with_candidates,
        rows_without_candidates: report.summary.rows_without_candidates,
        rows_with_topic_specific_best_candidate: report.summary.rows_with_topic_specific_best_candidate,
        rows_with_category_only_best_candidate: report.summary.rows_with_category_only_best_candidate
      },
      null,
      2
    )
  );
}

main();
