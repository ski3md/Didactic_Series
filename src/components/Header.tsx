import React from 'react';
import { MenuIcon } from './icons';
import { Section } from '../types';
import { useUIState } from '../hooks/useUIState';
import { LearningPreferences } from '../hooks/useLearningPreferences';
import { BRAND } from '../utils/brand';

interface HeaderProps {
  currentSection: Section;
  preferences: LearningPreferences;
  onToggleFocusMode: () => void;
  onToggleReduceMotion: () => void;
}

const Header: React.FC<HeaderProps> = ({
  currentSection,
  preferences,
  onToggleFocusMode,
  onToggleReduceMotion,
}) => {
  const { toggleSidebar } = useUIState();
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Toggle navigation menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="hidden text-xs font-semibold uppercase tracking-wide text-sky-700 sm:block">{BRAND.name}</p>
          <h1 className="truncate text-lg font-semibold text-slate-900">{currentSection}</h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            {preferences.focusMode ? 'Focus mode keeps the current task compact and guided.' : 'Standard mode shows the full workspace context.'}
          </p>
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
          >
            {preferences.focusMode ? 'Focus Mode On' : 'Focus Mode Off'}
          </button>
          <button
            type="button"
            onClick={onToggleReduceMotion}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              preferences.reduceMotion
                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {preferences.reduceMotion ? 'Reduced Motion On' : 'Reduce Motion'}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
