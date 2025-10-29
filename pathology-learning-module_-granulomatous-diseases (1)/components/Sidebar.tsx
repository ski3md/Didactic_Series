import React from 'react';
import { Section, User } from '../types';
import {
  HomeIcon, DocumentTextIcon, MicroscopeIcon, EyeIcon, BeakerIcon, 
  SparklesIcon, BookOpenIcon, AcademicCapIcon, UserCircleIcon, LogoutIcon, CogIcon, KeyIcon
} from './icons';

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  user: User;
  onLogout: () => void;
  onChangePasswordClick: () => void;
  className?: string;
}

const NavLink: React.FC<{
  section: Section;
  currentSection: Section;
  onClick: (section: Section) => void;
  icon: React.ReactNode;
}> = ({ section, currentSection, onClick, icon }) => {
  const isActive = section === currentSection;
  return (
    <button
      onClick={() => onClick(section)}
      className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
        isActive
          ? 'bg-primary-600 text-white font-semibold shadow-md shadow-primary-500/20'
          : 'text-slate-700 hover:bg-slate-200/70 hover:text-slate-900'
      }`}
    >
      <div className="mr-3 flex-shrink-0">{icon}</div>
      <span>{section}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange, user, onLogout, onChangePasswordClick, className }) => {
    const learningSections = [
        { section: Section.JOB_AID, icon: <DocumentTextIcon className="h-5 w-5" /> },
        { section: Section.CASE_STUDY, icon: <MicroscopeIcon className="h-5 w-5" /> },
        { section: Section.VISUAL_CHALLENGE, icon: <EyeIcon className="h-5 w-5" /> },
        { section: Section.DIAGNOSTIC_PATHWAY, icon: <BeakerIcon className="h-5 w-5" /> },
        { section: Section.AI_CASE_GENERATOR, icon: <SparklesIcon className="h-5 w-5" /> },
    ];

    const addieSections = [
        { section: Section.ANALYSIS, icon: <BookOpenIcon className="h-5 w-5" /> },
        { section: Section.DESIGN, icon: <BookOpenIcon className="h-5 w-5" /> },
        { section: Section.DEVELOPMENT, icon: <BookOpenIcon className="h-5 w-5" /> },
        { section: Section.EVALUATION, icon: <BookOpenIcon className="h-5 w-5" /> },
        { section: Section.ASSESSMENT, icon: <BookOpenIcon className="h-5 w-5" /> },
    ];

  return (
    <aside className={`bg-white border-r border-slate-200/80 p-4 flex flex-col ${className}`}>
      <div className="flex items-center mb-6 px-2 flex-shrink-0">
        <AcademicCapIcon className="h-8 w-8 text-primary-600" />
        <h1 className="ml-3 text-lg font-bold font-serif text-slate-800">Pathology Module</h1>
      </div>
      
      <nav className="flex-1 space-y-4 overflow-y-auto">
        <div>
           <NavLink
              section={Section.HOME}
              currentSection={currentSection}
              onClick={onSectionChange}
              icon={<HomeIcon className="h-5 w-5" />}
            />
        </div>
        <div>
          <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Learning Sections</h2>
          <div className="space-y-1">
            {learningSections.map(({ section, icon }) => (
              <NavLink
                key={section}
                section={section}
                currentSection={currentSection}
                onClick={onSectionChange}
                icon={icon}
              />
            ))}
          </div>
        </div>
        <div>
          <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Instructional Design</h2>
          <div className="space-y-1">
             {addieSections.map(({ section, icon }) => (
              <NavLink
                key={section}
                section={section}
                currentSection={currentSection}
                onClick={onSectionChange}
                icon={icon}
              />
            ))}
          </div>
        </div>
        {user.isAdmin && (
          <div>
            <h2 className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Admin</h2>
            <div className="space-y-1">
              <NavLink
                section={Section.ADMIN}
                currentSection={currentSection}
                onClick={onSectionChange}
                icon={<CogIcon className="h-5 w-5" />}
              />
            </div>
          </div>
        )}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <div className="px-4 py-2">
          <div className="flex items-center">
            <UserCircleIcon className="h-8 w-8 text-slate-400 flex-shrink-0" />
            <div className="ml-3 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{user.username}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
           <div className="mt-2 flex items-center space-x-2">
              <button onClick={onChangePasswordClick} title="Change Password" className="w-full flex items-center justify-center text-xs px-2 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 rounded-md font-medium transition-colors">
                  <KeyIcon className="h-4 w-4 mr-1.5" /> Change Password
              </button>
              <button onClick={onLogout} title="Logout" className="flex-shrink-0 p-2 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 rounded-md transition-colors">
                  <LogoutIcon className="h-5 w-5" />
              </button>
           </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
