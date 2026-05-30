import React, { useEffect, lazy, Suspense } from 'react';
import { Section, User } from './types.ts';
import { useUserProgress } from './hooks/useUserProgress.ts';
import { useAuth } from './hooks/useAuth.ts';
import { useUIState } from './hooks/useUIState.ts';
import { useLearningPreferences } from './hooks/useLearningPreferences.ts';

const Sidebar = lazy(() => import('./components/Sidebar.tsx'));
const Header = lazy(() => import('./components/Header.tsx'));
const Home = lazy(() => import('./components/Home.tsx'));
const ReferenceLibrary = lazy(() => import('./components/ReferenceLibrary.tsx'));
const VisualChallenge = lazy(() => import('./components/VisualChallenge.tsx'));
const SignOutSimulator = lazy(() => import('./components/SignOutSimulator.tsx'));
const AnalysisPhase = lazy(() => import('./components/AnalysisPhase.tsx'));
const DesignPhase = lazy(() => import('./components/DesignPhase.tsx'));
const DevelopmentPhase = lazy(() => import('./components/DevelopmentPhase.tsx'));
const AssessmentPhase = lazy(() => import('./components/AssessmentPhase.tsx'));
const AdminView = lazy(() => import('./components/AdminView.tsx'));
const Lecture = lazy(() => import('./components/Lecture.tsx'));
const DidacticLectures = lazy(() => import('./components/DidacticLectures.tsx'));
const AlgorithmNavigator = lazy(() => import('./components/AlgorithmNavigator.tsx'));
const DidacticTutorials = lazy(() => import('./components/DidacticTutorials.tsx'));
const DiagnosticPathway = lazy(() => import('./components/DiagnosticPathway.tsx'));
const PathologyCurriculum = lazy(() => import('./components/PathologyCurriculum.tsx'));
const CompetencyMatrix = lazy(() => import('./components/CompetencyMatrix.tsx'));
const SyllabusExplorer = lazy(() => import('./components/SyllabusExplorer.tsx'));
const Welcome = lazy(() => import('./components/Welcome.tsx'));
const PingTelemetryProbe = lazy(() => import('./components/PingTelemetryProbe.tsx'));
const WorkspaceErrorBoundary = lazy(() => import('./components/WorkspaceErrorBoundary.tsx'));
import {
  captureAndPersistPingTelemetry,
  isPingProbeVisible,
  isPingTelemetryRoute,
} from './utils/pingTelemetry.ts';
import { trackSectionVisit } from './utils/tracking.ts';
import { BRAND } from './utils/brand.ts';

