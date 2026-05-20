#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const reportPath = path.join(root, 'reports/didactics_learning_ux_report.json');
const ledgerPath = path.join(root, 'src/content/planning/full_1000_execution_ledger.json');
const algorithmsPath = path.join(root, 'src/content/algorithms/algorithms.normalized.json');
const algorithmCatalogPath = path.join(root, 'src/utils/algorithmCatalog.ts');
const algorithmNavigationPath = path.join(root, 'src/utils/algorithmNavigatorNavigation.ts');
const navigatorPath = path.join(root, 'src/components/AlgorithmNavigator.tsx');
const outJsonPath = path.join(root, 'reports/workups_routing_tranche_closeout_packet.json');
const outMdPath = path.join(root, 'reports/workups_routing_tranche_closeout_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const readText = (filePath) => fs.readFileSync(filePath, 'utf8');
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const report = readJson(reportPath);
const ledger = readJson(ledgerPath);
const algorithms = readJson(algorithmsPath);
const algorithmCatalogTs = readText(algorithmCatalogPath);
const algorithmNavigationTs = readText(algorithmNavigationPath);
const navigatorTsx = readText(navigatorPath);
const tranche = ledger.tranches.find((entry) => entry.id === 'T04');

if (!tranche) {
  throw new Error('Missing T04 tranche in full_1000_execution_ledger.json');
}

const workupPasses = report.passes.filter((entry) => entry.startsWith('Workup') || entry.startsWith('Workups'));
const clinicalPathAlgorithms = algorithms.filter((entry) => entry.category === 'Clinical Pathology');
const clinicalPathPatternFamilies = Array.from(new Set(clinicalPathAlgorithms.map((entry) => entry.title)));

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T04 W01 Workups and Routing',
  source: {
    uxReport: 'reports/didactics_learning_ux_report.json',
    trancheLedger: 'src/content/planning/full_1000_execution_ledger.json',
    ownedSurfaces: [
      'src/components/AlgorithmNavigator.tsx',
      'src/utils/algorithmCatalog.ts',
      'src/utils/algorithmNavigatorNavigation.ts',
      'src/content/algorithms/algorithms.normalized.json',
    ],
  },
  validator: {
    passCount: report.passes.length,
    failureCount: report.failures.length,
    workupPassCount: workupPasses.length,
  },
  routingBaseline: {
    totalAlgorithms: algorithms.length,
    clinicalPathAlgorithms: clinicalPathAlgorithms.length,
    distinctCategories: Array.from(new Set(algorithms.map((entry) => entry.category))).length,
    clinicalPathPatternFamilies: clinicalPathPatternFamilies.length,
    firstClinicalPathPatternFamily: clinicalPathPatternFamilies[0] ?? null,
  },
  routingSignals: {
    navigatorConsumesIntent: /consumeAlgorithmNavigatorIntent\(\)/.test(navigatorTsx),
    navigatorPushesTopicAndSubtopicDestinations:
      /kind:\s*intent\.patternFamily\s*\?\s*'subtopic_overview'\s*:\s*'topic_overview'/.test(navigatorTsx),
    navigatorWritesState: /writeAlgorithmNavigatorState\(\s*\{/.test(navigatorTsx),
    navigatorRehydratesPopstate: /window\.addEventListener\('popstate'/.test(navigatorTsx),
    navigatorUsesStudyDestinationEvents: /window\.addEventListener\(STUDY_DESTINATION_EVENT/.test(navigatorTsx),
    catalogExposesClinicalPathRouteFamilies:
      /'QC Failure Response'/.test(algorithmCatalogTs) &&
      /'Validation vs Verification'/.test(algorithmCatalogTs) &&
      /'Transfusion Reaction Triage'/.test(algorithmCatalogTs),
    navigationPersistsLaunchContext:
      /ALGORITHM_NAVIGATOR_LAUNCH_CONTEXT_KEY/.test(algorithmNavigationTs) &&
      /sourceModuleTitle/.test(algorithmNavigationTs) &&
      /window\.dispatchEvent\(new CustomEvent<AlgorithmNavigatorIntent>/.test(algorithmNavigationTs),
  },
  browserCheckpoint: {
    route: 'http://127.0.0.1:4179/Didactic_Series/didactics/?workspace=algorithms',
    expectedVisibleText: [
      'Clinical Pathology',
      'QC Failure Response',
      'Validation vs Verification',
    ],
  },
  execution: {
    completedStepIds: tranche.completionEvidence.completedStepIds,
    proofCommands: [
      'npm run didactics:ux:validate',
      'npm run test -- src/utils/algorithmCatalog.test.ts',
      'npx vitest run scripts/validate_didactics_learning_ux.test.ts scripts/validate_workups_routing_tranche_closeout_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      report.failures.length === 0 &&
      workupPasses.length >= 14 &&
      clinicalPathAlgorithms.length === 12 &&
      algorithms.length === 14 &&
      /window\.addEventListener\('popstate'/.test(navigatorTsx),
    staleWhen: [
      'the didactics learner UX report changes without regenerating this packet',
      'the algorithm catalog, algorithm navigation helper, or normalized algorithm baseline changes without regenerating this packet',
      'the tranche ledger status or completed step list changes without regenerating this packet',
    ],
  },
};

const md = [
  '# Workups and Routing Tranche Closeout Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  '',
  '## Validator',
  '',
  `- Pass count: ${payload.validator.passCount}`,
  `- Failure count: ${payload.validator.failureCount}`,
  `- Workup/workups pass count: ${payload.validator.workupPassCount}`,
  '',
  '## Routing Baseline',
  '',
  `- Total algorithms: ${payload.routingBaseline.totalAlgorithms}`,
  `- Clinical Pathology algorithms: ${payload.routingBaseline.clinicalPathAlgorithms}`,
  `- Distinct categories: ${payload.routingBaseline.distinctCategories}`,
  `- Clinical Pathology pattern families: ${payload.routingBaseline.clinicalPathPatternFamilies}`,
  `- First Clinical Pathology pattern family: ${payload.routingBaseline.firstClinicalPathPatternFamily}`,
  '',
  '## Routing Signals',
  '',
  `- Navigator consumes intent: ${payload.routingSignals.navigatorConsumesIntent ? 'yes' : 'no'}`,
  `- Navigator pushes topic/subtopic destinations: ${payload.routingSignals.navigatorPushesTopicAndSubtopicDestinations ? 'yes' : 'no'}`,
  `- Navigator writes state: ${payload.routingSignals.navigatorWritesState ? 'yes' : 'no'}`,
  `- Navigator rehydrates popstate: ${payload.routingSignals.navigatorRehydratesPopstate ? 'yes' : 'no'}`,
  `- Navigator uses study-destination events: ${payload.routingSignals.navigatorUsesStudyDestinationEvents ? 'yes' : 'no'}`,
  `- Catalog exposes CP route families: ${payload.routingSignals.catalogExposesClinicalPathRouteFamilies ? 'yes' : 'no'}`,
  `- Navigation persists launch context: ${payload.routingSignals.navigationPersistsLaunchContext ? 'yes' : 'no'}`,
  '',
  '## Browser Checkpoint',
  '',
  `- Route: ${payload.browserCheckpoint.route}`,
  ...payload.browserCheckpoint.expectedVisibleText.map((entry) => `- expected text: ${entry}`),
  '',
  '## Execution',
  '',
  `- Completed step ids: ${payload.execution.completedStepIds.join(', ')}`,
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

console.log(`[WORKUPS-ROUTING-CLOSEOUT] Wrote closeout packet for ${payload.tranche}.`);
