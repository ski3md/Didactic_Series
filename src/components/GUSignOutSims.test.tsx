import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GUSignOutSims from './GUSignOutSims.tsx';

vi.mock('./BreastSignoutMasterclass.tsx', () => ({
  default: () => <div data-testid="breast-signout-masterclass-stub">Breast signout masterclass</div>,
}));

describe('GUSignOutSims', () => {
  it('uses Genitourinary instead of GU Pathology on the directory surface', () => {
    render(<GUSignOutSims />);

    expect(screen.getByText('Genitourinary')).toBeInTheDocument();
    expect(screen.queryByText('GU Pathology')).not.toBeInTheDocument();
  });
});
