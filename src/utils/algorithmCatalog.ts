import normalizedAlgorithms from '../content/algorithms/algorithms.normalized.json';
import { guPilotAlgorithms } from '../content/lectures/guPilotAlgorithms.ts';
import { activeCurriculumModules } from '../content/curriculum/activeCurriculum.ts';
import { LectureAlgorithmRecord } from '../types.ts';
import { promotedLectures } from './lectureLibraryCatalog.ts';
import { getInteractivePromotedLecture } from './interactiveLectureCatalog.ts';

export type AlgorithmPromotionState = 'canonical' | 'staged';

export interface DidacticAlgorithmRecord {
  id: string;
  title: string;
  category: string;
  summary: string;
  algorithm: LectureAlgorithmRecord;
  promotionState: AlgorithmPromotionState;
  promotionLabel: string;
  subspecialtyLabel: string;
  patternFamily: string;
  lectureId?: string;
  lectureTitle?: string;
  moduleTitle?: string;
  routeAliases: string[];
  focusTerms: string[];
  imageReviewTerms: string[];
  tutorialQueries: string[];
  topicChips: string[];
}

export interface DidacticAlgorithmIntent {
  selectedId: string;
  category: string;
  patternFamily: string;
  query: string;
}

export interface ResolvedDidacticAlgorithmRoute extends DidacticAlgorithmIntent {
  requestedTopic: string;
}

interface RawNormalizedAlgorithmRecord {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags?: string[];
  routeAliases?: string[];
  provenance?: {
    startNodeId: string;
    nodes: Record<string, LectureAlgorithmRecord['nodes'][string]>;
  };
}

const algorithmPromotionLabels: Record<AlgorithmPromotionState, string> = {
  canonical: 'Canonical',
  staged: 'Canonical',
};

const unique = (values: Array<string | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value))));

const normalizeLookupText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const LOOKUP_STOP_WORDS = new Set(['a', 'an', 'and', 'for', 'of', 'the', 'to']);

const tokenizeLookupText = (value: string) =>
  normalizeLookupText(value)
    .split(' ')
    .filter((token) => token && !LOOKUP_STOP_WORDS.has(token));

const inferSubspecialtyLabel = (algorithm: Pick<LectureAlgorithmRecord, 'category' | 'title'>) => {
  const title = algorithm.title.toLowerCase();
  if (algorithm.category === 'GU' || /(renal|bladder|testicular|prostate|urothelial)/.test(title)) {
    return 'Genitourinary';
  }
  if (algorithm.category === 'Soft Tissue') {
    return 'Soft Tissue';
  }
  if (algorithm.category === 'Bone') {
    return 'Bone';
  }
  return algorithm.category;
};

