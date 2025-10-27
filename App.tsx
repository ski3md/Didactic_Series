import React, { useState } from 'react';
import { Section } from './types';
import Sidebar from './components/Sidebar';
import Home from './components/Home';
import EvaluationPhase from './components/EvaluationPhase';
import JobAid from './components/JobAid';
import CaseStudy from './components/CaseStudy';
import DiagnosticPathway from './components/DiagnosticPathway';
import Login from './components/Login';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>(Section.HOME);

  const handleLogin = (username: string) => {
    setIsLoggedIn(true);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    // Reset to home section on logout
    setCurrentSection(Section.HOME);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
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
      default:
        return <Home />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar 
        currentSection={currentSection} 
        onSectionChange={setCurrentSection} 
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <main className="flex-1 p-4 sm:p-6 lg:p-10">
        <div className="max-w-4xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;