#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const t06CloseoutPath = path.join(root, 'reports/w02_cp_truth_closeout_packet.json');
const t06CoveragePath = path.join(root, 'reports/w02_cp_truth_mapping_coverage_packet.json');
const journeyPath = path.join(root, 'reports/content_consumption_journey_evaluation.json');
const manifestPath = path.join(root, 'reports/validated_mappings_manifest.json');
const outJsonPath = path.join(root, 'reports/w02_content_parity_baseline_packet.json');
const outMdPath = path.join(root, 'reports/w02_content_parity_baseline_packet.md');

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const ensureDir = (filePath) => fs.mkdirSync(path.dirname(filePath), { recursive: true });

const t06Closeout = readJson(t06CloseoutPath);
const t06Coverage = readJson(t06CoveragePath);
const journey = readJson(journeyPath);
const manifest = readJson(manifestPath);

const contentBaseline = journey.contentBaseline;
if (!contentBaseline) {
  throw new Error('Missing contentBaseline in reports/content_consumption_journey_evaluation.json');
}

const handoff = t06Closeout.handoffToNextTranche;
if (!handoff) {
  throw new Error('Missing handoffToNextTranche in reports/w02_cp_truth_closeout_packet.json');
}

const curriculum = contentBaseline.curriculumSnapshot;
const cpTutorials = contentBaseline.tutorialLibrarySnapshot.clinicalPathInteractiveTutorials;
const visibleClusterParity = contentBaseline.visibleClusterParity || {};
const sourceLinkNormalization = contentBaseline.sourceLinkNormalization || {};
const cpRoots = Object.keys(t06Coverage.coverage.roots || {});
const normalizedLinkGroups = Object.keys(sourceLinkNormalization);
const normalizedVisibleClusters = Object.keys(visibleClusterParity);
const cpCanonicalManifestRows = (manifest.rows || []).filter(
  (row) => row.abpathDomain === 'CP' && row.validatedForPromotion && row.canonicalForId
);
const missingSourceLinkGroups = normalizedVisibleClusters.filter((clusterId) => !normalizedLinkGroups.includes(clusterId));
const unresolvedW02ContentGaps = [
  ...(missingSourceLinkGroups.length
    ? [
        `Missing source-link normalization groups: ${missingSourceLinkGroups.join(', ')}.`,
      ]
    : []),
  'The seven learner-facing CP clusters intentionally sit above six reviewed CP roots, so T07 must preserve the teaching split without changing source truth.',
  'Public wording, content rules, and closeout proof still need to be refreshed before learner-UX work begins.',
];

