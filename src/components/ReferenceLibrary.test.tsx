import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ReferenceLibrary from './ReferenceLibrary.tsx';

const mocks = vi.hoisted(() => ({
  consumeReferenceLibraryIntent: vi.fn(),
  getAtlasCollectionSummaries: vi.fn(),
  readSessionState: vi.fn(),
  writeSessionState: vi.fn(),
}));

vi.mock('./ImageGalleries.tsx', () => ({
  default: () => <div data-testid="image-galleries-stub">Image galleries</div>,
}));

vi.mock('../utils/referenceLibraryNavigation.ts', () => ({
  consumeReferenceLibraryIntent: mocks.consumeReferenceLibraryIntent,
}));

vi.mock('../utils/atlasImageCatalog.ts', () => ({
  getAtlasCollectionSummaries: mocks.getAtlasCollectionSummaries,
}));

vi.mock('../utils/viewStateStorage.ts', () => ({
  readSessionState: mocks.readSessionState,
  writeSessionState: mocks.writeSessionState,
}));

const supplementalManifest = {
  imageCount: 2,
  images: [
    {
      id: 'small-blue-1',
      title: 'small blue cell breast biopsy CK7 40x',
      specialty: 'breast',
      localPath: 'reference-images/small-blue-1.png',
      sourcePath: 'reference-images/small-blue-1.png',
      bytes: 1200,
      extension: 'png',
      caption: 'Differential remains broad and immunostain workup is pending before lineage assignment.',
      sourceDocument: 'small_blue_cell_review.pdf',
      pageNumber: 4,
    },
    {
      id: 'clear-cell-1',
      title: 'clear cell breast lesion PAX8 20x',
      specialty: 'breast',
      localPath: 'reference-images/clear-cell-1.png',
      sourcePath: 'reference-images/clear-cell-1.png',
      bytes: 1400,
      extension: 'png',
      caption: 'Molecular biomarker correlation remains pending while the clear cell differential stays open.',
      sourceDocument: 'clear_cell_workup.pdf',
      pageNumber: 7,
    },
  ],
};

