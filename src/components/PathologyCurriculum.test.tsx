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

  it('uses a compact topic list and shows an adding-now notice for staged topics', async () => {
    const user = userEvent.setup();
    render(<PathologyCurriculum onSectionChange={vi.fn()} preferences={preferences} />);

    expect(screen.getByRole('button', { name: 'Show all' })).toBeInTheDocument();
    expect(screen.queryByText('Canonical Modules')).not.toBeInTheDocument();
    expect(screen.queryByText('Staged Modules')).not.toBeInTheDocument();

    await user.type(screen.getByRole('searchbox', { name: /Search/i }), 'Skin / Melanocytic');
    await user.click(screen.getAllByRole('button', { name: /Skin \/ Melanocytic Staged Module/i })[0]);

    expect(screen.getByText('Some study links are still being added.')).toBeInTheDocument();
    expect(screen.getAllByText('Adding now').length).toBeGreaterThan(0);
  });

  it('opens morphology-first gateways into pattern curriculum modules', async () => {
    const user = userEvent.setup();
    render(<PathologyCurriculum onSectionChange={vi.fn()} preferences={preferences} />);

    expect(screen.getByText('Morphology-first curriculum')).toBeInTheDocument();
    expect(screen.getAllByText('PAX8').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Immunophenotype branch').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Open morphology gateway: Small Round Blue Cell Differential' }));

    expect(screen.getByRole('heading', { name: 'Small Round Blue Cell Differential' })).toBeInTheDocument();
    expect(screen.getByText(/genitourinary, mesenchymal, neuro, and pediatric contexts/i)).toBeInTheDocument();
    expect(screen.getByText('Common diagnostic patterns')).toBeInTheDocument();
    expect(screen.getByText('small round blue cell')).toBeInTheDocument();
    expect(screen.getByText(/Sort the small round blue cell differential by lineage/i)).toBeInTheDocument();
    expect(screen.getByText('NKX2.2')).toBeInTheDocument();
  });

  it('routes a canonical module into its linked lecture', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<PathologyCurriculum onSectionChange={onSectionChange} preferences={preferences} />);

    await user.click(screen.getAllByRole('button', { name: /Breast Core Module/i })[0]);
    await user.click(screen.getByRole('button', { name: /Review Breast Pathology: Core Principles/i }));

    expect(mocks.setLectureLibraryIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedId: 'ioc-overview-breast-surgery',
        query: expect.stringContaining('Breast'),
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_LECTURES);
  });

  it('preserves curriculum module context when launching an algorithm', async () => {
    const user = userEvent.setup();
    const onSectionChange = vi.fn();

    render(<PathologyCurriculum onSectionChange={onSectionChange} preferences={preferences} />);

    await user.click(screen.getByRole('button', { name: 'CP' }));
    expect(screen.getByText(/CP study paths keep the reviewed source-link map intact/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Transfusion and Cellular Therapy Core Clinical Pathology Ready/i }));
    expect(screen.getByText(/linked CP tutorial or operational studio/i)).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /transfusion reaction triage/i })[1]);

    expect(mocks.setAlgorithmNavigatorIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedId: 'cp-transfusion-reaction-triage',
        sourceModuleId: 'transfusion-cellular-therapy-core',
        sourceModuleTitle: 'Transfusion and Cellular Therapy Core',
      })
    );
    expect(onSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_ALGORITHMS);
  });
});
