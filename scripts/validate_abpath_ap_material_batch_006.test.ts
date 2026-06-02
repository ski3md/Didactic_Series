import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const batchPath = path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch006.json');
const priorBatchPaths = [
  path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch001.json'),
  path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch002.json'),
  path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch003.json'),
  path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch004.json'),
  path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch005.json'),
];
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const sourceMapPath = path.join(repoRoot, 'reports/curriculum/ap_local_source_map_v1.json');
const reportPath = path.join(repoRoot, 'reports/abpath_ap_material_batch_006.md');

interface BatchRow {
  batchRow: number;
  queueId: string;
  sourceMapId: string;
  domain: string;
  subject: string;
  materialKind: string;
  pathHierarchy: string[];
  source: {
    sourcePath: string;
    sourceTopicId: string;
  };
  sourceMapEvidence: {
    bestCandidateSpecificity: string;
    bestCandidateScore: number;
    localCandidateCount: number;
    primaryCandidatePath: string | null;
    primaryCandidateSpecificity: string | null;
    matchReasons: string[];
  };
  requiredMaterialSet: string[];
  review: {
    reviewStatus: string;
    promotionStatus: string;
    reviewerRequired: boolean;
    promotionAllowed: boolean;
  };
}

interface Batch {
  version: string;
  batchId: string;
  sourceQueue: string;
  sourceMap: {
    path: string;
    topicSpecificRows: number;
    categoryOnlyRows: number;
  };
  priorBatches: Array<{
    batchId: string;
    path: string;
    excludedQueueIds: string[];
  }>;
  selectionCriteria: {
    domain: string;
    priority: string;
    phase: string;
    reviewStatus: string;
    batchSize: number;
    specificity: string;
  };
  totals: {
    rows: number;
    reviewStatus: Record<string, number>;
    promotionStatus: Record<string, number>;
    sourceMapSpecificity: Record<string, number>;
  };
  guardrails: string[];
  rows: BatchRow[];
}

interface QueueEntry {
  id: string;
  domain: string;
  categoryId: string;
  path: string[];
  source: {
    sourcePath: string;
    sourceTopicId: string;
  };
  generator: {
    requiredMaterialSet: string[];
  };
  expansionStatus: {
    reviewStatus: string;
    promotionStatus: string;
    gapPlanPriority: string | null;
    gapPlanPhase: string | null;
  };
}

interface SourceMapRow {
  id: string;
  priority: string;
  best_candidate_specificity: string;
  best_candidate_score: number;
  local_candidate_count: number;
  local_candidates: Array<{
    file_path: string;
    specificity_class: string;
    match_reasons: string[];
  }>;
}

const readJson = <T>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
const sourceMapKey = (entry: QueueEntry) => `${entry.categoryId}-${entry.source.sourceTopicId}`;

