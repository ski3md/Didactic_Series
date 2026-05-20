import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const handoff = require('../reports/cp_truth_handoff_summary.json') as {
  baseline: {
    cpGovernedTutorials: number;
    cpGovernedModules: number;
    validatedTutorials: number;
    governancePendingTutorials: number;
    sourceFingerprint: string;
  };
  governedExceptionQueue: {
    total: number;
    byPrecisionMode: Record<string, number>;
    promoteUnderGovernedAnchor: string[];
    reviewerActionRequired: string[];
  };
  currentStatus: {
    baselineGreen: boolean;
    tranche: string;
    nextReviewSurface: string;
  };
};

describe('cp truth handoff summary', () => {
  it('captures the current CP truth baseline and queue counts', () => {
    expect(handoff.baseline.cpGovernedTutorials).toBe(13);
    expect(handoff.baseline.cpGovernedModules).toBe(7);
    expect(handoff.baseline.validatedTutorials).toBe(487);
    expect(handoff.baseline.governancePendingTutorials).toBe(0);
    expect(handoff.governedExceptionQueue.total).toBe(13);
    expect(handoff.governedExceptionQueue.byPrecisionMode).toEqual({
      'cross-domain-governed': 2,
      'nearest-valid-deep': 11,
    });
  });

  it('keeps the current actionable split and handoff posture', () => {
    expect(handoff.governedExceptionQueue.promoteUnderGovernedAnchor).toHaveLength(5);
    expect(handoff.governedExceptionQueue.reviewerActionRequired).toHaveLength(8);
    expect(handoff.currentStatus.baselineGreen).toBe(true);
    expect(handoff.currentStatus.tranche).toBe('T01 W01 CP Truth');
    expect(handoff.currentStatus.nextReviewSurface).toBe('reports/cp_governed_exception_reviewer_packet.md');
    expect(handoff.baseline.sourceFingerprint.length).toBeGreaterThan(0);
  });
});
