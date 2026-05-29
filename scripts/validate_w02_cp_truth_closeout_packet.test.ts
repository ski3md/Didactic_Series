import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/w02_cp_truth_closeout_packet.json') as {
  tranche: string;
  status: string;
  statusBasis: string;
  completedStepIds: string[];
  remainingStepIds: string[];
  proofBundle: {
    baselineGreen: boolean;
    duplicateShadowQueueUnderstood: boolean;
    targetedMappingCoverageGreen: boolean;
    sourceMapReviewCount: number;
    cpDomainValidatedRows: number;
    cpRootCount: number;
  };
  handoffToNextTranche: {
    nextTranche: string;
    requiredGuard: string;
  };
  completionGate: {
    t06Closed: boolean;
    staleWhen: string[];
  };
};

describe('W02 CP truth closeout packet', () => {
  it('closes T06 with all ten W02 CP truth steps and no remaining steps', () => {
    expect(packet.tranche).toBe('T06 W02 CP Truth');
    expect(packet.status).toBe('completed');
    expect(packet.statusBasis).toBe('exact_proof_bundle');
    expect(packet.completedStepIds).toEqual([
      'W02-L1_CP_TRUTH-C01',
      'W02-L1_CP_TRUTH-C02',
      'W02-L1_CP_TRUTH-C03',
      'W02-L1_CP_TRUTH-C04',
      'W02-L1_CP_TRUTH-C05',
      'W02-L1_CP_TRUTH-C06',
      'W02-L1_CP_TRUTH-C07',
      'W02-L1_CP_TRUTH-C08',
      'W02-L1_CP_TRUTH-C09',
      'W02-L1_CP_TRUTH-C10',
    ]);
    expect(packet.remainingStepIds).toEqual([]);
  });

  it('hands off a green W02 CP truth bundle to T07 content parity', () => {
    expect(packet.proofBundle).toEqual({
      baselineGreen: true,
      duplicateShadowQueueUnderstood: true,
      targetedMappingCoverageGreen: true,
      sourceMapReviewCount: 0,
      cpDomainValidatedRows: 285,
      cpRootCount: 6,
    });
    expect(packet.handoffToNextTranche.nextTranche).toBe('T07 W02 Content Parity');
    expect(packet.handoffToNextTranche.requiredGuard).toContain('Do not change source-truth mappings inside T07');
    expect(packet.completionGate.t06Closed).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
