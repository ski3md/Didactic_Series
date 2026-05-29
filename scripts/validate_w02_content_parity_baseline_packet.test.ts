import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const packet = require('../reports/w02_content_parity_baseline_packet.json') as {
  tranche: string;
  status: string;
  authority: {
    t06Closed: boolean;
    t06NextTranche: string;
    t06Guard: string;
  };
  baseline: {
    contentBaselineWave: string;
    contentBaselineTranche: string;
    currentWave: string;
    clinicalPathCanonicalModules: number;
    clinicalPathStagedModules: number;
    clinicalPathInteractiveTutorials: number;
    clinicalPathInteractiveAssets: number;
    clinicalPathRootTopics: number;
  };
  truthAlignment: {
    cpDomainValidatedRows: number;
    cpRootCount: number;
    canonicalCpManifestRows: number;
    unmappedValidatedCpRows: number;
    missingReviewOwnerRows: number;
    cpRoots: string[];
  };
  contentParityOverlay: {
    visibleClusterCount: number;
    sourceLinkNormalizationGroups: number;
    missingSourceLinkGroups: string[];
    unresolvedW02ContentGaps: string[];
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

describe('W02 content parity baseline packet', () => {
  it('opens T07 from the closed T06 CP truth handoff without mutating source truth', () => {
    expect(packet.tranche).toBe('T07 W02 Content Parity');
    expect(packet.status).toBe('in_progress');
    expect(packet.authority.t06Closed).toBe(true);
    expect(packet.authority.t06NextTranche).toBe('T07 W02 Content Parity');
    expect(packet.authority.t06Guard).toContain('Do not change source-truth mappings inside T07');
  });

  it('freezes the W02 content baseline against the reviewed CP truth bundle', () => {
    expect(packet.baseline.contentBaselineWave).toBe('W02');
    expect(packet.baseline.contentBaselineTranche).toBe('T07');
    expect(packet.baseline.currentWave).toBe('W02');
    expect(packet.baseline.clinicalPathCanonicalModules).toBe(7);
    expect(packet.baseline.clinicalPathStagedModules).toBe(0);
    expect(packet.baseline.clinicalPathInteractiveTutorials).toBe(13);
    expect(packet.baseline.clinicalPathInteractiveAssets).toBe(16);
    expect(packet.baseline.clinicalPathRootTopics).toBe(6);
    expect(packet.truthAlignment.cpDomainValidatedRows).toBe(285);
    expect(packet.truthAlignment.cpRootCount).toBe(6);
    expect(packet.truthAlignment.canonicalCpManifestRows).toBe(285);
    expect(packet.truthAlignment.unmappedValidatedCpRows).toBe(0);
    expect(packet.truthAlignment.missingReviewOwnerRows).toBe(0);
    expect(packet.truthAlignment.cpRoots).toContain('Management and Informatics');
  });

  it('keeps T07 scoped to a baseline packet until learner-facing parity changes land', () => {
    expect(packet.contentParityOverlay.visibleClusterCount).toBe(7);
    expect(packet.contentParityOverlay.sourceLinkNormalizationGroups).toBe(7);
    expect(packet.contentParityOverlay.missingSourceLinkGroups).toHaveLength(0);
    expect(packet.contentParityOverlay.unresolvedW02ContentGaps).toHaveLength(2);
    expect(packet.execution.completedStepIds).toEqual([
      'W02-L2_CONTENT_PARITY-C01',
      'W02-L2_CONTENT_PARITY-C02',
      'W02-L2_CONTENT_PARITY-C03',
    ]);
    expect(packet.execution.remainingStepIds).toHaveLength(7);
    expect(packet.execution.proofCommands).toContain('npm run test -- src/utils/tutorialLibraryCatalog.test.ts');
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
