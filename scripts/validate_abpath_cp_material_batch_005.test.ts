import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const batchPath = path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch005.json');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const coverageMapPath = path.join(repoRoot, 'reports/curriculum/cp_worked_example_coverage_map_v1.json');
const priorBatchPaths = [
  path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch001.json'),
  path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch002.json'),
  path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch003.json'),
  path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch004.json'),
];
const reportPath = path.join(repoRoot, 'reports/abpath_cp_material_batch_005.md');

interface CpMaterialBatchRow {
  queueEntryId: string;
  domain: string;
  materialKind: string;
  path: string[];
  source: {
    sourcePath: string;
    rawSourcePath: string;
    sourceTopicId: string;
  };
  requiredMaterialSet: string[];
  workedExampleCoverage: {
    workedExampleDomain: string;
    workedExampleRequired: boolean;
    requiredExampleShape: string[];
    currentCoverageStatus: string;
  };
  review: {
    reviewStatus: string;
    promotionStatus: string;
    sourceQueuePromotionStatus: string;
    reviewerRequired: boolean;
    promotionAllowed: boolean;
  };
}

interface CpMaterialBatch {
  version: string;
  batchId: string;
  selection: {
    sourceQueuePath: string;
    sourceCoverageMapPath: string;
    domain: string;
    queueEntryIds: string[];
    excludedPriorBatchIds: string[];
  };
  totals: {
    rows: number;
    reviewStatus: Record<string, number>;
    promotionStatus: Record<string, number>;
  };
  promotionGuardrails: string[];
  rows: CpMaterialBatchRow[];
}

interface QueueEntry {
  id: string;
  domain: string;
  path: string[];
  source: {
    sourcePath: string;
    rawSourcePath: string;
    sourceTopicId: string;
  };
  generator: {
    requiredMaterialSet: string[];
  };
  expansionStatus: {
    promotionStatus: string;
  };
}

interface CoverageRow {
  queueEntryId: string;
  currentCoverageStatus: string;
  workedExampleDomain: string;
  workedExampleRequired: boolean;
  requiredExampleShape: string[];
}

const readJson = <T>(filePath: string): T => JSON.parse(fs.readFileSync(filePath, 'utf8')) as T;

describe('ABPath CP material batch 005', () => {
  const batch = readJson<CpMaterialBatch>(batchPath);
  const queue = readJson<{ entries: QueueEntry[] }>(queuePath);
  const coverageMap = readJson<{ rows: CoverageRow[] }>(coverageMapPath);
  const priorBatches = priorBatchPaths.map((filePath) => readJson<CpMaterialBatch>(filePath));
  const priorQueueIds = new Set(priorBatches.flatMap((priorBatch) => priorBatch.rows.map((row) => row.queueEntryId)));
  const queueById = new Map(queue.entries.map((entry) => [entry.id, entry]));
  const coverageById = new Map(coverageMap.rows.map((row) => [row.queueEntryId, row]));
  const expectedQueueEntryIds = [
    'cp-bb-bb-6-a-hemolytic-transfusion-reactions-996f19c838',
    'cp-bb-bb-6-b-febrile-allergic-and-non-immune-transfusion-reactions-cb4a881404',
    'cp-bb-bb-6-c-transfusion-associated-graft-versus-host-disease-333ee3be6d',
    'cp-bb-bb-6-d-transfusion-induced-iron-overload-95f7d58c4d',
    'cp-bb-bb-6-e-transfusion-related-acute-lung-injury-trali-162a4f5ae0',
    'cp-bb-bb-6-f-vasovagal-and-hypovolemic-reactions-5feb473467',
    'cp-bb-bb-8-infectious-hazards-of-transfusion-9d1cb8c135',
    'cp-bb-bb-8-a-septic-transfusion-reactions-7fd750f6a3',
    'cp-bb-bb-8-b-prion-disease-transmission-cjd-b3ccbfdb39',
    'cp-bb-bb-10-surgery-patients-04ac9abf8f',
  ];

  it('materializes the next ten CP worked-example coverage rows after CP batch 004', () => {
    expect(batch.version).toBe('abpath-cp-material-batch.v1');
    expect(batch.batchId).toBe('abpath-cp-material-batch-005');
    expect(batch.selection.sourceQueuePath).toBe('src/content/materials/abpathMaterialExpansionQueue.json');
    expect(batch.selection.sourceCoverageMapPath).toBe('reports/curriculum/cp_worked_example_coverage_map_v1.json');
    expect(batch.selection.domain).toBe('CP');
    expect(batch.selection.excludedPriorBatchIds).toEqual([
      'abpath-cp-material-batch-001',
      'abpath-cp-material-batch-002',
      'abpath-cp-material-batch-003',
      'abpath-cp-material-batch-004',
    ]);
    expect(batch.selection.queueEntryIds).toEqual(expectedQueueEntryIds);
    expect(batch.rows.map((row) => row.queueEntryId)).toEqual(expectedQueueEntryIds);
    expect(batch.rows.some((row) => priorQueueIds.has(row.queueEntryId))).toBe(false);
  });

  it('keeps every row review-queued with worked-example coverage evidence', () => {
    expect(batch.rows).toHaveLength(10);
    expect(batch.totals.rows).toBe(10);
    expect(batch.totals.reviewStatus.unreviewed).toBe(10);
    expect(batch.totals.promotionStatus['review-queue']).toBe(10);

    for (const row of batch.rows) {
      const coverage = coverageById.get(row.queueEntryId);
      expect(row.domain).toBe('CP');
      expect(row.review).toEqual({
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        sourceQueuePromotionStatus: 'generation-queue',
        reviewerRequired: true,
        promotionAllowed: false,
      });
      expect(row.workedExampleCoverage.workedExampleRequired).toBe(true);
      expect(row.workedExampleCoverage.currentCoverageStatus).toBe(coverage?.currentCoverageStatus);
      expect(row.workedExampleCoverage.workedExampleDomain).toBe(coverage?.workedExampleDomain);
      expect(row.workedExampleCoverage.requiredExampleShape).toEqual(coverage?.requiredExampleShape);
    }
  });

  it('preserves queue source path, hierarchy, and required material set', () => {
    for (const row of batch.rows) {
      const sourceEntry = queueById.get(row.queueEntryId);
      expect(sourceEntry).toBeDefined();
      expect(row.source.sourcePath).toBe(sourceEntry?.source.sourcePath);
      expect(row.source.rawSourcePath).toBe(sourceEntry?.source.rawSourcePath);
      expect(row.source.sourceTopicId).toBe(sourceEntry?.source.sourceTopicId);
      expect(row.path).toEqual(sourceEntry?.path);
      expect(row.requiredMaterialSet).toEqual(sourceEntry?.generator.requiredMaterialSet);
      expect(row.requiredMaterialSet).toContain('bench-facing clinical question');
      expect(row.requiredMaterialSet).toContain('faculty review checklist');
    }
  });

  it('publishes reviewer-readable guardrails and report text', () => {
    const guardrailText = batch.promotionGuardrails.join(' ');
    const report = fs.readFileSync(reportPath, 'utf8');

    expect(guardrailText).toContain('unreviewed review-queue');
    expect(guardrailText).toContain('worked-example artifact evidence');
    expect(report).toContain('ABPath CP Material Batch 005');
    expect(report).toContain('unreviewed / review-queue');
    expect(report).toContain(
      'Prior batches excluded: abpath-cp-material-batch-001, abpath-cp-material-batch-002, abpath-cp-material-batch-003, abpath-cp-material-batch-004',
    );
    expect(report).toContain('transfusion_medicine');
  });
});
