#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..');
const OUT_JSON = path.join(REPO_ROOT, 'reports/didactics_qa_walkthrough.json');
const OUT_MD = path.join(REPO_ROOT, 'reports/didactics_qa_walkthrough.md');

const readText = (relativePath) => fs.readFileSync(path.join(REPO_ROOT, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const exists = (relativePath) => fs.existsSync(path.join(REPO_ROOT, relativePath));

const countMatches = (text, pattern) => (text.match(pattern) || []).length;

const extractArrayItemCount = (text, arrayName) => {
  const start = text.indexOf(`export const ${arrayName}`);
  if (start === -1) return 0;
  const nextExport = text.indexOf('\nexport ', start + 1);
  const body = text.slice(start, nextExport === -1 ? text.length : nextExport);
  return countMatches(body, /\{\s*\n\s*(?:moduleId|id):\s*['"]/g);
};

const scanForbiddenPublicLabels = (surfaceTexts) => {
  const forbidden = [
    'Didactic Algorithms',
    'Didactic Tutorials',
    'source-truth mutation',
    'routing-system',
    'workflow commentary',
    'Open algorithms',
    'Open tutorial',
    'Start practice',
  ];

  return forbidden
    .map((phrase) => ({
      phrase,
      hits: surfaceTexts
        .filter(({ text }) => new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(text))
        .map(({ surface }) => surface),
    }))
    .filter((entry) => entry.hits.length > 0);
};

const inspectImageManifest = () => {
  const supplemental = readJson('src/content/images/apcpboards_reference_images.json');
  const signout = readJson('src/content/signout_sims/signout_image_reference_index.json');
  const supplementalImages = supplemental.images || [];
  const localSupplemental = supplementalImages.filter((image) => image.localPath);
  const sourceServedSupplemental = supplementalImages.filter((image) => image.imageUrl);
  const sampledMissingLocal = localSupplemental
    .filter((image) => !exists(path.join('public', image.localPath)))
    .slice(0, 8)
    .map((image) => image.localPath);

  return {
    riskLevel: sampledMissingLocal.length > 0 || (signout.missingImages || 0) > 0 ? 'review' : 'low',
    supplementalReferenceImages: supplemental.imageCount || supplementalImages.length,
    supplementalLocalImages: localSupplemental.length,
    supplementalSourceServedImages: sourceServedSupplemental.length,
    supplementalSpecialtyCounts: supplemental.specialtyCounts || {},
    sampledMissingSupplementalLocalPaths: sampledMissingLocal,
    signoutImages: signout.totalImages || (signout.images || []).length,
    signoutPresentImages: signout.presentImages || 0,
    signoutMissingImages: signout.missingImages || 0,
    riskSummary:
      sampledMissingLocal.length > 0 || (signout.missingImages || 0) > 0
        ? 'Media manifests need local-path follow-up before claiming full rendered image safety.'
        : 'Current sampled media manifests are locally resolvable or intentionally source-served.',
  };
};

const inspectAdminCard = () => {
  const app = readText('src/App.tsx');
  const admin = readText('src/components/AdminView.tsx');
  const summary = readJson('src/content/materials/abpathMaterialAdminSummary.json');
  const importsFullQueue =
    /abpathMaterialExpansionQueue\.json/.test(admin) || /abpathMaterialExpansionQueue\.json/.test(app);
  const importsSummary = /abpathMaterialAdminSummary\.json/.test(admin);
  const hasAdminRouteGuard = /currentSection === Section\.ADMIN && !user\?\.isAdmin/.test(app);
  const noPromotionControls = /No promotion controls are exposed here/.test(admin);

  return {
    riskLevel: importsFullQueue || !hasAdminRouteGuard || !noPromotionControls ? 'review' : 'controlled',
    routeGuardedForAdmins: hasAdminRouteGuard,
    lazyAdminView: /const AdminView = lazy/.test(app),
    importsSummaryOnly: importsSummary && !importsFullQueue,
    fullQueueImportDetected: importsFullQueue,
    noPromotionControlsCopyPresent: noPromotionControls,
    queueEntriesSummarized: summary.totals?.queueEntries || 0,
    unreviewedQueueEntries: summary.totals?.unreviewedQueueEntries || 0,
    generationQueueEntries: summary.totals?.generationQueueEntries || 0,
    batchRows: summary.totals?.batchRows || 0,
    gates: summary.gates || {},
    riskSummary:
      importsSummary && !importsFullQueue && hasAdminRouteGuard && noPromotionControls
        ? 'Admin card is currently controlled: lazy admin route, summary-only import, unreviewed/generation-queue state, and no promotion controls.'
        : 'Admin card requires review before public promotion because at least one guardrail signal is missing.',
  };
};

const buildRouteCoverage = () => {
  const app = readText('src/App.tsx');
  const header = readText('src/components/Header.tsx');
  const sidebar = readText('src/components/Sidebar.tsx');
  const uxReport = readJson('reports/didactics_learning_ux_report.json');
  const required = [
    {
      key: 'curriculum',
      route: '/didactics/?workspace=curriculum',
      section: 'Section.PATHOLOGY_CURRICULUM',
      component: 'PathologyCurriculum',
      publicLabel: 'Curriculum',
    },
    {
      key: 'tutorials',
      route: '/didactics/?workspace=tutorials',
      section: 'Section.DIDACTIC_TUTORIALS',
      component: 'DidacticTutorials',
      publicLabel: 'Tutorials',
    },
    {
      key: 'workups',
      route: '/didactics/?workspace=algorithms',
      section: 'Section.DIDACTIC_ALGORITHMS',
      component: 'AlgorithmNavigator',
      publicLabel: 'Workups',
    },
    {
      key: 'reference',
      route: '/didactics/?workspace=reference',
      section: 'Section.REFERENCE_LIBRARY',
      component: 'ReferenceLibrary',
      publicLabel: 'Reference Library',
    },
  ];

  return required.map((item) => ({
    ...item,
    appSwitchPresent: app.includes(`case ${item.section}: return <${item.component}`),
    headerPublicLabelPresent: header.includes(`return '${item.publicLabel}'`) || header.includes(`default:\n      return currentSection`),
    sidebarMentionsLabel: sidebar.includes(item.publicLabel) || item.key === 'reference',
    existingValidatorSignal: uxReport.passes.some((pass) =>
      pass.toLowerCase().includes(item.publicLabel.toLowerCase()) ||
      (item.key === 'workups' && pass.toLowerCase().includes('workup')) ||
      (item.key === 'reference' && pass.toLowerCase().includes('reference library'))
    ),
  }));
};

const buildWalkthrough = () => {
  const app = readText('src/App.tsx');
  const tutorialsComponent = readText('src/components/DidacticTutorials.tsx');
  const referenceComponent = readText('src/components/ReferenceLibrary.tsx');
  const workupsComponent = readText('src/components/AlgorithmNavigator.tsx');
  const curriculumComponent = readText('src/components/PathologyCurriculum.tsx');
  const curriculumContent = readText('src/content/curriculum/activeCurriculum.ts');
  const tutorials = readJson('src/content/tutorials/clinicalPathInteractiveTutorials.json');
  const normalizedTutorials = readJson('src/content/tutorials/tutorials.normalized.json');
  const importedTutorials = readJson('src/content/downloads_imports/normalized/tutorials.normalized.json');
  const manifest = readJson('src/content/tutorials/validatedMappingsManifest.json');
  const uxReport = readJson('reports/didactics_learning_ux_report.json');
  const workupsPacket = readJson('reports/workups_routing_tranche_closeout_packet.json');
  const adminCardRisk = inspectAdminCard();
  const imageMediaRisk = inspectImageManifest();
  const publicLabelHits = scanForbiddenPublicLabels([
    { surface: 'DidacticTutorials', text: tutorialsComponent },
    { surface: 'ReferenceLibrary', text: referenceComponent },
    { surface: 'AlgorithmNavigator', text: workupsComponent },
    { surface: 'PathologyCurriculum', text: curriculumComponent },
  ]);

  const routeCoverage = buildRouteCoverage();
  const publicLabelRisk = {
    riskLevel: publicLabelHits.length === 0 && uxReport.failures.length === 0 ? 'low' : 'review',
    forbiddenPublicLabelHits: publicLabelHits,
    uxValidatorFailures: uxReport.failures,
    governedWorkupsLabelSignal: uxReport.passes.some((pass) => pass.includes('Workups')),
    riskSummary:
      publicLabelHits.length === 0 && uxReport.failures.length === 0
        ? 'No focused public-label drift found in inspected study surfaces; existing UX validator is green.'
        : 'Public-label review needed before promotion.',
  };

  const payload = {
    version: 'didactics-qa-walkthrough.v1',
    generatedAt: new Date().toISOString(),
    reviewerScope: {
      workerLane: 'Worker B',
      mode: 'non-mutating QA artifact generation',
      inspectedSurfaces: [
        'tutorials',
        'reference library',
        'workups',
        'curriculum',
        'existing didactics validators',
        'ABPath material admin summary',
        'image/media manifests',
      ],
      writeScope: [
        'scripts/generate_didactics_qa_walkthrough.cjs',
        'scripts/validate_didactics_qa_walkthrough.test.ts',
        'reports/didactics_qa_walkthrough.json',
        'reports/didactics_qa_walkthrough.md',
      ],
    },
    routeCoverage,
    surfaceInventory: {
      appRoutesInspected: countMatches(app, /case Section\./g),
      clinicalPathInteractiveTutorials: tutorials.length,
      normalizedTutorials: normalizedTutorials.length,
      importedNormalizedTutorials: importedTutorials.length,
      validatedMappingRows: manifest.summary?.totalRows || 0,
      validatedMappingValidatedRows: manifest.summary?.validatedRowCount || 0,
      curriculumModules: extractArrayItemCount(curriculumContent, 'activeCurriculumModules'),
      didacticAlgorithms: workupsPacket.routingBaseline?.totalAlgorithms || 0,
      didacticsUxPasses: uxReport.passes.length,
      didacticsUxFailures: uxReport.failures.length,
      workupsClinicalPathAlgorithms: workupsPacket.routingBaseline?.clinicalPathAlgorithms || 0,
    },
    publicLabelRisk,
    imageMediaRisk,
    adminCardRisk,
    topNextCorrections: [
      {
        priority: 'P1',
        area: 'browser proof',
        correction: 'Run a fresh rendered walkthrough for /didactics/?workspace=reference, /tutorials, /algorithms, and /curriculum before calling this browser-validated.',
      },
      {
        priority: 'P1',
        area: 'image/media',
        correction: 'Run images:validate-local and images:validate-rendered after any media manifest change; this artifact only samples manifest resolvability.',
      },
      {
        priority: 'P1',
        area: 'ABPath admin',
        correction: 'Keep AdminView summary-only and reviewer-only; block any full queue import or promotion controls from public bundles.',
      },
      {
        priority: 'P2',
        area: 'public labels',
        correction: 'Preserve Curriculum, Tutorials, Workups, and Reference Library labels; do not reintroduce internal Didactic Algorithms/Tutorials labels in public chrome.',
      },
      {
        priority: 'P2',
        area: 'workups copy',
        correction: 'Maintain CP Workups as bench-facing decision work: live lab question, safest next check, and result decision before optional support links.',
      },
    ],
    validationBasis: {
      existingReports: [
        'reports/didactics_learning_ux_report.json',
        'reports/workups_routing_tranche_closeout_packet.json',
      ],
      notClaimed: [
        'No browser-rendered PASS claimed by this generator.',
        'No runtime source/content mutation performed by this lane.',
      ],
    },
  };

  return payload;
};

const writeMarkdown = (payload) => {
  const routeRows = payload.routeCoverage
    .map(
      (route) =>
        `| ${route.publicLabel} | \`${route.route}\` | ${route.appSwitchPresent ? 'yes' : 'no'} | ${route.existingValidatorSignal ? 'yes' : 'no'} |`
    )
    .join('\n');
  const corrections = payload.topNextCorrections
    .map((item) => `- ${item.priority} ${item.area}: ${item.correction}`)
    .join('\n');
  const md = [
    '# Didactics QA Walkthrough',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    '## Scope',
    '',
    `Worker lane: ${payload.reviewerScope.workerLane}`,
    '',
    `Mode: ${payload.reviewerScope.mode}`,
    '',
    '## Route Coverage',
    '',
    '| Surface | Route | App switch | Existing validator signal |',
    '| --- | --- | --- | --- |',
    routeRows,
    '',
    '## Surface Inventory',
    '',
    `- Clinical Path interactive tutorials: ${payload.surfaceInventory.clinicalPathInteractiveTutorials}`,
    `- Normalized tutorials: ${payload.surfaceInventory.normalizedTutorials}`,
    `- Imported normalized tutorials: ${payload.surfaceInventory.importedNormalizedTutorials}`,
    `- Validated mapping rows: ${payload.surfaceInventory.validatedMappingRows}`,
    `- Curriculum modules: ${payload.surfaceInventory.curriculumModules}`,
    `- Didactic algorithms: ${payload.surfaceInventory.didacticAlgorithms}`,
    `- Didactics UX validator: ${payload.surfaceInventory.didacticsUxPasses} passes, ${payload.surfaceInventory.didacticsUxFailures} failures`,
    '',
    '## Risk Summary',
    '',
    `- Public-label risk: ${payload.publicLabelRisk.riskLevel}. ${payload.publicLabelRisk.riskSummary}`,
    `- Image/media risk: ${payload.imageMediaRisk.riskLevel}. ${payload.imageMediaRisk.riskSummary}`,
    `- ABPath admin-card risk: ${payload.adminCardRisk.riskLevel}. ${payload.adminCardRisk.riskSummary}`,
    '',
    '## ABPath Admin Card',
    '',
    `- Route guarded for admins: ${payload.adminCardRisk.routeGuardedForAdmins ? 'yes' : 'no'}`,
    `- Lazy AdminView: ${payload.adminCardRisk.lazyAdminView ? 'yes' : 'no'}`,
    `- Summary-only import: ${payload.adminCardRisk.importsSummaryOnly ? 'yes' : 'no'}`,
    `- Full queue import detected: ${payload.adminCardRisk.fullQueueImportDetected ? 'yes' : 'no'}`,
    `- Queue entries summarized: ${payload.adminCardRisk.queueEntriesSummarized}`,
    `- Unreviewed queue entries: ${payload.adminCardRisk.unreviewedQueueEntries}`,
    '',
    '## Top Next Corrections',
    '',
    corrections,
    '',
    '## Validation Boundary',
    '',
    payload.validationBasis.notClaimed.map((item) => `- ${item}`).join('\n'),
    '',
  ].join('\n');

  fs.writeFileSync(OUT_MD, md);
};

const main = () => {
  const payload = buildWalkthrough();
  fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
  fs.writeFileSync(OUT_JSON, `${JSON.stringify(payload, null, 2)}\n`);
  writeMarkdown(payload);
  console.log(`[DIDACTICS-QA-WALKTHROUGH] Wrote ${path.relative(REPO_ROOT, OUT_JSON)} and ${path.relative(REPO_ROOT, OUT_MD)}.`);
};

if (require.main === module) {
  main();
}

module.exports = {
  buildRouteCoverage,
  buildWalkthrough,
  inspectAdminCard,
  inspectImageManifest,
  scanForbiddenPublicLabels,
};
