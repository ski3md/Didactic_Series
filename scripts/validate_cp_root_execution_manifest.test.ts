import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const manifest = require('../reports/cp_root_execution_manifest.json') as {
  truthBaseline: {
    sourceFingerprint: string;
    cpGovernedTutorials: number;
    cpGovernedModules: number;
    validatedTutorials: number;
    governancePendingTutorials: number;
  };
  executionView: {
    rootCount: number;
    topPriorityRoot: string;
    proofCommands: string[];
  };
  staleWhen: string[];
};

describe('cp root execution manifest', () => {
  it('captures the current baseline fingerprint and execution view', () => {
    expect(manifest.truthBaseline.sourceFingerprint).toBe(
      'c1d6ff9c18b2ac0d5d6b7fef5010d47090c304968213f4d64d339fc55d65bf18',
    );
    expect(manifest.truthBaseline.cpGovernedTutorials).toBe(13);
    expect(manifest.truthBaseline.cpGovernedModules).toBe(7);
    expect(manifest.truthBaseline.validatedTutorials).toBe(487);
    expect(manifest.truthBaseline.governancePendingTutorials).toBe(0);
    expect(manifest.executionView.rootCount).toBe(6);
    expect(manifest.executionView.topPriorityRoot).toBe('Management and Informatics');
  });

  it('keeps the expected stale-detection rules and proof commands', () => {
    expect(manifest.executionView.proofCommands).toEqual([
      'npm run cp:precision:validate',
      'npx vitest run scripts/validate_cp_truth_baseline_outputs.test.ts',
      'git diff --check',
    ]);
    expect(manifest.staleWhen).toHaveLength(3);
  });
});
