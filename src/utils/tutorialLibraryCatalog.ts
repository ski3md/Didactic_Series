import boardPrepTutorialsUrl from '../content/tutorials/tutorials.normalized.json?url';
import downloadsTutorialsUrl from '../content/downloads_imports/normalized/tutorials.normalized.json?url';

export type TutorialLane = 'board-prep' | 'core-patterns' | 'granuloma' | 'mixed';
export type TutorialTrack = 'surgical-path' | 'clinical-path' | 'cross-cutting';
export type TutorialPromotionState = 'canonical' | 'staged';

export interface TutorialMCQ {
  question: string;
  choices: string[];
  answer: string;
  rationale?: string;
}

export interface TutorialFlashcard {
  front: string;
  back: string;
  tag?: string;
}

export interface DidacticTutorialRecord {
  id: string;
  title: string;
  summary: string;
  body: string;
  lane: TutorialLane;
  laneLabel: string;
  track: TutorialTrack;
  trackLabel: string;
  promotionState: TutorialPromotionState;
  promotionLabel: string;
  sourceRepo: string;
  sourceLabel: string;
  topicChips: string[];
  tags: string[];
  mcqCount: number;
  flashcardCount: number;
  category?: string;
  mcqs: TutorialMCQ[];
  flashcards: TutorialFlashcard[];
}

type RawTutorialRecord = {
  id: string;
  title: string;
  summary?: string;
  body?: string;
  sourceRepo?: string;
  tags?: string[];
  mcqs?: TutorialMCQ[];
  flashcards?: TutorialFlashcard[];
  category?: string;
};

const laneConfig: Record<TutorialLane, { label: string }> = {
  'board-prep': { label: 'Board Prep Tutorials' },
  'core-patterns': { label: 'Core Pattern Tutorials' },
  granuloma: { label: 'Granuloma Tutorials' },
  mixed: { label: 'Mixed Tutorial Imports' },
};

const trackConfig: Record<TutorialTrack, { label: string }> = {
  'surgical-path': { label: 'Surgical Pathology' },
  'clinical-path': { label: 'Clinical Pathology' },
  'cross-cutting': { label: 'Cross-Cutting' },
};

const promotionConfig: Record<TutorialPromotionState, { label: string }> = {
  canonical: { label: 'Canonical' },
  staged: { label: 'Staged Import' },
};

const CLINICAL_PATH_KEYWORDS = [
  'blood bank',
  'transfusion',
  'clinical chemistry',
  'chemistry',
  'microbiology',
  'molecular',
  'coagulation',
  'laboratory',
  'clinical pathology',
  'serology',
];

const CROSS_CUTTING_KEYWORDS = [
  'hematopathology',
  'hematopoietic',
  'lymphoma',
  'leukemia',
  'bone marrow',
];

const SURGICAL_PATH_KEYWORDS = [
  'breast',
  'gyn',
  'gynecologic',
  'renal',
  'testicular',
  'lung',
  'gi',
  'gastrointestinal',
  'bladder',
  'pancreas',
  'thyroid',
  'soft tissue',
  'bone',
  'sarcoidosis',
  'granuloma',
];

const inferLane = (record: RawTutorialRecord): TutorialLane => {
  if (record.sourceRepo === 'board_prep') {
    return 'board-prep';
  }
  if (record.sourceRepo === 'ioc-next-app') {
    return 'core-patterns';
  }
  if ((record.category || '').toLowerCase().includes('granulomatous')) {
    return 'granuloma';
  }
  return 'mixed';
};

