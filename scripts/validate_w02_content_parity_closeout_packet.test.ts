import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const packet = require('../reports/w02_content_parity_closeout_packet.json') as {
  tranche: string;
  status: string;
  statusBasis: string;
  completedStepIds: string[];
  remainingStepIds: string[];
  reusableOutput: {
    artifact: string;
    publicSafe: boolean;
    summary: string;
  };
  driftIsolation: {
    sourceTruthLocked: boolean;
    noSourceTruthEditsInsideT07: boolean;
    allVisibleClustersHaveSourceLinks: boolean;
    preserveSixRootsSevenClusters: boolean;
    remainingDriftRisk: string;
  };
  proofBundle: {
    baselineGreen: boolean;
    focusedProofChecksGreen: boolean;
    visibleClusterCount: number;
    sourceLinkNormalizationGroups: number;
    missingSourceLinkGroups: number;
    cpRootCount: number;
    cpDomainValidatedRows: number;
  };
  handoffToNextTranche: {
    nextTranche: string;
    requiredGuard: string;
  };
  completionGate: {
    t07Closed: boolean;
    staleWhen: string[];
  };
};

describe('W02 content parity closeout packet', () => {
  it('closes T07 with all ten content-parity records', () => {
    expect(packet.tranche).toBe('T07 W02 Content Parity');
    expect(packet.status).toBe('completed');
    expect(packet.statusBasis).toBe('exact_proof_bundle');
    expect(packet.completedStepIds).toEqual([
      'W02-L2_CONTENT_PARITY-C01',
      'W02-L2_CONTENT_PARITY-C02',
      'W02-L2_CONTENT_PARITY-C03',
      'W02-L2_CONTENT_PARITY-C04',
      'W02-L2_CONTENT_PARITY-C05',
      'W02-L2_CONTENT_PARITY-C06',
      'W02-L2_CONTENT_PARITY-C07',
      'W02-L2_CONTENT_PARITY-C08',
      'W02-L2_CONTENT_PARITY-C09',
      'W02-L2_CONTENT_PARITY-C10',
    ]);
    expect(packet.remainingStepIds).toHaveLength(0);
  });

  it('packages a reusable source-link overlay without reopening CP truth', () => {
    expect(packet.reusableOutput.artifact).toBe('reports/w02_content_parity_baseline_packet.json');
    expect(packet.reusableOutput.publicSafe).toBe(true);
    expect(packet.reusableOutput.summary).toContain('seven learner-facing CP clusters');
    expect(packet.driftIsolation.sourceTruthLocked).toBe(true);
    expect(packet.driftIsolation.noSourceTruthEditsInsideT07).toBe(true);
    expect(packet.driftIsolation.allVisibleClustersHaveSourceLinks).toBe(true);
    expect(packet.driftIsolation.preserveSixRootsSevenClusters).toBe(true);
    expect(packet.driftIsolation.remainingDriftRisk).toContain('T08 learner-UX work');
  });

  it('hands off to T08 only after the proof bundle is green', () => {
    expect(packet.proofBundle.baselineGreen).toBe(true);
    expect(packet.proofBundle.focusedProofChecksGreen).toBe(true);
    expect(packet.proofBundle.visibleClusterCount).toBe(7);
    expect(packet.proofBundle.sourceLinkNormalizationGroups).toBe(7);
    expect(packet.proofBundle.missingSourceLinkGroups).toBe(0);
    expect(packet.proofBundle.cpRootCount).toBe(6);
    expect(packet.proofBundle.cpDomainValidatedRows).toBe(285);
    expect(packet.handoffToNextTranche.nextTranche).toBe('T08 W02 Learner UX');
    expect(packet.handoffToNextTranche.requiredGuard).toContain('Do not alter CP source-link normalization');
    expect(packet.completionGate.t07Closed).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
