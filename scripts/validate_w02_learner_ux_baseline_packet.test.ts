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
    learnerPathClarity: string[];
    plainWordingGuard: string;
    uxRules: Record<string, boolean>;
    focusedUxChecks: Record<string, boolean>;
    targetedTestCoverage: string[];
    reusableStartHereOutput: {
      name: string;
      routeUse: string;
      ownedSurfaces: string[];
      publicSafe: boolean;
    };
    driftIsolation: {
      nextWordingRisk: string;
      containment: string;
      nextTrancheGuard: string;
    };
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
    expect(packet.baseline.learnerPathClarity).toHaveLength(4);
    expect(packet.baseline.learnerPathClarity.join(' ')).toContain('operational studio');
    expect(packet.baseline.plainWordingGuard).toContain('must not alter CP source-link normalization');
    expect(Object.values(packet.baseline.uxRules).every(Boolean)).toBe(true);
    expect(Object.values(packet.baseline.focusedUxChecks).every(Boolean)).toBe(true);
    expect(packet.baseline.targetedTestCoverage).toHaveLength(3);
    expect(packet.baseline.targetedTestCoverage.join(' ')).toContain('PathologyCurriculum.test.tsx');
    expect(packet.baseline.reusableStartHereOutput.name).toBe('W02 source-linked CP learner start-here guide');
    expect(packet.baseline.reusableStartHereOutput.routeUse).toContain('linked CP tutorial or operational studio');
    expect(packet.baseline.reusableStartHereOutput.ownedSurfaces).toHaveLength(4);
    expect(packet.baseline.reusableStartHereOutput.publicSafe).toBe(true);
    expect(packet.baseline.driftIsolation.nextWordingRisk).toContain('hide the reviewed source-link guard');
    expect(packet.baseline.driftIsolation.nextTrancheGuard).toContain('T09 Workups and Routing');
  });

  it('keeps T08 scoped to baseline work until UI wording changes land', () => {
    expect(packet.execution.completedStepIds).toEqual([
      'W02-L3_LEARNER_UX-C01',
      'W02-L3_LEARNER_UX-C02',
      'W02-L3_LEARNER_UX-C03',
      'W02-L3_LEARNER_UX-C04',
      'W02-L3_LEARNER_UX-C05',
      'W02-L3_LEARNER_UX-C06',
      'W02-L3_LEARNER_UX-C07',
      'W02-L3_LEARNER_UX-C08',
      'W02-L3_LEARNER_UX-C09',
      'W02-L3_LEARNER_UX-C10',
    ]);
    expect(packet.execution.remainingStepIds).toHaveLength(0);
    expect(packet.execution.proofCommands).toContain('npm run didactics:ux:validate');
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
