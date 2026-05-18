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
  focusTerms: string[];
  tutorialQueries: string[];
  topicChips: string[];
}

interface RawNormalizedAlgorithmRecord {
  id: string;
  title: string;
  category: string;
  summary: string;
  tags?: string[];
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

const inferPatternFamily = (algorithm: Pick<LectureAlgorithmRecord, 'title' | 'category'>) => {
  const title = algorithm.title.toLowerCase();
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

const normalizeCanonicalAlgorithm = (algorithm: LectureAlgorithmRecord): DidacticAlgorithmRecord => {
  const linkedLecture = promotedLectures
    .map((lecture) => getInteractivePromotedLecture(lecture.id))
    .find((lecture) => lecture?.algorithms.some((item) => item.id === algorithm.id));
  const focusTerms = unique([
    ...(linkedLecture?.enhancement?.referenceFocusTerms ?? []),
    ...collectFocusTerms(algorithm),
  ]);
  const tutorialQueries = unique([
    ...(linkedLecture?.enhancement?.relatedTutorialQueries ?? []),
    ...collectTutorialQueries(algorithm),
    algorithm.title,
  ]);
  const subspecialtyLabel = inferSubspecialtyLabel(algorithm);
  const patternFamily = inferPatternFamily(algorithm);

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
    moduleTitle: findLinkedModuleTitle(linkedLecture?.id, [algorithm.title, ...tutorialQueries]),
    focusTerms,
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
  const tutorialQueries = unique([...collectTutorialQueries(algorithm), record.title]);
  const subspecialtyLabel = inferSubspecialtyLabel(algorithm);
  const patternFamily = inferPatternFamily(algorithm);

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
    moduleTitle: findLinkedModuleTitle(undefined, [algorithm.title, ...tutorialQueries]),
    focusTerms,
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
