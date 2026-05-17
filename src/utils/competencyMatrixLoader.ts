import type { Section } from '../types.ts';
import type { ApP0CardBatch, ApP0CardBatchCard } from '../content/competency/apP0CardBatches.ts';
import type { SourceStandardDocument } from '../content/competency/competencyMatrix.ts';

type CompetencyMatrixModule = typeof import('../content/competency/competencyMatrix.ts');
type ApGapClosureModule = typeof import('../content/competency/apGapClosureQueue.ts');

export type P0GateCounts = {
  complete: number;
  'ready-for-review': number;
  missing: number;
};

export type { ApP0CardBatchCard };

type P0BatchSummary = {
  batchCount: number;
  cardCount: number;
  completedGates: number;
  reviewReadyGates: number;
  missingGates: number;
  totalGates: number;
  percentComplete: number;
  percentReviewReady: number;
};

type P0BatchPromotionRow = {
  batchName: string;
  facultyPacketPath: string;
  cardCount: number;
  gateCounts: P0GateCounts;
  totalGates: number;
  percentComplete: number;
  percentPromotable: number;
};

type P0GateBacklogRow = {
  label: string;
  complete: number;
  readyForReview: number;
  missing: number;
  total: number;
};

type P0BatchMetrics = {
  apP0CardBatchSummary: P0BatchSummary;
  apP0CardBatchReadiness: Omit<P0BatchSummary, 'batchCount' | 'cardCount'>;
  apP0BatchPromotionRows: P0BatchPromotionRow[];
  apP0GateBacklogRows: P0GateBacklogRow[];
};

type CompetencyMatrixBatchData = {
  apP0CardBatches: readonly ApP0CardBatch[];
  apP0CardBatchReadiness: P0BatchSummary;
  apP0CardBatchSummary: Omit<P0BatchSummary, 'percentComplete' | 'percentReviewReady'>;
  apP0BatchPromotionRows: P0BatchPromotionRow[];
  apP0GateBacklogRows: P0GateBacklogRow[];
  apP0LearningQualityStandards: CompetencyMatrixModule['apP0LearningQualityStandards'];
  apP0PromotionMilestones: CompetencyMatrixModule['apP0PromotionMilestones'];
  competencyDomains: CompetencyMatrixModule['competencyDomains'];
  competencyMatrixRecords: CompetencyMatrixModule['competencyMatrixRecords'];
  competencyMatrixSummary: CompetencyMatrixModule['competencyMatrixSummary'];
  apDesignationCrosswalk: CompetencyMatrixModule['apDesignationCrosswalk'];
  cpRotationStandards: CompetencyMatrixModule['cpRotationStandards'];
  learnerLevelLabels: CompetencyMatrixModule['learnerLevelLabels'];
  learnerLevelOrder: CompetencyMatrixModule['learnerLevelOrder'];
  levelModeGuidance: CompetencyMatrixModule['levelModeGuidance'];
  signOutRubric: CompetencyMatrixModule['signOutRubric'];
  sourceStandardDocuments: SourceStandardDocument[];
  apGapClosureQueue: ApGapClosureModule['apGapClosureQueue'];
};

export type CompetencyMatrixData = CompetencyMatrixBatchData;

const emptyGateCounts = () => ({
  complete: 0,
  'ready-for-review': 0,
  missing: 0,
});

const countGateStatuses = (cards: readonly ApP0CardBatchCard[]) =>
  cards.reduce((counts, card) => {
    card.gateStatuses.forEach((gate) => {
      counts[gate.status] += 1;
    });
    return counts;
  }, emptyGateCounts());

const buildP0BatchMetrics = (apP0CardBatches: readonly ApP0CardBatch[]): P0BatchMetrics => {
  const summary = {
    batchCount: 0,
    cardCount: 0,
    completedGates: 0,
    reviewReadyGates: 0,
    missingGates: 0,
    totalGates: 0,
  };

  const batchPromotionRows: P0BatchPromotionRow[] = [];
  const backlogMap = {} as Record<string, P0GateBacklogRow>;

  apP0CardBatches.forEach((batch) => {
    summary.batchCount += 1;
    summary.cardCount += batch.cards.length;

    const batchGateCounts = countGateStatuses(batch.cards);
    summary.completedGates += batchGateCounts.complete;
    summary.reviewReadyGates += batchGateCounts['ready-for-review'];
    summary.missingGates += batchGateCounts.missing;
    const totalGates = batchGateCounts.complete + batchGateCounts['ready-for-review'] + batchGateCounts.missing;
    summary.totalGates += totalGates;

    batchPromotionRows.push({
      batchName: batch.batchName,
      facultyPacketPath: batch.facultyPacketPath,
      cardCount: batch.cards.length,
      gateCounts: batchGateCounts,
      totalGates,
      percentComplete: totalGates ? Math.round((batchGateCounts.complete / totalGates) * 100) : 0,
      percentPromotable: totalGates
        ? Math.round(((batchGateCounts.complete + batchGateCounts['ready-for-review']) / totalGates) * 100)
        : 0,
    });

    batch.cards.forEach((card) => {
      card.gateStatuses.forEach((gate) => {
        backlogMap[gate.label] ||= {
          label: gate.label,
          complete: 0,
          readyForReview: 0,
          missing: 0,
          total: 0,
        };
        const row = backlogMap[gate.label];
        row.total += 1;
        if (gate.status === 'ready-for-review') {
          row.readyForReview += 1;
        } else {
          row[gate.status] += 1;
        }
      });
    });
  });

  const gateBacklogRows = Object.values(backlogMap).sort(
    (a, b) => b.missing - a.missing || b.readyForReview - a.readyForReview || a.label.localeCompare(b.label),
  );

  return {
    apP0CardBatchSummary: {
      ...summary,
      percentComplete: summary.totalGates ? Math.round((summary.completedGates / summary.totalGates) * 100) : 0,
      percentReviewReady: summary.totalGates
        ? Math.round(((summary.completedGates + summary.reviewReadyGates) / summary.totalGates) * 100)
        : 0,
    },
    apP0CardBatchReadiness: {
      ...summary,
      percentComplete: summary.totalGates ? Math.round((summary.completedGates / summary.totalGates) * 100) : 0,
      percentReviewReady: summary.totalGates
        ? Math.round(((summary.completedGates + summary.reviewReadyGates) / summary.totalGates) * 100)
        : 0,
    },
    apP0BatchPromotionRows: batchPromotionRows,
    apP0GateBacklogRows: gateBacklogRows,
  };
};

