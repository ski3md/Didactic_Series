import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SyllabusExplorer from './SyllabusExplorer.tsx';
import { Section } from '../types.ts';

const mocks = vi.hoisted(() => ({
  consumeSyllabusIntent: vi.fn(),
  loadSyllabusTopics: vi.fn(),
  getSyllabusCategories: vi.fn(),
  setTutorialLibraryIntent: vi.fn(),
  setReferenceLibraryIntent: vi.fn(),
}));

vi.mock('../utils/syllabusNavigation.ts', () => ({
  consumeSyllabusIntent: mocks.consumeSyllabusIntent,
}));

vi.mock('../utils/syllabusCatalog.ts', () => ({
  loadSyllabusTopics: mocks.loadSyllabusTopics,
  getSyllabusCategories: mocks.getSyllabusCategories,
}));

vi.mock('../utils/tutorialLibraryNavigation.ts', () => ({
  setTutorialLibraryIntent: mocks.setTutorialLibraryIntent,
}));

vi.mock('../utils/referenceLibraryNavigation.ts', () => ({
  setReferenceLibraryIntent: mocks.setReferenceLibraryIntent,
}));

describe('SyllabusExplorer cross-links', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.consumeSyllabusIntent.mockReturnValue(null);
    mocks.getSyllabusCategories.mockReturnValue([{ value: 'ap_gu', label: 'AP Genitourinary' }]);
    mocks.loadSyllabusTopics.mockResolvedValue([
      {
        id: 'ap-gu-renal-neoplasms',
        title: 'Renal neoplasms',
        summary: 'Clear cell renal carcinoma and mimics.',
        category: 'ap_gu',
        categoryLabel: 'AP Genitourinary',
        tags: ['clear cell', 'PAX8', 'renal mass'],
        body: 'Recognize renal epithelial tumor patterns and differential diagnosis.',
      },
    ]);
  });

  it('routes selected syllabus topics into related tutorials and atlas review', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<SyllabusExplorer onSectionChange={onSectionChange} />);

    expect(await screen.findByRole('heading', { name: 'Renal neoplasms', level: 2 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open related tutorial' }));

    expect(mocks.setTutorialLibraryIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        query: 'Renal neoplasms',
        queries: expect.arrayContaining(['Renal neoplasms', 'clear cell', 'PAX8', 'renal mass']),
        lane: 'all',
        track: 'all',
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_TUTORIALS);

    await user.click(screen.getByRole('button', { name: 'Open atlas review' }));

    expect(mocks.setReferenceLibraryIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Renal neoplasms',
        focusTerms: expect.arrayContaining(['Renal neoplasms', 'clear cell', 'PAX8', 'renal mass']),
        syllabusTopics: ['Renal neoplasms'],
        tutorialTopics: ['clear cell', 'PAX8', 'renal mass'],
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.REFERENCE_LIBRARY);
  });
});