const AppContent: React.FC<{
  user: User | null;
  onLogout: () => void;
}> = ({ user, onLogout }) => {
  const { currentSection, handleSectionChange, navigation } = useUserProgress(user?.username);
  const { isSidebarOpen, setSidebarOpen, toggleSidebar } = useUIState();
  const { preferences, toggleFocusMode, toggleVisualTheme } = useLearningPreferences();
  const displayedSection =
    currentSection === Section.BREAST_SIGNOUT_MASTERCLASS
      ? Section.SIGN_OUT_SIMULATOR
      : currentSection === Section.ADMIN && !user?.isAdmin
        ? Section.DIDACTIC_LECTURES
        : currentSection;
  const prefersWideWorkspaceShell =
    displayedSection === Section.DIDACTIC_ALGORITHMS ||
    displayedSection === Section.PATHOLOGY_CURRICULUM ||
    displayedSection === Section.COMPETENCY_MATRIX;

  // Effect to set initial sidebar state based on screen size and handle resizing
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleResize = () => setSidebarOpen(mediaQuery.matches);
    
    // Set initial state
    setSidebarOpen(mediaQuery.matches);
    
    mediaQuery.addEventListener('change', handleResize);
    return () => mediaQuery.removeEventListener('change', handleResize);
  }, [setSidebarOpen]);

  const onSectionSelect = (section: Section) => {
    handleSectionChange(section);
    if (user) {
      trackSectionVisit(user.username, section);
    }
    // On mobile, close sidebar after selection
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (currentSection === Section.ADMIN && !user?.isAdmin) {
      onSectionSelect(Section.DIDACTIC_LECTURES);
    }
  }, [currentSection, onSectionSelect, user]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-night', preferences.visualTheme === 'night');
    root.style.colorScheme = preferences.visualTheme === 'night' ? 'dark' : 'light';
  }, [preferences.visualTheme]);

  const renderSection = () => {
    switch (currentSection) {
      case Section.LECTURE: return <Lecture onComplete={() => onSectionSelect(Section.HOME)} />;
      case Section.DIDACTIC_LECTURES: return <DidacticLectures preferences={preferences} onSectionChange={onSectionSelect} />;
      case Section.DIDACTIC_ALGORITHMS: return <AlgorithmNavigator preferences={preferences} onSectionChange={onSectionSelect} />;
      case Section.DIDACTIC_TUTORIALS: return <DidacticTutorials preferences={preferences} onSectionChange={onSectionSelect} />;
      case Section.BREAST_SIGNOUT_MASTERCLASS: return <SignOutSimulator user={user} onSectionChange={onSectionSelect} />;
      case Section.COMPETENCY_MATRIX: return <CompetencyMatrix onSectionChange={onSectionSelect} />;
      case Section.SYLLABUS_EXPLORER: return <SyllabusExplorer />;
      case Section.PATHOLOGY_CURRICULUM: return <PathologyCurriculum onSectionChange={onSectionSelect} preferences={preferences} />;
      case Section.HOME: return <Home onSectionChange={onSectionSelect} user={user} preferences={preferences} />;
      case Section.REFERENCE_LIBRARY: return <ReferenceLibrary user={user} />;
      case Section.SIGN_OUT_SIMULATOR: return <SignOutSimulator user={user} onSectionChange={onSectionSelect} />;
      case Section.VISUAL_CHALLENGE: return <VisualChallenge user={user} />;
      case Section.DIAGNOSTIC_PATHWAY: return <DiagnosticPathway user={user} />;
      case Section.ANALYSIS: return <AnalysisPhase user={user} />;
      case Section.DESIGN: return <DesignPhase />;
      case Section.DEVELOPMENT: return <DevelopmentPhase />;
      case Section.EVALUATION: return <AssessmentPhase user={user} />;
      case Section.ADMIN: return user?.isAdmin ? <AdminView /> : <DidacticLectures preferences={preferences} onSectionChange={onSectionSelect} />;
      default: return <Home onSectionChange={onSectionSelect} user={user} />;
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          aria-hidden="true"
        />
      )}

      <Sidebar
        user={user}
        currentSection={currentSection}
        onSectionChange={onSectionSelect}
        onLogout={onLogout}
        preferences={preferences}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        <Header 
          currentSection={displayedSection}
          preferences={preferences}
          onToggleFocusMode={toggleFocusMode}
          onToggleVisualTheme={toggleVisualTheme}
          navigation={navigation}
        />
        <main
          className={`flex-1 overflow-y-auto ${
            displayedSection === Section.LECTURE
              ? ''
              : preferences.focusMode
                ? prefersWideWorkspaceShell
                  ? 'w-full p-4 sm:p-5 lg:p-6'
                  : 'mx-auto w-full max-w-5xl p-4 sm:p-5 lg:p-6'
                : 'w-full p-4 sm:p-6 md:p-8 lg:p-10'
          }`}
        >
          <WorkspaceErrorBoundary sectionName={displayedSection} onNavigate={onSectionSelect}>
            {renderSection()}
          </WorkspaceErrorBoundary>
        </main>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const { currentUser, login, logout, isLoading } = useAuth();
  const isPingTelemetry = isPingTelemetryRoute(
    window.location.pathname,
    window.location.search,
  );
  const isPingProbeRoute = isPingProbeVisible(window.location.search);
  const pathname = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  const isAdminLoginRoute = pathname === '/didactics/admin';

  useEffect(() => {
    if (!isPingTelemetry) return;
    void captureAndPersistPingTelemetry();
  }, [isPingTelemetry]);

  const loadingFallback = (
    <div className="w-full h-screen flex items-center justify-center text-slate-600">
      <p>Loading {BRAND.name}...</p>
    </div>
  );

  if (isPingTelemetry && isPingProbeRoute) {
    return <Suspense fallback={loadingFallback}><PingTelemetryProbe /></Suspense>;
  }

  const handleLoginSuccess = async (username: string, password: string, rememberMe: boolean) => {
    const user = await login(username, password, rememberMe);
    return user;
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Loading {BRAND.name}...</p>
      </div>
    );
  }
  
  if (!currentUser && isAdminLoginRoute) {
      return <Suspense fallback={loadingFallback}>
        <Welcome onLogin={handleLoginSuccess} />
      </Suspense>;
  }

  return (
    <Suspense fallback={loadingFallback}>
      <AppContent
        user={currentUser}
        onLogout={logout}
      />
    </Suspense>
  );
};

export default App;
