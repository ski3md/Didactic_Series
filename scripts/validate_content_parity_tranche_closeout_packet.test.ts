import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const packet = require('../reports/content_parity_tranche_closeout_packet.json') as {
  tranche: string;
  baseline: {
    totalModules: number;
    canonicalModules: number;
    stagedModules: number;
    clinicalPathCanonicalModules: number;
    clinicalPathStagedModules: number;
    clinicalPathTutorials: number;
    clinicalPathInteractiveAssets: number;
    clinicalPathRootTopics: number;
  };
  parity: {
    visibleClusterCount: number;
    normalizedSourceLinkGroups: number;
    parityRisks: string[];
    nextParityMoves: string[];
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

describe('content parity tranche closeout packet', () => {
  it('captures the T02 tranche identity and frozen baseline counts', () => {
    expect(packet.tranche).toBe('T02 W01 Content Parity');
    expect(packet.baseline.totalModules).toBe(26);
    expect(packet.baseline.canonicalModules).toBe(15);
    expect(packet.baseline.stagedModules).toBe(11);
    expect(packet.baseline.clinicalPathCanonicalModules).toBe(7);
    expect(packet.baseline.clinicalPathStagedModules).toBe(0);
    expect(packet.baseline.clinicalPathTutorials).toBe(13);
    expect(packet.baseline.clinicalPathInteractiveAssets).toBe(16);
    expect(packet.baseline.clinicalPathRootTopics).toBe(6);
  });

  it('keeps the parity map and completion gate aligned to the closed tranche', () => {
    expect(packet.parity.visibleClusterCount).toBe(7);
    expect(packet.parity.normalizedSourceLinkGroups).toBe(4);
    expect(packet.execution.completedStepIds).toHaveLength(10);
    expect(packet.execution.proofCommands).toEqual([
      'npm run cp:precision:validate',
      'npm run test -- src/utils/tutorialLibraryCatalog.test.ts',
      'npx vitest run scripts/validate_content_parity_tranche_closeout_packet.test.ts',
      'git diff --check',
    ]);
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
