import React from 'react';
import { Section } from '../types.ts';

interface DidacticWorkspaceNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

const didacticSections = [
  { section: Section.DIDACTIC_LECTURES, label: 'Lectures' },
  { section: Section.DIDACTIC_TUTORIALS, label: 'Tutorials' },
  { section: Section.DIDACTIC_ALGORITHMS, label: 'Algorithms' },
  { section: Section.SIGN_OUT_SIMULATOR, label: 'Sign-Out' },
];

const DidacticWorkspaceNav: React.FC<DidacticWorkspaceNavProps> = ({ activeSection, onSectionChange }) => {
  return (
    <div className="flex flex-wrap gap-2">
      {didacticSections.map((item) => {
        const isActive = item.section === activeSection;
        return (
          <button
            key={item.section}
            type="button"
            onClick={() => onSectionChange(item.section)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              isActive
                ? 'border-sky-400 bg-sky-50 text-sky-800'
                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

export default DidacticWorkspaceNav;
