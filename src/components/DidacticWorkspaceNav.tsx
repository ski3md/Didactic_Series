import React from 'react';
import { Section } from '../types.ts';

interface DidacticWorkspaceNavProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
  orientation?: 'horizontal' | 'vertical';
  items?: Array<{ section: Section; label: string; onActivate?: () => void }>;
  compact?: boolean;
  variant?: 'default' | 'workspace';
}

const didacticSections = [
  { section: Section.DIDACTIC_LECTURES, label: 'Lectures' },
  { section: Section.DIDACTIC_TUTORIALS, label: 'Tutorials' },
  { section: Section.DIDACTIC_ALGORITHMS, label: 'Workups' },
  { section: Section.SIGN_OUT_SIMULATOR, label: 'Sign-Out' },
];

const DidacticWorkspaceNav: React.FC<DidacticWorkspaceNavProps> = ({
  activeSection,
  onSectionChange,
  orientation = 'horizontal',
  items = didacticSections,
  compact = false,
  variant = 'default',
}) => {
  return (
    <div className={orientation === 'vertical' ? 'space-y-2' : 'flex flex-wrap gap-2'}>
      {items.map((item) => {
        const isActive = item.section === activeSection;
        const baseClass =
          orientation === 'vertical'
            ? compact
              ? 'w-full rounded-xl px-3 py-3 text-left text-[13px]'
              : 'w-full rounded-xl px-4 py-3 text-left'
            : 'rounded-full px-4 py-2';
        const workspaceClass =
          variant === 'workspace'
            ? isActive
              ? 'border-sky-500 bg-sky-600 text-white shadow-sm shadow-sky-600/20'
              : 'border-slate-300 bg-slate-900 text-white hover:border-slate-400 hover:bg-slate-800'
            : isActive
              ? 'border-sky-400 bg-sky-50 text-sky-800'
              : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900';
        return (
          <button
            key={item.section}
            type="button"
            onClick={() => {
              item.onActivate?.();
              onSectionChange(item.section);
            }}
            aria-pressed={isActive}
            className={`border text-sm font-semibold transition ${baseClass} ${workspaceClass}`}
          >
            <span className="block">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default DidacticWorkspaceNav;
