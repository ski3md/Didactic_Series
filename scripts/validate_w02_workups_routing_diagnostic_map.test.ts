import { createRequire } from 'module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);

const diagnosticMap = require('../reports/w02_workups_routing_diagnostic_map.json') as {
  tranche: string;
  step: string;
  status: string;
  guardrails: Record<string, boolean>;
  totals: {
    cpRoutes: number;
    routeAliases: number;
    groups: number;
  };
  baselineExpectation: {
    cpRoutes: number;
    routeAliases: number;
    managementAndInformaticsRoutes: number;
    foundationsRoutes: number;
    transfusionRoutes: number;
    microbiologyRoutes: number;
  };
  groups: Array<{
    id: string;
    label: string;
    routeCount: number;
    aliasCount: number;
    benchFacingDecisionCue: string;
    routes: string[];
  }>;
  routes: Array<{
    id: string;
    title: string;
    groupId: string;
    representativeAliases: string[];
    benchFacingDecisionCue: string;
  }>;
};

describe('W02 workups routing diagnostic map', () => {
  it('publishes a reusable T09 C08 diagnostic map without reopening source truth', () => {
    expect(diagnosticMap.tranche).toBe('T09 W02 Workups and Routing');
    expect(diagnosticMap.step).toBe('W02-L4_WORKUPS_ROUTING-C08');
    expect(diagnosticMap.status).toBe('reusable_diagnostic_map');
    expect(diagnosticMap.guardrails).toEqual({
      cpSourceLinkNormalizationUntouched: true,
      cpRootCountsUntouched: true,
      sourceTruthMappingsUntouched: true,
      executableWorkupsRulePreserved: true,
    });
  });

  it('covers the frozen CP route and alias baseline', () => {
    expect(diagnosticMap.totals.cpRoutes).toBe(12);
    expect(diagnosticMap.totals.routeAliases).toBe(36);
    expect(diagnosticMap.totals.groups).toBe(4);
    expect(diagnosticMap.totals.cpRoutes).toBe(diagnosticMap.baselineExpectation.cpRoutes);
    expect(diagnosticMap.totals.routeAliases).toBe(diagnosticMap.baselineExpectation.routeAliases);
    expect(diagnosticMap.routes).toHaveLength(12);
    expect(diagnosticMap.routes.every((route) => route.representativeAliases.length === 3)).toBe(true);
    expect(diagnosticMap.routes.every((route) => route.benchFacingDecisionCue.length > 40)).toBe(true);
  });

  it('keeps the four W02 CP workup groups at the expected counts', () => {
    const routeCounts = Object.fromEntries(
      diagnosticMap.groups.map((group) => [group.id, group.routeCount]),
    );

    expect(routeCounts).toEqual({
      foundations: diagnosticMap.baselineExpectation.foundationsRoutes,
      management_and_informatics: diagnosticMap.baselineExpectation.managementAndInformaticsRoutes,
      microbiology: diagnosticMap.baselineExpectation.microbiologyRoutes,
      transfusion: diagnosticMap.baselineExpectation.transfusionRoutes,
    });
    expect(routeCounts).toEqual({
      foundations: 3,
      management_and_informatics: 4,
      microbiology: 3,
      transfusion: 2,
    });
    expect(diagnosticMap.groups.every((group) => group.benchFacingDecisionCue.length > 40)).toBe(true);
  });
});
