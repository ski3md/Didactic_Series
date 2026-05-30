#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const baselinePath = path.join(root, 'reports/w02_workups_routing_baseline_packet.json');
const algorithmsPath = path.join(root, 'src/content/algorithms/algorithms.normalized.json');
const outJsonPath = path.join(root, 'reports/w02_workups_routing_diagnostic_map.json');
const outMdPath = path.join(root, 'reports/w02_workups_routing_diagnostic_map.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const groupDefinitions = [
  {
    id: 'management_and_informatics',
    label: 'Management and Informatics',
    prefix: 'cp-mi-',
    cue: 'Protect patient reporting, choose the oversight or workflow path, and keep operational consequences visible.',
  },
  {
    id: 'foundations',
    label: 'Foundations',
    prefix: 'cp-foundations-',
    cue: 'Start from specimen or patient context, select the safest bench check, and route the result without skipping safeguards.',
  },
  {
    id: 'transfusion',
    label: 'Transfusion',
    prefix: 'cp-transfusion-',
    cue: 'Stabilize transfusion safety first, reconcile identity and compatibility, then decide escalation or safe unit selection.',
  },
  {
    id: 'microbiology',
    label: 'Microbiology',
    prefix: 'cp-micro-',
    cue: 'Anchor organism or specimen quality to source context before reporting identification, susceptibility, or recollection decisions.',
  },
];

const firstDecisionCue = (algorithm) => {
  const nodes = Object.values(algorithm.provenance?.nodes || {});
  const decision = nodes.find((node) => node.type === 'decision');
  return decision?.description || algorithm.summary;
};

const baseline = readJson(baselinePath);
const algorithms = readJson(algorithmsPath);
const cpAlgorithms = algorithms.filter((algorithm) => algorithm.category === 'Clinical Pathology');

const routes = cpAlgorithms
  .map((algorithm) => {
    const group = groupDefinitions.find((definition) => algorithm.id.startsWith(definition.prefix));

    if (!group) {
      throw new Error(`Unmapped Clinical Pathology route group for ${algorithm.id}`);
    }

    return {
      id: algorithm.id,
      title: algorithm.title,
      groupId: group.id,
      groupLabel: group.label,
      representativeAliases: algorithm.routeAliases || [],
      benchFacingDecisionCue: firstDecisionCue(algorithm),
      summary: algorithm.summary,
    };
  })
  .sort((left, right) => left.groupId.localeCompare(right.groupId) || left.title.localeCompare(right.title));

const groups = groupDefinitions.map((definition) => {
  const groupRoutes = routes.filter((route) => route.groupId === definition.id);

  return {
    id: definition.id,
    label: definition.label,
    routeCount: groupRoutes.length,
    aliasCount: groupRoutes.reduce((sum, route) => sum + route.representativeAliases.length, 0),
    benchFacingDecisionCue: definition.cue,
    routes: groupRoutes.map((route) => route.id),
  };
});

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T09 W02 Workups and Routing',
  step: 'W02-L4_WORKUPS_ROUTING-C08',
  status: 'reusable_diagnostic_map',
  source: {
    baselinePacket: 'reports/w02_workups_routing_baseline_packet.json',
    algorithms: 'src/content/algorithms/algorithms.normalized.json',
  },
  guardrails: {
    cpSourceLinkNormalizationUntouched: true,
    cpRootCountsUntouched: true,
    sourceTruthMappingsUntouched: true,
    executableWorkupsRulePreserved: true,
  },
  totals: {
    cpRoutes: routes.length,
    routeAliases: routes.reduce((sum, route) => sum + route.representativeAliases.length, 0),
    groups: groups.length,
  },
  baselineExpectation: {
    cpRoutes: baseline.baseline.clinicalPathologyAlgorithms,
    routeAliases: baseline.baseline.clinicalPathologyRouteAliases,
    managementAndInformaticsRoutes: baseline.workupParity.managementAndInformaticsRoutes,
    foundationsRoutes: baseline.workupParity.foundationsRoutes,
    transfusionRoutes: baseline.workupParity.transfusionRoutes,
    microbiologyRoutes: baseline.workupParity.microbiologyRoutes,
  },
  groups,
  routes,
};

const md = [
  '# W02 Workups and Routing Diagnostic Map',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  `Step: ${payload.step}`,
  `Status: ${payload.status}`,
  '',
  '## Totals',
  '',
  `- CP routes: ${payload.totals.cpRoutes}`,
  `- Route aliases: ${payload.totals.routeAliases}`,
  `- Groups: ${payload.totals.groups}`,
  '',
  '## Groups',
  '',
  ...payload.groups.flatMap((group) => [
    `### ${group.label}`,
    '',
    `- Routes: ${group.routeCount}`,
    `- Aliases: ${group.aliasCount}`,
    `- Bench-facing decision cue: ${group.benchFacingDecisionCue}`,
    '',
    ...group.routes.map((routeId) => {
      const route = payload.routes.find((entry) => entry.id === routeId);
      return `- ${route.title} (${route.id}): ${route.representativeAliases.join('; ')}`;
    }),
    '',
  ]),
  '## Guardrails',
  '',
  `- CP source-link normalization untouched: ${payload.guardrails.cpSourceLinkNormalizationUntouched ? 'yes' : 'no'}`,
  `- CP root counts untouched: ${payload.guardrails.cpRootCountsUntouched ? 'yes' : 'no'}`,
  `- Source-truth mappings untouched: ${payload.guardrails.sourceTruthMappingsUntouched ? 'yes' : 'no'}`,
  `- Executable Workups rule preserved: ${payload.guardrails.executableWorkupsRulePreserved ? 'yes' : 'no'}`,
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-WORKUPS-ROUTING-DIAGNOSTIC-MAP] Wrote ${path.relative(root, outJsonPath)}.`);
