import React from 'react';
import { MenuIcon } from './icons';
import { Section } from '../types';
import { useUIState } from '../hooks/useUIState';

interface HeaderProps {
  currentSection: Section;
}

const Header: React.FC<HeaderProps> = ({ currentSection }) => {
  const { toggleSidebar } = useUIState();
  return (
    <header className="sticky top-0 z-20 flex items-center bg-white/80 backdrop-blur-sm shadow-sm p-4 border-b border-slate-200">
      <button
        onClick={toggleSidebar}
        className="text-slate-700 hover:text-slate-900 p-2 -ml-2 mr-2"
        aria-label="Toggle navigation menu"
      >
        <MenuIcon className="h-6 w-6" />
      </button>
      <h1 className="text-lg font-semibold text-slate-900 truncate">
        {currentSection}
      </h1>
    </header>
  );
};

export default Header;
