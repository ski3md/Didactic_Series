#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');

const paths = {
  curatedLectures: 'src/content/lectures/lectures.normalized.json',
  guWhoLectures: 'src/content/lectures/gu_who_complete_lectures.normalized.json',
  downloadsLectures: 'src/content/downloads_imports/normalized/lectures.normalized.json',
  customLectures: 'src/content/lectures/customLectures.ts',
  lectureCatalog: 'src/utils/lectureLibraryCatalog.ts',
  lectureNavigation: 'src/utils/lectureLibraryNavigation.ts',
  interactiveCatalog: 'src/utils/interactiveLectureCatalog.ts',
  studyCatalogScopes: 'src/utils/studyCatalogScopes.ts',
  didacticLectures: 'src/components/DidacticLectures.tsx',
  abpathContracts: 'src/content/lectures/lectureAbpathContracts.json',
  didacticsUxReport: 'reports/didactics_learning_ux_report.json',
  jsonOut: 'reports/lectures_qa_walkthrough.json',
  markdownOut: 'reports/lectures_qa_walkthrough.md',
};

const readText = (relativePath) => fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(readText(relativePath));
const ensureDir = (relativePath) => fs.mkdirSync(path.dirname(path.join(repoRoot, relativePath)), { recursive: true });

const unique = (values) => Array.from(new Set(values.filter(Boolean))).sort((left, right) => left.localeCompare(right));

const countArrayItems = (source, propertyName) => {
  const match = source.match(new RegExp(`${propertyName}:\\s*\\[([\\s\\S]*?)\\]\\s*,`, 'm'));
  if (!match) return 0;
  return (match[1].match(/\n\s*\{/g) || []).length;
};

const extractCustomLectures = () => {
  const source = readText(paths.customLectures);
  const lectureBlocks = source.match(/\n\s*\{\n\s*id:\s*'[^']+'[\s\S]*?\n\s*\},\n(?=\];|$)/g) || [];
  return lectureBlocks.map((block) => ({
    id: block.match(/id:\s*'([^']+)'/)?.[1],
    title: block.match(/title:\s*'([^']+)'/)?.[1],
    sourceRepo: block.match(/sourceRepo:\s*'([^']+)'/)?.[1] || 'didactic_series',
    sourcePath: paths.customLectures,
    category: block.match(/category:\s*'([^']+)'/)?.[1] || null,
    summary: block.match(/summary:\s*'([^']+)'/)?.[1] || null,
    learningObjectives: { length: countArrayItems(block, 'learningObjectives') },
    slides: { length: countArrayItems(block, 'slides') },
    mcqs: { length: countArrayItems(block, 'mcqs') },
    flashcards: { length: countArrayItems(block, 'flashcards') },
  }));
};

const sourceRows = () => {
  const curated = readJson(paths.curatedLectures);
  const guWho = readJson(paths.guWhoLectures);
  const custom = extractCustomLectures();
  const downloads = readJson(paths.downloadsLectures).filter((lecture) => lecture.sourceRepo === 'ioc-next-app');
  return {
    curated,
    custom,
    guWho,
    corePrinciples: downloads,
    promoted: [
      ...curated.map((lecture) => ({ ...lecture, sourceBucket: 'curated-normalized' })),
      ...custom.map((lecture) => ({ ...lecture, sourceBucket: 'custom-local' })),
      ...guWho.map((lecture) => ({ ...lecture, sourceBucket: 'gu-who-complete' })),
      ...downloads.map((lecture) => ({ ...lecture, sourceBucket: 'core-principles-import' })),
    ],
  };
};

const countBy = (rows, getter) =>
  rows.reduce((accumulator, row) => {
    const key = getter(row) || 'Unknown';
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});

const getLength = (value) => {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value.length === 'number') return value.length;
  return 0;
};