describe('ABPath AP material batch 006', () => {
  const batch = readJson<Batch>(batchPath);
  const queue = readJson<{ entries: QueueEntry[] }>(queuePath);
  const sourceMap = readJson<{ candidate_rows: SourceMapRow[]; summary: Record<string, number> }>(sourceMapPath);
  const priorBatches = priorBatchPaths.map((filePath) => readJson<Batch>(filePath));
  const priorQueueIds = new Set(priorBatches.flatMap((priorBatch) => priorBatch.rows.map((row) => row.queueId)));
  const queueBySourceMapId = new Map(queue.entries.map((entry) => [sourceMapKey(entry), entry]));
  const expectedRows = sourceMap.candidate_rows
    .filter((row) => row.best_candidate_specificity === 'topic_specific' && row.priority === 'P0 core board/sign-out gap')
    .map((sourceMapRow) => ({ sourceMapRow, queueEntry: queueBySourceMapId.get(sourceMapRow.id) }))
    .filter(({ queueEntry }) => queueEntry && !priorQueueIds.has(queueEntry.id))
    .filter(
      ({ queueEntry }) =>
        queueEntry?.domain === 'AP' &&
        queueEntry.expansionStatus.reviewStatus === 'unreviewed' &&
        queueEntry.expansionStatus.gapPlanPriority === 'P0 core board/sign-out gap' &&
        queueEntry.expansionStatus.gapPlanPhase === 'Phase 1: core resident coverage',
    )
    .slice(0, 4);

  it('materializes the final bounded topic-specific AP source-map slice after batches 001 through 005', () => {
    expect(batch.version).toBe('abpath-ap-material-batch.v1');
    expect(batch.batchId).toBe('abpath-ap-material-batch-006');
    expect(batch.sourceQueue).toBe('src/content/materials/abpathMaterialExpansionQueue.json');
    expect(batch.sourceMap).toMatchObject({
      path: 'reports/curriculum/ap_local_source_map_v1.json',
      topicSpecificRows: sourceMap.summary.rows_with_topic_specific_best_candidate,
      categoryOnlyRows: sourceMap.summary.rows_with_category_only_best_candidate,
    });
    expect(batch.priorBatches.map((priorBatch) => priorBatch.batchId)).toEqual([
      'abpath-ap-material-batch-001',
      'abpath-ap-material-batch-002',
      'abpath-ap-material-batch-003',
      'abpath-ap-material-batch-004',
      'abpath-ap-material-batch-005',
    ]);
    expect(batch.selectionCriteria).toMatchObject({
      domain: 'AP',
      priority: 'P0 core board/sign-out gap',
      phase: 'Phase 1: core resident coverage',
      reviewStatus: 'unreviewed',
      batchSize: 4,
      specificity: 'topic_specific',
    });
    expect(batch.rows.map((row) => row.queueId)).toEqual(expectedRows.map(({ queueEntry }) => queueEntry?.id));
    expect(batch.rows.some((row) => priorQueueIds.has(row.queueId))).toBe(false);
  });

  it('keeps rows review-queued and carries topic-specific source-map evidence', () => {
    expect(batch.rows).toHaveLength(4);
    expect(batch.totals.rows).toBe(4);
    expect(batch.totals.reviewStatus.unreviewed).toBe(4);
    expect(batch.totals.promotionStatus['review-queue']).toBe(4);
    expect(batch.totals.sourceMapSpecificity.topic_specific).toBe(4);

    for (const [index, row] of batch.rows.entries()) {
      const expected = expectedRows[index];
      expect(row.domain).toBe('AP');
      expect(row.queueId).toBe(expected.queueEntry?.id);
      expect(row.sourceMapId).toBe(expected.sourceMapRow.id);
      expect(row.sourceMapEvidence.bestCandidateSpecificity).toBe('topic_specific');
      expect(row.sourceMapEvidence.primaryCandidateSpecificity).toBe('topic_specific');
      expect(row.sourceMapEvidence.bestCandidateScore).toBe(expected.sourceMapRow.best_candidate_score);
      expect(row.sourceMapEvidence.localCandidateCount).toBe(expected.sourceMapRow.local_candidate_count);
      expect(row.sourceMapEvidence.primaryCandidatePath).toBe(expected.sourceMapRow.local_candidates[0]?.file_path);
      expect(row.sourceMapEvidence.matchReasons).toEqual(expected.sourceMapRow.local_candidates[0]?.match_reasons);
      expect(row.review).toEqual({
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        reviewerRequired: true,
        promotionAllowed: false,
      });
    }
  });

  it('preserves queue source path, hierarchy, and required material set', () => {
    for (const [index, row] of batch.rows.entries()) {
      const expected = expectedRows[index].queueEntry;
      expect(row.pathHierarchy).toEqual(expected?.path);
      expect(row.source.sourcePath).toBe(expected?.source.sourcePath);
      expect(row.source.sourceTopicId).toBe(expected?.source.sourceTopicId);
      expect(row.requiredMaterialSet).toEqual(expected?.generator.requiredMaterialSet);
      expect(row.requiredMaterialSet).toContain('faculty review checklist');
      expect(row.requiredMaterialSet).toContain('image or explicit no-image rationale');
    }
  });

  it('documents category-only exclusion and review guardrails', () => {
    const guardrailText = batch.guardrails.join(' ');
    const report = fs.readFileSync(reportPath, 'utf8');

    expect(guardrailText).toContain('topic-specific');
    expect(guardrailText).toContain('Category-only');
    expect(guardrailText).toContain('unreviewed');
    expect(report).toContain('ABPath AP Material Batch 006');
    expect(report).toContain('Category-only source-map rows excluded');
    expect(report).toContain('topic_specific=4');
    expect(report).toContain('review-queue');
  });
});
