import { apP0CvAutopsyCardBatch } from './apP0CvAutopsyCardBatch.ts';
import { apP0DermpathCardBatch } from './apP0DermpathCardBatch.ts';
import { apP0EndocrineCardBatch } from './apP0EndocrineCardBatch.ts';
import { apP0EntityCardBatch } from './apP0EntityCardBatch.ts';

export const apP0CardBatches = [
  apP0EntityCardBatch,
  apP0CvAutopsyCardBatch,
  apP0EndocrineCardBatch,
  apP0DermpathCardBatch,
] as const;

export type ApP0CardBatch = typeof apP0CardBatches[number];
export type ApP0CardBatchCard = ApP0CardBatch['cards'][number];

export const apP0CardBatchSummary = apP0CardBatches.reduce(
  (summary, batch) => {
    summary.batchCount += 1;
    summary.cardCount += batch.cards.length;
    summary.completedGates += batch.batchReadiness.completedGates;
    summary.reviewReadyGates += batch.batchReadiness.reviewReadyGates;
    summary.missingGates += batch.batchReadiness.missingGates;
    summary.totalGates += batch.batchReadiness.totalGates;
    return summary;
  },
  {
    batchCount: 0,
    cardCount: 0,
    completedGates: 0,
    reviewReadyGates: 0,
    missingGates: 0,
    totalGates: 0,
  },
);

export const apP0CardBatchReadiness = {
  ...apP0CardBatchSummary,
  percentComplete: apP0CardBatchSummary.totalGates
    ? Math.round((apP0CardBatchSummary.completedGates / apP0CardBatchSummary.totalGates) * 100)
    : 0,
  percentReviewReady: apP0CardBatchSummary.totalGates
    ? Math.round(((apP0CardBatchSummary.completedGates + apP0CardBatchSummary.reviewReadyGates) / apP0CardBatchSummary.totalGates) * 100)
    : 0,
};