const contractCoverage = (contracts, promoted) => {
  const promotedIds = new Set(promoted.map((lecture) => lecture.id));
  const contractIds = new Set(contracts.lectures.map((lecture) => lecture.lectureId));
  const minimums = contracts.globalParameters.minimums;
  const requiredTabs = contracts.globalParameters.requiredTabs;
  const perLecture = contracts.lectures.map((lecture) => {
    const tabNames = Object.keys(lecture.contractParameters || {});
    const missingTabs = requiredTabs.filter((tab) => !tabNames.includes(tab));
    return {
      lectureId: lecture.lectureId,
      title: lecture.title,
      track: lecture.track,
      contentArea: lecture.contentArea,
      sourceLabel: lecture.sourceLabel,
      anchorCount: lecture.abpathAnchors?.length || 0,
      requiredTabCount: tabNames.length,
      missingTabs,
      promotionGate: lecture.promotionGate,
      warningCount: lecture.contractWarnings?.length || 0,
      warnings: lecture.contractWarnings || [],
      meetsAnchorMinimum: (lecture.abpathAnchors?.length || 0) >= minimums.abpathAnchors,
      meetsTabContract: missingTabs.length === 0,
      meetsObjectiveMinimum: (lecture.minimums?.objectives || 0) >= minimums.objectives,
    };
  });

  return {
    version: contracts.version,
    requiredTabs,
    globalMinimums: minimums,
    contractLectures: contracts.lectures.length,
    promotedLectureCount: promoted.length,
    lecturesWithContracts: promoted.filter((lecture) => contractIds.has(lecture.id)).length,
    contractsWithoutPromotedLecture: contracts.lectures
      .filter((lecture) => !promotedIds.has(lecture.lectureId))
      .map((lecture) => lecture.lectureId),
    promotedLecturesWithoutContract: promoted
      .filter((lecture) => !contractIds.has(lecture.id))
      .map((lecture) => lecture.id),
    lecturesMeetingAnchorMinimum: perLecture.filter((lecture) => lecture.meetsAnchorMinimum).length,
    lecturesMeetingTabContract: perLecture.filter((lecture) => lecture.meetsTabContract).length,
    warningCount: perLecture.reduce((sum, lecture) => sum + lecture.warningCount, 0),
    warnings: perLecture
      .filter((lecture) => lecture.warningCount > 0)
      .map((lecture) => ({
        lectureId: lecture.lectureId,
        title: lecture.title,
        warnings: lecture.warnings,
      })),
    byTrack: countBy(contracts.lectures, (lecture) => lecture.track),
    bySourceLabel: countBy(contracts.lectures, (lecture) => lecture.sourceLabel),
    perLecture,
  };
};

const buildRouteSignals = () => {
  const didacticLectures = readText(paths.didacticLectures);
  const navigation = readText(paths.lectureNavigation);
  const catalog = readText(paths.lectureCatalog);
  const interactive = readText(paths.interactiveCatalog);
  const studyScopes = readText(paths.studyCatalogScopes);
  const uxReport = readJson(paths.didacticsUxReport);

  const requiredPositiveSignals = [
    ['promotedLectures imported by DidacticLectures', didacticLectures.includes('promotedLectures')],
    ['lecture selection writes study destination', didacticLectures.includes("pushStudyDestination('lectures'")],
    ['lecture workspace consumes query/session intent', didacticLectures.includes('consumeLectureLibraryIntent')],
    ['lecture workspace restores destination state', didacticLectures.includes('restoreStudyDestination')],
    ['lecture workspace resolves destination for render', didacticLectures.includes('resolveStudyDestinationForRender')],
    ['lecture study tree groups by public category', studyScopes.includes('buildLectureStudyTree')],
    ['lecture navigation stores selectedId/query/track intent', navigation.includes('LectureLibraryIntent')],
    ['interactive lecture augmentation is the fallback enrichment path', interactive.includes('buildLectureAbpathAugmentation')],
    ['landing copy exposes Current review and Next action', didacticLectures.includes('Current review: Lectures') && didacticLectures.includes('Next: open one topic')],
    ['didactics UX validator reports lecture route passes', uxReport.passes.some((pass) => pass.includes('Lectures routes to DidacticLectures'))],
  ];

  const positiveSignals = requiredPositiveSignals
    .filter(([, passed]) => passed)
    .map(([signal]) => signal);
  const missingSignals = requiredPositiveSignals
    .filter(([, passed]) => !passed)
    .map(([signal]) => signal);

  return {
    checkedSources: [
      paths.didacticLectures,
      paths.lectureCatalog,
      paths.lectureNavigation,
      paths.interactiveCatalog,
      paths.studyCatalogScopes,
      paths.didacticsUxReport,
    ],
    positiveSignals,
    missingSignals,
    currentUxReportFailures: uxReport.failures || [],
  };
};

