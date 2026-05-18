import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

vi.mock('./components/Home.tsx', () => ({
  default: () => <div>Home Screen</div>,
}));

vi.mock('./components/DidacticLectures.tsx', () => ({
  default: () => <div>Didactic Lectures Screen</div>,
}));

vi.mock('./components/PathologyCurriculum.tsx', () => ({
  default: () => <div>Pathology Curriculum Screen</div>,
}));

vi.mock('./components/ReferenceLibrary.tsx', () => ({ default: () => <div>Reference Library Screen</div> }));
vi.mock('./components/VisualChallenge.tsx', () => ({ default: () => <div>Visual Challenge Screen</div> }));
vi.mock('./components/SignOutSimulator.tsx', () => ({ default: () => <div>Sign Out Screen</div> }));
vi.mock('./components/AnalysisPhase.tsx', () => ({ default: () => <div>Analysis Screen</div> }));
vi.mock('./components/DesignPhase.tsx', () => ({ default: () => <div>Design Screen</div> }));
vi.mock('./components/DevelopmentPhase.tsx', () => ({ default: () => <div>Development Screen</div> }));
vi.mock('./components/AssessmentPhase.tsx', () => ({ default: () => <div>Assessment Screen</div> }));
vi.mock('./components/AdminView.tsx', () => ({ default: () => <div>Admin Screen</div> }));
vi.mock('./components/Lecture.tsx', () => ({ default: () => <div>Legacy Lecture Screen</div> }));
vi.mock('./components/AlgorithmNavigator.tsx', () => ({ default: () => <div>Algorithm Screen</div> }));
vi.mock('./components/DidacticTutorials.tsx', () => ({ default: () => <div>Tutorial Screen</div> }));
vi.mock('./components/DiagnosticPathway.tsx', () => ({ default: () => <div>Diagnostic Pathway Screen</div> }));
vi.mock('./components/SyllabusExplorer.tsx', () => ({ default: () => <div>Syllabus Screen</div> }));
vi.mock('./components/Welcome.tsx', () => ({ default: () => <div>Welcome Screen</div> }));

describe('App routing', () => {
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
    preferences: { focusMode: true },
    toggleFocusMode: vi.fn(),
  };

  beforeEach(() => {
    handleSectionChange.mockReset();
    setSidebarOpen.mockReset();
    toggleSidebar.mockReset();
    navigation.goBack.mockReset();
    navigation.goForward.mockReset();
    navigation.pushSection.mockReset();
    Object.values(mocks).forEach((mock) => mock.mockReset());

    mocks.useAuth.mockReturnValue({
      currentUser: { username: 'resident', email: 'resident@example.com' },
      login: vi.fn(),
      logout: vi.fn(),
      isLoading: false,
    });
    mocks.useUIState.mockReturnValue({
      isSidebarOpen: true,
      setSidebarOpen,
      toggleSidebar,
    });
    mocks.useLearningPreferences.mockReturnValue(preferencesApi);
    mocks.useUserProgress.mockReturnValue({
      currentSection: Section.HOME,
      handleSectionChange,
      navigation,
      visitedSections: [Section.HOME],
      isLoading: false,
    });
  });

  it('renders the active section component for Home by default', async () => {
    render(<App />);

    expect(await screen.findByText('Home Screen')).toBeInTheDocument();
    expect(await screen.findByText('Home')).toBeInTheDocument();
  });

  it('renders the didactic lectures section when the active section is updated', async () => {
    mocks.useUserProgress.mockReturnValue({
      currentSection: Section.DIDACTIC_LECTURES,
      handleSectionChange,
      navigation,
      visitedSections: [Section.HOME, Section.DIDACTIC_LECTURES],
      isLoading: false,
    });

    render(<App />);

    expect(await screen.findByText('Didactic Lectures Screen')).toBeInTheDocument();
  });

  it('routes the legacy breast sign-out section into the consolidated sign-out simulator', async () => {
    mocks.useUserProgress.mockReturnValue({
      currentSection: Section.BREAST_SIGNOUT_MASTERCLASS,
      handleSectionChange,
      navigation,
      visitedSections: [Section.HOME, Section.BREAST_SIGNOUT_MASTERCLASS],
      isLoading: false,
    });

    render(<App />);

    expect(await screen.findByText('Sign Out Screen')).toBeInTheDocument();
    expect(screen.queryByText('Breast Sign-Out Screen')).not.toBeInTheDocument();
  });

  it('routes sidebar selections through the active section handler and visit tracking', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(await screen.findByRole('button', { name: /Pathology Curriculum/i }));

    expect(handleSectionChange).toHaveBeenCalledWith(Section.PATHOLOGY_CURRICULUM);
    expect(mocks.trackSectionVisit).toHaveBeenCalledWith('resident', Section.PATHOLOGY_CURRICULUM);
  });
});
