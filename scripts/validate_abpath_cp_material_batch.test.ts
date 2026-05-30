import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const batchPath = path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch001.json');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const reportPath = path.join(repoRoot, 'reports/abpath_cp_material_batch_001.md');

interface BatchRow {
  batchRowId: string;
  queueEntryId: string;
  domain: string;
  subject: string;
  categoryId: string;
  materialKind: string;
  title: string;
  difficulty: string;
  path: string[];
  pathHierarchy: string;
  source: {
    sourcePath: string;
    rawSourcePath: string;
    sourceTopicId: string;
    sourceLine: number | null;
  };
  requiredMaterialSet: string[];
  benchFacingArtifactRequirements: string[];
  review: {
    reviewStatus: string;
    promotionStatus: string;
    sourceQueuePromotionStatus: string;
    reviewerRequired: boolean;
  };
  batchPromotionGuardrails: string[];
}

interface CpMaterialBatch {
  version: string;
  batchId: string;
  selection: {
    sourceQueuePath: string;
    sourceQueueVersion: string;
    domain: string;
    subject: string;
    pathPrefix: string[];
    sourceTopicIds: string[];
  };
  totals: {
    rows: number;
    reviewStatus: Record<string, number>;
    promotionStatus: Record<string, number>;
  };
  promotionGuardrails: string[];
  rows: BatchRow[];
}

interface QueueEntry {
  id: string;
  domain: string;
  subject: string;
  path: string[];
  source: {
    sourcePath: string;
    rawSourcePath: string;
    sourceTopicId: string;
    sourceLine: number | null;
  };
  generator: {
    requiredMaterialSet: string[];
  };
  expansionStatus: {
    reviewStatus: string;
    promotionStatus: string;
  };
}

interface ExpansionQueue {
  version: string;
  entries: QueueEntry[];
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;
}

describe('ABPath CP material batch 001', () => {
  const batch = readJson<CpMaterialBatch>(batchPath);
  const queue = readJson<ExpansionQueue>(queuePath);
  const report = fs.readFileSync(reportPath, 'utf8');

  it('materializes a bounded CP bench-facing slice from the existing queue', () => {
    expect(batch.version).toBe('abpath-cp-material-batch.v1');
    expect(batch.batchId).toBe('abpath-cp-material-batch-001');
    expect(batch.selection.sourceQueuePath).toBe('src/content/materials/abpathMaterialExpansionQueue.json');
    expect(batch.selection.sourceQueueVersion).toBe(queue.version);
    expect(batch.selection.domain).toBe('CP');
    expect(batch.selection.subject).toBe('Blood Banking/Transfusion Medicine');
    expect(batch.selection.pathPrefix).toEqual(['Blood Banking/Transfusion Medicine', 'RBCs and RBC Components']);
    expect(batch.rows).toHaveLength(9);
    expect(batch.totals.rows).toBe(batch.rows.length);
  });

  it('preserves source path, path hierarchy, and required material set for every selected row', () => {
    const queueByTopicId = new Map(queue.entries.map((entry) => [entry.source.sourceTopicId, entry]));

    for (const row of batch.rows) {
      const sourceEntry = queueByTopicId.get(row.source.sourceTopicId);
      expect(sourceEntry).toBeDefined();
      expect(row.queueEntryId).toBe(sourceEntry?.id);
      expect(row.domain).toBe('CP');
      expect(row.subject).toBe('Blood Banking/Transfusion Medicine');
      expect(row.source.sourcePath).toBe(sourceEntry?.source.sourcePath);
      expect(row.source.rawSourcePath).toBe(sourceEntry?.source.rawSourcePath);
      expect(row.path).toEqual(sourceEntry?.path);
      expect(row.pathHierarchy).toBe(row.path.join(' > '));
      expect(row.path.slice(0, 2)).toEqual(['Blood Banking/Transfusion Medicine', 'RBCs and RBC Components']);
      expect(row.requiredMaterialSet).toEqual(sourceEntry?.generator.requiredMaterialSet);
      expect(row.requiredMaterialSet).toContain('bench-facing clinical question');
      expect(row.requiredMaterialSet).toContain('faculty review checklist');
    }
  });

  it('keeps every batch row unreviewed and review-queue gated', () => {
    expect(batch.totals.reviewStatus.unreviewed).toBe(batch.rows.length);
    expect(batch.totals.promotionStatus['review-queue']).toBe(batch.rows.length);
    expect(batch.promotionGuardrails.join(' ')).toContain('source-truth mappings');

    for (const row of batch.rows) {
      expect(row.review.reviewStatus).toBe('unreviewed');
      expect(row.review.promotionStatus).toBe('review-queue');
      expect(row.review.sourceQueuePromotionStatus).toBe('generation-queue');
      expect(row.review.reviewerRequired).toBe(true);
      expect(row.batchPromotionGuardrails).toEqual(batch.promotionGuardrails);
    }
  });

  it('requires bench-facing artifacts and publishes a reviewer-readable report', () => {
    for (const row of batch.rows) {
      expect(row.benchFacingArtifactRequirements.length).toBeGreaterThanOrEqual(5);
      expect(row.benchFacingArtifactRequirements.join(' ')).toContain('bench-facing clinical question');
      expect(row.benchFacingArtifactRequirements.join(' ')).toMatch(/laboratory artifact|compatibility-testing/);
    }

    expect(report).toContain('ABPath CP Material Batch 001');
    expect(report).toContain('unreviewed / review-queue');
    expect(report).toContain('Red Cell Immunology and Compatibility Testing');
    expect(report).toContain('Red Cell Genotyping');
  });
});
