import React, { useState } from 'react';
import { Section, User } from './types';
import { useAuth } from './hooks/useAuth';
import { useUserProgress } from './hooks/useUserProgress';

import Welcome from './components/Welcome';
import Sidebar from './components/Sidebar';
import MobileHeader from './components/MobileHeader';
import Home from './components/Home';
import JobAid from './components/JobAid';
import CaseStudy from './components/CaseStudy';
import CaseLibrary from './components/CaseLibrary';
import VisualChallenge from './components/EvaluationPhase';
import DiagnosticPathway from './components/DiagnosticPathway';
import AICaseGenerator from './components/AICaseGenerator';
// Fix: Import ImageGalleries component
import ImageGalleries from './components/ImageGalleries';
import AnalysisPhase from './components/AnalysisPhase';
import DesignPhase from './components/DesignPhase';
import DevelopmentPhase from './components/DevelopmentPhase';
import AssessmentPhase from './components/AssessmentPhase';
import AdminView from './components/AdminView';
import ChangePasswordModal from './components/ChangePasswordModal';

const MainApp: React.FC<{ user: User; onLogout: () => void }> = ({ user, onLogout }) => {
  const { currentSection, handleSectionChange } = useUserProgress(user.username);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const onSectionSelect = (section: Section) => {
    handleSectionChange(section);
    setIsSidebarOpen(false);
  };

  const renderSection = () => {
    switch (currentSection) {
      case Section.HOME: return <Home onSectionChange={onSectionSelect} />;
      case Section.JOB_AID: return <JobAid />;
      case Section.CASE_STUDY: return <CaseStudy />;
      case Section.CASE_LIBRARY: return <CaseLibrary user={user} />;
      case Section.VISUAL_CHALLENGE: return <VisualChallenge user={user} />;
      case Section.DIAGNOSTIC_PATHWAY: return <DiagnosticPathway user={user} />;
      case Section.AI_CASE_GENERATOR: return <AICaseGenerator user={user} />;
      // Fix: Add rendering for ImageGalleries section
      case Section.IMAGE_GALLERIES: return <ImageGalleries user={user} />;
      case Section.ANALYSIS: return <AnalysisPhase user={user} />;
      case Section.DESIGN: return <DesignPhase />;
      case Section.DEVELOPMENT: return <DevelopmentPhase />;
      case Section.EVALUATION: return <AssessmentPhase user={user} />;
      case Section.ADMIN: return <AdminView />;
      default: return <Home onSectionChange={onSectionSelect} />;
    }
  };

  return (
    <>
      <div className="flex">
        {/* Mobile Sidebar */}
        <div className={`fixed inset-0 z-30 transition-transform transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden`}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)}></div>
            <div className="relative w-72 h-full">
                <Sidebar 
                    user={user}
                    onLogout={onLogout}
                    currentSection={currentSection}
                    onSectionChange={onSectionSelect}
                    onChangePasswordClick={() => setIsChangePasswordOpen(true)}
                    className="h-full"
                />
            </div>
        </div>

        {/* Desktop Sidebar */}
        <Sidebar
          user={user}
          onLogout={onLogout}
          currentSection={currentSection}
          onSectionChange={onSectionSelect}
          onChangePasswordClick={() => setIsChangePasswordOpen(true)}
          className="hidden md:block w-72 flex-shrink-0"
        />

        <div className="flex-1 flex flex-col min-w-0">
          <MobileHeader 
            currentSection={currentSection}
            onMenuClick={() => setIsSidebarOpen(true)}
          />
          <main className="p-4 sm:p-6 md:p-8 lg:p-12 flex-1">
            {renderSection()}
          </main>
        </div>
      </div>
      <ChangePasswordModal 
        user={user}
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
      />
    </>
  );
};

const App: React.FC = () => {
  const { currentUser, login, signup, logout, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-slate-100" />; // Or a loading spinner
  }
  
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {currentUser ? (
        <MainApp user={currentUser} onLogout={logout} />
      ) : (
        <Welcome onLogin={login} onSignup={signup} />
      )}
    </div>
  );
};

export default App;