let competencyMatrixPayloadPromise: Promise<CompetencyMatrixData> | null = null;

export const prefetchCompetencyMatrixPayload = (): void => {
  void loadCompetencyMatrixPayload();
};

export const loadCompetencyMatrixPayload = async (): Promise<CompetencyMatrixData> => {
  if (!competencyMatrixPayloadPromise) {
    competencyMatrixPayloadPromise = (async () => {
      const [
        competencyModule,
        gapClosureModule,
        p0EntityBatch,
        p0CvAutopsyBatch,
        p0CvAutopsyBatch2,
        p0CvAutopsyBatch3,
        p0CvTaxonomyBatch,
        p0DermpathBatch,
        p0EndocrineBatch,
        p0EndocrineBatch2,
        p0GiBatch,
        p0BreastBatch,
        p0MaleReproBatch,
        p0PediatricBatch,
        p0SmallDomainsBatch,
      ] = await Promise.all([
        import('../content/competency/competencyMatrix.ts'),
        import('../content/competency/apGapClosureQueue.ts'),
        import('../content/competency/apP0EntityCardBatch.ts'),
        import('../content/competency/apP0CvAutopsyCardBatch.ts'),
        import('../content/competency/apP0CvAutopsyCardBatch2.ts'),
        import('../content/competency/apP0CvAutopsyCardBatch3.ts'),
        import('../content/competency/apP0CvTaxonomyReviewCardBatch.ts'),
        import('../content/competency/apP0DermpathCardBatch.ts'),
        import('../content/competency/apP0EndocrineCardBatch.ts'),
        import('../content/competency/apP0EndocrineCardBatch2.ts'),
        import('../content/competency/apP0GiCardBatch.ts'),
        import('../content/competency/apP0BreastCardBatch.ts'),
        import('../content/competency/apP0MaleReproCardBatch.ts'),
        import('../content/competency/apP0PediatricCardBatch.ts'),
        import('../content/competency/apP0SmallDomainsCardBatch.ts'),
      ]);

      const apP0CardBatches: readonly ApP0CardBatch[] = [
        p0EntityBatch.apP0EntityCardBatch,
        p0CvAutopsyBatch.apP0CvAutopsyCardBatch,
        p0CvAutopsyBatch2.apP0CvAutopsyCardBatch2,
        p0CvAutopsyBatch3.apP0CvAutopsyCardBatch3,
        p0CvTaxonomyBatch.apP0CvTaxonomyReviewCardBatch,
        p0DermpathBatch.apP0DermpathCardBatch,
        p0EndocrineBatch.apP0EndocrineCardBatch,
        p0EndocrineBatch2.apP0EndocrineCardBatch2,
        p0GiBatch.apP0GiCardBatch,
        p0BreastBatch.apP0BreastCardBatch,
        p0MaleReproBatch.apP0MaleReproCardBatch,
        p0PediatricBatch.apP0PediatricCardBatch,
        p0SmallDomainsBatch.apP0SmallDomainsCardBatch,
      ];

      const p0Metrics = buildP0BatchMetrics(apP0CardBatches);

      return {
        apP0CardBatches,
        apP0CardBatchReadiness: p0Metrics.apP0CardBatchReadiness,
        apP0CardBatchSummary: p0Metrics.apP0CardBatchSummary,
        apP0BatchPromotionRows: p0Metrics.apP0BatchPromotionRows,
        apP0GateBacklogRows: p0Metrics.apP0GateBacklogRows,
        apP0LearningQualityStandards: competencyModule.apP0LearningQualityStandards,
        apP0PromotionMilestones: competencyModule.apP0PromotionMilestones,
        competencyDomains: competencyModule.competencyDomains,
        competencyMatrixRecords: competencyModule.competencyMatrixRecords,
        competencyMatrixSummary: competencyModule.competencyMatrixSummary,
        apDesignationCrosswalk: competencyModule.apDesignationCrosswalk,
        cpRotationStandards: competencyModule.cpRotationStandards,
        learnerLevelLabels: competencyModule.learnerLevelLabels,
        learnerLevelOrder: competencyModule.learnerLevelOrder,
        levelModeGuidance: competencyModule.levelModeGuidance,
        signOutRubric: competencyModule.signOutRubric,
        sourceStandardDocuments: competencyModule.sourceStandardDocuments,
        apGapClosureQueue: gapClosureModule.apGapClosureQueue,
      };
    })();
  }

  return competencyMatrixPayloadPromise;
};

export const loadCompetencyMatrixPayloadForSection = async (section: Section): Promise<void> => {
  if (section === Section.COMPETENCY_MATRIX) {
    await loadCompetencyMatrixPayload();
  }
};
