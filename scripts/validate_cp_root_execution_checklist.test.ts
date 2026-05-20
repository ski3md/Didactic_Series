import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const checklist = require('../reports/cp_root_execution_checklist.json') as {
  summary: {
    rootCount: number;
    topPriorityRoot: string;
    proofCommands: string[];
  };
  checklist: Array<{
    rank: number;
    root: string;
    reviewerActionCount: number;
    promoteCount: number;
    nextMoves: string[];
    proofCommands: string[];
  }>;
};

describe('cp root execution checklist', () => {
  it('captures the current ranked root queue and shared proof commands', () => {
    expect(checklist.summary.rootCount).toBe(6);
    expect(checklist.summary.topPriorityRoot).toBe('Management and Informatics');
    expect(checklist.summary.proofCommands).toEqual([
      'npm run cp:precision:validate',
      'npx vitest run scripts/validate_cp_truth_baseline_outputs.test.ts',
      'git diff --check',
    ]);
  });

  it('keeps deterministic next moves for the top roots', () => {
    expect(checklist.checklist[0]).toMatchObject({
      rank: 1,
      root: 'Management and Informatics',
      reviewerActionCount: 3,
      promoteCount: 0,
      nextMoves: ['Complete CP governance review for Management and Informatics.'],
    });
    expect(checklist.checklist[1]).toMatchObject({
      rank: 2,
      root: 'Hematopathology for Clinical Pathology',
      reviewerActionCount: 1,
      promoteCount: 3,
      nextMoves: [
        'Complete CP governance review for Hematopathology for Clinical Pathology.',
        'Promote governed-ready Hematopathology for Clinical Pathology tutorials under the current CP anchor.',
      ],
    });
  });
});
