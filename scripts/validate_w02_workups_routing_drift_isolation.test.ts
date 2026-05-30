import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const packet = require('../reports/w02_workups_routing_drift_isolation.json') as {
  tranche: string;
  stepId: string;
  status: string;
  baselineAuthority: {
    sourceLinkNormalizationGroups: number;
    visibleClusterCount: number;
    cpRootCount: number;
    unsupportedRouteGuard: string;
    workupsRuleLocked: boolean;
  };
  guardrails: {
    doNotTouch: string[];
    unsupportedCpTopicsMustNotRouteHeuristically: boolean;
    workupsLabelCannotBecomeGenericCta: boolean;
    cpSourceLinkAndRootCountsRemainUntouched: boolean;
    sourceTruthMappingsRemainReadOnly: boolean;
  };
  riskRegister: Array<{
    id: string;
    title: string;
    driftSignal: string;
    isolationRule: string;
    guardedFiles: string[];
    targetedProofCommands: string[];
    expectedBaseline?: {
      sourceLinkNormalizationGroups: number;
      visibleClusterCount: number;
      cpRootCount: number;
    };
  }>;
  targetedProofCommands: string[];
  completionGate: {
    isolatedRiskIds: string[];
    readyForC10When: string;
  };
};

describe('W02 workups routing drift isolation packet', () => {
  it('isolates the C09 route drift risks without changing source truth', () => {
    expect(packet.tranche).toBe('T09 W02 Workups and Routing');
    expect(packet.stepId).toBe('W02-L4_WORKUPS_ROUTING-C09');
    expect(packet.status).toBe('isolated');

    expect(packet.completionGate.isolatedRiskIds).toEqual([
      'W02-WR-C09-R01_UNSUPPORTED_CP_TOPIC_HEURISTIC',
      'W02-WR-C09-R02_WORKUPS_LABEL_GENERIC_CTA',
      'W02-WR-C09-R03_CP_SOURCE_LINK_ROOT_COUNT_DRIFT',
      'W02-WR-C09-R04_SOURCE_TRUTH_MAPPING_MUTATION',
    ]);
  });

  it('keeps the required guardrails explicit and machine-readable', () => {
    expect(packet.guardrails.unsupportedCpTopicsMustNotRouteHeuristically).toBe(true);
    expect(packet.guardrails.workupsLabelCannotBecomeGenericCta).toBe(true);
    expect(packet.guardrails.cpSourceLinkAndRootCountsRemainUntouched).toBe(true);
    expect(packet.guardrails.sourceTruthMappingsRemainReadOnly).toBe(true);
    expect(packet.guardrails.doNotTouch).toEqual([
      'CP source-link normalization',
      'CP root counts',
      'source-truth mappings',
      'the executable Workups routing rule',
    ]);
  });

  it('preserves the current CP count and Workups-rule authority from the baseline packet', () => {
    expect(packet.baselineAuthority).toMatchObject({
      sourceLinkNormalizationGroups: 7,
      visibleClusterCount: 7,
      cpRootCount: 6,
      workupsRuleLocked: true,
    });
    expect(packet.baselineAuthority.unsupportedRouteGuard).toContain('must not fall back heuristically');

    const countRisk = packet.riskRegister.find(
      (risk) => risk.id === 'W02-WR-C09-R03_CP_SOURCE_LINK_ROOT_COUNT_DRIFT',
    );
    expect(countRisk?.expectedBaseline).toEqual({
      sourceLinkNormalizationGroups: 7,
      visibleClusterCount: 7,
      cpRootCount: 6,
    });
  });

  it('names guarded files and targeted proof commands for each route drift risk', () => {
    const risksById = Object.fromEntries(packet.riskRegister.map((risk) => [risk.id, risk]));

    expect(risksById['W02-WR-C09-R01_UNSUPPORTED_CP_TOPIC_HEURISTIC'].guardedFiles).toContain(
      'src/utils/algorithmCatalog.ts',
    );
    expect(risksById['W02-WR-C09-R02_WORKUPS_LABEL_GENERIC_CTA'].guardedFiles).toContain(
      'scripts/validate_didactics_learning_ux.cjs',
    );
    expect(risksById['W02-WR-C09-R03_CP_SOURCE_LINK_ROOT_COUNT_DRIFT'].guardedFiles).toContain(
      'reports/w02_workups_routing_baseline_packet.json',
    );
    expect(risksById['W02-WR-C09-R04_SOURCE_TRUTH_MAPPING_MUTATION'].guardedFiles).toContain(
      'src/content/tutorials/validatedMappingsManifest.json',
    );

    for (const risk of packet.riskRegister) {
      expect(risk.targetedProofCommands).toContain(
        'npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts',
      );
    }
    expect(packet.targetedProofCommands).toEqual([
      'node scripts/generate_w02_workups_routing_drift_isolation.cjs',
      'npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts',
      'git diff --check',
    ]);
  });
});
