import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const packet = require('../reports/w02_learner_ux_baseline_packet.json') as {
  tranche: string;
  status: string;
  authority: {
    t07Closed: boolean;
    t07NextTranche: string;
    t07Guard: string;
    sourceLinkNormalizationGroups: number;
    visibleClusterCount: number;
    cpRootCount: number;
  };
  baseline: {
    contractVersion: string;
    passCount: number;
    failureCount: number;
    ownedSurfaces: string[];
    learnerUxFocus: string;
  };
  execution: {
    completedStepIds: string[];
    remainingStepIds: string[];
    proofCommands: string[];
  };
  completionGate: {
    baselineGreen: boolean;
    staleWhen: string[];
  };
};

describe('W02 learner UX baseline packet', () => {
  it('opens T08 from the closed T07 content-parity handoff', () => {
    expect(packet.tranche).toBe('T08 W02 Learner UX');
    expect(packet.status).toBe('in_progress');
    expect(packet.authority.t07Closed).toBe(true);
    expect(packet.authority.t07NextTranche).toBe('T08 W02 Learner UX');
    expect(packet.authority.t07Guard).toContain('Do not alter CP source-link normalization');
    expect(packet.authority.visibleClusterCount).toBe(7);
    expect(packet.authority.sourceLinkNormalizationGroups).toBe(7);
    expect(packet.authority.cpRootCount).toBe(6);
  });

  it('freezes the learner-UX proof baseline and owned surfaces', () => {
    expect(packet.baseline.contractVersion).toBe('pthfndr-didactics-learning-ux-contract.v1');
    expect(packet.baseline.passCount).toBeGreaterThan(100);
    expect(packet.baseline.failureCount).toBe(0);
    expect(packet.baseline.ownedSurfaces).toEqual([
      'src/components/Home.tsx',
      'src/components/PathologyCurriculum.tsx',
      'src/components/ReferenceLibrary.tsx',
      'src/components/CompetencyMatrix.tsx',
    ]);
    expect(packet.baseline.learnerUxFocus).toContain('preserving the T07 source-link map');
  });

  it('keeps T08 scoped to baseline work until UI wording changes land', () => {
    expect(packet.execution.completedStepIds).toEqual(['W02-L3_LEARNER_UX-C01']);
    expect(packet.execution.remainingStepIds).toHaveLength(9);
    expect(packet.execution.proofCommands).toContain('npm run didactics:ux:validate');
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
