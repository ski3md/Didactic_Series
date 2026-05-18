import React from 'react';
import { Section } from '../types.ts';

interface DidacticWorkspaceNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  orientation?: 'horizontal' | 'vertical';
  items?: Array<{ section: Section; label: string; onActivate?: () => void }>;
  compact?: boolean;
}

const didacticSections = [
  { section: Section.DIDACTIC_LECTURES, label: 'Lectures' },
  { section: Section.DIDACTIC_TUTORIALS, label: 'Tutorials' },
  { section: Section.DIDACTIC_ALGORITHMS, label: 'Algorithms' },
  { section: Section.SIGN_OUT_SIMULATOR, label: 'Sign-Out' },
];

const DidacticWorkspaceNav: React.FC<DidacticWorkspaceNavProps> = ({
  activeSection,
  onSectionChange,
  orientation = 'horizontal',
  items = didacticSections,
  compact = false,
}) => {
  return (
    <div className={orientation === 'vertical' ? 'space-y-2' : 'flex flex-wrap gap-2'}>
      {items.map((item) => {
        const isActive = item.section === activeSection;
        return (
          <button
            key={item.section}
            type="button"
            onClick={() => {
              item.onActivate?.();
              onSectionChange(item.section);
            }}
            className={`text-sm font-semibold transition ${
              orientation === 'vertical'
                ? compact
                  ? 'w-full rounded-lg border px-3 py-2 text-left text-[13px]'
                  : 'w-full rounded-xl border px-4 py-2.5 text-left'
                : 'rounded-full border px-4 py-2'
            } ${
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
