import React from 'react';
import Card from './ui/Card';
import { Section } from '../types';
import { 
  DocumentTextIcon, MicroscopeIcon, EyeIcon, BeakerIcon, 
  SparklesIcon, BookOpenIcon, PhotographIcon, CollectionIcon
} from './icons';

interface HomeProps {
  onSectionChange: (section: Section) => void;
}

const SectionLinkCard: React.FC<{
  section: Section;
  description: string;
  icon: React.ReactNode;
  onClick: (section: Section) => void;
}> = ({ section, description, icon, onClick }) => (
  <li className="list-none">
    <Card interactive={true} className="!mb-0 h-full" onClick={() => onClick(section)}>
      <div className="flex items-start">
        <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center mr-4">
          <div className="text-primary-600">{icon}</div>
        </div>
        <div>
          <h3 className="text-lg font-semibold font-serif text-slate-800">{section}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
      </div>
    </Card>
  </li>
);

const Home: React.FC<HomeProps> = ({ onSectionChange }) => {
  const learningSections = [
    { section: Section.JOB_AID, description: "A quick-reference table comparing high-yield features of Sarcoidosis and Tuberculosis.", icon: <DocumentTextIcon className="h-5 w-5" /> },
    { section: Section.CASE_STUDY, description: "Work through a classic case of Hypersensitivity Pneumonitis with an interactive whole-slide image viewer.", icon: <MicroscopeIcon className="h-5 w-5" /> },
    { section: Section.CASE_LIBRARY, description: "Browse a library of AI-organized case studies with integrated histology.", icon: <CollectionIcon className="h-5 w-5" /> },
    { section: Section.VISUAL_CHALLENGE, description: "Sharpen your morphologic eye by comparing Sarcoidosis and HP side-by-side on digital slides.", icon: <EyeIcon className="h-5 w-5" /> },
    { section: Section.DIAGNOSTIC_PATHWAY, description: "A comprehensive, multi-step quiz that guides you through the differential diagnosis of a wide range of granulomatous diseases.", icon: <BeakerIcon className="h-5 w-5" /> },
    { section: Section.AI_CASE_GENERATOR, description: "Leverage Gemini AI to generate unique, board-style cases and receive instant feedback on your diagnostic skills.", icon: <SparklesIcon className="h-5 w-5" /> },
    // Fix: Add Image Galleries section to home page
    { section: Section.IMAGE_GALLERIES, description: "Browse curated official images and contribute your own finds to the community gallery.", icon: <PhotographIcon className="h-5 w-5" /> },
  ];

  const addieSections = [
    { section: Section.ANALYSIS, description: "Defining the learner, their knowledge gaps, and the context for learning.", icon: <BookOpenIcon className="h-5 w-5" /> },
    { section: Section.DESIGN, description: "Creating specific, measurable learning objectives based on the analysis.", icon: <BookOpenIcon className="h-5 w-5" /> },
    { section: Section.DEVELOPMENT, description: "Creating the instructional content, media, and activities.", icon: <BookOpenIcon className="h-5 w-5" /> },
    { section: Section.EVALUATION, description: "Measuring your ability to integrate findings and form a diagnosis.", icon: <BookOpenIcon className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 tracking-tight">Granulomatous Diseases of the Lung</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">An Interactive Learning Module for Pathology Residents</p>
      </header>

      <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-4">Welcome, Resident!</h2>
        <p className="text-slate-600 leading-relaxed">
          This module is designed to elevate your diagnostic skills in evaluating granulomatous diseases of the lung. The primary challenge in this area is not just identifying a granuloma, but navigating the significant morphologic overlap between different etiologies. Our goal is to move you from simple identification to integrated diagnostic reasoning—a crucial skill for both daily sign-out and board examinations.
        </p>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-6 text-center">The Learning Module</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningSections.map(item => (
            <SectionLinkCard key={item.section} {...item} onClick={onSectionChange} />
          ))}
        </ul>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-6 text-center">About This Project (Instructional Design)</h2>
        <p className="text-slate-600 mb-6 text-center max-w-3xl mx-auto">
          This module was built using the ADDIE model of instructional design. The sections below provide a meta-narrative on how this learning experience was constructed, from initial analysis to final evaluation.
        </p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addieSections.map(item => (
            <SectionLinkCard key={item.section} {...item} onClick={onSectionChange} />
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Home;
