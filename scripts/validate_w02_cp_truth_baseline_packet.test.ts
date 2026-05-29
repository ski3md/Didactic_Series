import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/w02_cp_truth_baseline_packet.json') as {
  tranche: string;
  baseline: {
    rawCrosswalkTutorialCount: number;
    rawCrosswalkMappedCount: number;
    manifestTotalRows: number;
    reviewedForPromotionRows: number;
    notYetReviewedRows: number;
    cpReviewedRows: number;
    cpGovernedTutorials: number;
    cpGovernedModules: number;
    sourceFingerprint: string;
  };
  reconciliationGap: {
    rawVsReviewedGap: number;
    currentNotReviewedIds: string[];
    cpGovernedExceptionCount: number;
    cpGovernedExceptionIds: string[];
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

describe('W02 CP truth baseline packet', () => {
  it('captures the T06 tranche identity and reviewed-mapping baseline gap', () => {
    expect(packet.tranche).toBe('T06 W02 CP Truth');
    expect(packet.baseline.rawCrosswalkTutorialCount).toBe(493);
    expect(packet.baseline.manifestTotalRows).toBe(493);
    expect(packet.baseline.reviewedForPromotionRows).toBe(487);
    expect(packet.baseline.notYetReviewedRows).toBe(6);
    expect(packet.baseline.cpReviewedRows).toBe(285);
    expect(packet.baseline.cpGovernedTutorials).toBe(13);
    expect(packet.baseline.cpGovernedModules).toBe(7);
    expect(packet.reconciliationGap.rawVsReviewedGap).toBe(6);
    expect(packet.reconciliationGap.currentNotReviewedIds).toHaveLength(6);
    expect(packet.reconciliationGap.cpGovernedExceptionCount).toBe(13);
  });

  it('keeps the proof bundle and baseline gate aligned to the opened tranche', () => {
    expect(packet.execution.completedStepIds).toEqual([
      'W02-L1_CP_TRUTH-C01',
      'W02-L1_CP_TRUTH-C02',
      'W02-L1_CP_TRUTH-C03',
      'W02-L1_CP_TRUTH-C04',
      'W02-L1_CP_TRUTH-C05',
    ]);
    expect(packet.execution.proofCommands).toEqual([
      'npm run cp:precision:validate',
      'node scripts/validate_validated_mappings_manifest.cjs',
      'npx vitest run scripts/validate_w02_cp_truth_baseline_packet.test.ts scripts/validate_w02_cp_truth_duplicate_shadow_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ]);
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
