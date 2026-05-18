import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PathologyCurriculum from './PathologyCurriculum.tsx';
import { Section } from '../types.ts';

const mocks = vi.hoisted(() => ({
  setLectureLibraryIntent: vi.fn(),
  setAlgorithmNavigatorIntent: vi.fn(),
  setReferenceLibraryIntent: vi.fn(),
  setTutorialLibraryIntent: vi.fn(),
  setSyllabusIntent: vi.fn(),
}));

vi.mock('../utils/lectureLibraryNavigation.ts', () => ({
  setLectureLibraryIntent: mocks.setLectureLibraryIntent,
}));

vi.mock('../utils/algorithmNavigatorNavigation.ts', () => ({
  setAlgorithmNavigatorIntent: mocks.setAlgorithmNavigatorIntent,
}));

vi.mock('../utils/referenceLibraryNavigation.ts', () => ({
  setReferenceLibraryIntent: mocks.setReferenceLibraryIntent,
}));

vi.mock('../utils/tutorialLibraryNavigation.ts', () => ({
  setTutorialLibraryIntent: mocks.setTutorialLibraryIntent,
}));

vi.mock('../utils/syllabusNavigation.ts', () => ({
  setSyllabusIntent: mocks.setSyllabusIntent,
}));

vi.mock('../utils/curriculumNavigation.ts', () => ({
  consumeCurriculumIntent: () => null,
}));

vi.mock('../utils/syllabusCatalog.ts', () => ({
  findBestSyllabusCategory: () => 'Breast pathology',
}));

vi.mock('../content/lectures/guPilotEnhancements.ts', () => ({
  getGuPilotEnhancement: (id: string) =>
    id
      ? {
          defaultMode: 'overview',
          algorithmIds: ['algo-1'],
          tissueLayerSets: [{ id: 'layer-set-1' }],
        }
      : undefined,
}));

describe('PathologyCurriculum', () => {
  const preferences = { focusMode: true };

  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
  });

  it('uses a compact module list and shows a buildout notice for staged modules', async () => {
    const user = userEvent.setup();
    render(<PathologyCurriculum onSectionChange={vi.fn()} preferences={preferences} />);

    expect(screen.getByRole('button', { name: 'Show all' })).toBeInTheDocument();
    expect(screen.queryByText('Canonical Modules')).not.toBeInTheDocument();
    expect(screen.queryByText('Staged Modules')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: /Search/i }), 'Skin / Melanocytic');
    await user.click(screen.getAllByRole('button', { name: /Skin \/ Melanocytic Staged Module/i })[0]);

    expect(screen.getByText('Some routes are still being built.')).toBeInTheDocument();
    expect(screen.getAllByText('Buildout').length).toBeGreaterThan(0);
  });

  it('routes a canonical module into its linked lecture', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<PathologyCurriculum onSectionChange={onSectionChange} preferences={preferences} />);

    await user.click(screen.getAllByRole('button', { name: /Breast Core Module/i })[0]);
    await user.click(screen.getByRole('button', { name: /Start lecture/i }));

    expect(mocks.setLectureLibraryIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedId: 'ioc-overview-breast-surgery',
        query: expect.stringContaining('Breast'),
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_LECTURES);
  });
});
