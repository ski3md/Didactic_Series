import React, { useState, useEffect } from 'react';
import { Section, User } from './types.ts';
import { useUserProgress } from './hooks/useUserProgress.ts';
import { useAuth } from './hooks/useAuth.ts';
import { useUIState } from './hooks/useUIState.ts';

import Sidebar from './components/Sidebar.tsx';
import Header from './components/Header.tsx';
import Home from './components/Home.tsx';
import ReferenceLibrary from './components/ReferenceLibrary.tsx';
import VisualChallenge from './components/VisualChallenge.tsx';
import SignOutSimulator from './components/SignOutSimulator.tsx';
import AnalysisPhase from './components/AnalysisPhase.tsx';
import DesignPhase from './components/DesignPhase.tsx';
import DevelopmentPhase from './components/DevelopmentPhase.tsx';
import AssessmentPhase from './components/AssessmentPhase.tsx';
import AdminView from './components/AdminView.tsx';
import Lecture from './components/Lecture.tsx';
import DiagnosticPathway from './components/DiagnosticPathway.tsx';
import Welcome from './components/Welcome.tsx';
import { trackSectionVisit } from './utils/tracking.ts';

const AppContent: React.FC<{
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
}> = ({ user, onLogout, onLoginClick }) => {
  const { currentSection, handleSectionChange } = useUserProgress(user?.username);
  const { isSidebarOpen, setSidebarOpen, toggleSidebar } = useUIState();

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

  const renderSection = () => {
    switch (currentSection) {
      case Section.LECTURE: return <Lecture onComplete={() => onSectionSelect(Section.HOME)} />;
      case Section.HOME: return <Home onSectionChange={onSectionSelect} user={user} />;
      case Section.REFERENCE_LIBRARY: return <ReferenceLibrary user={user} />;
      case Section.SIGN_OUT_SIMULATOR: return <SignOutSimulator user={user} />;
      case Section.VISUAL_CHALLENGE: return <VisualChallenge user={user} />;
      case Section.DIAGNOSTIC_PATHWAY: return <DiagnosticPathway user={user} />;
      case Section.ANALYSIS: return <AnalysisPhase user={user} />;
      case Section.DESIGN: return <DesignPhase />;
      case Section.DEVELOPMENT: return <DevelopmentPhase />;
      case Section.EVALUATION: return <AssessmentPhase user={user} />;
      case Section.ADMIN: return <AdminView />;
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
        onLoginClick={onLoginClick}
      />

      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-72' : 'ml-0'}`}>
        <Header 
          currentSection={currentSection}
        />
        <main className={`flex-1 overflow-y-auto ${currentSection === Section.LECTURE ? '' : 'p-4 sm:p-6 md:p-8 lg:p-12'}`}>
          {renderSection()}
        </main>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const { currentUser, login, logout, isLoading } = useAuth();
  const [isLoginViewVisible, setLoginViewVisible] = useState(false);

  const handleLoginSuccess = async (username: string, password: string, rememberMe: boolean) => {
    const user = await login(username, password, rememberMe);
    setLoginViewVisible(false); // Close login view on success
    return user;
  };

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p>Loading Module...</p>
      </div>
    );
  }
  
  if (isLoginViewVisible) {
      return <Welcome onLogin={handleLoginSuccess} onBack={() => setLoginViewVisible(false)} />;
  }

  return (
    <>
      <AppContent
        user={currentUser}
        onLogout={logout}
        onLoginClick={() => setLoginViewVisible(true)}
      />
    </>
  );
};

export default App;