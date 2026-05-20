#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const skiCortexRoot = '/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX';

const contractPath = path.join(root, 'src/content/contracts/pthfndrDidacticsLearningUxContract.json');
const agentsPath = path.join(root, 'AGENTS.md');
const codexAlignmentContractPath = path.join(root, 'docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md');
const learningUxContractMdPath = path.join(root, 'docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md');
const adapterPath = path.join(skiCortexRoot, 'adapters/didactic_series/adapter.yaml');
const tutorialsPath = path.join(root, 'src/components/DidacticTutorials.tsx');
const lecturesPath = path.join(root, 'src/components/DidacticLectures.tsx');
const algorithmsPath = path.join(root, 'src/components/AlgorithmNavigator.tsx');
const curriculumPath = path.join(root, 'src/components/PathologyCurriculum.tsx');
const headerPath = path.join(root, 'src/components/Header.tsx');
const homePath = path.join(root, 'src/components/Home.tsx');
const mobileHeaderPath = path.join(root, 'src/components/MobileHeader.tsx');
const sidebarPath = path.join(root, 'src/components/Sidebar.tsx');
const workspaceNavPath = path.join(root, 'src/components/DidacticWorkspaceNav.tsx');
const appPath = path.join(root, 'src/App.tsx');
const referencePath = path.join(root, 'src/components/ReferenceLibrary.tsx');
const stateStoragePath = path.join(root, 'src/utils/viewStateStorage.ts');
const studyDestinationStatePath = path.join(root, 'src/utils/studyDestinationState.ts');
const sectionNavPath = path.join(root, 'src/hooks/useSectionNavigation.ts');

const tutorialCatalogPath = path.join(root, 'src/content/tutorials/clinicalPathInteractiveTutorials.json');
const validatedManifestPath = path.join(root, 'src/content/tutorials/validatedMappingsManifest.json');
const algorithmCatalogPath = path.join(root, 'src/content/algorithms/algorithms.normalized.json');
const curriculumCatalogPath = path.join(root, 'src/content/curriculum/activeCurriculum.ts');

const reportJsonPath = path.join(root, 'reports/didactics_learning_ux_report.json');
const reportMdPath = path.join(root, 'reports/didactics_learning_ux_report.md');

const CURRICULUM_GENERIC_CTA_RULES = [
  { pattern: /buttonLabel:\s*'Open tutorial'/, guidance: 'Use a destination-specific tutorial label.' },
  { pattern: /buttonLabel:\s*'Open algorithms'/, guidance: 'Use a destination-specific algorithm label.' },
  { pattern: /buttonLabel:\s*'Open images'/, guidance: 'Use a destination-specific image-review label.' },
  { pattern: /buttonLabel:\s*'Start practice'/, guidance: 'Use a destination-specific practice label.' },
  { pattern: /buttonLabel:\s*'Start lecture'/, guidance: 'Use a destination-specific lecture label.' },
];

const WORKSPACE_EXPECTATIONS = [
  {
    workspaceKey: 'curriculum',
    workspaceKeyLiteral: 'WorkspaceKey.CURRICULUM',
    sectionLiteral: 'Section.PATHOLOGY_CURRICULUM',
    label: 'Curriculum',
    labelLiteral: 'WORKSPACE_LABELS[WorkspaceKey.CURRICULUM]',
    componentName: 'PathologyCurriculum',
    componentIdentityPatterns: [/\bStart here\b/, /\bCommon diagnostic patterns\b/, /\bChoose another module\b/],
  },
  {
    workspaceKey: 'lectures',
    workspaceKeyLiteral: 'WorkspaceKey.LECTURES',
    sectionLiteral: 'Section.DIDACTIC_LECTURES',
    label: 'Lectures',
    labelLiteral: 'WORKSPACE_LABELS[WorkspaceKey.LECTURES]',
    componentName: 'DidacticLectures',
    destinationWorkspace: 'lectures',
    componentIdentityPatterns: [/\bLectures\b/, /\bChoose a teaching topic\b/, /\bResume last lecture\b/],
    landingSummaryPatterns: [/Current review:\s*Lectures/, /Next:\s*open one topic/],
  },
  {
    workspaceKey: 'tutorials',
    workspaceKeyLiteral: 'WorkspaceKey.TUTORIALS',
    sectionLiteral: 'Section.DIDACTIC_TUTORIALS',
    label: 'Tutorials',
    labelLiteral: 'WORKSPACE_LABELS[WorkspaceKey.TUTORIALS]',
    componentName: 'DidacticTutorials',
    destinationWorkspace: 'tutorials',
    componentIdentityPatterns: [/\bTutorials\b/, /\bResume topic\b/, /\bOpen the reviewed topic instead\b/],
    landingSummaryPatterns: [/Current review:\s*Tutorials/, /Next:\s*choose one major topic/],
  },
  {
    workspaceKey: 'algorithms',
    workspaceKeyLiteral: 'WorkspaceKey.ALGORITHMS',
    sectionLiteral: 'Section.DIDACTIC_ALGORITHMS',
    label: 'Workups',
    labelLiteral: 'WORKSPACE_LABELS[WorkspaceKey.ALGORITHMS]',
    componentName: 'AlgorithmNavigator',
    destinationWorkspace: 'algorithms',
    componentIdentityPatterns: [/\bWorkups\b/, /\bDiagnostic areas\b/, /\bChoose a diagnostic workup\b/],
    landingSummaryPatterns: [/Current review:\s*Workups/, /Next:\s*open one diagnostic area/],
  },
];

const ensure = (condition, passMessage, failMessage, passes, failures) => {
  if (condition) {
    passes.push(passMessage);
  } else {
    failures.push(failMessage);
  }
};

const escapeRegExp = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildPhrasePattern = (phrase, { wholeWord = false, caseSensitive = false } = {}) => {
  const source = escapeRegExp(phrase).replace(/\s+/g, '\\s+');
  return new RegExp(wholeWord ? `\\b${source}\\b` : source, caseSensitive ? 'g' : 'gi');
};

const getSemanticClarity = (contract = {}) => contract.semanticClarity || {};

const getPlainLanguageRules = (contract = {}) =>
  (getSemanticClarity(contract).plainLanguage?.forbiddenPublicLabels || []).map((phrase) => ({
    phrase,
    pattern: buildPhrasePattern(phrase, { wholeWord: true }),
    guidance: 'Replace with the section name, the actual topic, or a direct study instruction.',
  }));

const getForbiddenSelfNarrationRules = (contract = {}) =>
  (getSemanticClarity(contract).antiMetaNarration?.forbiddenPublicPhrases || []).map((phrase) => buildPhrasePattern(phrase));

const getPathologyVernacularDriftRules = (contract = {}) => {
  const pathologyVernacular = getSemanticClarity(contract).pathologyVernacular || {};
  const discouragedPublicPhrases = (pathologyVernacular.discouragedPublicPhrases || []).map((phrase) => ({
    pattern: buildPhrasePattern(phrase, { wholeWord: true }),
    guidance: 'Replace with pathology-native wording that sounds natural during signout, board preparation, or diagnostic workup.',
  }));
  const discouragedVerbs = (pathologyVernacular.discouragedVerbs || []).map((phrase) => ({
    pattern: buildPhrasePattern(phrase, { wholeWord: true }),
    guidance: 'Avoid generic educational abstractions on learner-facing pages.',
  }));
  return [...discouragedPublicPhrases, ...discouragedVerbs];
};

const getReferenceFrameworkDriftRules = (contract = {}) =>
  (getSemanticClarity(contract).referenceLane?.discouragedPublicPhrases || []).map((phrase) => ({
    pattern: buildPhrasePattern(phrase, { wholeWord: /[A-Za-z0-9]/.test(phrase), caseSensitive: true }),
    guidance: 'Use pathology-native public wording instead of framework or competency language on the reference lane.',
  }));

const hasYamlListEntry = (text, key, value) =>
  new RegExp(`${escapeRegExp(key)}:\\s*[\\s\\S]*?^\\s*-\\s+${escapeRegExp(value)}\\s*$`, 'm').test(text);

