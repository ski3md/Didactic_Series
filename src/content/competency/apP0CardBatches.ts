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

type GateStatus = ApP0CardBatchCard['gateStatuses'][number]['status'];

const emptyGateStatusCounts = () => ({
  complete: 0,
  'ready-for-review': 0,
  missing: 0,
}) satisfies Record<GateStatus, number>;

const countGateStatuses = (cards: readonly ApP0CardBatchCard[]) =>
  cards.reduce((counts, card) => {
    card.gateStatuses.forEach((gate) => {
      counts[gate.status] += 1;
    });
    return counts;
  }, emptyGateStatusCounts());

export const apP0BatchPromotionRows = apP0CardBatches.map((batch) => {
  const gateCounts = countGateStatuses(batch.cards);
  const totalGates = gateCounts.complete + gateCounts['ready-for-review'] + gateCounts.missing;
  return {
    batchName: batch.batchName,
    facultyPacketPath: batch.facultyPacketPath,
    cardCount: batch.cards.length,
    gateCounts,
    totalGates,
    percentComplete: totalGates ? Math.round((gateCounts.complete / totalGates) * 100) : 0,
    percentPromotable: totalGates ? Math.round(((gateCounts.complete + gateCounts['ready-for-review']) / totalGates) * 100) : 0,
  };
});

export const apP0GateBacklogRows = Object.values(
  apP0CardBatches.flatMap((batch) => batch.cards.flatMap((card) => card.gateStatuses)).reduce(
    (rows, gate) => {
      rows[gate.label] ||= {
        label: gate.label,
        complete: 0,
        readyForReview: 0,
        missing: 0,
        total: 0,
      };
      rows[gate.label].total += 1;
      if (gate.status === 'ready-for-review') {
        rows[gate.label].readyForReview += 1;
      } else {
        rows[gate.label][gate.status] += 1;
      }
      return rows;
    },
    {} as Record<string, { label: string; complete: number; readyForReview: number; missing: number; total: number }>,
  ),
).sort((a, b) => b.missing - a.missing || b.readyForReview - a.readyForReview || a.label.localeCompare(b.label));

export const apP0LearningQualityStandards = [
  {
    standard: 'Contrastive normal-to-abnormal encoding',
    appRule: 'Every promoted card needs a normal/reactive comparator plus one high-yield mimic discriminator before learner reveal.',
    evidenceTarget: 'Comparator, mimic, and discriminator fields present in source-backed content.',
  },
  {
    standard: 'Retrieval before explanation',
    appRule: 'Cards must ask the learner to commit to diagnosis, required feature, mimic, and report consequence before showing the answer key.',
    evidenceTarget: 'Faculty-reviewed retrieval key attached for each prompt set.',
  },
  {
    standard: 'Spaced consolidation',
    appRule: 'The same concept should recur same-session, 1 day, 3 days, 7 days, and 21 days with escalating independence.',
    evidenceTarget: 'Spacing schedule preserved and linked to level-aware prompts.',
  },
  {
    standard: 'Dual coding without image over-reliance',
    appRule: 'Visual anchors must include what to inspect at low power, what confirms at high power, and what report language changes care.',
    evidenceTarget: 'Image/gross/diagram asset metadata plus interpretation checklist.',
  },
  {
    standard: 'Faculty-calibrated safety',
    appRule: 'Each card needs a safety-critical pitfall, editorial status, reviewer, citation, and last-reviewed date before canonical status.',
    evidenceTarget: 'Faculty review gate complete with provenance metadata.',
  },
] as const;

export const apP0PromotionMilestones = [
  {
    milestone: '1. Taxonomy confirmation',
    target: `${apP0CardBatchSummary.reviewReadyGates} ready gates are available for first-pass faculty confirmation.`,
    outcome: 'Separate true diseases, physiologic processes, specimen tasks, and taxonomy spillover before authoring facts.',
  },
  {
    milestone: '2. Source-backed card authoring',
    target: `${apP0GateBacklogRows.find((row) => row.label.toLowerCase().includes('content'))?.missing ?? 0} content gates require definition, comparator, morphology, mimic, pitfall, and report consequence.`,
    outcome: 'Turn scaffolds into learner-safe AP micro-lessons without exposing unreviewed answer text.',
  },
  {
    milestone: '3. Visual and retrieval build-out',
    target: 'Pair visual anchors with faculty-reviewed retrieval keys so image recognition and diagnostic reasoning reinforce each other.',
    outcome: 'Promote memory consolidation through contrast, generation, and delayed recall.',
  },
  {
    milestone: '4. Canonical faculty release',
    target: 'Complete reviewer, citation, asset/license, and last-reviewed metadata before marking any card canonical.',
    outcome: 'Give PGY1-attending users trustworthy, provenance-visible didactics rather than opaque flashcards.',
  },
] as const;