const inferTrack = (record: RawTutorialRecord): TutorialTrack => {
  const sourceRepo = (record.sourceRepo || '').toLowerCase();
  const id = record.id.toLowerCase();
  const text = [record.title, record.summary, record.category, ...(record.tags || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (sourceRepo === 'board_prep' || sourceRepo === 'ioc-next-app') {
    return 'surgical-path';
  }
  if (sourceRepo.includes('granulomatous')) {
    return 'surgical-path';
  }
  if (sourceRepo.includes('cp-content-specification')) {
    return 'clinical-path';
  }
  if (/^topic-(bb|cp|mb)\b/.test(id) || CLINICAL_PATH_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return 'clinical-path';
  }
  if (/^topic-hp\b/.test(id) || CROSS_CUTTING_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return 'cross-cutting';
  }
  if (/^topic-ap\b/.test(id) || SURGICAL_PATH_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return 'surgical-path';
  }
  return 'surgical-path';
};

const inferPromotionState = (record: RawTutorialRecord): TutorialPromotionState =>
  record.sourceRepo === 'board_prep' ? 'canonical' : 'staged';

const toSourceLabel = (sourceRepo?: string) => {
  if (!sourceRepo) {
    return 'Unknown source';
  }
  if (sourceRepo === 'board_prep') {
    return 'Board Prep Library';
  }
  if (sourceRepo === 'ioc-next-app') {
    return 'Pattern Tutorial Imports';
  }
  if (sourceRepo.includes('cp-content-specification')) {
    return 'CP Content Specifications';
  }
  if (sourceRepo.includes('granulomatous')) {
    return 'Granulomatous Module Imports';
  }
  if (sourceRepo.includes('abpath-advanced-board-prep-platform')) {
    return 'ABPath Board Prep Imports';
  }
  return sourceRepo;
};

const buildTopicChips = (
  record: RawTutorialRecord,
  lane: TutorialLane,
  track: TutorialTrack,
  promotionState: TutorialPromotionState
) => {
  return Array.from(
    new Set(
      [
        trackConfig[track].label,
        laneConfig[lane].label.replace(' Tutorials', ''),
        promotionConfig[promotionState].label,
        record.category || '',
        ...(record.tags || []).slice(0, 4),
      ].filter(Boolean)
    )
  ).slice(0, 6);
};

const normalizeTutorial = (record: RawTutorialRecord): DidacticTutorialRecord => {
  const lane = inferLane(record);
  const track = inferTrack(record);
  const promotionState = inferPromotionState(record);
  return {
    id: record.id,
    title: record.title,
    summary: record.summary || record.title,
    body: record.body || '',
    lane,
    laneLabel: laneConfig[lane].label,
    track,
    trackLabel: trackConfig[track].label,
    promotionState,
    promotionLabel: promotionConfig[promotionState].label,
    sourceRepo: record.sourceRepo || 'unknown',
    sourceLabel: toSourceLabel(record.sourceRepo),
    topicChips: buildTopicChips(record, lane, track, promotionState),
    tags: record.tags || [],
    mcqCount: record.mcqs?.length || 0,
    flashcardCount: record.flashcards?.length || 0,
    category: record.category || undefined,
    mcqs: record.mcqs || [],
    flashcards: record.flashcards || [],
  };
};

export const loadDidacticTutorials = async (): Promise<DidacticTutorialRecord[]> => {
  const [boardPrepResponse, downloadsResponse] = await Promise.all([
    fetch(boardPrepTutorialsUrl),
    fetch(downloadsTutorialsUrl),
  ]);
  const [boardPrepData, downloadsData] = await Promise.all([
    boardPrepResponse.json() as Promise<RawTutorialRecord[]>,
    downloadsResponse.json() as Promise<RawTutorialRecord[]>,
  ]);
  return [...boardPrepData, ...downloadsData]
    .map(normalizeTutorial)
    .sort((left, right) => {
      if (left.promotionState !== right.promotionState) {
        return left.promotionState === 'canonical' ? -1 : 1;
      }
      if (left.track !== right.track) {
        return left.track.localeCompare(right.track);
      }
      return left.title.localeCompare(right.title);
    });
};

export const getDidacticTutorialById = (tutorials: DidacticTutorialRecord[], id?: string | null) =>
  tutorials.find((tutorial) => tutorial.id === id);

export const findBestTutorialMatch = (tutorials: DidacticTutorialRecord[], terms: string[]) => {
  const normalizedTerms = terms
    .map((term) => term.trim().toLowerCase())
    .filter(Boolean);

  if (normalizedTerms.length === 0) {
    return tutorials[0];
  }

  let bestMatch = tutorials[0];
  let bestScore = -1;

  for (const tutorial of tutorials) {
    const haystack = [
      tutorial.title,
      tutorial.summary,
      tutorial.body.slice(0, 1200),
      tutorial.category || '',
      ...tutorial.tags,
    ]
      .join(' ')
      .toLowerCase();

    const score = normalizedTerms.reduce((total, term) => {
      if (tutorial.title.toLowerCase().includes(term)) {
        return total + 6;
      }
      if ((tutorial.category || '').toLowerCase().includes(term)) {
        return total + 4;
      }
      if (tutorial.tags.some((tag) => tag.toLowerCase().includes(term))) {
        return total + 3;
      }
      if (haystack.includes(term)) {
        return total + 1;
      }
      return total;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = tutorial;
    }
  }

  return bestMatch;
};