const inferPatternFamily = (
  algorithm: Pick<LectureAlgorithmRecord, 'title' | 'category'>,
  context: {
    tutorialQueries?: string[];
    moduleTitle?: string;
  } = {}
) => {
  const title = algorithm.title.toLowerCase();
  const moduleTitle = context.moduleTitle?.toLowerCase() ?? '';
  const tutorialHaystack = (context.tutorialQueries ?? []).join(' ').toLowerCase();
  const cpHaystack = `${title} ${moduleTitle} ${tutorialHaystack}`;

  if (
    algorithm.category === 'Clinical Pathology' ||
    /management and informatics|westgard|levey|verification|validation|lis|break-even|reagent rental|productivity/.test(cpHaystack)
  ) {
    if (/qc failure response|qc failure/.test(title)) {
      return 'QC Failure Response';
    }
    if (/validation-versus-verification triage|validation-versus-verification|validation vs verification/.test(title)) {
      return 'Validation vs Verification';
    }
    if (/lis workflow redesign|lis interfacing/.test(title)) {
      return 'LIS and Workflow Safety';
    }
    if (/finance-aware assay planning/.test(title)) {
      return 'Assay Planning and Finance';
    }
    if (/anemia workup and hemolysis triage/.test(title)) {
      return 'Anemia and Red Cell Triage';
    }
    if (/bleeding diathesis and coagulation test interpretation/.test(title)) {
      return 'Bleeding and Coagulation Triage';
    }
    if (/clinical microbiology specimen quality triage/.test(title)) {
      return 'Microbiology Specimen Quality';
    }
    if (/organism identification workflow/.test(title)) {
      return 'Organism Identification Workflow';
    }
    if (/ast interpretation/.test(title)) {
      return 'AST Interpretation and Stewardship';
    }
    if (/specimen-to-result cp workflow/.test(title)) {
      return 'Specimen and Result Workflow';
    }
    if (/transfusion reaction triage/.test(title)) {
      return 'Transfusion Reaction Triage';
    }
    if (/crossmatch workup/.test(title)) {
      return 'Transfusion Compatibility and Crossmatch';
    }
    if (/qc failure|westgard|levey/.test(cpHaystack)) {
      return 'QC Failure Response';
    }
    if (/validation-versus-verification|validation vs verification|verification pathway|validation pathway/.test(cpHaystack)) {
      return 'Validation vs Verification';
    }
    if (/anemia workup|hemolysis triage|red cell/.test(cpHaystack)) {
      return 'Anemia and Red Cell Triage';
    }
    if (/bleeding diathesis|coagulation test interpretation|factor pathway|hemostasis/.test(cpHaystack)) {
      return 'Bleeding and Coagulation Triage';
    }
    if (/crossmatch workup|compatibility issue|compatibility workup|alloantibody|red cell immunology and compatibility testing/.test(cpHaystack)) {
      return 'Transfusion Compatibility and Crossmatch';
    }
    if (/transfusion reaction triage|hemolytic transfusion reaction|febrile allergic and anaphylactic reactions|trali|taco|hazards of transfusion/.test(cpHaystack)) {
      return 'Transfusion Reaction Triage';
    }
    if (/ast interpretation|susceptibility|antimicrobial susceptibility|stewardship/.test(cpHaystack)) {
      return 'AST Interpretation and Stewardship';
    }
    if (/organism identification workflow|organism identification|maldi tof|colony pattern|gram stain morphology/.test(cpHaystack)) {
      return 'Organism Identification Workflow';
    }
    if (/microbiology specimen quality|specimen quality triage|gram stain|culture plate|maldi tof/.test(cpHaystack)) {
      return 'Microbiology Specimen Quality';
    }
    if (/specimen to result|specimen-to-result|critical reporting|bench selection/.test(cpHaystack)) {
      return 'Specimen and Result Workflow';
    }
    if (/lis workflow redesign|lis interfacing|middleware|workflow vulnerability/.test(cpHaystack)) {
      return 'LIS and Workflow Safety';
    }
    if (/finance-aware assay planning|break-even|reagent rental|productivity/.test(cpHaystack)) {
      return 'Assay Planning and Finance';
    }
    return 'Clinical Pathology Operations';
  }

  if (title.includes('spindle')) {
    return 'Spindle Cell';
  }
  if (title.includes('giant cell')) {
    return 'Giant Cell-Rich';
  }
  if (title.includes('bladder')) {
    return 'Bladder Triage';
  }
  if (title.includes('renal')) {
    return 'Renal Mass';
  }
  if (title.includes('testicular')) {
    return 'Testicular Mass';
  }
  return algorithm.category;
};

const collectTutorialQueries = (algorithm: LectureAlgorithmRecord) =>
  unique(Object.values(algorithm.nodes).map((node) => node.relatedTutorialQuery));

const collectFocusTerms = (algorithm: LectureAlgorithmRecord) =>
  unique(Object.values(algorithm.nodes).flatMap((node) => node.relatedImageTerms || []));

const findLinkedModuleTitle = (lectureId?: string, fallbackTerms: string[] = []) => {
  if (lectureId) {
    const directModule = activeCurriculumModules.find((module) =>
      module.lectures.some((lecture) => lecture.id === lectureId)
    );
    if (directModule) {
      return directModule.title;
    }
  }

  const lowered = fallbackTerms.map((term) => term.toLowerCase());
  const matchedModule = activeCurriculumModules.find((module) => {
    const haystack = [module.title, ...module.algorithmTopics, ...module.tutorialTopics].join(' ').toLowerCase();
    return lowered.some((term) => haystack.includes(term));
  });
  return matchedModule?.title;
};

const buildTopicChips = (
  subspecialtyLabel: string,
  patternFamily: string,
  promotionState: AlgorithmPromotionState,
  focusTerms: string[]
) =>
  unique([
    subspecialtyLabel,
    patternFamily,
    algorithmPromotionLabels[promotionState],
    ...focusTerms.slice(0, 3),
  ]).slice(0, 6);