const buildBrokenMissingRisks = (coverage, promoted) => {
  const rawObjectiveMissing = promoted
    .filter((lecture) => getLength(lecture.learningObjectives) === 0)
    .map((lecture) => lecture.id);
  const rawSlidesMissing = promoted
    .filter((lecture) => getLength(lecture.slides) === 0)
    .map((lecture) => lecture.id);
  const rawQuestionsMissing = promoted
    .filter((lecture) => getLength(lecture.mcqs) === 0 && getLength(lecture.flashcards) === 0)
    .map((lecture) => lecture.id);

  const risks = [];
  if (coverage.promotedLecturesWithoutContract.length > 0) {
    risks.push({
      severity: 'high',
      category: 'missing-contract',
      signal: `${coverage.promotedLecturesWithoutContract.length} promoted lectures lack ABPath contracts.`,
      affectedLectures: coverage.promotedLecturesWithoutContract,
      reviewerInterpretation: 'A learner-facing lecture would be route-visible without a governed ABPath contract.',
    });
  }
  if (coverage.contractsWithoutPromotedLecture.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'orphan-contract',
      signal: `${coverage.contractsWithoutPromotedLecture.length} ABPath contracts lack promoted lecture records.`,
      affectedLectures: coverage.contractsWithoutPromotedLecture,
      reviewerInterpretation: 'A contract may describe a lecture not currently reachable through the promoted library.',
    });
  }
  if (rawSlidesMissing.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'fallback-scaffold-dependence',
      signal: `${rawSlidesMissing.length} promoted lectures have no raw slide records before interactive ABPath augmentation.`,
      affectedLectures: rawSlidesMissing,
      reviewerInterpretation: 'The app can still fill these through augmentation, but faculty review should verify they read as complete lectures rather than scaffold cards.',
    });
  }
  if (rawObjectiveMissing.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'objective-source-gap',
      signal: `${rawObjectiveMissing.length} promoted lectures have no source learning-objective array before augmentation.`,
      affectedLectures: rawObjectiveMissing,
      reviewerInterpretation: 'ABPath augmentation supplies objectives, but the source lecture payload itself does not carry objective parity.',
    });
  }
  if (rawQuestionsMissing.length > 0) {
    risks.push({
      severity: 'medium',
      category: 'retrieval-practice-source-gap',
      signal: `${rawQuestionsMissing.length} promoted lectures have no source MCQ/flashcard records before augmentation.`,
      affectedLectures: rawQuestionsMissing,
      reviewerInterpretation: 'Question tabs rely on generated ABPath augmentation unless richer reviewed questions are attached.',
    });
  }
  for (const warning of coverage.warnings) {
    risks.push({
      severity: 'medium',
      category: 'contract-warning',
      signal: `${warning.title} carries ABPath contract warning(s).`,
      affectedLectures: [warning.lectureId],
      reviewerInterpretation: warning.warnings.join(' '),
    });
  }
  return risks;
};

const buildLearnerRisks = (coverage, routeSignals) => {
  const risks = [];
  if (routeSignals.missingSignals.length > 0) {
    risks.push({
      severity: 'high',
      category: 'routing-signal-missing',
      signal: 'One or more expected lecture navigation signals are absent.',
      evidence: routeSignals.missingSignals,
      correction: 'Repair route-state wiring before declaring lecture navigation stable.',
    });
  }
  if (coverage.warnings.some((warning) => warning.lectureId === 'renal_mass_eval')) {
    risks.push({
      severity: 'medium',
      category: 'learner-contract-wording-risk',
      signal: 'Renal Mass Evaluation is contract-covered but warning notes kidney medical-process anchors are stronger than renal neoplasm anchors.',
      correction: 'Add renal tumor-specific ABPath anchors or visible caveat language before presenting the lecture as a fully tumor-specific board map.',
    });
  }
  if (coverage.warnings.some((warning) => warning.lectureId === 'ioc-overview-urologic-oncology')) {
    risks.push({
      severity: 'medium',
      category: 'routing-label-scope-risk',
      signal: 'Renal Pathology: Core Principles carries a warning that kidney and urothelial/bladder anchors are blended.',
      correction: 'Separate renal-oncology versus urothelial/bladder routing or make the scope boundary visible in the lecture card.',
    });
  }
  if (coverage.warnings.some((warning) => warning.lectureId === 'ioc-overview-gynecologic-oncology')) {
    risks.push({
      severity: 'medium',
      category: 'taxonomy-contract-risk',
      signal: 'Gynecologic Pathology contract is governed by path-context filtering because the normalized AP source lacks a clean ap_gyn category.',
      correction: 'Normalize gynecologic AP taxonomy so learner labels and contract source categories agree.',
    });
  }
  return risks;
};

