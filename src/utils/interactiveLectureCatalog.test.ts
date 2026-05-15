import { describe, expect, it } from 'vitest';
import { getInteractivePromotedLecture } from './interactiveLectureCatalog.ts';
import { promotedLectures } from './lectureLibraryCatalog.ts';

describe('interactive lecture ABPath augmentation', () => {
  it('fills every promoted lecture with the top-tab content areas', () => {
    expect(promotedLectures.length).toBeGreaterThan(0);

    for (const lecture of promotedLectures) {
      const interactiveLecture = getInteractivePromotedLecture(lecture.id);

      expect(interactiveLecture, lecture.id).toBeDefined();
      expect(interactiveLecture?.learningObjectives?.length, `${lecture.id} objectives`).toBeGreaterThanOrEqual(5);
      expect(interactiveLecture?.slides.length, `${lecture.id} overview slides`).toBeGreaterThan(0);
      expect(interactiveLecture?.algorithms.length, `${lecture.id} algorithm`).toBeGreaterThan(0);
      expect(interactiveLecture?.tissueLayerSets.length, `${lecture.id} microscopy`).toBeGreaterThan(0);
      expect(interactiveLecture?.entityCards.length, `${lecture.id} knowledge cards`).toBeGreaterThan(0);
      expect(interactiveLecture?.quickChecks.length, `${lecture.id} quick checks`).toBeGreaterThan(0);
      expect(interactiveLecture?.mcqs.length, `${lecture.id} MCQs`).toBeGreaterThan(0);
      expect(interactiveLecture?.flashcards.length, `${lecture.id} flashcards`).toBeGreaterThan(0);
    }
  });
});
