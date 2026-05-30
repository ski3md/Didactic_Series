export type AbpathMaterialDomain = 'AP' | 'CP' | string;

export interface AbpathMaterialQueueEntry {
  domain: AbpathMaterialDomain;
  materialKind?: string;
  subject?: string;
  expansionStatus?: {
    reviewStatus?: string;
    promotionStatus?: string;
  };
}

export interface AbpathMaterialExpansionQueuePayload {
  guardrails?: readonly string[];
  totals?: {
    entries?: number;
    domains?: Record<string, number>;
    materialKinds?: Record<string, number>;
    reviewStatus?: Record<string, number>;
    promotionStatus?: Record<string, number>;
    requiredMaterialSetItems?: number;
  };
  entries?: readonly AbpathMaterialQueueEntry[];
}

export interface AbpathMaterialBatchRow {
  domain?: AbpathMaterialDomain;
  review?: {
    reviewStatus?: string;
    promotionStatus?: string;
    reviewerRequired?: boolean;
    promotionAllowed?: boolean;
    sourceQueuePromotionStatus?: string;
  };
  sourceQueueStatus?: {
    reviewStatus?: string;
    promotionStatus?: string;
  };
}

export interface AbpathMaterialBatchPayload {
  batchId?: string;
  totals?: {
    rows?: number;
    reviewStatus?: Record<string, number>;
    promotionStatus?: Record<string, number>;
  };
  guardrails?: readonly string[];
  promotionGuardrails?: readonly string[];
  rows?: readonly AbpathMaterialBatchRow[];
}

export interface AbpathMaterialAdminSummaryOptions {
  maxGuardrails?: number;
  maxPreviewItems?: number;
}

export interface AbpathStatusLabel {
  status: string;
  label: string;
  count: number;
}

export interface AbpathMaterialBatchSummary {
  batchId: string;
  domain: AbpathMaterialDomain;
  rowCount: number;
  unreviewedRows: number;
  reviewQueueRows: number;
  reviewerRequiredRows: number;
  promotionBlockedRows: number;
}

export interface AbpathMaterialAdminSummary {
  totals: {
    queueEntries: number;
    apQueueItems: number;
    cpQueueItems: number;
    requiredMaterialSetItems: number;
    batchRows: number;
    unreviewedQueueEntries: number;
    generationQueueEntries: number;
  };
  statusLabels: {
    review: AbpathStatusLabel[];
    promotion: AbpathStatusLabel[];
  };
  materialKindPreview: AbpathStatusLabel[];
  guardrails: {
    visible: string[];
    total: number;
    hidden: number;
  };
  batches: AbpathMaterialBatchSummary[];
  previewCounts: {
    queuePreviewItems: number;
    materialKindPreviewItems: number;
    visibleGuardrails: number;
    hiddenGuardrails: number;
    batchPreviewRows: number;
  };
  gates: {
    allQueueEntriesUnreviewed: boolean;
    allQueueEntriesInGenerationQueue: boolean;
    allBatchRowsUnreviewed: boolean;
    allBatchRowsReviewQueued: boolean;
    promotionAllowedRows: number;
  };
}

const DEFAULT_MAX_GUARDRAILS = 3;
const DEFAULT_MAX_PREVIEW_ITEMS = 5;

const humanizeStatus = (status: string): string =>
  status
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const entriesFromCounts = (counts: Record<string, number> | undefined): AbpathStatusLabel[] =>
  Object.entries(counts ?? {}).map(([status, count]) => ({
    status,
    label: humanizeStatus(status),
    count,
  }));

const countRowsWithStatus = (
  rows: readonly AbpathMaterialBatchRow[],
  statusField: 'reviewStatus' | 'promotionStatus',
  status: string,
): number =>
  rows.filter((row) => {
    const batchStatus = row.review?.[statusField];
    const sourceStatus = row.sourceQueueStatus?.[statusField];
    return batchStatus === status || sourceStatus === status;
  }).length;

const countPromotionBlockedRows = (rows: readonly AbpathMaterialBatchRow[]): number =>
  rows.filter((row) => row.review?.promotionAllowed !== true).length;

const inferBatchDomain = (batch: AbpathMaterialBatchPayload): AbpathMaterialDomain =>
  batch.rows?.find((row) => row.domain)?.domain ?? 'unknown';

