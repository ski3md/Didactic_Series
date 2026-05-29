#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const t08CloseoutPath = path.join(root, 'reports/w02_learner_ux_closeout_packet.json');
const algorithmsPath = path.join(root, 'src/content/algorithms/algorithms.normalized.json');
const outJsonPath = path.join(root, 'reports/w02_workups_routing_baseline_packet.json');
const outMdPath = path.join(root, 'reports/w02_workups_routing_baseline_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const t08Closeout = readJson(t08CloseoutPath);
const algorithms = readJson(algorithmsPath);
const cpAlgorithms = algorithms.filter((algorithm) => algorithm.category === 'Clinical Pathology');
const cpRouteAliases = cpAlgorithms.flatMap((algorithm) =>
  (algorithm.routeAliases || []).map((alias) => ({
    algorithmId: algorithm.id,
    algorithmTitle: algorithm.title,
    alias,
  }))
);
const cpAlgorithmIds = cpAlgorithms.map((algorithm) => algorithm.id).sort();

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T09 W02 Workups and Routing',
  status: 'in_progress',
  source: {
    t08Closeout: 'reports/w02_learner_ux_closeout_packet.json',
    algorithms: 'src/content/algorithms/algorithms.normalized.json',
    algorithmCatalog: 'src/utils/algorithmCatalog.ts',
    algorithmNavigatorNavigation: 'src/utils/algorithmNavigatorNavigation.ts',
  },
  authority: {
    t08Closed: t08Closeout.tranche === 'T08 W02 Learner UX' && t08Closeout.status === 'completed',
    t08NextTranche: t08Closeout.handoffToNextTranche.nextTranche,
    t08Guard: t08Closeout.handoffToNextTranche.requiredGuard,
    sourceLinkNormalizationGroups: t08Closeout.proofBundle.sourceLinkNormalizationGroups,
    visibleClusterCount: t08Closeout.proofBundle.visibleClusterCount,
    cpRootCount: t08Closeout.proofBundle.cpRootCount,
  },
  baseline: {
    totalAlgorithms: algorithms.length,
    clinicalPathologyAlgorithms: cpAlgorithms.length,
    clinicalPathologyRouteAliases: cpRouteAliases.length,
    clinicalPathologyAlgorithmIds: cpAlgorithmIds,
    routingEntryFiles: [
      'src/components/AlgorithmNavigator.tsx',
      'src/utils/algorithmCatalog.ts',
      'src/utils/algorithmNavigatorNavigation.ts',
      'src/content/algorithms/algorithms.normalized.json',
    ],
  },
  routeSourceLinks: {
    preserveLearnerSourceLinkWording: true,
    preserveT07SourceLinkMap: true,
    preserveT08LearnerWording: true,
    routeAliasesCarryCpOperationalLanguage: cpRouteAliases.length > 0,
    representativeRoutes: cpAlgorithms.map((algorithm) => ({
      id: algorithm.id,
      title: algorithm.title,
      aliases: algorithm.routeAliases || [],
    })),
  },
  workupParity: {
    cpRouteCoverageGreen: cpAlgorithms.length >= 12,
    managementAndInformaticsRoutes: cpAlgorithms.filter((algorithm) => /^cp-mi-/.test(algorithm.id)).length,
    foundationsRoutes: cpAlgorithms.filter((algorithm) => /^cp-foundations-/.test(algorithm.id)).length,
    transfusionRoutes: cpAlgorithms.filter((algorithm) => /^cp-transfusion-/.test(algorithm.id)).length,
    microbiologyRoutes: cpAlgorithms.filter((algorithm) => /^cp-micro-/.test(algorithm.id)).length,
    unsupportedRouteGuard:
      'Unimplemented CP topics must not fall back heuristically to unrelated algorithm routes.',
  },
  execution: {
    completedStepIds: [
      'W02-L4_WORKUPS_ROUTING-C01',
      'W02-L4_WORKUPS_ROUTING-C02',
      'W02-L4_WORKUPS_ROUTING-C03',
    ],
    remainingStepIds: [
      'W02-L4_WORKUPS_ROUTING-C04',
      'W02-L4_WORKUPS_ROUTING-C05',
      'W02-L4_WORKUPS_ROUTING-C06',
      'W02-L4_WORKUPS_ROUTING-C07',
      'W02-L4_WORKUPS_ROUTING-C08',
      'W02-L4_WORKUPS_ROUTING-C09',
      'W02-L4_WORKUPS_ROUTING-C10',
    ],
    proofCommands: [
      'npm run didactics:ux:validate',
      'npm run test -- src/utils/algorithmCatalog.test.ts src/utils/studyDestinationResolver.test.ts',
      'npx vitest run scripts/validate_w02_workups_routing_baseline_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      t08Closeout.status === 'completed' &&
      t08Closeout.handoffToNextTranche.nextTranche === 'T09 W02 Workups and Routing' &&
      cpAlgorithms.length >= 12 &&
      cpRouteAliases.length > 0,
    staleWhen: [
      'T08 closeout changes without regenerating this packet',
      'algorithms.normalized.json changes without regenerating this packet',
      'algorithm routing tests change without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 Workups and Routing Baseline Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  `Status: ${payload.status}`,
  '',
  '## Authority',
  '',
  `- T08 closed: ${payload.authority.t08Closed ? 'yes' : 'no'}`,
  `- T08 next tranche: ${payload.authority.t08NextTranche}`,
  `- Guard: ${payload.authority.t08Guard}`,
  `- Source-link normalization groups: ${payload.authority.sourceLinkNormalizationGroups}`,
  `- Visible cluster count: ${payload.authority.visibleClusterCount}`,
  `- CP root count: ${payload.authority.cpRootCount}`,
  '',
  '## Baseline',
  '',
  `- Total algorithms: ${payload.baseline.totalAlgorithms}`,
  `- Clinical Pathology algorithms: ${payload.baseline.clinicalPathologyAlgorithms}`,
  `- Clinical Pathology route aliases: ${payload.baseline.clinicalPathologyRouteAliases}`,
  ...payload.baseline.clinicalPathologyAlgorithmIds.map((id) => `- CP algorithm: ${id}`),
  '',
  '## Route Source Links',
  '',
  `- Preserve learner source-link wording: ${payload.routeSourceLinks.preserveLearnerSourceLinkWording ? 'yes' : 'no'}`,
  `- Preserve T07 source-link map: ${payload.routeSourceLinks.preserveT07SourceLinkMap ? 'yes' : 'no'}`,
  `- Preserve T08 learner wording: ${payload.routeSourceLinks.preserveT08LearnerWording ? 'yes' : 'no'}`,
  `- Route aliases carry CP operational language: ${payload.routeSourceLinks.routeAliasesCarryCpOperationalLanguage ? 'yes' : 'no'}`,
  '',
  '## Workup Parity',
  '',
  `- CP route coverage green: ${payload.workupParity.cpRouteCoverageGreen ? 'yes' : 'no'}`,
  `- Management and Informatics routes: ${payload.workupParity.managementAndInformaticsRoutes}`,
  `- Foundations routes: ${payload.workupParity.foundationsRoutes}`,
  `- Transfusion routes: ${payload.workupParity.transfusionRoutes}`,
  `- Microbiology routes: ${payload.workupParity.microbiologyRoutes}`,
  `- Unsupported route guard: ${payload.workupParity.unsupportedRouteGuard}`,
  '',
  '## Execution',
  '',
  `- Completed step ids: ${payload.execution.completedStepIds.join(', ')}`,
  `- Remaining step ids: ${payload.execution.remainingStepIds.join(', ')}`,
  `- Proof commands: ${payload.execution.proofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
  '',
  '## Completion Gate',
  '',
  `- Baseline green: ${payload.completionGate.baselineGreen ? 'yes' : 'no'}`,
  ...payload.completionGate.staleWhen.map((entry) => `- stale when: ${entry}`),
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-WORKUPS-ROUTING-BASELINE] Wrote ${path.relative(root, outJsonPath)}.`);
