import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(__dirname, '..');
const batchPath = path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch003.json');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const coverageMapPath = path.join(repoRoot, 'reports/curriculum/cp_worked_example_coverage_map_v1.json');
const priorBatchPaths = [
  path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch001.json'),
  path.join(repoRoot, 'src/content/materials/abpathCpMaterialBatch002.json'),
];
const reportPath = path.join(repoRoot, 'reports/abpath_cp_material_batch_003.md');

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

describe('ABPath CP material batch 003', () => {
  const batch = readJson<CpMaterialBatch>(batchPath);
  const queue = readJson<{ entries: QueueEntry[] }>(queuePath);
  const coverageMap = readJson<{ rows: CoverageRow[] }>(coverageMapPath);
  const priorBatches = priorBatchPaths.map((filePath) => readJson<CpMaterialBatch>(filePath));
  const priorQueueIds = new Set(priorBatches.flatMap((priorBatch) => priorBatch.rows.map((row) => row.queueEntryId)));
  const queueById = new Map(queue.entries.map((entry) => [entry.id, entry]));
  const coverageById = new Map(coverageMap.rows.map((row) => [row.queueEntryId, row]));
  const expectedQueueEntryIds = [
    'cp-bb-bb-blood-banking-transfusion-medicine-dbf7f42282',
    'cp-bb-bb-1-clinical-practice-dafc3e1149',
    'cp-bb-bb-1-a-autoimmune-hemolytic-anemia-2b8fb5c258',
    'cp-bb-bb-1-b-paroxysmal-nocturnal-hemoglobinuria-2adfcdef45',
    'cp-bb-bb-1-c-anemia-in-oncology-patients-9bea48a011',
    'cp-bb-bb-1-d-immune-thrombocytopenia-1d2da677f2',
    'cp-bb-bb-1-e-bleeding-from-coagulation-defects-d99172de51',
    'cp-bb-bb-1-e-i-cirrhosis-coagulopathy-b46e5d074b',
    'cp-bb-bb-1-e-ii-drug-induced-hemolytic-anemia-2406b71689',
    'cp-bb-bb-1-e-iv-acquired-coagulation-factor-inhibitors-20a4348423',
  ];

  it('materializes the first ten unmaterialized CP worked-example coverage rows', () => {
    expect(batch.version).toBe('abpath-cp-material-batch.v1');
    expect(batch.batchId).toBe('abpath-cp-material-batch-003');
    expect(batch.selection.sourceQueuePath).toBe('src/content/materials/abpathMaterialExpansionQueue.json');
    expect(batch.selection.sourceCoverageMapPath).toBe('reports/curriculum/cp_worked_example_coverage_map_v1.json');
    expect(batch.selection.domain).toBe('CP');
    expect(batch.selection.excludedPriorBatchIds).toEqual([
      'abpath-cp-material-batch-001',
      'abpath-cp-material-batch-002',
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
    expect(report).toContain('ABPath CP Material Batch 003');
    expect(report).toContain('unreviewed / review-queue');
    expect(report).toContain('Prior batches excluded: abpath-cp-material-batch-001, abpath-cp-material-batch-002');
    expect(report).toContain('transfusion_medicine');
  });
});
