import React from 'react';
import { MenuIcon } from './icons';
import { Section } from '../types';

interface MobileHeaderProps {
  onMenuClick: () => void;
  currentSection: Section;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick, currentSection }) => {
  return (
    <header className="md:hidden bg-white shadow-sm sticky top-0 z-20 flex items-center justify-between p-4 border-b border-slate-200">
      <button onClick={onMenuClick} className="text-slate-600 hover:text-slate-900 p-2 -ml-2" aria-label="Open navigation menu">
        <MenuIcon className="h-6 w-6" />
      </button>
      <h1 className="text-lg font-semibold text-slate-800 truncate">
        {currentSection}
      </h1>
      <div className="w-6"></div> {/* Spacer to balance the title */}
    </header>
  );
};

export default MobileHeader;