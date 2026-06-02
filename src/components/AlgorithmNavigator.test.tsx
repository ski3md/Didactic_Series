import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AlgorithmNavigator from './AlgorithmNavigator.tsx';

const mocks = vi.hoisted(() => ({
  consumeAlgorithmNavigatorIntent: vi.fn(),
  readAlgorithmNavigatorLaunchContext: vi.fn(),
  writeAlgorithmNavigatorState: vi.fn(),
}));

vi.mock('../utils/algorithmNavigatorNavigation.ts', async () => {
  const actual = await vi.importActual<typeof import('../utils/algorithmNavigatorNavigation.ts')>('../utils/algorithmNavigatorNavigation.ts');
  return {
    ...actual,
    consumeAlgorithmNavigatorIntent: mocks.consumeAlgorithmNavigatorIntent,
    readAlgorithmNavigatorLaunchContext: mocks.readAlgorithmNavigatorLaunchContext,
    writeAlgorithmNavigatorState: mocks.writeAlgorithmNavigatorState,
  };
});

describe('AlgorithmNavigator', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.readAlgorithmNavigatorLaunchContext.mockReturnValue(null);
  });

  it('shows the first CP bench decision before the anemia workup player', async () => {
    mocks.consumeAlgorithmNavigatorIntent.mockReturnValue({
      selectedId: 'cp-foundations-anemia-workup',
    });

    render(<AlgorithmNavigator preferences={{ focusMode: false, visualTheme: 'day' }} onSectionChange={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Anemia Workup and Hemolysis Triage' })).toBeInTheDocument();
    expect(screen.getByText('First bench decision')).toBeInTheDocument();
    expect(screen.getByText('what is the first diagnostic frame?')).toBeInTheDocument();
    expect(screen.getByText(/Separate increased red-cell loss from impaired production/i)).toBeInTheDocument();
    expect(screen.getByText(/Reticulocytes are appropriately elevated/i)).toBeInTheDocument();
    expect(screen.getByText(/Open the first decision before using lectures/i)).toBeInTheDocument();
  });
});