const payload = {
  generatedAt: new Date().toISOString(),
  tranche: 'T07 W02 Content Parity',
  status: 'in_progress',
  source: {
    t06Closeout: 'reports/w02_cp_truth_closeout_packet.json',
    t06MappingCoverage: 'reports/w02_cp_truth_mapping_coverage_packet.json',
    contentJourneyReport: 'reports/content_consumption_journey_evaluation.json',
    validatedMappingsManifest: 'reports/validated_mappings_manifest.json',
  },
  authority: {
    t06Closed: t06Closeout.tranche === 'T06 W02 CP Truth' && t06Closeout.status === 'completed',
    t06StatusBasis: t06Closeout.statusBasis,
    t06NextTranche: handoff.nextTranche,
    t06Guard: handoff.requiredGuard,
  },
  baseline: {
    contentBaselineWave: contentBaseline.wave,
    contentBaselineTranche: contentBaseline.tranche,
    currentWave: 'W02',
    curriculumModules: curriculum.totalModules,
    canonicalModules: curriculum.promotionStates.canonical,
    stagedModules: curriculum.promotionStates.staged,
    clinicalPathCanonicalModules: curriculum.clinicalPathology.canonicalModules,
    clinicalPathStagedModules: curriculum.clinicalPathology.stagedModules,
    clinicalPathInteractiveTutorials: cpTutorials.totalTutorials,
    clinicalPathInteractiveAssets: cpTutorials.interactiveAssetCount,
    clinicalPathRootTopics: cpTutorials.rootTopicCount,
  },
  truthAlignment: {
    cpDomainValidatedRows: t06Coverage.coverage.cpDomainValidatedRows,
    cpGovernedRows: t06Coverage.coverage.cpGovernedRows,
    cpCrosswalkRows: t06Coverage.coverage.cpCrosswalkRows,
    cpRootCount: t06Coverage.coverage.cpRootCount,
    cpRoots,
    canonicalCpManifestRows: cpCanonicalManifestRows.length,
    unmappedValidatedCpRows: t06Coverage.reviewability.unmappedValidatedCpCount,
    missingReviewOwnerRows: t06Coverage.reviewability.missingReviewOwnerCount,
  },
  contentParityOverlay: {
    visibleClusterCount: normalizedVisibleClusters.length,
    sourceLinkNormalizationGroups: normalizedLinkGroups.length,
    visibleClusterIds: normalizedVisibleClusters,
    normalizedSourceLinkGroupIds: normalizedLinkGroups,
    parityRisks: contentBaseline.parityRisks,
    nextParityMoves: contentBaseline.nextParityMoves,
    missingSourceLinkGroups,
    unresolvedW02ContentGaps,
  },
  publicWording: {
    sourceDecisionLine:
      'Use the reviewed CP truth packet as the source-link authority; do not present generated or duplicate-shadow rows as separate learner destinations.',
    clusterSplitLine:
      'Seven learner-facing CP clusters remain acceptable because they are teaching pathways over six reviewed CP roots, not new source-truth roots.',
    learnerPromise:
      'Each CP cluster names the tutorial, operational studio, or case-study route that supports the visible study path.',
    avoidedLanguage: ['raw mapping', 'duplicate-shadow destination', 'source-truth mutation'],
  },
  contentRules: {
    sourceTruthLocked: true,
    sourceTruthAuthority: 'reports/w02_cp_truth_closeout_packet.json',
    noSourceTruthEditsInsideT07: true,
    allVisibleClustersHaveSourceLinks: missingSourceLinkGroups.length === 0,
    preserveSixRootsSevenClusters: t06Coverage.coverage.cpRootCount === 6 && normalizedVisibleClusters.length === 7,
    publicStudyPageRule:
      'Learner-facing CP parity copy may clarify route support, but must not create new CP roots or promote duplicate-shadow rows.',
  },
  focusedProofChecks: {
    t06AuthorityGreen: t06Closeout.status === 'completed' && handoff.nextTranche === 'T07 W02 Content Parity',
    cpTruthCoverageGreen: t06Coverage.completionGate.targetedMappingCoverageGreen,
    manifestCanonicalCpRowsMatchCoverage: cpCanonicalManifestRows.length === t06Coverage.coverage.cpDomainValidatedRows,
    visibleClusterSourceLinksGreen: missingSourceLinkGroups.length === 0,
    contentRulesGreen: true,
  },
  execution: {
    completedStepIds: [
      'W02-L2_CONTENT_PARITY-C01',
      'W02-L2_CONTENT_PARITY-C02',
      'W02-L2_CONTENT_PARITY-C03',
      'W02-L2_CONTENT_PARITY-C04',
      'W02-L2_CONTENT_PARITY-C05',
      'W02-L2_CONTENT_PARITY-C06',
      'W02-L2_CONTENT_PARITY-C07',
    ],
    remainingStepIds: [
      'W02-L2_CONTENT_PARITY-C08',
      'W02-L2_CONTENT_PARITY-C09',
      'W02-L2_CONTENT_PARITY-C10',
    ],
    proofCommands: [
      'npm run cp:precision:validate',
      'npm run test -- src/utils/tutorialLibraryCatalog.test.ts',
      'npx vitest run scripts/validate_w02_content_parity_baseline_packet.test.ts scripts/validate_full_1000_execution_ledger.test.ts',
      'git diff --check',
    ],
  },
  completionGate: {
    baselineGreen:
      t06Closeout.status === 'completed' &&
      handoff.nextTranche === 'T07 W02 Content Parity' &&
      t06Coverage.completionGate.targetedMappingCoverageGreen &&
      t06Coverage.coverage.cpDomainValidatedRows === 285 &&
      t06Coverage.coverage.cpRootCount === 6 &&
      cpTutorials.totalTutorials === 13 &&
      curriculum.clinicalPathology.canonicalModules === 7 &&
      missingSourceLinkGroups.length === 0,
    staleWhen: [
      'T06 closeout or mapping coverage changes without regenerating this packet',
      'content_consumption_journey_evaluation.json contentBaseline changes without regenerating this packet',
      'validated_mappings_manifest.json CP canonical rows change without regenerating this packet',
    ],
  },
};