const buildTopCorrections = (brokenMissingRisks, learnerRisks) => {
  const corrections = [
    {
      priority: 1,
      action: 'Resolve the three ABPath contract warnings before promotion language says these lectures are fully source-clean.',
      source: 'src/content/lectures/lectureAbpathContracts.json',
    },
    {
      priority: 2,
      action: 'Review the nine core-principles lectures with zero raw slides/objectives/questions and decide which should get authored content versus explicit scaffold status.',
      source: 'src/content/downloads_imports/normalized/lectures.normalized.json',
    },
    {
      priority: 3,
      action: 'Keep route labels, card subtitles, and lecture scope boundaries aligned for renal/urologic and gynecologic topics.',
      source: 'src/components/DidacticLectures.tsx',
    },
    {
      priority: 4,
      action: 'Add reviewer-approved image assets where tissue-layer scaffolds are empty or checklist-only.',
      source: 'src/utils/lectureAbpathAugmentation.ts',
    },
  ];
  if (brokenMissingRisks.some((risk) => risk.category === 'missing-contract')) {
    corrections.unshift({
      priority: 0,
      action: 'Create ABPath contracts for every promoted lecture before further lecture publication.',
      source: 'src/content/lectures/lectureAbpathContracts.json',
    });
  }
  if (learnerRisks.some((risk) => risk.category === 'routing-signal-missing')) {
    corrections.unshift({
      priority: 0,
      action: 'Repair missing lecture routing signals before further QA.',
      source: 'src/components/DidacticLectures.tsx',
    });
  }
  return corrections.map((correction, index) => ({ ...correction, priority: index + 1 }));
};

const toMarkdown = (report) => {
  const lines = [];
  lines.push('# Lectures QA Walkthrough');
  lines.push('');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Counts');
  lines.push('');
  lines.push(`- Promoted lectures: ${report.lectureCounts.promotedTotal}`);
  lines.push(`- Curated normalized: ${report.lectureCounts.bySource.curatedNormalized}`);
  lines.push(`- Custom local: ${report.lectureCounts.bySource.customLocal}`);
  lines.push(`- GU WHO-complete: ${report.lectureCounts.bySource.guWhoComplete}`);
  lines.push(`- Core principles import: ${report.lectureCounts.bySource.corePrinciplesImport}`);
  lines.push(`- Categories: ${Object.entries(report.lectureCounts.byCategory).map(([category, count]) => `${category} (${count})`).join(', ')}`);
  lines.push('');
  lines.push('## ABPath Contract Coverage');
  lines.push('');
  lines.push(`- Contract version: ${report.abpathCoverage.version}`);
  lines.push(`- Lectures with contracts: ${report.abpathCoverage.lecturesWithContracts}/${report.abpathCoverage.promotedLectureCount}`);
  lines.push(`- Required tabs present: ${report.abpathCoverage.lecturesMeetingTabContract}/${report.abpathCoverage.contractLectures}`);
  lines.push(`- Anchor minimum met: ${report.abpathCoverage.lecturesMeetingAnchorMinimum}/${report.abpathCoverage.contractLectures}`);
  lines.push(`- Contract warnings: ${report.abpathCoverage.warningCount}`);
  lines.push('');
  for (const warning of report.abpathCoverage.warnings) {
    lines.push(`- ${warning.title}: ${warning.warnings.join(' ')}`);
  }
  lines.push('');
  lines.push('## Broken Or Missing Risk');
  lines.push('');
  for (const risk of report.brokenMissingRisks) {
    lines.push(`- ${risk.severity.toUpperCase()} ${risk.category}: ${risk.signal}`);
  }
  lines.push('');
  lines.push('## Learner Wording And Routing Risk');
  lines.push('');
  lines.push(`- Positive routing signals: ${report.navigationSignals.positiveSignals.length}`);
  lines.push(`- Missing routing signals: ${report.navigationSignals.missingSignals.length}`);
  for (const risk of report.learnerWordingRoutingRisks) {
    lines.push(`- ${risk.severity.toUpperCase()} ${risk.category}: ${risk.signal}`);
  }
  lines.push('');
  lines.push('## Top Next Corrections');
  lines.push('');
  for (const correction of report.topNextCorrections) {
    lines.push(`${correction.priority}. ${correction.action} (${correction.source})`);
  }
  lines.push('');
  lines.push('## Review Boundary');
  lines.push('');
  for (const guardrail of report.reviewBoundary.guardrails) {
    lines.push(`- ${guardrail}`);
  }
  lines.push('');
  return `${lines.join('\n')}\n`;
};