const writeReport = (jsonPath, mdPath, payload) => {
  fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2) + '\n');

  const md = [
    '# Didactics Learning UX Report',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    `- Passes: ${payload.passes.length}`,
    `- Failures: ${payload.failures.length}`,
    '',
    '## Passes',
    '',
    ...(payload.passes.length ? payload.passes.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Failures',
    '',
    ...(payload.failures.length ? payload.failures.map((item) => `- ${item}`) : ['- None']),
    '',
  ];
  fs.writeFileSync(mdPath, md.join('\n'));
};

const normalizeComparableLabel = (label) =>
  String(label || '')
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/&/g, ' and ')
    .replace(/\+/g, ' plus ')
    .replace(/[^a-z0-9/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toSlashVariantKey = (label) => {
  const normalized = normalizeComparableLabel(label);
  if (!normalized.includes('/')) {
    return null;
  }
  return normalized
    .split('/')
    .map((part) => part.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .sort()
    .join(' / ');
};

const formatLabelVariant = (entry) => `${entry.label} (${entry.source})`;

const indexOfPattern = (text, pattern, fromIndex = 0) => {
  if (!text || !pattern) {
    return -1;
  }

  if (typeof pattern === 'string') {
    return text.indexOf(pattern, fromIndex);
  }

  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  matcher.lastIndex = fromIndex;
  const match = matcher.exec(text);
  return match ? match.index : -1;
};

const appearsInOrder = (text, patterns) => {
  let cursor = 0;
  for (const pattern of patterns) {
    const index = indexOfPattern(text, pattern, cursor);
    if (index === -1) {
      return false;
    }
    const matchedText =
      typeof pattern === 'string'
        ? pattern
        : text.slice(index, index + (new RegExp(pattern.source, pattern.flags.replace(/g/g, '')).exec(text.slice(index))?.[0]?.length ?? 0));
    cursor = index + Math.max(matchedText.length, 1);
  }
  return true;
};

const collectPublicTopicLabels = ({
  tutorialCatalog = [],
  validatedManifest = { rows: [] },
  algorithmCatalog = [],
  curriculumCatalogText = '',
} = {}) => {
  const entries = [];

  for (const tutorial of tutorialCatalog) {
    if (tutorial.category) {
      entries.push({ label: tutorial.category, source: 'tutorial category' });
    }
    if (tutorial.abpathRootTopic) {
      entries.push({ label: tutorial.abpathRootTopic, source: 'tutorial ABPath root' });
    }
  }

  for (const row of validatedManifest.rows || []) {
    if (row.abpathRoot) {
      entries.push({ label: row.abpathRoot, source: 'validated manifest root' });
    }
  }

  for (const algorithm of algorithmCatalog) {
    if (algorithm.category) {
      entries.push({ label: algorithm.category, source: 'algorithm category' });
    }
  }

  for (const match of curriculumCatalogText.matchAll(/subspecialty:\s*'([^']+)'/g)) {
    entries.push({ label: match[1], source: 'curriculum subspecialty' });
  }

  return entries;
};

const findDuplicatePublicTopicLabels = (entries) => {
  const slashVariantGroups = new Map();

  for (const entry of entries) {
    const key = toSlashVariantKey(entry.label);
    if (!key) {
      continue;
    }
    if (!slashVariantGroups.has(key)) {
      slashVariantGroups.set(key, []);
    }
    slashVariantGroups.get(key).push(entry);
  }

  return Array.from(slashVariantGroups.values())
    .map((group) => {
      const distinctLabels = Array.from(new Set(group.map((entry) => entry.label)));
      return distinctLabels.length > 1
        ? {
            kind: 'slash-variant',
            normalizedKey: toSlashVariantKey(group[0].label),
            entries: group.filter((entry, index) => group.findIndex((candidate) => candidate.label === entry.label) === index),
          }
        : null;
    })
    .filter(Boolean);
};

const collectMetaJargonMatches = (surfaceText, surfaceLabel, contract) => {
  const matches = [];

  for (const rule of getPlainLanguageRules(contract)) {
    const found = surfaceText.match(rule.pattern) ?? [];
    for (const phrase of new Set(found.map((value) => value.trim()))) {
      matches.push({
        surface: surfaceLabel,
        phrase,
        guidance: rule.guidance,
      });
    }
  }

  return matches;
};

const evaluatePlainLanguageSemantics = ({
  contract,
  sidebarTsx = '',
  tutorialsTsx = '',
  lecturesTsx = '',
  workspaceNavTsx = '',
  curriculumTsx = '',
  algorithmsTsx = '',
} = {}) => {
  const passes = [];
  const issues = [];

  const metaJargonMatches = [
    ...collectMetaJargonMatches(sidebarTsx, 'Sidebar', contract),
    ...collectMetaJargonMatches(tutorialsTsx, 'Tutorials', contract),
    ...collectMetaJargonMatches(lecturesTsx, 'Lectures', contract),
    ...collectMetaJargonMatches(workspaceNavTsx, 'Workspace nav', contract),
  ];

  if (metaJargonMatches.length === 0) {
    passes.push('Learner-facing sidebar, tutorial, lecture, and workspace-nav copy avoids governed meta jargon.');
  } else {
    issues.push(
      `Learner-facing meta jargon detected: ${metaJargonMatches
        .map((match) => `${match.surface} -> "${match.phrase}" (${match.guidance})`)
        .join('; ')}`
    );
  }

  const publicSurfaceText = [sidebarTsx, tutorialsTsx, lecturesTsx, workspaceNavTsx, curriculumTsx, algorithmsTsx].join('\n');
  const selfNarrationMatches = getForbiddenSelfNarrationRules(contract).flatMap((pattern) => publicSurfaceText.match(pattern) ?? []);
  if (selfNarrationMatches.length === 0) {
    passes.push('Learner-facing copy avoids self-narration and workflow commentary.');
  } else {
    issues.push(`Learner-facing self-narration detected: ${Array.from(new Set(selfNarrationMatches)).join(', ')}`);
  }

  const vagueCurriculumCtas = CURRICULUM_GENERIC_CTA_RULES.filter((rule) => rule.pattern.test(curriculumTsx));
  if (vagueCurriculumCtas.length === 0) {
    passes.push('Curriculum launch actions use destination-specific labels instead of vague generic CTAs.');
  } else {
    issues.push(`Curriculum still contains vague CTA labels: ${vagueCurriculumCtas.map((rule) => rule.guidance).join('; ')}`);
  }

  const pathologyDriftMatches = getPathologyVernacularDriftRules(contract).flatMap((rule) => {
    const found = publicSurfaceText.match(rule.pattern) ?? [];
    return found.length > 0 ? [{ phrase: found[0], guidance: rule.guidance }] : [];
  });
  if (pathologyDriftMatches.length === 0) {
    passes.push('Learner-facing copy uses pathology-native vernacular instead of generic educational jargon.');
  } else {
    issues.push(
      `Pathology vernacular drift detected: ${pathologyDriftMatches.map((match) => `"${match.phrase}" (${match.guidance})`).join('; ')}`
    );
  }

  return { passes, issues };
};

const evaluateHierarchySemantics = ({
  tutorialsTsx = '',
  lecturesTsx = '',
  algorithmsTsx = '',
  curriculumTsx = '',
} = {}) => {
  const passes = [];
  const issues = [];

  const tutorialRelatedReviewIndex = indexOfPattern(tutorialsTsx, /(Related review|Follow-up review|Morphology follow-up)/);
  const tutorialRecognitionCueIndex = indexOfPattern(tutorialsTsx, /What to recognize/);
  const tutorialDiagnosticCueIndex = indexOfPattern(tutorialsTsx, /(Diagnostic approach|Diagnostic focus|Common pitfall)/);

  if (
    tutorialRelatedReviewIndex !== -1 &&
    ((tutorialRecognitionCueIndex !== -1 && tutorialRecognitionCueIndex < tutorialRelatedReviewIndex) ||
      (tutorialDiagnosticCueIndex !== -1 && tutorialDiagnosticCueIndex < tutorialRelatedReviewIndex))
  ) {
    passes.push('Tutorial detail keeps diagnostic framing and recognition cues ahead of optional related review.');
  } else {
    issues.push('Tutorial detail does not clearly keep diagnostic framing ahead of optional related review.');
  }

  if (
    appearsInOrder(tutorialsTsx, [
      /(What to recognize|Common pitfall|References)/,
      /(Related review|Optional follow-up review)/,
      /(Morphology follow-up|Interactive review|Open full morphology review|Open interactive review)/,
    ])
  ) {
    passes.push('Tutorial detail keeps optional follow-up review after the core lesson content.');
  } else {
    issues.push('Tutorial detail does not clearly keep optional follow-up review after the core lesson content.');
  }

  if (
    appearsInOrder(tutorialsTsx, [
      /Current review:\s*Tutorials/,
      /(Resume last lesson|Start here)/,
      /(Browse topics|Open the topic list)/,
      /Major topic/,
    ])
  ) {
    passes.push('Tutorial landing exposes a direct resume-or-start CTA and a browse CTA before the topic grid.');
  } else {
    issues.push('Tutorial landing does not clearly expose both a direct resume-or-start CTA and a browse CTA before the topic grid.');
  }

  if (
    appearsInOrder(lecturesTsx, [
      /Current review:\s*Lectures/,
      /(Resume last lecture|Start here)/,
      /(Browse topics|Open the topic list)/,
      /Major topics/,
    ])
  ) {
    passes.push('Lecture landing exposes a direct resume-or-start CTA and a browse CTA before the topic grid.');
  } else {
    issues.push('Lecture landing does not clearly expose both a direct resume-or-start CTA and a browse CTA before the topic grid.');
  }

  if (
    appearsInOrder(algorithmsTsx, [
      /Current review:\s*Workups/,
      /(Resume last workup|Return to topic)/,
      /(Browse areas|Open the diagnostic areas)/,
      /Diagnostic areas/,
    ])
  ) {
    passes.push('Workup landing exposes a direct resume-or-start CTA and a browse CTA before the diagnostic-area grid.');
  } else {
    issues.push('Workup landing does not clearly expose both a direct resume-or-start CTA and a browse CTA before the diagnostic-area grid.');
  }

  if (
    appearsInOrder(tutorialsTsx, [
      /Major topic/,
      /Scope:/,
      /Next:\s*open the first (diagnostic focus|lesson)/,
      /Open .*|Back to tutorials/,
    ])
  ) {
    passes.push('Tutorial topic overview exposes scope and a single obvious next action before the topic grid.');
  } else {
    issues.push('Tutorial topic overview does not clearly expose scope and a single obvious next action before the topic grid.');
  }

  if (
    appearsInOrder(lecturesTsx, [
      /Major topic/,
      /Scope:/,
      /Next:\s*open the first (review set|lecture)/,
      /Open .*|Back to lectures/,
    ])
  ) {
    passes.push('Lecture topic overview exposes scope and a single obvious next action before the review-set grid.');
  } else {
    issues.push('Lecture topic overview does not clearly expose scope and a single obvious next action before the review-set grid.');
  }

  if (
    appearsInOrder(algorithmsTsx, [
      /Major topic/,
      /Scope:/,
      /Next:\s*open the first (differential or workup|workup)/,
      /Open .*|Back to workups/,
    ])
  ) {
    passes.push('Workup topic overview exposes scope and a single obvious next action before the differential grid.');
  } else {
    issues.push('Workup topic overview does not clearly expose scope and a single obvious next action before the differential grid.');
  }

  if (
    appearsInOrder(tutorialsTsx, [
      /Diagnostic focus/,
      /Scope:/,
      /Next:\s*open the first lesson/,
      /Open .*|Back to topic/,
    ])
  ) {
    passes.push('Tutorial subtopic overview exposes scope and a single obvious next action before the lesson list.');
  } else {
    issues.push('Tutorial subtopic overview does not clearly expose scope and a single obvious next action before the lesson list.');
  }

  if (
    appearsInOrder(lecturesTsx, [
      /Lectures/,
      /Scope:/,
      /Next:\s*open the first lecture/,
      /Open .*|Back to topic/,
    ])
  ) {
    passes.push('Lecture subtopic overview exposes scope and a single obvious next action before the lecture list.');
  } else {
    issues.push('Lecture subtopic overview does not clearly expose scope and a single obvious next action before the lecture list.');
  }

  if (
    appearsInOrder(algorithmsTsx, [
      /Workups/,
      /Scope:/,
      /Next:\s*open the first workup/,
      /Open .*|Start here/,
    ])
  ) {
    passes.push('Workup subtopic overview exposes scope and a single obvious next action before the workup list.');
  } else {
    issues.push('Workup subtopic overview does not clearly expose scope and a single obvious next action before the workup list.');
  }

  const algorithmWorkupIndex = indexOfPattern(algorithmsTsx, /<LectureAlgorithmPlayer\b/);
  const algorithmHeaderCueIndex = indexOfPattern(algorithmsTsx, /(Diagnostic focus|Workup controls)/);
  const algorithmRelatedReviewIndex = indexOfPattern(algorithmsTsx, /(Related review|Follow-up review|Optional follow-up review)/);
  const algorithmSupportLinkIndex = indexOfPattern(
    algorithmsTsx,
    /(Open related tutorial|Open mapped morphology review|Open related lecture)/
  );

  if (
    algorithmWorkupIndex !== -1 &&
    algorithmRelatedReviewIndex !== -1 &&
    algorithmWorkupIndex < algorithmRelatedReviewIndex &&
    (algorithmHeaderCueIndex === -1 || algorithmHeaderCueIndex < algorithmWorkupIndex) &&
    (algorithmSupportLinkIndex === -1 || algorithmWorkupIndex < algorithmSupportLinkIndex)
  ) {
    passes.push('Algorithm detail places the workup before optional tutorial or review links.');
  } else {
    issues.push('Algorithm detail does not clearly place the workup ahead of optional tutorial or review links.');
  }

  if (
    appearsInOrder(curriculumTsx, [
      /selectedModule\.patternFamilies[\s\S]*?Common diagnostic patterns/,
      /selectedModule\.cpGovernance[\s\S]*?(Board-relevant focus|What to recognize)/,
      /selectedModuleResolvedAlgorithms\.length > 0[\s\S]*?Initial workup/,
      /selectedModuleCompetency[\s\S]*?Diagnostic focus/,
    ])
  ) {
    passes.push('Curriculum module pages present patterns, board focus, workup, and diagnostic focus in a stable reasoning order.');
  } else {
    issues.push('Curriculum module pages do not clearly present patterns, board focus, workup, and diagnostic focus in a stable reasoning order.');
  }

  if (
    appearsInOrder(curriculumTsx, [
      /selectedModuleResolvedAlgorithms\.length > 0[\s\S]*?Initial workup/,
      /selectedModuleCompetency[\s\S]*?Diagnostic focus/,
      /selectedModule\.lectures\.length > 1[\s\S]*?Related review/,
      /Optional follow-up review/,
    ])
  ) {
    passes.push('Curriculum module pages keep optional follow-up review after the core module framing.');
  } else {
    issues.push('Curriculum module pages do not clearly keep optional follow-up review after the core module framing.');
  }

  if (
    appearsInOrder(curriculumTsx, [
      /selectedModule\.cpGovernance[\s\S]*?Board blueprint/,
      /selectedModule\.lectures\.length > 1[\s\S]*?Related review/,
      /Optional follow-up review/,
    ])
  ) {
    passes.push('Curriculum side rail keeps board blueprint ahead of optional follow-up review.');
  } else {
    issues.push('Curriculum side rail does not clearly keep board blueprint ahead of optional follow-up review.');
  }

  if (
    appearsInOrder(lecturesTsx, [
      /(Faculty run sheet|Signout brief)/,
      /Signout sequence/,
    ])
  ) {
    passes.push('Lecture detail opens with an orientation block before the signout sequence.');
  } else {
    issues.push('Lecture detail does not clearly open with orientation before the signout sequence.');
  }

  if (
    appearsInOrder(lecturesTsx, [
      /(Faculty run sheet|Signout brief)/,
      /Signout sequence/,
      /(Related diagnostic groups|Related review|Optional follow-up review)/,
      /(Open related tutorial|Open mapped morphology review)/,
    ])
  ) {
    passes.push('Lecture detail keeps optional follow-up review after the core signout sequence.');
  } else {
    issues.push('Lecture detail does not clearly keep optional follow-up review after the core signout sequence.');
  }

  if (
    appearsInOrder(lecturesTsx, [
      /Teaching Text/,
      /StructuredTeachingContent/,
      /Section guide/,
    ])
  ) {
    passes.push('Lecture transcript keeps the section guide after the full teaching text.');
  } else {
    issues.push('Lecture transcript does not clearly keep the section guide after the full teaching text.');
  }

  if (
    appearsInOrder(lecturesTsx, [
      /Full Lecture Text/,
      /References/,
    ])
  ) {
    passes.push('Lecture print export keeps references after the full lecture text.');
  } else {
    issues.push('Lecture print export does not clearly keep references after the full lecture text.');
  }

  return { passes, issues };
};

const evaluateWorkspaceRoutingSemantics = ({
  tutorialsTsx = '',
  lecturesTsx = '',
  algorithmsTsx = '',
  sidebarTsx = '',
  workspaceNavTsx = '',
  lectureNavigationTs = '',
  tutorialNavigationTs = '',
  algorithmNavigationTs = '',
} = {}) => {
  const issues = [];
  const passes = [];

  const workspaceRoutingExpectations = [
    {
      label: 'Lectures',
      componentText: lecturesTsx,
      workspace: 'lectures',
      workspaceKeyLiteral: 'WorkspaceKey.LECTURES',
      consumeIntentPattern: /consumeLectureLibraryIntent\(\)/,
      restorePattern: /restoreStudyDestination\((WorkspaceKey\.LECTURES|'lectures')\)/,
      activeTabPattern: /setStudyDestinationActiveTab\((WorkspaceKey\.LECTURES|'lectures'),\s*activeMode\)/,
      destinationChangePattern: /if\s*\(nextDestination\?\.workspace\s*===\s*(WorkspaceKey\.LECTURES|'lectures')\)/,
      navigationText: lectureNavigationTs,
      navigationQueryPattern: /query\?:\s*string/,
    },
    {
      label: 'Tutorials',
      componentText: tutorialsTsx,
      workspace: 'tutorials',
      workspaceKeyLiteral: 'WorkspaceKey.TUTORIALS',
      consumeIntentPattern: /consumeTutorialLibraryIntent\(\)/,
      restorePattern: /restoreStudyDestination\((WorkspaceKey\.TUTORIALS|'tutorials')\)/,
      activeTabPattern: /setStudyDestinationActiveTab\((WorkspaceKey\.TUTORIALS|'tutorials'),\s*activeTab\)/,
      destinationChangePattern: /if\s*\(nextDestination\?\.workspace\s*===\s*(WorkspaceKey\.TUTORIALS|'tutorials')\)/,
      navigationText: tutorialNavigationTs,
      navigationQueryPattern: /query\?:\s*string/,
    },
    {
      label: 'Workups',
      componentText: algorithmsTsx,
      workspace: 'algorithms',
      workspaceKeyLiteral: 'WorkspaceKey.ALGORITHMS',
      consumeIntentPattern: /consumeAlgorithmNavigatorIntent\(\)/,
      restorePattern: /restoreStudyDestination\((WorkspaceKey\.ALGORITHMS|'algorithms')\)/,
      activeTabPattern: /writeAlgorithmNavigatorState\(\s*\{/,
      destinationChangePattern: /if\s*\(nextDestination\?\.workspace\s*===\s*(WorkspaceKey\.ALGORITHMS|'algorithms')\)/,
      navigationText: algorithmNavigationTs,
      navigationQueryPattern: /query\?:\s*string/,
    },
  ];

  for (const workspace of workspaceRoutingExpectations) {
    if (workspace.consumeIntentPattern.test(workspace.componentText)) {
      passes.push(`${workspace.label} consumes its workspace-scoped routing intent.`);
    } else {
      issues.push(`${workspace.label} does not consume its workspace-scoped routing intent.`);
    }

    if (workspace.restorePattern.test(workspace.componentText)) {
      passes.push(`${workspace.label} restores only its own study destination on load.`);
    } else {
      issues.push(`${workspace.label} does not restore its own study destination on load.`);
    }

    if (workspace.activeTabPattern.test(workspace.componentText)) {
      passes.push(`${workspace.label} persists its active workspace state after routing.`);
    } else {
      issues.push(`${workspace.label} does not persist active workspace state after routing.`);
    }

    if (workspace.destinationChangePattern.test(workspace.componentText)) {
      passes.push(`${workspace.label} filters destination-change events to its own workspace.`);
    } else {
      issues.push(`${workspace.label} does not filter destination-change events to its own workspace.`);
    }

    if (workspace.navigationQueryPattern.test(workspace.navigationText)) {
      passes.push(`${workspace.label} intent surface preserves query-routed launch semantics.`);
    } else {
      issues.push(`${workspace.label} intent surface is missing query-routed launch semantics.`);
    }
  }

  if (/if\s*\(intent\?\.query\)/.test(tutorialsTsx) && /findBestTutorialMatch\(/.test(tutorialsTsx)) {
    passes.push('Tutorials resolves query-routed intents into visible destination views.');
  } else {
    issues.push('Tutorials does not clearly resolve query-routed intents into visible destination views.');
  }

  if (/if\s*\(intent\.track\)/.test(lecturesTsx) && /pushStudyDestination\((WorkspaceKey\.LECTURES|'lectures'),\s*\{[\s\S]*kind:\s*'topic_overview'/.test(lecturesTsx)) {
    passes.push('Lectures resolves routed intents into a lecture workspace overview before detail.');
  } else {
    issues.push('Lectures does not clearly resolve routed intents into a lecture workspace overview.');
  }

  if (/if\s*\(intent\.category\)/.test(algorithmsTsx) && /pushStudyDestination\((WorkspaceKey\.ALGORITHMS|'algorithms'),\s*\{[\s\S]*kind:\s*intent\.patternFamily\s*\?\s*'subtopic_overview'\s*:\s*'topic_overview'/.test(algorithmsTsx)) {
    passes.push('Workups resolves routed intents into governed algorithm topic or subtopic views.');
  } else {
    issues.push('Workups does not clearly resolve routed intents into governed topic or subtopic views.');
  }

  const workspaceLandingResetCount = (sidebarTsx.match(/pushStudyDestination\((WorkspaceKey\.(LECTURES|TUTORIALS|ALGORITHMS)|'(lectures|tutorials|algorithms)'),\s*\{\s*kind:\s*'landing',\s*previous:\s*null\s*\}\)/g) || []).length;
  if (workspaceLandingResetCount >= 3) {
    passes.push('Sidebar resets each didactics workspace to a fresh landing state before cross-workspace navigation.');
  } else {
    issues.push('Sidebar does not reset every didactics workspace to a fresh landing state before cross-workspace navigation.');
  }

  for (const workspace of workspaceRoutingExpectations) {
    const readPattern = new RegExp(`readStudyDestination\\((${escapeRegExp(workspace.workspaceKeyLiteral)}|'${workspace.workspace}')\\)`);
    const pushPattern = new RegExp(`pushStudyDestination\\((${escapeRegExp(workspace.workspaceKeyLiteral)}|'${workspace.workspace}')`);
    const resetPattern = new RegExp(
      `pushStudyDestination\\((${escapeRegExp(workspace.workspaceKeyLiteral)}|'${workspace.workspace}'),\\s*\\{\\s*kind:\\s*'landing',\\s*previous:\\s*null\\s*\\}\\)`
    );

    if (readPattern.test(sidebarTsx) && pushPattern.test(sidebarTsx)) {
      passes.push(`Sidebar uses the shared study-destination contract for ${workspace.workspace}.`);
    } else {
      issues.push(`Sidebar does not use the shared study-destination contract for ${workspace.workspace}.`);
    }

    if (resetPattern.test(sidebarTsx)) {
      passes.push(`Sidebar applies the canonical landing reset for ${workspace.workspace}.`);
    } else {
      issues.push(`Sidebar is missing the canonical landing reset for ${workspace.workspace}.`);
    }
  }

  if (/item\.onActivate\?\.\(\);\s*onSectionChange\(item\.section\);/.test(workspaceNavTsx)) {
    passes.push('Workspace switch clicks activate routed workspace state before section selection changes.');
  } else {
    issues.push('Workspace switch clicks do not clearly activate routed workspace state before section selection changes.');
  }

  return { passes, issues };
};

const evaluateRefreshAndHistorySemantics = ({
  studyDestinationStateTs = '',
  sectionNavTs = '',
  tutorialsTsx = '',
  lecturesTsx = '',
  algorithmsTsx = '',
} = {}) => {
  const issues = [];
  const passes = [];

  if (/return `\$\{window\.location\.pathname\}\$\{window\.location\.search\}\$\{window\.location\.hash\}`;/.test(studyDestinationStateTs)) {
    passes.push('Study destination history preserves pathname, query string, and hash for refresh stability.');
  } else {
    issues.push('Study destination history does not clearly preserve pathname, query string, and hash for refresh stability.');
  }

  if (/didacticsStudyDestination:\s*destination/.test(studyDestinationStateTs) && /window\.history\.replaceState\(state,\s*'',\s*currentUrl\(\)\)/.test(studyDestinationStateTs) && /window\.history\.pushState\(state,\s*'',\s*currentUrl\(\)\)/.test(studyDestinationStateTs)) {
    passes.push('Study destination writes routed workspace state into browser history for refresh and back-forward restore.');
  } else {
    issues.push('Study destination does not clearly write routed workspace state into browser history.');
  }

  if (/const fromHistory = readHistoryStudyDestination\(window\.history\.state,\s*workspace\);/.test(studyDestinationStateTs) && /if \(fromHistory\)\s*\{\s*return fromHistory;/.test(studyDestinationStateTs)) {
    passes.push('Workspace refresh restore prefers browser history state before session fallback.');
  } else {
    issues.push('Workspace refresh restore does not clearly prefer browser history state before session fallback.');
  }

  if (/if \(workspace && candidate\.workspace !== workspace\)\s*\{\s*return null;/.test(studyDestinationStateTs)) {
    passes.push('History restore rejects cross-workspace destination leakage.');
  } else {
    issues.push('History restore does not clearly reject cross-workspace destination leakage.');
  }

  const workspacePopstateChecks = [
    { label: 'Tutorials', text: tutorialsTsx, workspace: 'tutorials', activeStatePattern: /setActiveTab\(nextDestination\.activeTab\)/ },
    { label: 'Lectures', text: lecturesTsx, workspace: 'lectures', activeStatePattern: /setActiveMode\(nextDestination\.activeTab as LecturePlayerMode\)/ },
    { label: 'Workups', text: algorithmsTsx, workspace: 'algorithms', activeStatePattern: null },
  ];

  for (const workspace of workspacePopstateChecks) {
    const workspacePopstatePattern = new RegExp(
      `const handlePopState = \\(event: PopStateEvent\\) => \\{[\\s\\S]*?didacticsStudyDestination[\\s\\S]*?if \\(nextDestination\\?\\.workspace === '${workspace.workspace}'\\) \\{[\\s\\S]*?setDestination\\(nextDestination\\);`,
    );
    if (workspacePopstatePattern.test(workspace.text)) {
      passes.push(`${workspace.label} rehydrates only its own routed destination on browser popstate.`);
    } else {
      issues.push(`${workspace.label} does not clearly rehydrate only its own routed destination on browser popstate.`);
    }

    if (workspace.activeStatePattern) {
      if (workspace.activeStatePattern.test(workspace.text)) {
        passes.push(`${workspace.label} restores active in-workspace view state during history navigation.`);
      } else {
        issues.push(`${workspace.label} does not clearly restore active in-workspace view state during history navigation.`);
      }
    }
  }

  if (/window\.history\.back\(\)/.test(sectionNavTs) && /window\.history\.forward\(\)/.test(sectionNavTs)) {
    passes.push('Section navigation delegates back and forward actions to browser history.');
  } else {
    issues.push('Section navigation does not clearly delegate back and forward actions to browser history.');
  }

  if (/if \(browserStore\.index <= 0 && !canGoBackWithinStudyWorkspace\(currentSection\)\)\s*\{\s*return;/.test(sectionNavTs)) {
    passes.push('Back navigation stays enabled when a study workspace still has internal history even at section boundary.');
  } else {
    issues.push('Back navigation does not clearly honor in-workspace history at section boundaries.');
  }

  return { passes, issues };
};

const evaluateWorkspaceSemantics = ({
  appTsx = '',
  headerTsx = '',
  sidebarTsx = '',
  workspaceNavTsx = '',
  componentTexts = {},
} = {}) => {
  const issues = [];
  const passes = [];

  if (/<Header[\s\S]*currentSection=\{displayedSection\}/.test(appTsx)) {
    passes.push('App passes the displayed section label into the shared header.');
  } else {
    issues.push('App does not pass the displayed section label into the shared header.');
  }

  if (
    /const resolveHeaderTitle = \(currentSection: Section\): string => \{[\s\S]*?case Section\.DIDACTIC_LECTURES:[\s\S]*?return 'Lectures';[\s\S]*?case Section\.DIDACTIC_TUTORIALS:[\s\S]*?return 'Tutorials';[\s\S]*?case Section\.DIDACTIC_ALGORITHMS:[\s\S]*?return 'Workups';/.test(headerTsx) &&
    /<h1[^>]*>\{headerTitle\}<\/h1>/.test(headerTsx)
  ) {
    passes.push('Header resolves internal didactics section names into governed public workspace labels.');
  } else if (/<h1[^>]*>\{currentSection\}<\/h1>/.test(headerTsx)) {
    issues.push('Header still exposes raw internal section names instead of governed public workspace labels.');
  } else {
    issues.push('Header title is not clearly resolved through governed public workspace labels.');
  }

  if (!/Didactic Lectures|Didactic Tutorials|Didactic Algorithms/.test(headerTsx)) {
    passes.push('Header source no longer hard-codes internal didactics naming drift.');
  } else {
    issues.push('Header source still contains internal didactics naming drift.');
  }

  if (/item\.onActivate\?\.\(\);\s*onSectionChange\(item\.section\);/.test(workspaceNavTsx)) {
    passes.push('Workspace switcher triggers destination activation before section change.');
  } else {
    issues.push('Workspace switcher does not clearly activate destination state before section change.');
  }

  for (const workspace of WORKSPACE_EXPECTATIONS) {
    const componentText = componentTexts[workspace.workspaceKey] || '';
    const appRoutePattern = new RegExp(`case\\s+${workspace.sectionLiteral}:\\s+return\\s+<${workspace.componentName}\\b`);
    if (appRoutePattern.test(appTsx)) {
      passes.push(`${workspace.label} routes to ${workspace.componentName}.`);
    } else {
      issues.push(`${workspace.label} is not routed to ${workspace.componentName} in App.`);
    }

    const sidebarLabelPattern = new RegExp(`label:\\s*(${escapeRegExp(workspace.labelLiteral)}|'${workspace.label}')`);
    if (sidebarLabelPattern.test(sidebarTsx)) {
      passes.push(`Sidebar exposes ${workspace.label} as a study workspace using shared authority.`);
    } else {
      issues.push(`Sidebar is missing the ${workspace.label} workspace label or shared authority.`);
    }

    if (workspace.destinationWorkspace) {
      const activationPattern = new RegExp(
        `label:\\s*(${escapeRegExp(workspace.labelLiteral)}|'${workspace.label}')[\\s\\S]*?pushStudyDestination\\((${escapeRegExp(workspace.workspaceKeyLiteral)}|'${workspace.workspaceKey}'),\\s*\\{[\\s\\S]*?kind:\\s*'landing'[\\s\\S]*?previous:\\s*null`,
      );
      if (activationPattern.test(sidebarTsx)) {
        passes.push(`${workspace.label} resets its workspace destination to a landing state using shared authority.`);
      } else {
        issues.push(`${workspace.label} does not show a landing-state workspace reset in Sidebar using shared authority.`);
      }
    }

    if (workspace.componentIdentityPatterns.some((pattern) => pattern.test(componentText))) {
      passes.push(`${workspace.label} exposes visible workspace identity in its main-panel component.`);
    } else {
      issues.push(`${workspace.label} main-panel component lacks a visible workspace identity signal.`);
    }

    if (!workspace.landingSummaryPatterns) {
      continue;
    }

    if (workspace.landingSummaryPatterns.every((pattern) => pattern.test(componentText))) {
      passes.push(`${workspace.label} landing exposes a compact current-review and next-step summary.`);
    } else {
      issues.push(`${workspace.label} landing is missing a compact current-review and next-step summary.`);
    }
  }

  return { passes, issues };
};

const evaluateReferenceBoundarySemantics = ({
  homeTsx = '',
  mobileHeaderTsx = '',
  sidebarTsx = '',
  curriculumTsx = '',
  lecturesTsx = '',
  algorithmsTsx = '',
} = {}) => {
  const issues = [];
  const passes = [];

  const learnerEntrySurfaces = [
    { label: 'Home', text: homeTsx },
    { label: 'Mobile header', text: mobileHeaderTsx },
    { label: 'Sidebar', text: sidebarTsx },
  ];

  const directReferenceLaunches = learnerEntrySurfaces
    .filter(({ text }) => /onSectionChange\(Section\.REFERENCE_LIBRARY\)/.test(text))
    .map(({ label }) => label);

  if (directReferenceLaunches.length === 0) {
    passes.push('Learner-first navigation avoids direct Reference Library launches.');
  } else {
    issues.push(`Direct Reference Library launch still appears in learner-first navigation: ${directReferenceLaunches.join(', ')}.`);
  }

  const contextualReferenceSurfaces = [
    { label: 'Curriculum', text: curriculumTsx },
    { label: 'Lectures', text: lecturesTsx },
    { label: 'Workups', text: algorithmsTsx },
  ];

  const missingContextualReferenceRoutes = contextualReferenceSurfaces
    .filter(({ text }) => !/setReferenceLibraryIntent\(/.test(text) || !/onSectionChange\(Section\.REFERENCE_LIBRARY\)/.test(text))
    .map(({ label }) => label);

  if (missingContextualReferenceRoutes.length === 0) {
    passes.push('Reference Library remains reachable from curriculum, lecture, and workup context.');
  } else {
    issues.push(`Reference Library is missing contextual launch wiring from: ${missingContextualReferenceRoutes.join(', ')}.`);
  }

  return { passes, issues };
};

const evaluateReferenceRouteSemantics = ({
  contract,
  appTsx = '',
  sectionNavTs = '',
  referenceTsx = '',
} = {}) => {
  const issues = [];
  const passes = [];

  if (/case Section\.REFERENCE_LIBRARY:\s*return <ReferenceLibrary user=\{user\} \/>;/.test(appTsx)) {
    passes.push('Reference Library is rendered as a first-class didactics section in the app shell.');
  } else {
    issues.push('Reference Library is not clearly rendered as a first-class didactics section in the app shell.');
  }

  if (
    (/case Section\.REFERENCE_LIBRARY:\s*return (WorkspaceKey\.REFERENCE|'reference');/.test(sectionNavTs) || /return getWorkspaceKeyForSection\(section\);/.test(sectionNavTs)) &&
    (/case (WorkspaceKey\.REFERENCE|'reference'):\s*return Section\.REFERENCE_LIBRARY;/.test(sectionNavTs) || /return getSectionForWorkspaceKey\(workspace\);/.test(sectionNavTs)) &&
    /case Section\.REFERENCE_LIBRARY:\s*\{[\s\S]*\?workspace=\$\{workspace\}/.test(sectionNavTs)
  ) {
    passes.push('Reference Library has a route-backed workspace mapping through didactics navigation.');
  } else {
    issues.push('Reference Library is missing a complete route-backed workspace mapping through didactics navigation.');
  }

  const referenceDriftMatches = getReferenceFrameworkDriftRules(contract).flatMap((rule) => {
    const found = referenceTsx.match(rule.pattern) ?? [];
    return found.map((phrase) => ({ phrase, guidance: rule.guidance }));
  });

  if (referenceDriftMatches.length === 0) {
    passes.push('Reference Library copy avoids residual framework jargon on the public reference lane.');
  } else {
    issues.push(
      `Reference Library still exposes framework-ish public copy: ${Array.from(
        new Set(referenceDriftMatches.map((match) => `"${match.phrase}" (${match.guidance})`))
      ).join('; ')}`
    );
  }

  if (
    appearsInOrder(referenceTsx, [
      /Start here/,
      /Diagnostic focus/,
      /What to recognize/,
      /Sign-out calibration/,
    ])
  ) {
    passes.push('Reference Library opens with study framing before deeper recognition and sign-out calibration cues.');
  } else {
    issues.push('Reference Library does not clearly open with study framing before deeper recognition and sign-out calibration cues.');
  }

  if (
    appearsInOrder(referenceTsx, [
      /Training level guidance/,
      /Diagnostic focus/,
      /Review approach/,
      /What to recognize/,
    ])
  ) {
    passes.push('Reference Library keeps training-level guidance ordered from diagnostic focus to recognition targets.');
  } else {
    issues.push('Reference Library does not clearly keep training-level guidance ordered from diagnostic focus to recognition targets.');
  }

  return { passes, issues };
};

const evaluateContractAlignmentSemantics = ({
  agentsMd = '',
  codexAlignmentContractMd = '',
  learningUxContractMd = '',
  contract,
  adapterYaml = '',
} = {}) => {
  const issues = [];
  const passes = [];

  if (
    agentsMd.includes('docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md') &&
    agentsMd.includes('/Volumes/DB_External/ExternalOffice/SyncedSources/Documents/GitHub/SKI-CORTEX/contracts/openclaw_parallel_execution_contract.md')
  ) {
    passes.push('AGENTS imports both the Codex system-alignment and OpenClaw execution contracts.');
  } else {
    issues.push('AGENTS is missing one or more required Codex/OpenClaw contract imports for Didactic Series.');
  }

  if (
    codexAlignmentContractMd.includes('## Public Text Rule') &&
    codexAlignmentContractMd.includes('The governed `Workups` workspace label is allowed only when it truthfully names the diagnostic-workup lane.') &&
    codexAlignmentContractMd.includes('## Autonomous Execution Rule') &&
    codexAlignmentContractMd.includes('continue through logically connected repo steps without repeatedly asking for `proceed`, `continue`, or equivalent confirmations') &&
    codexAlignmentContractMd.includes('pause only for destructive actions, irreversible mutations, missing credentials or secrets, materially changed legal or risk posture, truly ambiguous branch decisions, required external approval, or policy-bound clarification') &&
    codexAlignmentContractMd.includes('## OpenClaw Execution Rule') &&
    codexAlignmentContractMd.includes('## Parallel Lane Rule')
  ) {
    passes.push('Codex system alignment contract captures autonomous execution, public-text truth, OpenClaw posture, and parallel-lane ownership.');
  } else {
    issues.push('Codex system alignment contract is missing one or more required autonomous-execution, public-text, OpenClaw, or parallel-lane rules.');
  }

  if (
    learningUxContractMd.includes('Exception:') &&
    learningUxContractMd.includes('the governed workspace label `Workups` is allowed only when it truthfully names the active diagnostic-workup lane') &&
    learningUxContractMd.includes('`Workups` must not be reused as a generic CTA')
  ) {
    passes.push('Learning UX markdown contract distinguishes the governed Workups lane label from vague public CTAs.');
  } else {
    issues.push('Learning UX markdown contract does not clearly distinguish the governed Workups label from vague public CTAs.');
  }

  const governedWorkupsLabels = contract.semanticClarity?.intentionalClicks?.allowedGovernedLabels || [];
  if (
    governedWorkupsLabels.some(
      (entry) =>
        entry?.label === 'Workups' &&
        Array.isArray(entry.allowedOnlyWhen) &&
        entry.allowedOnlyWhen.includes('workspace_switcher') &&
        entry.allowedOnlyWhen.includes('breadcrumb') &&
        entry.allowedOnlyWhen.includes('destination_heading')
    )
  ) {
    passes.push('Machine-readable UX contract preserves the governed Workups-label exception.');
  } else {
    issues.push('Machine-readable UX contract is missing the governed Workups-label exception.');
  }

  if (
    /execution_profile:[\s\S]*primary_interface:\s*codex/.test(adapterYaml) &&
    /execution_profile:[\s\S]*bounded_parallel_interface:\s*openclaw/.test(adapterYaml) &&
    /execution_profile:[\s\S]*promotion_authority:\s*codex/.test(adapterYaml)
  ) {
    passes.push('Adapter declares Codex as primary authority with bounded OpenClaw parallel execution.');
  } else {
    issues.push('Adapter does not clearly declare Codex primary authority with bounded OpenClaw parallel execution.');
  }

  if (
    hasYamlListEntry(adapterYaml, 'contracts', 'docs/contracts/CODEX_SYSTEM_ALIGNMENT_CONTRACT.md') &&
    hasYamlListEntry(adapterYaml, 'contracts', 'docs/contracts/PTHFNDR_DIDACTICS_LEARNING_UX_CONTRACT.md') &&
    hasYamlListEntry(adapterYaml, 'contracts', 'src/content/contracts/pthfndrDidacticsLearningUxContract.json') &&
    hasYamlListEntry(adapterYaml, 'contracts', 'scripts/validate_didactics_learning_ux.cjs')
  ) {
    passes.push('Adapter points to the current Didactic contract and validator truth surfaces.');
  } else {
    issues.push('Adapter is missing one or more current Didactic contract or validator truth surfaces.');
  }

  if (
    /verification:[\s\S]*npm run didactics:ux:validate/.test(adapterYaml) &&
    /verification:[\s\S]*npx vitest run scripts\/validate_didactics_learning_ux\.test\.ts/.test(adapterYaml) &&
    /verification:[\s\S]*git diff --check/.test(adapterYaml)
  ) {
    passes.push('Adapter defines a lane-relevant validation bundle for didactics UX contract work.');
  } else {
    issues.push('Adapter is missing the lane-relevant didactics UX validation bundle.');
  }

  if (
    /boundaries:[\s\S]*keep the governed Workups label only as workspace identity, never as a generic CTA/.test(adapterYaml) &&
    /integration_notes:[\s\S]*Treat Workups as a governed workspace label, not a generic public action label\./.test(adapterYaml)
  ) {
    passes.push('Adapter preserves the current Workups public-text rule.');
  } else {
    issues.push('Adapter does not clearly preserve the current Workups public-text rule.');
  }

  return { passes, issues };
};

const runValidation = ({
  agentsMd,
  codexAlignmentContractMd,
  learningUxContractMd,
  contract,
  adapterYaml,
  homeTsx,
  tutorialsTsx,
  lecturesTsx,
  algorithmsTsx,
  curriculumTsx,
  headerTsx,
  mobileHeaderTsx,
  sidebarTsx,
  workspaceNavTsx,
  appTsx,
  referenceTsx,
  stateStorageTs,
  studyDestinationStateTs,
  sectionNavTs,
  lectureNavigationTs,
  tutorialNavigationTs,
  algorithmNavigationTs,
  publicTopicLabels,
} = {}) => {
  const failures = [];
  const passes = [];

  ensure(
    contract.productSurface === '/didactics',
    'Contract targets /didactics.',
    'Learning UX contract does not target /didactics.',
    passes,
    failures,
  );

  ensure(
    Array.isArray(contract.routeAcceptanceGates) &&
      contract.routeAcceptanceGates.some((gate) => gate.includes('workspace change must visibly change the main panel')) &&
      contract.routeAcceptanceGates.some((gate) => gate.includes('true destination views')) &&
      contract.routeAcceptanceGates.some((gate) => gate.includes('workspace identity')) &&
      contract.routeAcceptanceGates.some((gate) => gate.includes('Duplicate public taxonomy labels')),
    'Machine-readable contract acceptance gates cover current workspace, destination, and taxonomy rules.',
    'Learning UX contract JSON is missing one or more current machine-checked acceptance gates.',
    passes,
    failures,
  );

  ensure(
    Array.isArray(contract.routeFailureClasses) &&
      contract.routeFailureClasses.includes('workspace click with no visible main-panel change') &&
      contract.routeFailureClasses.includes('duplicated public topic labels') &&
      contract.routeFailureClasses.includes('learner-facing meta jargon that explains the software structure instead of the study task'),
    'Machine-readable contract failure classes cover current high-risk didactics failure modes.',
    'Learning UX contract JSON is missing one or more current route failure classes.',
    passes,
    failures,
  );

  ensure(
    headerTsx.includes('Go to previous view') && headerTsx.includes('Go to next view'),
    'Header exposes explicit back/forward controls.',
    'Header is missing explicit back/forward navigation controls.',
    passes,
    failures,
  );

  ensure(
    sectionNavTs.includes('window.history.back()') && sectionNavTs.includes('window.history.forward()'),
    'Section navigation uses browser history for resilient movement.',
    'Section navigation is missing browser-history back/forward behavior.',
    passes,
    failures,
  );

  ensure(
    tutorialsTsx.includes('returnToTutorialLibrary'),
    'Tutorials open as destination views with a clear return path.',
    'Tutorial destination view is missing a clear return control.',
    passes,
    failures,
  );

  ensure(
    (tutorialsTsx.includes('Official ABPath scope') || tutorialsTsx.includes('ABPath scope') || tutorialsTsx.includes('Major topic:')) &&
      (
        tutorialsTsx.includes('Study sequence') ||
        tutorialsTsx.includes('Board-relevant focus') ||
        tutorialsTsx.includes('Diagnostic focus') ||
        tutorialsTsx.includes('Common pitfall')
      ),
    'Tutorial destination view exposes immediate context framing.',
    'Tutorial destination view is missing immediate context framing fields.',
    passes,
    failures,
  );

  ensure(
    tutorialsTsx.includes('Subject progress') &&
      tutorialsTsx.includes('Accuracy') &&
      tutorialsTsx.includes('Questions remaining'),
    'Tutorial quick-check surface exposes visible feedback and reward loops.',
    'Tutorial quick-check surface is missing visible feedback or reward-loop metrics.',
    passes,
    failures,
  );

  ensure(
    tutorialsTsx.includes('Faculty review required before trusting this key.'),
    'Incorrect-answer flow can raise discrepancy feedback.',
    'Incorrect-answer flow is missing discrepancy-feedback messaging.',
    passes,
    failures,
  );

  ensure(
    tutorialsTsx.includes('writeSessionState<TutorialViewState>') &&
      lecturesTsx.includes('writeSessionState<LectureViewState>') &&
      stateStorageTs.includes('sessionStorage'),
    'Tutorial and lecture routes preserve prior state across resume flow.',
    'Route state persistence for tutorial and lecture views is incomplete.',
    passes,
    failures,
  );

  ensure(
    lecturesTsx.includes('Lectures') &&
      lecturesTsx.includes('Choose a teaching topic') &&
      lecturesTsx.includes('Start here') &&
      lecturesTsx.includes('Back'),
    'Lecture destinations use concise path framing with an immediate return action.',
    'Lecture destination surface still relies on legacy phrasing.',
    passes,
    failures,
  );

  ensure(
    sidebarTsx.includes('Study') &&
      sidebarTsx.includes('Curriculum') &&
      sidebarTsx.includes('Lectures') &&
      sidebarTsx.includes('Tutorials') &&
      sidebarTsx.includes('Sign-Out'),
    'Persistent navigation remains stable and labeled.',
    'Persistent navigation is missing required stable primary destinations.',
    passes,
    failures,
  );

  ensure(
    headerTsx.includes('Focus View') || appTsx.includes('focusMode'),
    'The app communicates focused working-state context.',
    'The app is missing focused working-state context messaging.',
    passes,
    failures,
  );

  ensure(
    tutorialsTsx.includes('rounded-xl border border-slate-200 bg-slate-50') &&
      lecturesTsx.includes('rounded-xl border border-slate-200 bg-slate-50'),
    'Didactics routes use chunked grouped panels rather than unstructured text walls.',
    'Didactics routes may be missing chunked grouped panel structure.',
    passes,
    failures,
  );

  ensure(
    !/governed diagnostic route|pattern famil(?:y|ies)|study lane|decision nodes|Choose a study path|Launch module|Return to module|Available topics|This group|All topics|Recommended first click|Recommended first item|No algorithms are currently available in this lane|focused algorithm/i.test(algorithmsTsx),
    'Algorithm learner copy avoids internal route jargon, framework labels, and routing-system phrasing.',
    'Algorithm learner copy still exposes internal route jargon, framework labels, or routing-system phrasing.',
    passes,
    failures,
  );

  const duplicateTopicVariants = findDuplicatePublicTopicLabels(publicTopicLabels);
  ensure(
    duplicateTopicVariants.length === 0,
    'Static public topic labels are free of duplicate slash-format variants across current taxonomy surfaces.',
    `Duplicate public topic label variants detected: ${duplicateTopicVariants
      .map((variant) => variant.entries.map(formatLabelVariant).join(' vs '))
      .join('; ')}`,
    passes,
    failures,
  );

  ensure(
    sidebarTsx.includes('normalizePublicStudyLabel(') &&
      tutorialsTsx.includes('normalizePublicStudyLabel(') &&
      tutorialsTsx.includes('normalizePublicStudyPath('),
    'Sidebar and tutorial study surfaces share the same public label normalization rules.',
    'Sidebar and tutorial study surfaces do not clearly share the same public label normalization rules.',
    passes,
    failures,
  );

  const workspaceSemantics = evaluateWorkspaceSemantics({
    appTsx,
    headerTsx,
    sidebarTsx,
    workspaceNavTsx,
    componentTexts: {
      curriculum: curriculumTsx,
      lectures: lecturesTsx,
      tutorials: tutorialsTsx,
      algorithms: algorithmsTsx,
    },
  });
  passes.push(...workspaceSemantics.passes);
  failures.push(...workspaceSemantics.issues);

  const referenceBoundarySemantics = evaluateReferenceBoundarySemantics({
    homeTsx,
    mobileHeaderTsx,
    sidebarTsx,
    curriculumTsx,
    lecturesTsx,
    algorithmsTsx,
  });
  passes.push(...referenceBoundarySemantics.passes);
  failures.push(...referenceBoundarySemantics.issues);

  const referenceRouteSemantics = evaluateReferenceRouteSemantics({
    contract,
    appTsx,
    sectionNavTs,
    referenceTsx,
  });
  passes.push(...referenceRouteSemantics.passes);
  failures.push(...referenceRouteSemantics.issues);

  const contractAlignmentSemantics = evaluateContractAlignmentSemantics({
    agentsMd,
    codexAlignmentContractMd,
    learningUxContractMd,
    contract,
    adapterYaml,
  });
  passes.push(...contractAlignmentSemantics.passes);
  failures.push(...contractAlignmentSemantics.issues);

  const workspaceRoutingSemantics = evaluateWorkspaceRoutingSemantics({
    tutorialsTsx,
    lecturesTsx,
    algorithmsTsx,
    sidebarTsx,
    workspaceNavTsx,
    lectureNavigationTs,
    tutorialNavigationTs,
    algorithmNavigationTs,
  });
  passes.push(...workspaceRoutingSemantics.passes);
  failures.push(...workspaceRoutingSemantics.issues);

  const refreshAndHistorySemantics = evaluateRefreshAndHistorySemantics({
    studyDestinationStateTs,
    sectionNavTs,
    tutorialsTsx,
    lecturesTsx,
    algorithmsTsx,
  });
  passes.push(...refreshAndHistorySemantics.passes);
  failures.push(...refreshAndHistorySemantics.issues);

  const plainLanguageSemantics = evaluatePlainLanguageSemantics({
    contract,
    sidebarTsx,
    tutorialsTsx,
    lecturesTsx,
    workspaceNavTsx,
    curriculumTsx,
    algorithmsTsx,
  });
  passes.push(...plainLanguageSemantics.passes);
  failures.push(...plainLanguageSemantics.issues);

  const hierarchySemantics = evaluateHierarchySemantics({
    tutorialsTsx,
    lecturesTsx,
    algorithmsTsx,
    curriculumTsx,
  });
  passes.push(...hierarchySemantics.passes);
  failures.push(...hierarchySemantics.issues);

  return { passes, failures };
};

const loadInputsFromDisk = () => {
  const contract = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
  const agentsMd = fs.readFileSync(agentsPath, 'utf8');
  const codexAlignmentContractMd = fs.readFileSync(codexAlignmentContractPath, 'utf8');
  const learningUxContractMd = fs.readFileSync(learningUxContractMdPath, 'utf8');
  const adapterYaml = fs.readFileSync(adapterPath, 'utf8');
  const tutorialsTsx = fs.readFileSync(tutorialsPath, 'utf8');
  const lecturesTsx = fs.readFileSync(lecturesPath, 'utf8');
  const algorithmsTsx = fs.readFileSync(algorithmsPath, 'utf8');
  const curriculumTsx = fs.readFileSync(curriculumPath, 'utf8');
  const headerTsx = fs.readFileSync(headerPath, 'utf8');
  const homeTsx = fs.readFileSync(homePath, 'utf8');
  const mobileHeaderTsx = fs.readFileSync(mobileHeaderPath, 'utf8');
  const sidebarTsx = fs.readFileSync(sidebarPath, 'utf8');
  const workspaceNavTsx = fs.readFileSync(workspaceNavPath, 'utf8');
  const appTsx = fs.readFileSync(appPath, 'utf8');
  const referenceTsx = fs.readFileSync(referencePath, 'utf8');
  const stateStorageTs = fs.readFileSync(stateStoragePath, 'utf8');
  const studyDestinationStateTs = fs.readFileSync(studyDestinationStatePath, 'utf8');
  const sectionNavTs = fs.readFileSync(sectionNavPath, 'utf8');
  const lectureNavigationTs = fs.readFileSync(path.join(root, 'src/utils/lectureLibraryNavigation.ts'), 'utf8');
  const tutorialNavigationTs = fs.readFileSync(path.join(root, 'src/utils/tutorialLibraryNavigation.ts'), 'utf8');
  const algorithmNavigationTs = fs.readFileSync(path.join(root, 'src/utils/algorithmNavigatorNavigation.ts'), 'utf8');

  const tutorialCatalog = JSON.parse(fs.readFileSync(tutorialCatalogPath, 'utf8'));
  const validatedManifest = JSON.parse(fs.readFileSync(validatedManifestPath, 'utf8'));
  const algorithmCatalog = JSON.parse(fs.readFileSync(algorithmCatalogPath, 'utf8'));
  const curriculumCatalogText = fs.readFileSync(curriculumCatalogPath, 'utf8');

  const publicTopicLabels = collectPublicTopicLabels({
    tutorialCatalog,
    validatedManifest,
    algorithmCatalog,
    curriculumCatalogText,
  });

  return {
    agentsMd,
    codexAlignmentContractMd,
    learningUxContractMd,
    contract,
    adapterYaml,
    homeTsx,
    tutorialsTsx,
    lecturesTsx,
    algorithmsTsx,
    curriculumTsx,
    headerTsx,
    mobileHeaderTsx,
    sidebarTsx,
    workspaceNavTsx,
    appTsx,
    referenceTsx,
    stateStorageTs,
    studyDestinationStateTs,
    sectionNavTs,
    lectureNavigationTs,
    tutorialNavigationTs,
    algorithmNavigationTs,
    publicTopicLabels,
  };
};

const main = () => {
  const inputs = loadInputsFromDisk();
  const { passes, failures } = runValidation(inputs);

  const payload = {
    generatedAt: new Date().toISOString(),
    contractVersion: inputs.contract.version,
    passes,
    failures,
  };

  writeReport(reportJsonPath, reportMdPath, payload);

  if (failures.length > 0) {
    console.error(`[DIDACTICS-UX] Validation failed with ${failures.length} issue(s).`);
    failures.forEach((failure) => console.error(`- ${failure}`));
    process.exit(1);
  }

  console.log(`[DIDACTICS-UX] Validation passed with ${passes.length} checks.`);
};

module.exports = {
  collectPublicTopicLabels,
  evaluateContractAlignmentSemantics,
  evaluateRefreshAndHistorySemantics,
  evaluatePlainLanguageSemantics,
  evaluateHierarchySemantics,
  evaluateReferenceBoundarySemantics,
  evaluateReferenceRouteSemantics,
  evaluateWorkspaceSemantics,
  evaluateWorkspaceRoutingSemantics,
  findDuplicatePublicTopicLabels,
  normalizeComparableLabel,
  runValidation,
  toSlashVariantKey,
};

if (require.main === module) {
  main();
}
