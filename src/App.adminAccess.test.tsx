import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.tsx';
import { Section } from './types.ts';

const mocks = vi.hoisted(() => ({
  useAuth: vi.fn(),
  useUserProgress: vi.fn(),
  useUIState: vi.fn(),
  useLearningPreferences: vi.fn(),
  trackSectionVisit: vi.fn(),
}));

vi.mock('./hooks/useAuth.ts', () => ({
  useAuth: mocks.useAuth,
}));

vi.mock('./hooks/useUserProgress.ts', () => ({
  useUserProgress: mocks.useUserProgress,
}));

vi.mock('./hooks/useUIState.ts', () => ({
  useUIState: mocks.useUIState,
}));

vi.mock('./hooks/useLearningPreferences.ts', () => ({
  useLearningPreferences: mocks.useLearningPreferences,
}));

vi.mock('./utils/tracking.ts', () => ({
  trackSectionVisit: mocks.trackSectionVisit,
}));

vi.mock('./components/Sidebar.tsx', () => ({
  default: () => <aside data-testid="app-sidebar">Sidebar</aside>,
}));

vi.mock('./components/Header.tsx', () => ({
  default: ({ currentSection }: { currentSection: Section }) => (
    <header data-testid="app-header">{currentSection}</header>
  ),
}));

vi.mock('./components/WorkspaceErrorBoundary.tsx', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/AdminView.tsx', () => ({
  default: () => <section>Admin View Mock</section>,
}));

vi.mock('./components/DidacticLectures.tsx', () => ({
  default: () => <section>Didactic Lectures Mock</section>,
}));

vi.mock('./components/Welcome.tsx', () => ({
  default: () => <section>Welcome Login Mock</section>,
}));

describe('App admin access gating', () => {
  const handleSectionChange = vi.fn();
  const setSidebarOpen = vi.fn();
  const toggleSidebar = vi.fn();
  const navigation = {
    canGoBack: false,
    canGoForward: false,
    goBack: vi.fn(),
    goForward: vi.fn(),
    pushSection: vi.fn(),
  };
  const preferencesApi = {
    preferences: { focusMode: true, visualTheme: 'day' as const },
    toggleFocusMode: vi.fn(),
    toggleVisualTheme: vi.fn(),
  };

  beforeEach(() => {
    handleSectionChange.mockReset();
    setSidebarOpen.mockReset();
    toggleSidebar.mockReset();
    navigation.goBack.mockReset();
    navigation.goForward.mockReset();
    navigation.pushSection.mockReset();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    window.history.pushState({}, '', '/didactics/');

    mocks.useAuth.mockReturnValue({
      currentUser: { username: 'resident', email: 'resident@example.com', isAdmin: false },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });
    mocks.useUIState.mockReturnValue({
      isSidebarOpen: false,
      setSidebarOpen,
      toggleSidebar,
    });
    mocks.useLearningPreferences.mockReturnValue(preferencesApi);
    mocks.useUserProgress.mockReturnValue({
      currentSection: Section.ADMIN,
      handleSectionChange,
      navigation,
      visitedSections: [Section.HOME, Section.ADMIN],
      isLoading: false,
    });
  });

  it('does not render AdminView for a non-admin on Section.ADMIN', async () => {
    render(<App />);

    expect(await screen.findByText('Didactic Lectures Mock')).toBeInTheDocument();
    expect(screen.queryByText('Admin View Mock')).not.toBeInTheDocument();
    expect(handleSectionChange).toHaveBeenCalledWith(Section.DIDACTIC_LECTURES);
  });

  it('renders AdminView for an admin on Section.ADMIN', async () => {
    mocks.useAuth.mockReturnValue({
      currentUser: { username: 'admin', email: 'admin@example.com', isAdmin: true },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<App />);

    expect(await screen.findByText('Admin View Mock')).toBeInTheDocument();
    expect(screen.queryByText('Didactic Lectures Mock')).not.toBeInTheDocument();
    expect(handleSectionChange).not.toHaveBeenCalledWith(Section.DIDACTIC_LECTURES);
  });

  it('renders only the login welcome for unauthenticated /didactics/admin', async () => {
    window.history.pushState({}, '', '/didactics/admin');
    mocks.useAuth.mockReturnValue({
      currentUser: null,
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });

    render(<App />);

    expect(await screen.findByText('Welcome Login Mock')).toBeInTheDocument();
    expect(screen.queryByText('Admin View Mock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-header')).not.toBeInTheDocument();
  });
});
