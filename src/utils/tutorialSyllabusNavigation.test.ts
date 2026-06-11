import { describe, expect, it, vi } from 'vitest';
import { buildTutorialSyllabusIntent } from './tutorialSyllabusNavigation.ts';
import type { DidacticTutorialRecord } from './tutorialLibraryCatalog.ts';

vi.mock('./syllabusCatalog.ts', () => ({
  findBestSyllabusCategory: (terms: string[]) =>
    terms.some((term) => term.toLowerCase().includes('genitourinary')) ? 'ap_gu' : 'ap_breast',
}));

const baseTutorial: DidacticTutorialRecord = {
  id: 'renal-cell-carcinoma-clear-cell-papillary',
  title: 'Renal Cell Carcinoma (Clear Cell, Papillary)',
  summary: 'Renal tumor review.',
  body: '',
  lane: 'board-prep',
  laneLabel: 'Board Prep Tutorials',
  track: 'surgical-path',
  trackLabel: 'Surgical Pathology',
  promotionState: 'canonical',
  promotionLabel: 'Canonical',
  sourceRepo: 'board_prep',
  sourceLabel: 'Board Prep',
  topicChips: ['renal', 'clear cell'],
  tags: ['Genitourinary'],
  mcqCount: 0,
  flashcardCount: 0,
  mcqs: [],
  flashcards: [],
};

describe('tutorial syllabus navigation', () => {
  it('builds an AP syllabus intent from tutorial ABPath scope', () => {
    const intent = buildTutorialSyllabusIntent({
      ...baseTutorial,
      abpathScope: {
        domain: 'AP',
        root: 'Genitourinary',
        primaryPath: 'Genitourinary > Kidney > Renal cell carcinoma',
        title: 'Renal cell carcinoma',
        confidence: 'high',
        source: 'local crosswalk',
      },
    });

    expect(intent).toEqual({
      query: 'Renal cell carcinoma',
      category: 'ap_gu',
    });
  });

  it('does not create a syllabus intent for CP tutorials until CP syllabus anchors exist', () => {
    const intent = buildTutorialSyllabusIntent({
      ...baseTutorial,
      track: 'clinical-path',
      trackLabel: 'Clinical Pathology',
      abpathScope: {
        domain: 'CP',
        root: 'Transfusion Medicine',
        primaryPath: 'Transfusion Medicine > Reactions',
        title: 'Transfusion reaction workup',
        confidence: 'high',
        source: 'local crosswalk',
      },
    });

    expect(intent).toBeNull();
  });
});
