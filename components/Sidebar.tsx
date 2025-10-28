import React from 'react';
import { Section } from '../types';
import { MicroscopeIcon, LogoutIcon, UserCircleIcon } from './icons';

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  onLogout: () => void;
  currentUser: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const moduleSections = [
    Section.HOME,
    Section.JOB_AID,
    Section.CASE_STUDY,
    Section.VISUAL_CHALLENGE,
    Section.DIAGNOSTIC_PATHWAY,
    Section.AI_CASE_GENERATOR,
];

const addieSections = [
    Section.ANALYSIS,
    Section.DESIGN,
    Section.DEVELOPMENT,
    Section.EVALUATION,
];

const NavButton: React.FC<{
    section: Section;
    currentSection: Section;
    onClick: (section: Section) => void;
}> = ({ section, currentSection, onClick }) => (
    <button
        key={section}
        onClick={() => onClick(section)}
        className={`w-full text-left flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
        currentSection === section
            ? 'bg-blue-100 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`}
    >
        {section}
    </button>
);

const SectionHeader: React.FC<{title: string}> = ({ title }) => (
    <h3 className="px-4 pt-4 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {title}
    </h3>
);


const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange, onLogout, currentUser, isOpen, onClose }) => {

  const handleSectionChange = (section: Section) => {
    onSectionChange(section);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        onClick={onClose}
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />
      
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white shadow-md flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-md ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-200 px-4 flex-shrink-0">
          <MicroscopeIcon className="h-8 w-8 text-blue-600" />
          <h1 className="ml-2 text-lg font-bold text-slate-800">Pathology Module</h1>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          <SectionHeader title="The Learning Module" />
          {moduleSections.map((section) => (
            <NavButton key={section} section={section} currentSection={currentSection} onClick={handleSectionChange} />
          ))}

          <SectionHeader title="Instructional Design (ADDIE)" />
          {addieSections.map((section) => (
            <NavButton key={section} section={section} currentSection={currentSection} onClick={handleSectionChange} />
          ))}
        </nav>
        <div className="px-4 py-4 border-t border-slate-200 flex-shrink-0">
            {currentUser && (
              <div className="flex items-center px-4 py-2.5 mb-2">
                  <UserCircleIcon className="h-6 w-6 mr-3 text-slate-500" />
                  <span className="text-sm font-medium text-slate-600 truncate">{currentUser}</span>
              </div>
            )}
            <button
              onClick={onLogout}
              className="w-full text-left flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <LogoutIcon className="h-5 w-5 mr-3" />
              Logout
            </button>
          <div className="mt-4 text-xs text-slate-500 text-center">
            <p>&copy; 2024 Pathology Education</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