export const buildAbpathMaterialAdminSummary = (
  queue: AbpathMaterialExpansionQueuePayload,
  batches: readonly AbpathMaterialBatchPayload[] = [],
  options: AbpathMaterialAdminSummaryOptions = {},
): AbpathMaterialAdminSummary => {
  const maxGuardrails = Math.max(0, options.maxGuardrails ?? DEFAULT_MAX_GUARDRAILS);
  const maxPreviewItems = Math.max(0, options.maxPreviewItems ?? DEFAULT_MAX_PREVIEW_ITEMS);
  const queueEntries = queue.entries ?? [];
  const queueTotals = queue.totals ?? {};
  const reviewStatusCounts = queueTotals.reviewStatus ?? {};
  const promotionStatusCounts = queueTotals.promotionStatus ?? {};
  const guardrails = [...(queue.guardrails ?? [])];
  const batchSummaries = batches.map((batch) => {
    const rows = batch.rows ?? [];
    return {
      batchId: batch.batchId ?? 'unknown-batch',
      domain: inferBatchDomain(batch),
      rowCount: batch.totals?.rows ?? rows.length,
      unreviewedRows: batch.totals?.reviewStatus?.unreviewed ?? countRowsWithStatus(rows, 'reviewStatus', 'unreviewed'),
      reviewQueueRows:
        batch.totals?.promotionStatus?.['review-queue'] ?? countRowsWithStatus(rows, 'promotionStatus', 'review-queue'),
      reviewerRequiredRows: rows.filter((row) => row.review?.reviewerRequired === true).length,
      promotionBlockedRows: countPromotionBlockedRows(rows),
    };
  });
  const batchRows = batchSummaries.reduce((total, batch) => total + batch.rowCount, 0);
  const unreviewedBatchRows = batchSummaries.reduce((total, batch) => total + batch.unreviewedRows, 0);
  const reviewQueueBatchRows = batchSummaries.reduce((total, batch) => total + batch.reviewQueueRows, 0);
  const promotionAllowedRows = batches
    .flatMap((batch) => [...(batch.rows ?? [])])
    .filter((row) => row.review?.promotionAllowed === true).length;

  return {
    totals: {
      queueEntries: queueTotals.entries ?? queueEntries.length,
      apQueueItems: queueTotals.domains?.AP ?? queueEntries.filter((entry) => entry.domain === 'AP').length,
      cpQueueItems: queueTotals.domains?.CP ?? queueEntries.filter((entry) => entry.domain === 'CP').length,
      requiredMaterialSetItems: queueTotals.requiredMaterialSetItems ?? 0,
      batchRows,
      unreviewedQueueEntries: reviewStatusCounts.unreviewed ?? 0,
      generationQueueEntries: promotionStatusCounts['generation-queue'] ?? 0,
    },
    statusLabels: {
      review: entriesFromCounts(reviewStatusCounts),
      promotion: entriesFromCounts(promotionStatusCounts),
    },
    materialKindPreview: entriesFromCounts(queueTotals.materialKinds).slice(0, maxPreviewItems),
    guardrails: {
      visible: guardrails.slice(0, maxGuardrails),
      total: guardrails.length,
      hidden: Math.max(0, guardrails.length - maxGuardrails),
    },
    batches: batchSummaries,
    previewCounts: {
      queuePreviewItems: Math.min(queueEntries.length, maxPreviewItems),
      materialKindPreviewItems: Math.min(Object.keys(queueTotals.materialKinds ?? {}).length, maxPreviewItems),
      visibleGuardrails: Math.min(guardrails.length, maxGuardrails),
      hiddenGuardrails: Math.max(0, guardrails.length - maxGuardrails),
      batchPreviewRows: Math.min(batchRows, maxPreviewItems),
    },
    gates: {
      allQueueEntriesUnreviewed:
        (reviewStatusCounts.unreviewed ?? 0) === (queueTotals.entries ?? queueEntries.length) &&
        Object.keys(reviewStatusCounts).every((status) => status === 'unreviewed'),
      allQueueEntriesInGenerationQueue:
        (promotionStatusCounts['generation-queue'] ?? 0) === (queueTotals.entries ?? queueEntries.length) &&
        Object.keys(promotionStatusCounts).every((status) => status === 'generation-queue'),
      allBatchRowsUnreviewed: unreviewedBatchRows === batchRows,
      allBatchRowsReviewQueued: reviewQueueBatchRows === batchRows,
      promotionAllowedRows,
    },
  };
};
