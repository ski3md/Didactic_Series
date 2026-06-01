import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const batchPath = path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch002.json');
const priorBatchPath = path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch001.json');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const reportPath = path.join(repoRoot, 'reports/abpath_cp_material_batch_002.md');

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
    selectionRationale: string;
    sourceTopicIds: string[];
    excludedPriorBatchIds?: string[];
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

describe('ABPath CP material batch 002', () => {
  const batch = readJson<CpMaterialBatch>(batchPath);
  const priorBatch = readJson<CpMaterialBatch>(priorBatchPath);
  const queue = readJson<ExpansionQueue>(queuePath);
  const report = fs.readFileSync(reportPath, 'utf8');

  it('materializes the next bounded CP blood-bank slice after batch 001 without queue ID overlap', () => {
    expect(batch.version).toBe('abpath-cp-material-batch.v1');
    expect(batch.batchId).toBe('abpath-cp-material-batch-002');
    expect(batch.selection.sourceQueuePath).toBe('src/content/materials/abpathMaterialExpansionQueue.json');
    expect(batch.selection.sourceQueueVersion).toBe(queue.version);
    expect(batch.selection.domain).toBe('CP');
    expect(batch.selection.subject).toBe('Blood Banking/Transfusion Medicine');
    expect(batch.selection.sourceTopicIds).toEqual(['bb-4', 'bb-5', 'bb-5-a', 'bb-5-b']);
    expect(batch.selection.excludedPriorBatchIds).toContain('abpath-cp-material-batch-001');
    expect(batch.rows).toHaveLength(4);
    expect(batch.totals.rows).toBe(batch.rows.length);

    const priorQueueIds = new Set(priorBatch.rows.map((row) => row.queueEntryId));
    const currentQueueIds = batch.rows.map((row) => row.queueEntryId);
    expect(new Set(currentQueueIds).size).toBe(currentQueueIds.length);
    expect(currentQueueIds.every((id) => !priorQueueIds.has(id))).toBe(true);
  });

  it('preserves source path, hierarchy, and material requirements from the source queue', () => {
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
      expect(row.path[0]).toBe('Blood Banking/Transfusion Medicine');
      expect(row.requiredMaterialSet).toEqual(sourceEntry?.generator.requiredMaterialSet);
      expect(row.requiredMaterialSet).toContain('bench-facing clinical question');
      expect(row.requiredMaterialSet).toContain('representative laboratory artifact');
    }
  });

  it('keeps every batch row unreviewed and review-queue gated with promotion guardrails', () => {
    expect(batch.totals.reviewStatus.unreviewed).toBe(batch.rows.length);
    expect(batch.totals.promotionStatus['review-queue']).toBe(batch.rows.length);
    expect(batch.promotionGuardrails.join(' ')).toContain('batch 001 files');
    expect(batch.promotionGuardrails.join(' ')).toContain('faculty review');

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
      const artifactRequirements = row.benchFacingArtifactRequirements.join(' ');
      expect(row.benchFacingArtifactRequirements.length).toBeGreaterThanOrEqual(5);
      expect(artifactRequirements).toContain('bench-facing clinical question');
      expect(artifactRequirements).toMatch(/laboratory artifact|workflow card|worksheet|checklist|triage card/);
      expect(artifactRequirements).toMatch(/safety|bleeding-risk|handoff|escalation|decision/);
    }

    expect(report).toContain('ABPath CP Material Batch 002');
    expect(report).toContain('unreviewed / review-queue');
    expect(report).toContain('Prior batch excluded: abpath-cp-material-batch-001');
    expect(report).toContain('Anemia and Red Blood Cell Transfusion');
    expect(report).toContain('Plasma Exchange for IgM Removal');
    expect(report).toContain('Coagulation Factor Return Post-TPE');
  });
});