const main = () => {
  const rows = sourceRows();
  const contracts = readJson(paths.abpathContracts);
  const routeSignals = buildRouteSignals();
  const coverage = contractCoverage(contracts, rows.promoted);
  const brokenMissingRisks = buildBrokenMissingRisks(coverage, rows.promoted);
  const learnerWordingRoutingRisks = buildLearnerRisks(coverage, routeSignals);

  const report = {
    version: 'lectures-qa-walkthrough.v1',
    generatedAt: new Date().toISOString(),
    mode: 'reviewer-readable QA artifact; runtime components and content are read-only for this tranche',
    sources: {
      data: [
        paths.curatedLectures,
        paths.customLectures,
        paths.guWhoLectures,
        paths.downloadsLectures,
        paths.abpathContracts,
      ],
      navigation: routeSignals.checkedSources,
    },
    lectureCounts: {
      promotedTotal: rows.promoted.length,
      bySource: {
        curatedNormalized: rows.curated.length,
        customLocal: rows.custom.length,
        guWhoComplete: rows.guWho.length,
        corePrinciplesImport: rows.corePrinciples.length,
      },
      byTrack: {
        curated: rows.curated.length + rows.custom.length + rows.guWho.length,
        corePrinciples: rows.corePrinciples.length,
      },
      byCategory: countBy(rows.promoted, (lecture) => lecture.category === 'GU Pathology' ? 'Genitourinary Pathology' : lecture.category),
      rawContentGaps: {
        lecturesWithNoRawObjectives: rows.promoted.filter((lecture) => getLength(lecture.learningObjectives) === 0).length,
        lecturesWithNoRawSlides: rows.promoted.filter((lecture) => getLength(lecture.slides) === 0).length,
        lecturesWithNoRawQuestions: rows.promoted.filter((lecture) => getLength(lecture.mcqs) === 0 && getLength(lecture.flashcards) === 0).length,
      },
    },
    abpathCoverage: coverage,
    navigationSignals: routeSignals,
    brokenMissingRisks,
    learnerWordingRoutingRisks,
    topNextCorrections: buildTopCorrections(brokenMissingRisks, learnerWordingRoutingRisks),
    reviewBoundary: {
      workerLane: 'Worker A',
      allowedWriteScope: [
        paths.jsonOut,
        paths.markdownOut,
        'scripts/generate_lectures_qa_walkthrough.cjs',
        'scripts/validate_lectures_qa_walkthrough.test.ts',
      ],
      guardrails: [
        'This report does not mutate runtime components or lecture content.',
        'Generated mappings and scaffolds remain reviewer evidence, not automatically promoted teaching truth.',
        'Navigation signals are source-level QA signals; browser-visible proof remains separate unless a browser walkthrough is explicitly run.',
      ],
    },
  };

  ensureDir(paths.jsonOut);
  fs.writeFileSync(path.join(repoRoot, paths.jsonOut), `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(path.join(repoRoot, paths.markdownOut), toMarkdown(report));
  console.log(`[LECTURES-QA] Wrote ${paths.jsonOut} and ${paths.markdownOut}.`);
};

main();
