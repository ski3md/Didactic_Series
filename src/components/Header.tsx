import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon, MenuIcon } from './icons';
import { Section } from '../types';
import { useUIState } from '../hooks/useUIState';
import { LearningPreferences } from '../hooks/useLearningPreferences';
import { BRAND } from '../utils/brand';
import { SectionNavigationController } from '../hooks/useSectionNavigation';

interface HeaderProps {
  currentSection: Section;
  preferences: LearningPreferences;
  onToggleFocusMode: () => void;
  navigation?: SectionNavigationController;
}

const Header: React.FC<HeaderProps> = ({
  currentSection,
  preferences,
  onToggleFocusMode,
  navigation,
}) => {
  const { toggleSidebar } = useUIState();
  const safeNavigation: SectionNavigationController = navigation ?? {
    canGoBack: false,
    canGoForward: false,
    goBack: () => {},
    goForward: () => {},
    pushSection: () => {},
  };
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white px-4 py-2.5">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={safeNavigation.goBack}
            disabled={!safeNavigation.canGoBack}
            aria-label="Go to previous view"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={safeNavigation.goForward}
            disabled={!safeNavigation.canGoForward}
            aria-label="Go to next view"
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-500 sm:hidden">{BRAND.name}</p>
          <h1 className="truncate text-sm font-semibold text-slate-900 md:text-base">{currentSection}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              preferences.focusMode
                ? 'border-sky-300 bg-sky-50 text-sky-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
            aria-pressed={preferences.focusMode}
          >
            {preferences.focusMode ? 'Focus View' : 'Full View'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