describe('ReferenceLibrary', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.consumeReferenceLibraryIntent.mockReturnValue(null);
    mocks.readSessionState.mockReturnValue(null);
    mocks.getAtlasCollectionSummaries.mockReturnValue([
      { id: 'acquired', title: 'Lecture microscopy', description: 'Lecture images', imageCount: 8, highlightedTerms: ['Histology'] },
      { id: 'curated', title: 'Histology comparison', description: 'Comparison images', imageCount: 12, highlightedTerms: ['Spindle'] },
      { id: 'promoted', title: 'Granulomatous differential', description: 'Granuloma images', imageCount: 6, highlightedTerms: ['Granuloma'] },
    ]);

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => supplementalManifest,
      })
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders morphology gateway immunophenotype guidance for small blue cell review', async () => {
    render(<ReferenceLibrary user={null} />);

    expect(await screen.findByText('Morphology-first review')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /start with the closest pattern/i })).toBeInTheDocument();
    const gatewayButton = (await screen.findAllByRole('button', { name: /small blue cell/i }))[0];
    expect(within(gatewayButton).getByText('Immunophenotype branch')).toBeInTheDocument();
    expect(
      within(gatewayButton).getByText('Sort the small round blue cell differential by lineage before naming a tumor.')
    ).toBeInTheDocument();
    expect(within(gatewayButton).getAllByText('Differential only').length).toBeGreaterThan(0);
    expect(within(gatewayButton).getAllByText('Ancillary pending').length).toBeGreaterThan(0);
    expect(within(gatewayButton).getByText('Reasoning progression')).toBeInTheDocument();
    expect(within(gatewayButton).getByText('pattern')).toBeInTheDocument();
    expect(within(gatewayButton).getByText('compartment')).toBeInTheDocument();
    expect(within(gatewayButton).getByText('differential')).toBeInTheDocument();
    expect(within(gatewayButton).getByText('ancillary')).toBeInTheDocument();
    expect(within(gatewayButton).getByText('wording')).toBeInTheDocument();
    expect(within(gatewayButton).getByText('CD99')).toBeInTheDocument();
    expect(within(gatewayButton).getByText('NKX2.2')).toBeInTheDocument();
  });

  it('shows reasoning progression on image cards and updates the review context from morphology-first selection', async () => {
    const user = userEvent.setup();
    render(<ReferenceLibrary user={null} />);

    const smallBlueImageTitle = await screen.findByRole('heading', { name: 'Small Blue Cell Breast Biopsy CK7 40x' });
    const smallBlueCard = smallBlueImageTitle.closest('article');
    expect(smallBlueCard).not.toBeNull();
    if (!smallBlueCard) {
      throw new Error('Expected small blue cell image card');
    }

    expect(within(smallBlueCard).getByText('Uncertainty')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('Workflow state')).toBeInTheDocument();
    expect(within(smallBlueCard).getAllByText('Differential only').length).toBeGreaterThan(0);
    expect(within(smallBlueCard).getAllByText('Ancillary pending').length).toBeGreaterThan(0);
    expect(within(smallBlueCard).getByText('Reasoning progression')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('pattern')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('compartment')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('differential')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('ancillary')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('wording')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('Mimics still active')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('Stain evidence is part of the workup')).toBeInTheDocument();
    expect(within(smallBlueCard).getByText('CK7')).toBeInTheDocument();

    const clearCellImageTitle = screen.getByRole('heading', { name: 'Clear Cell Breast Lesion PAX8 20x' });
    const clearCellCard = clearCellImageTitle.closest('article');
    expect(clearCellCard).not.toBeNull();
    if (!clearCellCard) {
      throw new Error('Expected clear cell image card');
    }

    expect(within(clearCellCard).getAllByText('Differential only').length).toBeGreaterThan(0);
    expect(within(clearCellCard).getAllByText('Molecular pending').length).toBeGreaterThan(0);
    expect(within(clearCellCard).getByText('Mimics still active')).toBeInTheDocument();
    expect(within(clearCellCard).getByText('Result may change classification')).toBeInTheDocument();
    expect(within(clearCellCard).getAllByText('PAX8').length).toBeGreaterThan(0);

    await user.click(screen.getAllByRole('button', { name: /small blue cell/i })[0]);

    await waitFor(() => {
      expect(screen.getAllByText('Current review context')[0]).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /small blue cell differential/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('small blue cell')).toBeInTheDocument();
    expect(screen.getAllByText('small blue cell').length).toBeGreaterThan(0);
  });

  it('falls back to a morphology-ready specialty when the cold default has no morphology tags', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          imageCount: 2,
          images: [
            {
              id: 'breast-plain-1',
              title: 'breast teaching image H&E',
              specialty: 'breast',
              localPath: 'reference-images/breast-plain-1.png',
              sourcePath: 'reference-images/breast-plain-1.png',
              bytes: 1200,
              extension: 'png',
              caption: 'Routine breast teaching image without morphology-tag keywords.',
              sourceDocument: 'breast_reference.pdf',
              pageNumber: 2,
            },
            {
              id: 'thoracic-small-blue-1',
              title: 'small blue cell thoracic biopsy CK7 40x',
              specialty: 'thoracic',
              localPath: 'reference-images/thoracic-small-blue-1.png',
              sourcePath: 'reference-images/thoracic-small-blue-1.png',
              bytes: 1500,
              extension: 'png',
              caption: 'Differential remains broad and immunostain workup is pending before lineage assignment.',
              sourceDocument: 'thoracic_small_blue_review.pdf',
              pageNumber: 6,
            },
          ],
        }),
      })
    );

    render(<ReferenceLibrary user={null} />);

    expect(await screen.findByText('Morphology-first review')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /small blue cell/i }).length).toBeGreaterThan(0);
  });

  it('uses Genitourinary instead of GU on the public Reference Library surface', async () => {
    render(<ReferenceLibrary user={null} />);

    expect(await screen.findAllByRole('button', { name: /Genitourinary/i })).not.toHaveLength(0);
    expect(screen.queryByRole('button', { name: /^GU$/i })).not.toBeInTheDocument();
  });
});
