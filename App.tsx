import React, { useState } from 'react';
import { Section } from './types';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import EvaluationPhase from './components/EvaluationPhase';
import JobAid from './components/JobAid';
import CaseStudy from './components/CaseStudy';
import DiagnosticPathway from './components/DiagnosticPathway';
import Welcome from './components/Welcome';
import AnalysisPhase from './components/AnalysisPhase';
import DesignPhase from './components/DesignPhase';
import DevelopmentPhase from './components/DevelopmentPhase';
import AssessmentPhase from './components/AssessmentPhase';
import MobileHeader from './components/MobileHeader';
import AICaseGenerator from './components/AICaseGenerator';

const App: React.FC = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>(Section.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleStart = (username: string) => {
    setHasStarted(true);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setHasStarted(false);
    setCurrentUser(null);
    setCurrentSection(Section.HOME);
    setIsSidebarOpen(false);
  };

  if (!hasStarted) {
    return <Welcome onStart={handleStart} />;
  }

  const renderContent = () => {
    switch (currentSection) {
      case Section.HOME:
        return <Home />;
      case Section.JOB_AID:
        return <JobAid />;
      case Section.CASE_STUDY:
        return <CaseStudy />;
      case Section.VISUAL_CHALLENGE:
        return <EvaluationPhase />;
      case Section.DIAGNOSTIC_PATHWAY:
        return <DiagnosticPathway />;
      case Section.AI_CASE_GENERATOR:
        return <AICaseGenerator />;
      case Section.ANALYSIS:
        return <AnalysisPhase />;
      case Section.DESIGN:
        return <DesignPhase />;
      case Section.DEVELOPMENT:
        return <DevelopmentPhase />;
      case Section.EVALUATION:
        return <AssessmentPhase />;
      default:
        return <Home />;
    }
  };

  return (
    <div className="relative min-h-screen md:flex bg-slate-100">
      <Sidebar
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
        onLogout={handleLogout}
        currentUser={currentUser}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <MobileHeader 
          onMenuClick={() => setIsSidebarOpen(true)} 
          currentSection={currentSection} 
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto pb-12">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
