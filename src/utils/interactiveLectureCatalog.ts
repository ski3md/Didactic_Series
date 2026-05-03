import {
  DxEntityCard,
  Flashcard,
  InteractiveLectureEnhancement,
  InteractiveLectureSlide,
  LectureAlgorithmRecord,
  LecturePlayerMode,
  LectureQuickCheck,
  LectureTissueLayerSet,
  MCQ,
} from '../types.ts';
import { getPromotedLectureById, type ImportedLectureRecord, type PromotedLectureRecord } from './lectureLibraryCatalog.ts';
import { getGuPilotEnhancement } from '../content/lectures/guPilotEnhancements.ts';
import { getGuPilotAlgorithm } from '../content/lectures/guPilotAlgorithms.ts';

export interface InteractivePromotedLectureRecord extends PromotedLectureRecord {
  slides: InteractiveLectureSlide[];
  mcqs: MCQ[];
  flashcards: Flashcard[];
  enhancement?: InteractiveLectureEnhancement;
  algorithms: LectureAlgorithmRecord[];
  tissueLayerSets: LectureTissueLayerSet[];
  entityCards: DxEntityCard[];
  quickChecks: LectureQuickCheck[];
  defaultMode: LecturePlayerMode;
}

const normalizeSlides = (slides: Array<Record<string, unknown>>): InteractiveLectureSlide[] =>
  slides.map((slide) => ({
    type: String(slide.type ?? 'summary') as InteractiveLectureSlide['type'],
    title: String(slide.title ?? 'Untitled slide'),
    content: typeof slide.content === 'string' ? slide.content : undefined,
    config: typeof slide.config === 'object' && slide.config ? (slide.config as InteractiveLectureSlide['config']) : undefined,
    visualAid:
      typeof slide.visualAid === 'object' && slide.visualAid
        ? (slide.visualAid as InteractiveLectureSlide['visualAid'])
        : undefined,
  }));

const normalizeLecture = (lecture: PromotedLectureRecord): InteractivePromotedLectureRecord => {
  const enhancement = getGuPilotEnhancement(lecture.id);
  const normalizedSlides = normalizeSlides((lecture.slides as Array<Record<string, unknown>> | undefined) ?? []);
  const embeddedMcqs = ((lecture as ImportedLectureRecord & { mcqs?: MCQ[] }).mcqs ?? []).filter(Boolean);
  const embeddedFlashcards = ((lecture as ImportedLectureRecord & { flashcards?: Flashcard[] }).flashcards ?? []).filter(Boolean);
  const algorithmIds = enhancement?.algorithmIds ?? [];
  const algorithms = algorithmIds
    .map((id) => getGuPilotAlgorithm(id))
    .filter(Boolean) as LectureAlgorithmRecord[];

  return {
    ...lecture,
    slides: normalizedSlides,
    mcqs: embeddedMcqs,
    flashcards: embeddedFlashcards,
    enhancement,
    algorithms,
    tissueLayerSets: enhancement?.tissueLayerSets ?? [],
    entityCards: enhancement?.entityCards ?? [],
    quickChecks: enhancement?.quickChecks ?? [],
    defaultMode: enhancement?.defaultMode ?? 'overview',
  };
};

export const getInteractivePromotedLecture = (lectureId: string): InteractivePromotedLectureRecord | undefined => {
  const lecture = getPromotedLectureById(lectureId);
  return lecture ? normalizeLecture(lecture) : undefined;
};

export const isInteractiveGuPilotLecture = (lectureId: string): boolean => Boolean(getGuPilotEnhancement(lectureId));
