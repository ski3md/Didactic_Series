import React from 'react';
import { Section, User } from '../types.ts';
import { useUIState } from '../hooks/useUIState.ts';
import {
  HomeIcon, MicroscopeIcon, EyeIcon, 
  BookOpenIcon, AcademicCapIcon, UserCircleIcon, CogIcon, BeakerIcon, LogoutIcon, ArrowRightToBracketIcon, ChevronLeftIcon, MagnifyingGlassChartIcon, BullseyeIcon, CheckCircleIcon
} from './icons.tsx';

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
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
          ? 'bg-sky-100 text-sky-800 font-bold shadow-lg shadow-sky-500/20'
          : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
      }`}
    >
      <div className="mr-3 flex-shrink-0">{icon}</div>
      <span>{section}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange, user, onLogout, onLoginClick }) => {
    const { isSidebarOpen, toggleSidebar } = useUIState();

    const learningSections = [
        { section: Section.LECTURE, icon: <AcademicCapIcon className="h-5 w-5" /> },
        { section: Section.REFERENCE_LIBRARY, icon: <BookOpenIcon className="h-5 w-5" /> },
        { section: Section.SIGN_OUT_SIMULATOR, icon: <MicroscopeIcon className="h-5 w-5" /> },
        { section: Section.VISUAL_CHALLENGE, icon: <EyeIcon className="h-5 w-5" /> },
        { section: Section.DIAGNOSTIC_PATHWAY, icon: <BeakerIcon className="h-5 w-5" /> },
    ];
    
    const instructionalDesignSections = [
        { section: Section.ANALYSIS, icon: <MagnifyingGlassChartIcon className="h-5 w-5" /> },
        { section: Section.DESIGN, icon: <BullseyeIcon className="h-5 w-5" /> },
        { section: Section.DEVELOPMENT, icon: <CogIcon className="h-5 w-5" /> },
        { section: Section.EVALUATION, icon: <CheckCircleIcon className="h-5 w-5" /> },
    ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200/80 p-4 flex flex-col w-72 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between mb-6 px-2 flex-shrink-0">
        <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            <h1 className="ml-3 text-lg font-bold font-serif text-slate-900">Pathology Module</h1>
        </div>
        <button
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-slate-800 p-1"
          aria-label="Collapse menu"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
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
          <h2 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Learning Sections</h2>
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
            <h2 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Instructional Design</h2>
            <div className="space-y-1">
                {instructionalDesignSections.map(({ section, icon }) => (
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

        {user?.isAdmin && (
          <div>
            <h2 className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 mt-4">Admin</h2>
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
        {user ? (
            <>
                <div className="px-4 py-2">
                    <div className="flex items-center">
                        <UserCircleIcon className="h-8 w-8 text-slate-400 flex-shrink-0" />
                        <div className="ml-3 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{user.username}</p>
                        <p className="text-xs text-slate-600 truncate">{user.email}</p>
                        </div>
                    </div>
                </div>
                <div className="px-4 py-2 mt-1">
                    <button
                        onClick={onLogout}
                        className="w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg text-slate-700 hover:bg-rose-100 hover:text-rose-800 transition-all duration-200"
                    >
                        <LogoutIcon className="h-5 w-5 mr-3" />
                        <span>Logout</span>
                    </button>
                </div>
            </>
        ) : (
            <div className="px-4 py-2 mt-1">
                 <button
                    onClick={onLoginClick}
                    className="w-full flex items-center justify-center px-4 py-2.5 text-sm font-semibold rounded-lg text-white bg-sky-600 hover:bg-sky-700 transition-all duration-200 shadow"
                >
                    <ArrowRightToBracketIcon className="h-5 w-5 mr-3" />
                    <span>Admin Login</span>
                </button>
            </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;