const buildRouteAliases = (
  record: Pick<DidacticAlgorithmRecord, 'title' | 'patternFamily' | 'moduleTitle' | 'tutorialQueries'> & {
    routeAliases?: string[];
  }
) =>
  unique([
    record.title,
    record.patternFamily,
    record.moduleTitle,
    ...(record.routeAliases ?? []),
    ...record.tutorialQueries,
  ]);

interface ScoredAlgorithmRoute {
  entry: DidacticAlgorithmRecord;
  score: number;
  tokenGap: number;
}

const scoreRouteAlias = (topic: string, alias: string): Omit<ScoredAlgorithmRoute, 'entry'> | null => {
  const normalizedTopic = normalizeLookupText(topic);
  const normalizedAlias = normalizeLookupText(alias);

  if (!normalizedTopic || !normalizedAlias) {
    return null;
  }

  if (normalizedTopic === normalizedAlias) {
    return { score: 100, tokenGap: 0 };
  }

  const topicTokens = tokenizeLookupText(topic);
  const aliasTokens = tokenizeLookupText(alias);

  if (topicTokens.length < 2) {
    return null;
  }

  const aliasTokenSet = new Set(aliasTokens);
  if (!topicTokens.every((token) => aliasTokenSet.has(token))) {
    return null;
  }

  const ordered = topicTokens.every((token, index) => {
    const nextIndex = aliasTokens.indexOf(token, index === 0 ? 0 : aliasTokens.indexOf(topicTokens[index - 1]) + 1);
    return nextIndex !== -1;
  });
  const tokenGap = Math.max(aliasTokens.length - topicTokens.length, 0);
  const score = normalizedAlias.includes(normalizedTopic)
    ? 90 - tokenGap
    : ordered
    ? 82 - tokenGap
    : 74 - tokenGap;

  return score > 0 ? { score, tokenGap } : null;
};

const resolveBestAlgorithmRoute = (
  topic: string,
  candidates: DidacticAlgorithmRecord[]
): DidacticAlgorithmRecord | null => {
  const scoredMatches: ScoredAlgorithmRoute[] = candidates
    .map((entry) => {
      const bestAliasScore = buildRouteAliases(entry).reduce<Omit<ScoredAlgorithmRoute, 'entry'> | null>((best, alias) => {
        const current = scoreRouteAlias(topic, alias);
        if (!current) {
          return best;
        }
        if (!best || current.score > best.score || (current.score === best.score && current.tokenGap < best.tokenGap)) {
          return current;
        }
        return best;
      }, null);

      return bestAliasScore ? { entry, ...bestAliasScore } : null;
    })
    .filter((match): match is ScoredAlgorithmRoute => Boolean(match))
    .sort((left, right) => right.score - left.score || left.tokenGap - right.tokenGap || left.entry.title.localeCompare(right.entry.title));

  if (scoredMatches.length === 0) {
    return null;
  }

  const [best, runnerUp] = scoredMatches;
  if (runnerUp && best.score === runnerUp.score && best.tokenGap === runnerUp.tokenGap) {
    return null;
  }

  return best.entry;
};

const normalizeCanonicalAlgorithm = (algorithm: LectureAlgorithmRecord): DidacticAlgorithmRecord => {
  const linkedLecture = promotedLectures
    .map((lecture) => getInteractivePromotedLecture(lecture.id))
    .find((lecture) => lecture?.algorithms.some((item) => item.id === algorithm.id));
  const focusTerms = unique([
    ...(linkedLecture?.enhancement?.referenceFocusTerms ?? []),
    ...collectFocusTerms(algorithm),
  ]);
  const imageReviewTerms = unique(collectFocusTerms(algorithm));
  const tutorialQueries = unique([
    ...(linkedLecture?.enhancement?.relatedTutorialQueries ?? []),
    ...collectTutorialQueries(algorithm),
    algorithm.title,
  ]);
  const subspecialtyLabel = inferSubspecialtyLabel(algorithm);
  const moduleTitle = findLinkedModuleTitle(linkedLecture?.id, [algorithm.title, ...tutorialQueries]);
  const patternFamily = inferPatternFamily(algorithm, { tutorialQueries, moduleTitle });

  return {
    id: algorithm.id,
    title: algorithm.title,
    category: algorithm.category,
    summary: algorithm.summary,
    algorithm,
    promotionState: 'canonical',
    promotionLabel: algorithmPromotionLabels.canonical,
    subspecialtyLabel,
    patternFamily,
    lectureId: linkedLecture?.id,
    lectureTitle: linkedLecture?.title,
    moduleTitle,
    routeAliases: buildRouteAliases({
      title: algorithm.title,
      patternFamily,
      moduleTitle,
      tutorialQueries,
    }),
    focusTerms,
    imageReviewTerms,
    tutorialQueries,
    topicChips: buildTopicChips(subspecialtyLabel, patternFamily, 'canonical', focusTerms),
  };
};

