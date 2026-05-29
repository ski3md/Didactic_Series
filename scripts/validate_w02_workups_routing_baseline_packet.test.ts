import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const packet = require('../reports/w02_workups_routing_baseline_packet.json') as {
  tranche: string;
  status: string;
  authority: {
    t08Closed: boolean;
    t08NextTranche: string;
    t08Guard: string;
    sourceLinkNormalizationGroups: number;
    visibleClusterCount: number;
    cpRootCount: number;
  };
  baseline: {
    totalAlgorithms: number;
    clinicalPathologyAlgorithms: number;
    clinicalPathologyRouteAliases: number;
    clinicalPathologyAlgorithmIds: string[];
  };
  routeSourceLinks: {
    preserveLearnerSourceLinkWording: boolean;
    preserveT07SourceLinkMap: boolean;
    preserveT08LearnerWording: boolean;
    routeAliasesCarryCpOperationalLanguage: boolean;
  };
  workupParity: {
    cpRouteCoverageGreen: boolean;
    managementAndInformaticsRoutes: number;
    foundationsRoutes: number;
    transfusionRoutes: number;
    microbiologyRoutes: number;
    unsupportedRouteGuard: string;
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

describe('W02 workups routing baseline packet', () => {
  it('opens T09 from the closed T08 handoff without reopening source truth', () => {
    expect(packet.tranche).toBe('T09 W02 Workups and Routing');
    expect(packet.status).toBe('in_progress');
    expect(packet.authority.t08Closed).toBe(true);
    expect(packet.authority.t08NextTranche).toBe('T09 W02 Workups and Routing');
    expect(packet.authority.t08Guard).toContain('Do not alter CP source-link normalization');
    expect(packet.authority.sourceLinkNormalizationGroups).toBe(7);
    expect(packet.authority.visibleClusterCount).toBe(7);
    expect(packet.authority.cpRootCount).toBe(6);
  });

  it('freezes the CP algorithm route baseline and parity counts', () => {
    expect(packet.baseline.totalAlgorithms).toBe(14);
    expect(packet.baseline.clinicalPathologyAlgorithms).toBe(12);
    expect(packet.baseline.clinicalPathologyRouteAliases).toBeGreaterThan(20);
    expect(packet.baseline.clinicalPathologyAlgorithmIds).toContain('cp-transfusion-reaction-triage');
    expect(packet.routeSourceLinks.preserveLearnerSourceLinkWording).toBe(true);
    expect(packet.routeSourceLinks.preserveT07SourceLinkMap).toBe(true);
    expect(packet.routeSourceLinks.preserveT08LearnerWording).toBe(true);
    expect(packet.routeSourceLinks.routeAliasesCarryCpOperationalLanguage).toBe(true);
    expect(packet.workupParity.cpRouteCoverageGreen).toBe(true);
    expect(packet.workupParity.managementAndInformaticsRoutes).toBe(4);
    expect(packet.workupParity.foundationsRoutes).toBe(3);
    expect(packet.workupParity.transfusionRoutes).toBe(2);
    expect(packet.workupParity.microbiologyRoutes).toBe(3);
    expect(packet.workupParity.unsupportedRouteGuard).toContain('must not fall back heuristically');
  });

  it('keeps T09 scoped to routing baseline work before wording and closeout', () => {
    expect(packet.execution.completedStepIds).toEqual([
      'W02-L4_WORKUPS_ROUTING-C01',
      'W02-L4_WORKUPS_ROUTING-C02',
      'W02-L4_WORKUPS_ROUTING-C03',
    ]);
    expect(packet.execution.remainingStepIds).toHaveLength(7);
    expect(packet.execution.proofCommands).toContain(
      'npm run test -- src/utils/algorithmCatalog.test.ts src/utils/studyDestinationResolver.test.ts',
    );
    expect(packet.completionGate.baselineGreen).toBe(true);
    expect(packet.completionGate.staleWhen).toHaveLength(3);
  });
});
