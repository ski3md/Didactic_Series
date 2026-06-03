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
  onToggleVisualTheme: () => void;
  navigation?: SectionNavigationController;
}

const resolveHeaderTitle = (currentSection: Section): string => {
  switch (currentSection) {
    case Section.PATHOLOGY_CURRICULUM:
      return 'Curriculum';
    case Section.DIDACTIC_LECTURES:
    case Section.LECTURE:
      return 'Lectures';
    case Section.DIDACTIC_TUTORIALS:
      return 'Tutorials';
    case Section.DIDACTIC_ALGORITHMS:
      return 'Workups';
    case Section.SIGN_OUT_SIMULATOR:
    case Section.BREAST_SIGNOUT_MASTERCLASS:
      return 'Sign-Out';
    default:
      return currentSection;
  }
};

const Header: React.FC<HeaderProps> = ({
  currentSection,
  preferences,
  onToggleFocusMode,
  onToggleVisualTheme,
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
  const headerTitle = resolveHeaderTitle(currentSection);
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
          <h1 className="truncate text-sm font-semibold text-slate-900 md:text-base">{headerTitle}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleVisualTheme}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              preferences.visualTheme === 'night'
                ? 'border-cyan-400/70 bg-slate-900 text-cyan-100'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
            aria-pressed={preferences.visualTheme === 'night'}
            aria-label="Toggle night mode"
          >
            {preferences.visualTheme === 'night' ? 'Night Mode' : 'Day Mode'}
          </button>
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
      <p className="mt-2 border-t border-slate-100 pt-2 text-center text-xs font-medium italic tracking-wide text-slate-500">
        &ldquo;Persistence guarantees that results are inevitable.&rdquo; &ndash; Robbins
      </p>
    </header>
  );
};

export default Header;
