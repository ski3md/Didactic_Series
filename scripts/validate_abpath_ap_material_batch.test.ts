import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const batchPath = path.join(repoRoot, 'src/content/materials/abpathApMaterialBatch001.json');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const reportPath = path.join(repoRoot, 'reports/abpath_ap_material_batch_001.md');

interface BatchRow {
  batchRow: number;
  queueId: string;
  domain: string;
  subject: string;
  categoryId: string;
  materialKind: string;
  title: string;
  difficulty: string;
  learnerLevel: string;
  pathHierarchy: string[];
  source: {
    sourcePath: string;
    rawSourcePath: string;
    sourceTopicId: string;
    sourceLine: number | null;
  };
  requiredMaterialSet: string[];
  generatorProfile: string;
  review: {
    reviewStatus: string;
    promotionStatus: string;
    reviewerRequired: boolean;
    promotionAllowed: boolean;
  };
  sourceQueueStatus: {
    reviewStatus: string;
    promotionStatus: string;
    gapPlanPriority: string;
    gapPlanPhase: string;
  };
}

interface Batch {
  version: string;
  batchId: string;
  sourceQueue: string;
  selectionCriteria: {
    domain: string;
    priority: string;
    phase: string;
    reviewStatus: string;
    batchSize: number;
  };
  guardrails: string[];
  totals: {
    rows: number;
    reviewStatus: Record<string, number>;
    promotionStatus: Record<string, number>;
    subjects: Record<string, number>;
    requiredMaterialSetItems: number;
  };
  rows: BatchRow[];
}

interface Queue {
  entries: Array<{
    id: string;
    domain: string;
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
      gapPlanPriority: string | null;
      gapPlanPhase: string | null;
    };
  }>;
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

describe('ABPath AP material batch 001', () => {
  const batch = readJson<Batch>(batchPath);
  const queue = readJson<Queue>(queuePath);
  const expectedSourceRows = queue.entries
    .filter(
      (entry) =>
        entry.domain === 'AP' &&
        entry.expansionStatus.reviewStatus === 'unreviewed' &&
        entry.expansionStatus.gapPlanPriority === 'P0 core board/sign-out gap' &&
        entry.expansionStatus.gapPlanPhase === 'Phase 1: core resident coverage',
    )
    .slice(0, 12);

  it('materializes the first bounded AP P0 core resident slice from the queue', () => {
    const expectedQueueIds = expectedSourceRows.map((entry) => entry.id);

    expect(batch.version).toBe('abpath-ap-material-batch.v1');
    expect(batch.batchId).toBe('abpath-ap-material-batch-001');
    expect(batch.sourceQueue).toBe('src/content/materials/abpathMaterialExpansionQueue.json');
    expect(batch.selectionCriteria).toMatchObject({
      domain: 'AP',
      priority: 'P0 core board/sign-out gap',
      phase: 'Phase 1: core resident coverage',
      reviewStatus: 'unreviewed',
      batchSize: 12,
    });
    expect(batch.rows.map((row) => row.queueId)).toEqual(expectedQueueIds);
  });

  it('keeps every row unreviewed and in the review queue with promotion blocked', () => {
    expect(batch.totals.rows).toBe(12);
    expect(batch.rows).toHaveLength(12);
    expect(batch.totals.reviewStatus.unreviewed).toBe(12);
    expect(batch.totals.promotionStatus['review-queue']).toBe(12);

    for (const row of batch.rows) {
      expect(row.domain).toBe('AP');
      expect(row.learnerLevel).toBe('PGY1-PGY2 core resident');
      expect(row.review).toEqual({
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        reviewerRequired: true,
        promotionAllowed: false,
      });
      expect(row.sourceQueueStatus).toMatchObject({
        reviewStatus: 'unreviewed',
        gapPlanPriority: 'P0 core board/sign-out gap',
        gapPlanPhase: 'Phase 1: core resident coverage',
      });
    }
  });

  it('preserves source path, path hierarchy, and required material set from the queue', () => {
    for (const [index, row] of batch.rows.entries()) {
      const source = expectedSourceRows[index];

      expect(source).toBeDefined();
      expect(row.queueId).toBe(source.id);
      expect(row.pathHierarchy).toEqual(source.path);
      expect(row.pathHierarchy.length).toBeGreaterThanOrEqual(2);
      expect(row.source.sourcePath).toBe(source.source.sourcePath);
      expect(row.source.sourceTopicId).toBe(source.source.sourceTopicId);
      expect(row.requiredMaterialSet).toEqual(source.generator.requiredMaterialSet);
      expect(row.requiredMaterialSet).toContain('faculty review checklist');
      expect(row.requiredMaterialSet).toContain('image or explicit no-image rationale');
    }
  });

  it('documents batch promotion guardrails for reviewer use', () => {
    const guardrailText = batch.guardrails.join(' ');
    const report = fs.readFileSync(reportPath, 'utf8');

    expect(batch.guardrails.length).toBeGreaterThanOrEqual(5);
    expect(guardrailText).toContain('unreviewed');
    expect(guardrailText).toContain('source-truth mappings');
    expect(guardrailText).toContain('reviewer evidence');
    expect(report).toContain('ABPath AP Material Batch 001');
    expect(report).toContain('Batch Promotion Guardrails');
    expect(report).toContain('review-queue');
  });
});
