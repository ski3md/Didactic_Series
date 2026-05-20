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
import { buildLectureAbpathAugmentation } from './lectureAbpathAugmentation.ts';

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
  const abpathAugmentation = buildLectureAbpathAugmentation(lecture);
  const normalizedSlides = normalizeSlides((lecture.slides as Array<Record<string, unknown>> | undefined) ?? []);
  const embeddedMcqs = ((lecture as ImportedLectureRecord & { mcqs?: MCQ[] }).mcqs ?? []).filter(Boolean);
  const embeddedFlashcards = ((lecture as ImportedLectureRecord & { flashcards?: Flashcard[] }).flashcards ?? []).filter(Boolean);
  const algorithmIds = enhancement?.algorithmIds ?? [];
  const algorithms = algorithmIds
    .map((id) => getGuPilotAlgorithm(id))
    .filter(Boolean) as LectureAlgorithmRecord[];
  const existingObjectives = ((lecture as ImportedLectureRecord & { learningObjectives?: string[] }).learningObjectives ?? []).filter(Boolean);
  const mergedObjectives = Array.from(new Set([...existingObjectives, ...abpathAugmentation.objectives]));

  return {
    ...lecture,
    learningObjectives: mergedObjectives,
    slides: normalizedSlides.length > 0 ? normalizedSlides : abpathAugmentation.slides,
    mcqs: embeddedMcqs.length > 0 ? embeddedMcqs : abpathAugmentation.mcqs,
    flashcards: embeddedFlashcards.length > 0 ? embeddedFlashcards : abpathAugmentation.flashcards,
    enhancement,
    algorithms: algorithms.length > 0 ? algorithms : abpathAugmentation.algorithms,
    tissueLayerSets: (enhancement?.tissueLayerSets?.length ?? 0) > 0 ? enhancement!.tissueLayerSets : abpathAugmentation.tissueLayerSets,
    entityCards: (enhancement?.entityCards?.length ?? 0) > 0 ? enhancement!.entityCards : abpathAugmentation.entityCards,
    quickChecks: (enhancement?.quickChecks?.length ?? 0) > 0 ? enhancement!.quickChecks : abpathAugmentation.quickChecks,
    defaultMode: enhancement?.defaultMode ?? 'overview',
  };
};

export const getInteractivePromotedLecture = (lectureId: string): InteractivePromotedLectureRecord | undefined => {
  const lecture = getPromotedLectureById(lectureId);
  return lecture ? normalizeLecture(lecture) : undefined;
};

export const isInteractiveGuPilotLecture = (lectureId: string): boolean => Boolean(getGuPilotEnhancement(lectureId));
