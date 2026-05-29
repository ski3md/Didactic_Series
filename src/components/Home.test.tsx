import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import Home from './Home.tsx';
import { Section } from '../types.ts';

const mocks = vi.hoisted(() => ({
  setLectureLibraryIntent: vi.fn(),
  setAlgorithmNavigatorIntent: vi.fn(),
  setCurriculumIntent: vi.fn(),
  setTutorialLibraryIntent: vi.fn(),
}));

vi.mock('../hooks/useUserProgress.ts', () => ({
  useUserProgress: () => ({}),
}));

vi.mock('../utils/lectureLibraryNavigation.ts', () => ({
  setLectureLibraryIntent: mocks.setLectureLibraryIntent,
}));

vi.mock('../utils/algorithmNavigatorNavigation.ts', () => ({
  setAlgorithmNavigatorIntent: mocks.setAlgorithmNavigatorIntent,
}));

vi.mock('../utils/curriculumNavigation.ts', () => ({
  setCurriculumIntent: mocks.setCurriculumIntent,
}));

vi.mock('../utils/tutorialLibraryNavigation.ts', () => ({
  setTutorialLibraryIntent: mocks.setTutorialLibraryIntent,
}));

vi.mock('../content/lectures/guPilotEnhancements.ts', () => ({
  getGuPilotEnhancement: () => ({
    defaultMode: 'overview',
    tissueLayerSets: [{ id: 'layer-set-1' }],
  }),
}));

vi.mock('../utils/lectureLibraryCatalog.ts', () => ({
  curatedPromotedLectures: [
    { id: 'bladder_path_core_principles', title: 'Bladder Pathology Core Principles', lectureTrack: 'curated' },
    { id: 'renal_mass_eval', title: 'Renal Mass Evaluation', lectureTrack: 'curated' },
  ],
  corePrinciplesPromotedLectures: [
    { id: 'ioc-overview-breast-surgery', title: 'Breast Pathology Core Principles', lectureTrack: 'core-principles' },
  ],
  getPromotedLectureById: (id: string) => {
    const lectures = [
      { id: 'bladder_path_core_principles', title: 'Bladder Pathology Core Principles', lectureTrack: 'curated' },
      { id: 'renal_mass_eval', title: 'Renal Mass Evaluation', lectureTrack: 'curated' },
      { id: 'ioc-overview-breast-surgery', title: 'Breast Pathology Core Principles', lectureTrack: 'core-principles' },
    ];
    return lectures.find((lecture) => lecture.id === id) ?? null;
  },
}));

vi.mock('../utils/interactiveLectureCatalog.ts', () => ({
  getInteractivePromotedLecture: (id: string) => ({
    id,
    title:
      id === 'bladder_path_core_principles'
        ? 'Bladder Pathology Core Principles'
        : id === 'renal_mass_eval'
          ? 'Renal Mass Evaluation'
          : 'Testicular Mass Evaluation',
    lectureTrack: 'curated',
    summary: 'Summary',
    category: 'Genitourinary',
    sourceLabel: 'Promoted',
    learningObjectives: ['Objective 1', 'Objective 2'],
    algorithms: [{ id: 'algo-1' }],
    tissueLayerSets: [{ id: 'layer-set-1' }],
    quickChecks: [{ id: 'quick-1' }],
    mcqs: [{ id: 'mcq-1' }],
    enhancement: {
      workflowSummary: ['Step 1', 'Step 2'],
      relatedTutorialQueries: ['bladder carcinoma tutorial'],
    },
  }),
}));

describe('Home', () => {
  const preferences = { focusMode: true };

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('routes the lecture entry card into the didactic lecture library', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<Home onSectionChange={onSectionChange} user={null} preferences={preferences} />);

    await user.click(screen.getByRole('button', { name: /Choose a lecture/i }));

    expect(mocks.setLectureLibraryIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedId: undefined,
        track: 'all',
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_LECTURES);
  });

  it('opens featured lecture overview with the selected lecture intent', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<Home onSectionChange={onSectionChange} user={null} preferences={preferences} />);

    await user.click(screen.getAllByRole('button', { name: /Testicular Mass Evaluation.*Open/i })[0]);

    expect(mocks.setLectureLibraryIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedId: 'penile_who_complete_pathology',
        initialMode: 'overview',
        imageLayerSetId: 'layer-set-1',
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_LECTURES);
  });

  it('routes CP checks into the broader clinical pathology tutorial lane', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<Home onSectionChange={onSectionChange} user={null} preferences={preferences} />);

    await user.click(screen.getByRole('button', { name: /Reviewed CP tutorial checks/i }));

    expect(mocks.setTutorialLibraryIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        track: 'clinical-path',
        query: expect.stringContaining('management informatics'),
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_TUTORIALS);
  });

  it('does not surface the reference library as a direct learner-first home route', () => {
    const onSectionChange = vi.fn();

    render(<Home onSectionChange={onSectionChange} user={null} preferences={preferences} />);

    expect(screen.queryByRole('button', { name: /reference library/i })).not.toBeInTheDocument();
  });

  it('uses Genitourinary instead of GU on learner-facing home labels', () => {
    const onSectionChange = vi.fn();

    render(<Home onSectionChange={onSectionChange} user={null} preferences={preferences} />);

    expect(screen.getByText('Start Genitourinary WHO testis')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Genitourinary curriculum/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^GU curriculum$/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/^Start GU WHO testis$/i)).not.toBeInTheDocument();
  });
});
