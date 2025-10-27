
import React from 'react';
import Card from './Card';

const Home: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Granulomatous Diseases of the Lung</h1>
        <p className="mt-4 text-lg text-slate-600">An Interactive Learning Module for Pathology Residents</p>
      </header>

      <Card>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Welcome, Resident!</h2>
        <p className="text-slate-600 leading-relaxed">
          This educational module is designed to elevate your diagnostic skills in evaluating granulomatous diseases of the lung. The primary challenge in this area is not identifying a granuloma, but navigating the significant morphologic overlap between different etiologies.
        </p>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Our goal is to move you from simple identification to integrated diagnostic reasoning, a crucial skill for both daily sign-out and board examinations.
        </p>
         <p className="mt-4 text-slate-600 leading-relaxed">
          Use the sidebar to navigate through each section of the learning experience.
        </p>
      </Card>
    </div>
  );
};

export default Home;
