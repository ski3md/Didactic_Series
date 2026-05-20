import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const summary = require('../reports/cp_root_priority_summary.json') as {
  summary: {
    rootCount: number;
    totalReviewerActionRequired: number;
    totalPromoteUnderGovernedAnchor: number;
  };
  rankedRoots: Array<{
    root: string;
    reviewerActionCount: number;
    promoteCount: number;
    totalCount: number;
  }>;
};

describe('cp root priority summary', () => {
  it('captures the current root-level queue totals', () => {
    expect(summary.summary.rootCount).toBe(6);
    expect(summary.summary.totalReviewerActionRequired).toBe(8);
    expect(summary.summary.totalPromoteUnderGovernedAnchor).toBe(5);
  });

  it('ranks roots by reviewer-action count first', () => {
    expect(summary.rankedRoots[0]).toMatchObject({
      root: 'Management and Informatics',
      reviewerActionCount: 3,
      promoteCount: 0,
      totalCount: 3,
    });
    expect(summary.rankedRoots[1]).toMatchObject({
      root: 'Hematopathology for Clinical Pathology',
      reviewerActionCount: 1,
      promoteCount: 3,
      totalCount: 4,
    });
    expect(summary.rankedRoots[2]).toMatchObject({
      root: 'Medical Microbiology',
      reviewerActionCount: 1,
      promoteCount: 2,
      totalCount: 3,
    });
  });
});
