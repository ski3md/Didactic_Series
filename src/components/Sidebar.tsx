import React from 'react';
import { Section, User } from '../types.ts';
import { useUIState } from '../hooks/useUIState.ts';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import { BRAND } from '../utils/brand.ts';
import {
  MicroscopeIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  CogIcon,
  LogoutIcon,
  ArrowRightToBracketIcon,
  ChevronLeftIcon,
} from './icons.tsx';

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  user: User | null;
  onLogout: () => void;
  onLoginClick: () => void;
  preferences: LearningPreferences;
}

const NavLink: React.FC<{
  label: string;
  ariaLabel?: string;
  isActive: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}> = ({ label, ariaLabel, isActive, onClick, icon }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      className={`w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
        isActive
          ? 'bg-sky-100 text-sky-800 font-bold shadow-lg shadow-sky-500/20'
          : 'text-slate-700 hover:bg-slate-200 hover:text-slate-900'
      }`}
    >
      <div className="mr-3 flex-shrink-0">{icon}</div>
      <span>{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange, user, onLogout, onLoginClick, preferences }) => {
    const { isSidebarOpen, toggleSidebar } = useUIState();
    const isLearnActive = [
      Section.HOME,
      Section.PATHOLOGY_CURRICULUM,
      Section.COMPETENCY_MATRIX,
      Section.SYLLABUS_EXPLORER,
    ].includes(currentSection);
    const isDidacticsActive = [
      Section.DIDACTIC_LECTURES,
      Section.DIDACTIC_TUTORIALS,
      Section.DIDACTIC_ALGORITHMS,
      Section.LECTURE,
    ].includes(currentSection);
    const isSignOutActive = [
      Section.SIGN_OUT_SIMULATOR,
      Section.BREAST_SIGNOUT_MASTERCLASS,
    ].includes(currentSection);

  return (
    <aside
      aria-label={`${BRAND.name} navigation`}
      className={`fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-200/80 p-4 flex flex-col w-72 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="mb-6 flex-shrink-0 px-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <AcademicCapIcon className="h-8 w-8 text-primary-600" />
            <div className="ml-3 min-w-0">
              <h1 className="text-lg font-bold font-serif text-slate-900">{BRAND.name}</h1>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500">{BRAND.shortTagline}</p>
            </div>
          </div>
          <button
            onClick={toggleSidebar}
            className="p-1 text-slate-500 hover:text-slate-800"
            aria-label="Collapse menu"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        </div>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>Move through {BRAND.name} in three steps: learn, study, then sign out.</p>
          {preferences.focusMode && <p className="mt-2 text-xs text-slate-500">Focus mode keeps the active workspace centered.</p>}
        </div>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <NavLink
          label="Learn"
          ariaLabel="Pathology Curriculum"
          isActive={isLearnActive}
          onClick={() => onSectionChange(Section.PATHOLOGY_CURRICULUM)}
          icon={<AcademicCapIcon className="h-5 w-5" />}
        />
        <NavLink
          label="Competency"
          ariaLabel="Competency Matrix"
          isActive={currentSection === Section.COMPETENCY_MATRIX}
          onClick={() => onSectionChange(Section.COMPETENCY_MATRIX)}
          icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
        />
        <NavLink
          label="Didactics"
          isActive={isDidacticsActive}
          onClick={() => onSectionChange(isDidacticsActive ? currentSection : Section.DIDACTIC_LECTURES)}
          icon={<BookOpenIcon className="h-5 w-5" />}
        />
        <NavLink
          label="Images"
          ariaLabel="Reference Library"
          isActive={currentSection === Section.REFERENCE_LIBRARY}
          onClick={() => onSectionChange(Section.REFERENCE_LIBRARY)}
          icon={<BookOpenIcon className="h-5 w-5" />}
        />
        <NavLink
          label="Sign-Out"
          ariaLabel="Pathology Sign-Out Workflows"
          isActive={isSignOutActive}
          onClick={() => onSectionChange(Section.SIGN_OUT_SIMULATOR)}
          icon={<MicroscopeIcon className="h-5 w-5" />}
        />

        {user?.isAdmin && (
          <div>
            <div className="space-y-1">
              <NavLink
                label="Admin"
                isActive={currentSection === Section.ADMIN}
                onClick={() => onSectionChange(Section.ADMIN)}
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
