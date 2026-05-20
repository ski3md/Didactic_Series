import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/cp_truth_tranche_closeout_packet.json') as {
  tranche: string;
  baseline: {
    cpGovernedTutorials: number;
    cpGovernedModules: number;
    validatedTutorials: number;
    governancePendingTutorials: number;
    sourceFingerprint: string;
  };
  queue: {
    total: number;
    reviewerActionRequired: number;
    promoteUnderGovernedAnchor: number;
    rootsRepresented: number;
  };
  execution: {
    topPriorityRoot: string;
    proofCommands: string[];
    sourceFingerprint: string;
  };
  completionGate: {
    baselineGreen: boolean;
    staleWhen: string[];
  };
};

describe('cp truth tranche closeout packet', () => {
  it('captures the current tranche identity and baseline counts', () => {
    expect(packet.tranche).toBe('T01 W01 CP Truth');
    expect(packet.baseline.cpGovernedTutorials).toBe(13);
    expect(packet.baseline.cpGovernedModules).toBe(7);
    expect(packet.baseline.validatedTutorials).toBe(487);
    expect(packet.baseline.governancePendingTutorials).toBe(0);
    expect(packet.queue.total).toBe(13);
    expect(packet.queue.reviewerActionRequired).toBe(8);
    expect(packet.queue.promoteUnderGovernedAnchor).toBe(5);
    expect(packet.queue.rootsRepresented).toBe(6);
  });

  it('keeps the current execution and stale-detection posture', () => {
    expect(packet.execution.topPriorityRoot).toBe('Management and Informatics');
    expect(packet.execution.proofCommands).toEqual([
      'npm run cp:precision:validate',
      'npx vitest run scripts/validate_cp_truth_baseline_outputs.test.ts',
      'git diff --check',
    ]);
    expect(packet.execution.sourceFingerprint).toBe(packet.baseline.sourceFingerprint);
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
