import { apP0BreastCardBatch } from './apP0BreastCardBatch.ts';
import { apP0CvAutopsyCardBatch } from './apP0CvAutopsyCardBatch.ts';
import { apP0CvAutopsyCardBatch2 } from './apP0CvAutopsyCardBatch2.ts';
import { apP0CvAutopsyCardBatch3 } from './apP0CvAutopsyCardBatch3.ts';
import { apP0CvTaxonomyReviewCardBatch } from './apP0CvTaxonomyReviewCardBatch.ts';
import { apP0DermpathCardBatch } from './apP0DermpathCardBatch.ts';
import { apP0EndocrineCardBatch } from './apP0EndocrineCardBatch.ts';
import { apP0EndocrineCardBatch2 } from './apP0EndocrineCardBatch2.ts';
import { apP0EntityCardBatch } from './apP0EntityCardBatch.ts';
import { apP0GiCardBatch } from './apP0GiCardBatch.ts';
import { apP0MaleReproCardBatch } from './apP0MaleReproCardBatch.ts';
import { apP0PediatricCardBatch } from './apP0PediatricCardBatch.ts';
import { apP0SmallDomainsCardBatch } from './apP0SmallDomainsCardBatch.ts';

export const apP0CardBatches = [
  apP0EntityCardBatch,
  apP0CvAutopsyCardBatch,
  apP0CvAutopsyCardBatch2,
  apP0CvAutopsyCardBatch3,
  apP0CvTaxonomyReviewCardBatch,
  apP0EndocrineCardBatch,
  apP0EndocrineCardBatch2,
  apP0DermpathCardBatch,
  apP0GiCardBatch,
  apP0BreastCardBatch,
  apP0MaleReproCardBatch,
  apP0PediatricCardBatch,
  apP0SmallDomainsCardBatch,
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
