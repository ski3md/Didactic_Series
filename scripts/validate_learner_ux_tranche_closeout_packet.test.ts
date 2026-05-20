import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/learner_ux_tranche_closeout_packet.json') as {
  tranche: string;
  validator: {
    passCount: number;
    failureCount: number;
    referencePassCount: number;
  };
  learnerFlow: {
    home: {
      masterclassStartHereCount: number;
      hasSecondaryRoutes: boolean;
      hasClinicalPathTutorialRoute: boolean;
    };
    referenceLibrary: {
      hasStartHere: boolean;
      hasReviewChoiceTitle: boolean;
      opensWithStudyFraming: boolean;
      guidanceOrderIsStable: boolean;
    };
    competencyMatrix: {
      hasLearnerFocus: boolean;
      referenceButtonCount: number;
      hasReferenceGuideTitle: boolean;
      filterPrompts: {
        search: boolean;
        domain: boolean;
        readyNowOnly: boolean;
      };
    };
  };
  execution: {
    completedStepIds: string[];
    proofCommands: string[];
  };
  completionGate: {
    baselineGreen: boolean;
    staleWhen: string[];
  };
};

describe('learner UX tranche closeout packet', () => {
  it('captures the T03 tranche identity and owned-surface learner signals', () => {
    expect(packet.tranche).toBe('T03 W01 Learner UX');
    expect(packet.validator.passCount).toBeGreaterThan(100);
    expect(packet.validator.failureCount).toBe(0);
    expect(packet.validator.referencePassCount).toBeGreaterThanOrEqual(6);

    expect(packet.learnerFlow.home).toEqual({
      masterclassStartHereCount: 1,
      hasSecondaryRoutes: true,
      hasClinicalPathTutorialRoute: true,
    });

    expect(packet.learnerFlow.referenceLibrary).toEqual({
      hasStartHere: true,
      hasReviewChoiceTitle: true,
      opensWithStudyFraming: true,
      guidanceOrderIsStable: true,
    });

    expect(packet.learnerFlow.competencyMatrix.hasLearnerFocus).toBe(true);
    expect(packet.learnerFlow.competencyMatrix.referenceButtonCount).toBe(2);
    expect(packet.learnerFlow.competencyMatrix.hasReferenceGuideTitle).toBe(true);
    expect(packet.learnerFlow.competencyMatrix.filterPrompts).toEqual({
      search: true,
      domain: true,
      readyNowOnly: true,
    });
  });

  it('keeps the proof bundle and completion gate aligned to the closed tranche', () => {
    expect(packet.execution.completedStepIds).toHaveLength(10);
    expect(packet.execution.proofCommands).toEqual([
      'npm run didactics:ux:validate',
      'npm run test -- src/components/Home.test.tsx',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts scripts/validate_learner_ux_tranche_closeout_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ]);
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
