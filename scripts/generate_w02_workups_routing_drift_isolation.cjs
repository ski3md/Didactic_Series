#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const baselinePath = path.join(root, 'reports/w02_workups_routing_baseline_packet.json');
const outJsonPath = path.join(root, 'reports/w02_workups_routing_drift_isolation.json');
const outMdPath = path.join(root, 'reports/w02_workups_routing_drift_isolation.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const baseline = readJson(baselinePath);

const riskRegister = [
  {
    id: 'W02-WR-C09-R01_UNSUPPORTED_CP_TOPIC_HEURISTIC',
    title: 'Unsupported Clinical Pathology topics must not route heuristically',
    driftSignal:
      'An unimplemented CP topic resolves to the nearest live algorithm through partial-token matching instead of returning null.',
    isolationRule:
      'Keep unsupported CP topics unrouted until an owned algorithm record or exact guarded alias is added with proof.',
    guardedFiles: [
      'src/utils/algorithmCatalog.ts',
      'src/utils/algorithmCatalog.test.ts',
      'src/content/algorithms/algorithms.normalized.json',
    ],
    targetedProofCommands: [
      'npm run test -- src/utils/algorithmCatalog.test.ts',
      'npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts',
    ],
  },
  {
    id: 'W02-WR-C09-R02_WORKUPS_LABEL_GENERIC_CTA',
    title: 'Workups label cannot become a generic CTA',
    driftSignal:
      '`Workups` appears as generic launch, teaser, fallback, or marketing copy rather than the governed diagnostic-workup lane label.',
    isolationRule:
      'Use `Workups` only when it truthfully names the active diagnostic-workup workspace and bench-facing routing rule.',
    guardedFiles: [
      'src/components/AlgorithmNavigator.tsx',
      'docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md',
      'src/content/contracts/pthfndrDidacticsLearningUxContract.json',
      'scripts/validate_didactics_learning_ux.cjs',
    ],
    targetedProofCommands: [
      'npm run didactics:ux:validate',
      'npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts',
    ],
  },
  {
    id: 'W02-WR-C09-R03_CP_SOURCE_LINK_ROOT_COUNT_DRIFT',
    title: 'CP source-link and root-count proof must remain untouched',
    driftSignal:
      'The T07/T08 source-link normalization groups, visible cluster count, or CP root count change during T09 route work.',
    isolationRule:
      'Do not alter CP source-link normalization, learner source-link wording, visible cluster count, or CP root count inside T09.',
    guardedFiles: [
      'reports/w02_workups_routing_baseline_packet.json',
      'reports/w02_learner_ux_closeout_packet.json',
      'reports/w02_content_parity_closeout_packet.json',
    ],
    expectedBaseline: {
      sourceLinkNormalizationGroups: baseline.authority.sourceLinkNormalizationGroups,
      visibleClusterCount: baseline.authority.visibleClusterCount,
      cpRootCount: baseline.authority.cpRootCount,
    },
    targetedProofCommands: [
      'npx vitest run scripts/validate_w02_workups_routing_baseline_packet.test.ts',
      'npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts',
    ],
  },
  {
    id: 'W02-WR-C09-R04_SOURCE_TRUTH_MAPPING_MUTATION',
    title: 'Source-truth mappings stay outside this route drift tranche',
    driftSignal:
      'Validated mappings, mapping validators, or normalized algorithm source truth change while isolating route drift.',
    isolationRule:
      'Treat mapping/source-truth files as read-only for T09 C09; regenerate upstream proof before any intentional change.',
    guardedFiles: [
      'src/content/tutorials/validatedMappingsManifest.json',
      'scripts/validate_validated_mappings_manifest.cjs',
      'src/content/algorithms/algorithms.normalized.json',
    ],
    targetedProofCommands: [
      'node scripts/validate_validated_mappings_manifest.cjs',
      'npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts',
    ],
  },
];

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T09 W02 Workups and Routing',
  stepId: 'W02-L4_WORKUPS_ROUTING-C09',
  status: 'isolated',
  source: {
    baselinePacket: 'reports/w02_workups_routing_baseline_packet.json',
    routeCoverageTest: 'src/utils/algorithmCatalog.test.ts',
  },
  baselineAuthority: {
    sourceLinkNormalizationGroups: baseline.authority.sourceLinkNormalizationGroups,
    visibleClusterCount: baseline.authority.visibleClusterCount,
    cpRootCount: baseline.authority.cpRootCount,
    unsupportedRouteGuard: baseline.workupParity.unsupportedRouteGuard,
    workupsRuleLocked: Object.values(baseline.workupChecks).every(Boolean),
  },
  guardrails: {
    doNotTouch: [
      'CP source-link normalization',
      'CP root counts',
      'source-truth mappings',
      'the executable Workups routing rule',
    ],
    unsupportedCpTopicsMustNotRouteHeuristically: true,
    workupsLabelCannotBecomeGenericCta: true,
    cpSourceLinkAndRootCountsRemainUntouched: true,
    sourceTruthMappingsRemainReadOnly: true,
  },
  riskRegister,
  targetedProofCommands: [
    'node scripts/generate_w02_workups_routing_drift_isolation.cjs',
    'npx vitest run scripts/validate_w02_workups_routing_drift_isolation.test.ts',
    'git diff --check',
  ],
  completionGate: {
    isolatedRiskIds: riskRegister.map((risk) => risk.id),
    readyForC10When:
      'C09 packet exists, its focused validation passes, and no guarded source-truth or CP count files were edited.',
  },
};

