import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import SignOutSimulator from './SignOutSimulator.tsx';

vi.mock('./GUSignOutSims.tsx', () => ({
  default: () => <div data-testid="gu-signout-sims-stub">GU sign-out sims</div>,
}));

describe('SignOutSimulator', () => {
  it('uses genitourinary instead of GU in the workflow directory copy', () => {
    render(<SignOutSimulator user={null} />);

    expect(
      screen.getByText(
        'Breast, GI, genitourinary, gynecologic, thoracic, head and neck, heme, cytology, bone and soft tissue, and neuropathology.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText(/\bBreast, GI, GU,/i)).not.toBeInTheDocument();
  });
});
