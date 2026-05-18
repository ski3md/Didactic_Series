import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <header className="mb-4 border-b border-slate-200 pb-3">
      <div className="flex items-start gap-3">
        {icon && <div className="mt-0.5 text-slate-500">{icon}</div>}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold font-serif text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
        </div>
      </div>
    </header>
  );
};

export default SectionHeader;