const md = [
  '# W02 Workups and Routing Drift Isolation Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  `Step: ${payload.stepId}`,
  `Status: ${payload.status}`,
  '',
  '## Baseline Authority',
  '',
  `- Source-link normalization groups: ${payload.baselineAuthority.sourceLinkNormalizationGroups}`,
  `- Visible cluster count: ${payload.baselineAuthority.visibleClusterCount}`,
  `- CP root count: ${payload.baselineAuthority.cpRootCount}`,
  `- Unsupported route guard: ${payload.baselineAuthority.unsupportedRouteGuard}`,
  `- Workups rule locked: ${payload.baselineAuthority.workupsRuleLocked ? 'yes' : 'no'}`,
  '',
  '## Guardrails',
  '',
  ...payload.guardrails.doNotTouch.map((entry) => `- Do not touch: ${entry}`),
  `- Unsupported CP topics must not route heuristically: ${payload.guardrails.unsupportedCpTopicsMustNotRouteHeuristically ? 'yes' : 'no'}`,
  `- Workups label cannot become a generic CTA: ${payload.guardrails.workupsLabelCannotBecomeGenericCta ? 'yes' : 'no'}`,
  `- CP source-link and root counts remain untouched: ${payload.guardrails.cpSourceLinkAndRootCountsRemainUntouched ? 'yes' : 'no'}`,
  `- Source-truth mappings remain read-only: ${payload.guardrails.sourceTruthMappingsRemainReadOnly ? 'yes' : 'no'}`,
  '',
  '## Risk Register',
  '',
  ...payload.riskRegister.flatMap((risk) => [
    `### ${risk.id}`,
    '',
    `- Title: ${risk.title}`,
    `- Drift signal: ${risk.driftSignal}`,
    `- Isolation rule: ${risk.isolationRule}`,
    `- Guarded files: ${risk.guardedFiles.join(', ')}`,
    `- Targeted proof: ${risk.targetedProofCommands.map((cmd) => `\`${cmd}\``).join(', ')}`,
    '',
  ]),
  '## Targeted Proof',
  '',
  ...payload.targetedProofCommands.map((command) => `- \`${command}\``),
  '',
  '## Completion Gate',
  '',
  `- Isolated risk ids: ${payload.completionGate.isolatedRiskIds.join(', ')}`,
  `- Ready for C10 when: ${payload.completionGate.readyForC10When}`,
].join('\n');

ensureDir(outJsonPath);
fs.writeFileSync(outJsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(outMdPath, `${md}\n`);

console.log(`[W02-WORKUPS-ROUTING-DRIFT-ISOLATION] Wrote ${path.relative(root, outJsonPath)}.`);
