#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const queuePath = path.join(repoRoot, 'src/content/materials/abpathMaterialExpansionQueue.json');
const batchPaths = [
  'src/content/materials/abpathApMaterialBatch001.json',
  'src/content/materials/abpathCpMaterialBatch001.json',
  'src/content/materials/abpathApMaterialBatch002.json',
  'src/content/materials/abpathCpMaterialBatch002.json',
  'src/content/materials/abpathApMaterialBatch003.json',
  'src/content/materials/abpathApMaterialBatch004.json',
  'src/content/materials/abpathApMaterialBatch005.json',
  'src/content/materials/abpathApMaterialBatch006.json',
  'src/content/materials/abpathCpMaterialBatch003.json',
  'src/content/materials/abpathCpMaterialBatch004.json',
  'src/content/materials/abpathCpMaterialBatch005.json',
];
const outPath = path.join(repoRoot, 'src/content/materials/abpathMaterialAdminSummary.json');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const humanizeStatus = (status) =>
  String(status)
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const labelsFromCounts = (counts) =>
  Object.entries(counts || {}).map(([status, count]) => ({
    status,
    label: humanizeStatus(status),
    count,
  }));

const batchSummary = (batch) => ({
  batchId: batch.batchId,
  domain: batch.rows?.find((row) => row.domain)?.domain || 'unknown',
  rowCount: batch.totals?.rows || batch.rows?.length || 0,
  unreviewedRows: batch.totals?.reviewStatus?.unreviewed || 0,
  reviewQueueRows: batch.totals?.promotionStatus?.['review-queue'] || 0,
  reviewerRequiredRows: (batch.rows || []).filter((row) => row.review?.reviewerRequired === true).length,
  promotionBlockedRows: (batch.rows || []).filter((row) => row.review?.promotionAllowed !== true).length,
});

const loadExistingBatchRecords = () =>
  batchPaths
    .map((relativePath) => ({
      relativePath,
      absolutePath: path.join(repoRoot, relativePath),
    }))
    .filter(({ absolutePath }) => fs.existsSync(absolutePath))
    .map(({ relativePath, absolutePath }) => ({
      relativePath,
      batch: readJson(absolutePath),
    }));

const main = () => {
  const queue = readJson(queuePath);
  const batchRecords = loadExistingBatchRecords();
  const batches = batchRecords.map(({ batch }) => batchSummary(batch));
  const batchRows = batches.reduce((sum, batch) => sum + batch.rowCount, 0);
  const unreviewedBatchRows = batches.reduce((sum, batch) => sum + batch.unreviewedRows, 0);
  const reviewQueueBatchRows = batches.reduce((sum, batch) => sum + batch.reviewQueueRows, 0);

  const summary = {
    version: 'abpath-material-admin-summary.v1',
    generatedAt: new Date().toISOString(),
    source: {
      queue: 'src/content/materials/abpathMaterialExpansionQueue.json',
      apBatch: 'src/content/materials/abpathApMaterialBatch001.json',
      cpBatch: 'src/content/materials/abpathCpMaterialBatch001.json',
      batches: batchRecords.map(({ relativePath }) => relativePath),
    },
    totals: {
      queueEntries: queue.totals.entries,
      apQueueItems: queue.totals.domains.AP,
      cpQueueItems: queue.totals.domains.CP,
      requiredMaterialSetItems: queue.totals.requiredMaterialSetItems,
      batchRows,
      unreviewedQueueEntries: queue.totals.reviewStatus.unreviewed,
      generationQueueEntries: queue.totals.promotionStatus['generation-queue'],
    },
    statusLabels: {
      review: labelsFromCounts(queue.totals.reviewStatus),
      promotion: labelsFromCounts(queue.totals.promotionStatus),
    },
    materialKindPreview: labelsFromCounts(queue.totals.materialKinds),
    guardrails: {
      visible: queue.guardrails,
      total: queue.guardrails.length,
      hidden: 0,
    },
    batches,
    gates: {
      allQueueEntriesUnreviewed: queue.totals.reviewStatus.unreviewed === queue.totals.entries,
      allQueueEntriesInGenerationQueue: queue.totals.promotionStatus['generation-queue'] === queue.totals.entries,
      allBatchRowsUnreviewed: unreviewedBatchRows === batchRows,
      allBatchRowsReviewQueued: reviewQueueBatchRows === batchRows,
      promotionAllowedRows: 0,
    },
  };

  ensureDir(outPath);
  fs.writeFileSync(outPath, `${JSON.stringify(summary, null, 2)}\n`);
  console.log(`[ABPATH-MATERIAL-ADMIN-SUMMARY] Wrote summary to ${path.relative(repoRoot, outPath)}.`);
};

main();
