import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/workups_routing_tranche_closeout_packet.json') as {
  tranche: string;
  validator: {
    passCount: number;
    failureCount: number;
    workupPassCount: number;
  };
  routingBaseline: {
    totalAlgorithms: number;
    clinicalPathAlgorithms: number;
    distinctCategories: number;
    clinicalPathPatternFamilies: number;
    firstClinicalPathPatternFamily: string | null;
  };
  routingSignals: {
    navigatorConsumesIntent: boolean;
    navigatorPushesTopicAndSubtopicDestinations: boolean;
    navigatorWritesState: boolean;
    navigatorRehydratesPopstate: boolean;
    navigatorUsesStudyDestinationEvents: boolean;
    catalogExposesClinicalPathRouteFamilies: boolean;
    navigationPersistsLaunchContext: boolean;
  };
  browserCheckpoint: {
    route: string;
    expectedVisibleText: string[];
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

describe('workups and routing tranche closeout packet', () => {
  it('captures the T04 tranche identity and workup routing baseline', () => {
    expect(packet.tranche).toBe('T04 W01 Workups and Routing');
    expect(packet.validator.passCount).toBeGreaterThan(100);
    expect(packet.validator.failureCount).toBe(0);
    expect(packet.validator.workupPassCount).toBeGreaterThanOrEqual(14);

    expect(packet.routingBaseline).toEqual({
      totalAlgorithms: 14,
      clinicalPathAlgorithms: 12,
      distinctCategories: 3,
      clinicalPathPatternFamilies: 12,
      firstClinicalPathPatternFamily: 'QC Failure Response',
    });

    expect(packet.routingSignals).toEqual({
      navigatorConsumesIntent: true,
      navigatorPushesTopicAndSubtopicDestinations: true,
      navigatorWritesState: true,
      navigatorRehydratesPopstate: true,
      navigatorUsesStudyDestinationEvents: true,
      catalogExposesClinicalPathRouteFamilies: true,
      navigationPersistsLaunchContext: true,
    });

    expect(packet.browserCheckpoint.route).toBe('http://127.0.0.1:4179/Didactic_Series/didactics/?workspace=algorithms');
    expect(packet.browserCheckpoint.expectedVisibleText).toEqual([
      'Clinical Pathology',
      'QC Failure Response',
      'Validation vs Verification',
    ]);
  });

  it('keeps the proof bundle and completion gate aligned to the closed tranche', () => {
    expect(packet.execution.completedStepIds).toHaveLength(10);
    expect(packet.execution.proofCommands).toEqual([
      'npm run didactics:ux:validate',
      'npm run test -- src/utils/algorithmCatalog.test.ts',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts scripts/validate_workups_routing_tranche_closeout_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ]);
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
