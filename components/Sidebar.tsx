import React from 'react';
import { Section } from '../types';
import { MicroscopeIcon, LogoutIcon, UserCircleIcon } from './icons';

interface SidebarProps {
  currentSection: Section;
  onSectionChange: (section: Section) => void;
  onLogout: () => void;
  currentUser: string | null;
}

const Sidebar: React.FC<SidebarProps> = ({ currentSection, onSectionChange, onLogout, currentUser }) => {
  const sections = Object.values(Section);

  return (
    <aside className="w-64 bg-white shadow-md flex-shrink-0 hidden md:flex md:flex-col">
      <div className="h-16 flex items-center justify-center border-b border-slate-200 px-4">
        <MicroscopeIcon className="h-8 w-8 text-blue-600" />
        <h1 className="ml-2 text-lg font-bold text-slate-800">Pathology Module</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => onSectionChange(section)}
            className={`w-full text-left flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 ${
              currentSection === section
                ? 'bg-blue-100 text-blue-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {section}
          </button>
        ))}
      </nav>
      <div className="px-4 py-4 border-t border-slate-200">
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
        <div className="mt-4 text-xs text-slate-500">
          <p>&copy; 2024 AI Instructional Design</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;