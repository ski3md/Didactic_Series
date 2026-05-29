import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const packet = require('../reports/w02_learner_ux_closeout_packet.json') as {
  tranche: string;
  status: string;
  statusBasis: string;
  completedStepIds: string[];
  remainingStepIds: string[];
  reusableOutput: {
    name: string;
    routeUse: string;
    publicSafe: boolean;
    ownedSurfaces: string[];
  };
  driftIsolation: {
    nextWordingRisk: string;
    containment: string;
    nextTrancheGuard: string;
  };
  proofBundle: {
    baselineGreen: boolean;
    didacticsUxFailures: number;
    focusedUxChecksGreen: boolean;
    uxRulesGreen: boolean;
    targetedTestCoverageCount: number;
    sourceLinkNormalizationGroups: number;
    visibleClusterCount: number;
    cpRootCount: number;
  };
  handoffToNextTranche: {
    nextTranche: string;
    requiredGuard: string;
  };
  completionGate: {
    t08Closed: boolean;
    staleWhen: string[];
  };
};

describe('W02 learner UX closeout packet', () => {
  it('closes T08 with all ten learner-UX records', () => {
    expect(packet.tranche).toBe('T08 W02 Learner UX');
    expect(packet.status).toBe('completed');
    expect(packet.statusBasis).toBe('exact_proof_bundle');
    expect(packet.completedStepIds).toEqual([
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
    expect(packet.remainingStepIds).toHaveLength(0);
  });

  it('packages a reusable start-here output and drift guard', () => {
    expect(packet.reusableOutput.name).toBe('W02 source-linked CP learner start-here guide');
    expect(packet.reusableOutput.routeUse).toContain('linked CP tutorial or operational studio');
    expect(packet.reusableOutput.publicSafe).toBe(true);
    expect(packet.reusableOutput.ownedSurfaces).toHaveLength(4);
    expect(packet.driftIsolation.nextWordingRisk).toContain('reviewed source-link guard');
    expect(packet.driftIsolation.nextTrancheGuard).toContain('T09 Workups and Routing');
  });

  it('hands off to T09 only after learner-UX proof is green', () => {
    expect(packet.proofBundle.baselineGreen).toBe(true);
    expect(packet.proofBundle.didacticsUxFailures).toBe(0);
    expect(packet.proofBundle.focusedUxChecksGreen).toBe(true);
    expect(packet.proofBundle.uxRulesGreen).toBe(true);
    expect(packet.proofBundle.targetedTestCoverageCount).toBe(3);
    expect(packet.proofBundle.sourceLinkNormalizationGroups).toBe(7);
    expect(packet.proofBundle.visibleClusterCount).toBe(7);
    expect(packet.proofBundle.cpRootCount).toBe(6);
    expect(packet.handoffToNextTranche.nextTranche).toBe('T09 W02 Workups and Routing');
    expect(packet.handoffToNextTranche.requiredGuard).toContain('Do not alter CP source-link normalization');
    expect(packet.completionGate.t08Closed).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
