import React from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, subtitle, icon }) => {
  return (
    <header className="mb-8 md:mb-12 animate-fade-in">
      <div className="flex items-center">
        {icon && <div className="mr-4 text-primary-600">{icon}</div>}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold font-serif text-slate-900">{title}</h1>
          <p className="mt-2 text-md text-slate-700">{subtitle}</p>
        </div>
      </div>
    </header>
  );
};

export default SectionHeader;