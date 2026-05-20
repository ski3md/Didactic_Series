import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/contracts_proof_tranche_closeout_packet.json') as {
  tranche: string;
  validator: {
    passCount: number;
    failureCount: number;
    contractPassCount: number;
  };
  contractBaseline: {
    learningUxMarkdownHasWorkupsException: boolean;
    learningUxJsonHasGovernedWorkupsException: boolean;
    codexAlignmentHasAutonomousExecutionRule: boolean;
    codexAlignmentHasAutomationRule: boolean;
    codexAlignmentHasOpenClawRule: boolean;
    validatorChecksContractAlignment: boolean;
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

describe('contracts and proof tranche closeout packet', () => {
  it('captures the T05 tranche identity and contract-alignment baseline', () => {
    expect(packet.tranche).toBe('T05 W01 Contracts and Proof');
    expect(packet.validator.passCount).toBeGreaterThan(100);
    expect(packet.validator.failureCount).toBe(0);
    expect(packet.validator.contractPassCount).toBeGreaterThanOrEqual(7);

    expect(packet.contractBaseline).toEqual({
      learningUxMarkdownHasWorkupsException: true,
      learningUxJsonHasGovernedWorkupsException: true,
      codexAlignmentHasAutonomousExecutionRule: true,
      codexAlignmentHasAutomationRule: true,
      codexAlignmentHasOpenClawRule: true,
      validatorChecksContractAlignment: true,
    });
  });

  it('keeps the proof bundle and completion gate aligned to the closed tranche', () => {
    expect(packet.execution.completedStepIds).toHaveLength(10);
    expect(packet.execution.proofCommands).toEqual([
      'npm run didactics:ux:validate',
      'npm run resource:contracts:validate',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts scripts/validate_contracts_proof_tranche_closeout_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ]);
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
