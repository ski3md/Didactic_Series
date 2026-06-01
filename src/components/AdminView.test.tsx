import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminView from './AdminView.tsx';
import abpathMaterialAdminSummary from '../content/materials/abpathMaterialAdminSummary.json';

const mocks = vi.hoisted(() => ({
  getAllUserData: vi.fn(),
  apiGetAllUsers: vi.fn(),
  apiGetLoginHistory: vi.fn(),
}));

vi.mock('../utils/tracking.ts', () => ({
  getAllUserData: mocks.getAllUserData,
}));

vi.mock('../api/mockApi.ts', () => ({
  apiGetAllUsers: mocks.apiGetAllUsers,
  apiGetLoginHistory: mocks.apiGetLoginHistory,
}));

describe('AdminView ABPath material expansion queue', () => {
  beforeEach(() => {
    Object.values(mocks).forEach((mock) => mock.mockReset());
    mocks.getAllUserData.mockResolvedValue({
      resident: {
        visitedSections: ['Home'],
      },
    });
    mocks.apiGetAllUsers.mockResolvedValue({
      admin: {
        username: 'admin',
        email: 'admin@example.com',
        isAdmin: true,
      },
      resident: {
        username: 'resident',
        email: 'resident@example.com',
      },
    });
    mocks.apiGetLoginHistory.mockResolvedValue({
      resident: [
        {
          timestamp: '2026-05-29T12:00:00.000Z',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) AppleWebKit Chrome',
          ip: '203.0.113.10',
        },
      ],
    });
  });

  it('renders the Admin-only queue card without replacing User Activity & Analytics', async () => {
    render(<AdminView />);

    expect(screen.getByText('Admin-only material governance')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'ABPath Material Expansion Queue' })).toBeInTheDocument();
    expect(screen.getByText('Review required')).toBeInTheDocument();

    expect(screen.getByText('Queue total')).toBeInTheDocument();
    expect(screen.getByText('AP queue items')).toBeInTheDocument();
    expect(screen.getByText(abpathMaterialAdminSummary.totals.apQueueItems.toLocaleString())).toBeInTheDocument();
    expect(screen.getByText('CP queue items')).toBeInTheDocument();
    expect(screen.getByText(abpathMaterialAdminSummary.totals.cpQueueItems.toLocaleString())).toBeInTheDocument();

    expect(screen.getByText('Review / Promotion Status')).toBeInTheDocument();
    expect(screen.getByText('Unreviewed')).toBeInTheDocument();
    expect(screen.getByText('Generation Queue')).toBeInTheDocument();
    expect(screen.getAllByText(abpathMaterialAdminSummary.totals.queueEntries.toLocaleString())).toHaveLength(3);
    expect(
      screen.getByText('Generated rows are unreviewed generation-queue items, not authoritative teaching truth.')
    ).toBeInTheDocument();

    const batchCard = screen.getByText('Batch Review Rows').closest('div');
    expect(batchCard).not.toBeNull();
    if (!batchCard) {
      throw new Error('Expected Batch Review Rows card');
    }

    for (const batch of abpathMaterialAdminSummary.batches) {
      const suffix = batch.batchId.match(/-(\d{3})$/)?.[1] ?? 'unknown';
      expect(within(batchCard).getByText(`${batch.domain} batch ${suffix}`)).toBeInTheDocument();
      expect(within(batchCard).getAllByText(batch.rowCount.toLocaleString()).length).toBeGreaterThan(0);
    }

    expect(screen.getByRole('heading', { name: 'User Activity & Analytics' })).toBeInTheDocument();
    expect(await screen.findByText('Found 1 registered user(s). Click on a user to expand their activity log.')).toBeInTheDocument();
    expect(screen.getByText('resident')).toBeInTheDocument();
    expect(screen.getByText('resident@example.com')).toBeInTheDocument();
  });
});