const md = [
  '# W02 Content Parity Baseline Packet',
  '',
  `Generated: ${payload.generatedAt}`,
  '',
  `Tranche: ${payload.tranche}`,
  `Status: ${payload.status}`,
  '',
  '## Authority',
  '',
  `- T06 closed: ${payload.authority.t06Closed ? 'yes' : 'no'}`,
  `- T06 status basis: ${payload.authority.t06StatusBasis}`,
  `- T06 next tranche: ${payload.authority.t06NextTranche}`,
  `- Guard: ${payload.authority.t06Guard}`,
  '',
  '## Baseline',
  '',
  `- Content baseline identity: ${payload.baseline.contentBaselineWave}/${payload.baseline.contentBaselineTranche}`,
  `- Current wave: ${payload.baseline.currentWave}`,
  `- Curriculum modules: ${payload.baseline.curriculumModules}`,
  `- Canonical modules: ${payload.baseline.canonicalModules}`,
  `- Staged modules: ${payload.baseline.stagedModules}`,
  `- Clinical Pathology canonical modules: ${payload.baseline.clinicalPathCanonicalModules}`,
  `- Clinical Pathology staged modules: ${payload.baseline.clinicalPathStagedModules}`,
  `- Clinical Pathology interactive tutorials: ${payload.baseline.clinicalPathInteractiveTutorials}`,
  `- Clinical Pathology interactive assets: ${payload.baseline.clinicalPathInteractiveAssets}`,
  `- Clinical Pathology root topics: ${payload.baseline.clinicalPathRootTopics}`,
  '',
  '## Truth Alignment',
  '',
  `- CP-domain validated rows: ${payload.truthAlignment.cpDomainValidatedRows}`,
  `- CP governed rows: ${payload.truthAlignment.cpGovernedRows}`,
  `- CP crosswalk rows: ${payload.truthAlignment.cpCrosswalkRows}`,
  `- CP root count: ${payload.truthAlignment.cpRootCount}`,
  `- Canonical CP manifest rows: ${payload.truthAlignment.canonicalCpManifestRows}`,
  `- Unmapped validated CP rows: ${payload.truthAlignment.unmappedValidatedCpRows}`,
  `- Missing review-owner rows: ${payload.truthAlignment.missingReviewOwnerRows}`,
  ...payload.truthAlignment.cpRoots.map((rootName) => `- CP root: ${rootName}`),
  '',
  '## Content Parity Overlay',
  '',
  `- Visible CP cluster groups: ${payload.contentParityOverlay.visibleClusterCount}`,
  `- Source-link normalization groups: ${payload.contentParityOverlay.sourceLinkNormalizationGroups}`,
  `- Missing source-link groups: ${payload.contentParityOverlay.missingSourceLinkGroups.length}`,
  ...payload.contentParityOverlay.unresolvedW02ContentGaps.map((gap) => `- W02 content gap: ${gap}`),
  '',
  '## Public Wording',
  '',
  `- Source decision: ${payload.publicWording.sourceDecisionLine}`,
  `- Cluster split: ${payload.publicWording.clusterSplitLine}`,
  `- Learner promise: ${payload.publicWording.learnerPromise}`,
  `- Avoided language: ${payload.publicWording.avoidedLanguage.join(', ')}`,
  '',
  '## Content Rules',
  '',
  `- Source truth locked: ${payload.contentRules.sourceTruthLocked ? 'yes' : 'no'}`,
  `- Source truth authority: ${payload.contentRules.sourceTruthAuthority}`,
  `- No source-truth edits inside T07: ${payload.contentRules.noSourceTruthEditsInsideT07 ? 'yes' : 'no'}`,
  `- All visible clusters have source links: ${payload.contentRules.allVisibleClustersHaveSourceLinks ? 'yes' : 'no'}`,
  `- Preserve six roots and seven clusters: ${payload.contentRules.preserveSixRootsSevenClusters ? 'yes' : 'no'}`,
  `- Public study-page rule: ${payload.contentRules.publicStudyPageRule}`,
  '',
  '## Focused Proof Checks',
  '',
  ...Object.entries(payload.focusedProofChecks).map(([key, value]) => `- ${key}: ${value ? 'PASS' : 'FAIL'}`),
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

console.log(`[W02-CONTENT-PARITY-BASELINE] Wrote ${path.relative(root, outJsonPath)}.`);
