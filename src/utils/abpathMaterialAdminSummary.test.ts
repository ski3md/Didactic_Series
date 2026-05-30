import { describe, expect, it } from 'vitest';
import { buildAbpathMaterialAdminSummary } from './abpathMaterialAdminSummary.ts';
import type {
  AbpathMaterialBatchPayload,
  AbpathMaterialExpansionQueuePayload,
} from './abpathMaterialAdminSummary.ts';

const queuePayload: AbpathMaterialExpansionQueuePayload = {
  guardrails: [
    'Rows remain unreviewed until faculty review.',
    'Do not overwrite source-truth mappings.',
    'Promotion requires reviewer evidence.',
    'Generated summaries do not promote material.',
  ],
  totals: {
    entries: 5,
    domains: { AP: 3, CP: 2 },
    materialKinds: { topic: 3, subheader: 1, subject: 1 },
    reviewStatus: { unreviewed: 5 },
    promotionStatus: { 'generation-queue': 5 },
    requiredMaterialSetItems: 7,
  },
  entries: [
    { domain: 'AP', materialKind: 'topic' },
    { domain: 'AP', materialKind: 'topic' },
    { domain: 'AP', materialKind: 'subheader' },
    { domain: 'CP', materialKind: 'topic' },
    { domain: 'CP', materialKind: 'subject' },
  ],
};

const apBatchPayload: AbpathMaterialBatchPayload = {
  batchId: 'abpath-ap-material-batch-001',
  totals: {
    rows: 2,
    reviewStatus: { unreviewed: 2 },
    promotionStatus: { 'review-queue': 2 },
  },
  rows: [
    {
      domain: 'AP',
      review: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        reviewerRequired: true,
        promotionAllowed: false,
      },
      sourceQueueStatus: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'generation-queue',
      },
    },
    {
      domain: 'AP',
      review: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        reviewerRequired: true,
        promotionAllowed: false,
      },
      sourceQueueStatus: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'generation-queue',
      },
    },
  ],
};

const cpBatchPayload: AbpathMaterialBatchPayload = {
  batchId: 'abpath-cp-material-batch-001',
  totals: {
    rows: 1,
    reviewStatus: { unreviewed: 1 },
    promotionStatus: { 'review-queue': 1 },
  },
  rows: [
    {
      domain: 'CP',
      review: {
        reviewStatus: 'unreviewed',
        promotionStatus: 'review-queue',
        reviewerRequired: true,
      },
    },
  ],
};

describe('buildAbpathMaterialAdminSummary', () => {
  it('summarizes queue totals, labels, capped guardrails, and preview counts', () => {
    const summary = buildAbpathMaterialAdminSummary(queuePayload, [apBatchPayload, cpBatchPayload], {
      maxGuardrails: 2,
      maxPreviewItems: 2,
    });

    expect(summary.totals).toMatchObject({
      queueEntries: 5,
      apQueueItems: 3,
      cpQueueItems: 2,
      requiredMaterialSetItems: 7,
      batchRows: 3,
      unreviewedQueueEntries: 5,
      generationQueueEntries: 5,
    });
    expect(summary.statusLabels.review).toEqual([{ status: 'unreviewed', label: 'Unreviewed', count: 5 }]);
    expect(summary.statusLabels.promotion).toEqual([
      { status: 'generation-queue', label: 'Generation Queue', count: 5 },
    ]);
    expect(summary.materialKindPreview.map((item) => item.status)).toEqual(['topic', 'subheader']);
    expect(summary.guardrails).toEqual({
      visible: ['Rows remain unreviewed until faculty review.', 'Do not overwrite source-truth mappings.'],
      total: 4,
      hidden: 2,
    });
    expect(summary.previewCounts).toMatchObject({
      queuePreviewItems: 2,
      materialKindPreviewItems: 2,
      visibleGuardrails: 2,
      hiddenGuardrails: 2,
      batchPreviewRows: 2,
    });
  });

  it('builds AP and CP batch row summaries without requiring a shared row id shape', () => {
    const summary = buildAbpathMaterialAdminSummary(queuePayload, [apBatchPayload, cpBatchPayload]);

    expect(summary.batches).toEqual([
      {
        batchId: 'abpath-ap-material-batch-001',
        domain: 'AP',
        rowCount: 2,
        unreviewedRows: 2,
        reviewQueueRows: 2,
        reviewerRequiredRows: 2,
        promotionBlockedRows: 2,
      },
      {
        batchId: 'abpath-cp-material-batch-001',
        domain: 'CP',
        rowCount: 1,
        unreviewedRows: 1,
        reviewQueueRows: 1,
        reviewerRequiredRows: 1,
        promotionBlockedRows: 1,
      },
    ]);
  });

  it('keeps unreviewed gating explicit and does not mutate runtime payloads', () => {
    const originalGuardrails = [...(queuePayload.guardrails ?? [])];
    const originalApRows = [...(apBatchPayload.rows ?? [])];
    const summary = buildAbpathMaterialAdminSummary(queuePayload, [apBatchPayload, cpBatchPayload], {
      maxGuardrails: 1,
    });

    expect(summary.gates).toEqual({
      allQueueEntriesUnreviewed: true,
      allQueueEntriesInGenerationQueue: true,
      allBatchRowsUnreviewed: true,
      allBatchRowsReviewQueued: true,
      promotionAllowedRows: 0,
    });
    expect(queuePayload.guardrails).toEqual(originalGuardrails);
    expect(apBatchPayload.rows).toEqual(originalApRows);
  });
});