const normalizeImportedAlgorithm = (record: RawNormalizedAlgorithmRecord): DidacticAlgorithmRecord => {
  const algorithm: LectureAlgorithmRecord = {
    id: record.id,
    title: record.title,
    category: record.category,
    summary: record.summary,
    startNodeId: record.provenance?.startNodeId || '',
    nodes: record.provenance?.nodes || {},
  };
  const focusTerms = unique([record.category, ...(record.tags || []), ...collectFocusTerms(algorithm)]);
  const imageReviewTerms = unique(collectFocusTerms(algorithm));
  const tutorialQueries = unique([...collectTutorialQueries(algorithm), record.title]);
  const subspecialtyLabel = inferSubspecialtyLabel(algorithm);
  const moduleTitle = findLinkedModuleTitle(undefined, [algorithm.title, ...tutorialQueries]);
  const patternFamily = inferPatternFamily(algorithm, { tutorialQueries, moduleTitle });

  return {
    id: algorithm.id,
    title: algorithm.title,
    category: algorithm.category,
    summary: algorithm.summary,
    algorithm,
    promotionState: 'staged',
    promotionLabel: algorithmPromotionLabels.staged,
    subspecialtyLabel,
    patternFamily,
    moduleTitle,
    routeAliases: buildRouteAliases({
      title: algorithm.title,
      patternFamily,
      moduleTitle,
      tutorialQueries,
      routeAliases: record.routeAliases,
    }),
    focusTerms,
    imageReviewTerms,
    tutorialQueries,
    topicChips: buildTopicChips(subspecialtyLabel, patternFamily, 'staged', focusTerms),
  };
};

export const didacticAlgorithms: DidacticAlgorithmRecord[] = [
  ...guPilotAlgorithms.map(normalizeCanonicalAlgorithm),
  ...(normalizedAlgorithms as RawNormalizedAlgorithmRecord[]).map(normalizeImportedAlgorithm),
].sort((left, right) => {
  if (left.promotionState !== right.promotionState) {
    return left.promotionState === 'canonical' ? -1 : 1;
  }
  if (left.subspecialtyLabel !== right.subspecialtyLabel) {
    return left.subspecialtyLabel.localeCompare(right.subspecialtyLabel);
  }
  return left.title.localeCompare(right.title);
});

export const resolveDidacticAlgorithmIntent = (
  topic: string,
  preferredSubspecialty?: string
): DidacticAlgorithmIntent | null => {
  const normalizedTopic = normalizeLookupText(topic);
  if (!normalizedTopic) {
    return null;
  }

  const candidates = didacticAlgorithms.filter((entry) =>
    preferredSubspecialty ? entry.subspecialtyLabel === preferredSubspecialty : true
  );
  const match = resolveBestAlgorithmRoute(topic, candidates);

  if (!match) {
    return null;
  }

  return {
    selectedId: match.id,
    category: match.subspecialtyLabel,
    patternFamily: match.patternFamily,
    query: match.title,
  };
};

export const resolveDidacticAlgorithmRoutes = (
  topics: string[],
  preferredSubspecialty?: string
): ResolvedDidacticAlgorithmRoute[] => {
  const seen = new Set<string>();
  const resolved: ResolvedDidacticAlgorithmRoute[] = [];

  for (const topic of topics) {
    const match = resolveDidacticAlgorithmIntent(topic, preferredSubspecialty);
    if (!match || seen.has(match.selectedId)) {
      continue;
    }
    seen.add(match.selectedId);
    resolved.push({
      ...match,
      requestedTopic: topic,
    });
  }

  return resolved;
};
