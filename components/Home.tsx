import React from 'react';
import Card from './ui/Card';
import { Section } from '../types';
import { 
  DocumentTextIcon, MicroscopeIcon, EyeIcon, BeakerIcon, 
  SparklesIcon, BookOpenIcon, PhotographIcon, CollectionIcon, AcademicCapIcon
} from './icons';
import { setCurriculumDrilldown } from '../utils/curriculumDrilldown';
import {
  corePrinciplesPromotedLectures,
  curatedPromotedLectures,
  PromotedLectureRecord,
} from '../utils/lectureCatalog';

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
    { section: Section.SURGICAL_PATH_CURRICULUM, description: "Follow the new boards-first pathology curriculum shell spanning surgical pathology modules plus curated clinical pathology teaching blocks.", icon: <AcademicCapIcon className="h-5 w-5" /> },
    { section: Section.JOB_AID, description: "A quick-reference table comparing high-yield features of Sarcoidosis and Tuberculosis.", icon: <DocumentTextIcon className="h-5 w-5" /> },
    { section: Section.CASE_STUDY, description: "Work through a classic case of Hypersensitivity Pneumonitis with an interactive whole-slide image viewer.", icon: <MicroscopeIcon className="h-5 w-5" /> },
    { section: Section.CASE_LIBRARY, description: "Browse a library of AI-organized case studies with integrated histology.", icon: <CollectionIcon className="h-5 w-5" /> },
    { section: Section.LECTURES, description: "Read imported lecture transcripts, slide outlines, and companion algorithms from curated pathology projects.", icon: <BookOpenIcon className="h-5 w-5" /> },
    { section: Section.TUTORIALS, description: "Study imported board-style tutorials with markdown lessons, MCQs, and flashcards.", icon: <CollectionIcon className="h-5 w-5" /> },
    { section: Section.DOWNLOADS_LIBRARY, description: "Review the separate Downloads-derived staging library with imported lectures, tutorials, algorithms, and histology images.", icon: <DocumentTextIcon className="h-5 w-5" /> },
    { section: Section.SYLLABUS_EXPLORER, description: "Search the imported parsed syllabus topic index across the canonical curriculum backbone.", icon: <DocumentTextIcon className="h-5 w-5" /> },
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

  const openLecture = (lecture: PromotedLectureRecord) => {
    setCurriculumDrilldown({
      sourceModuleId: `home-lecture-pathway-${lecture.id}`,
      targetSection: Section.LECTURES,
      selectedId: lecture.id,
      query: lecture.title,
      track: lecture.lectureTrack,
    });
    onSectionChange(Section.LECTURES);
  };

  return (
    <div className="space-y-12 animate-fade-in">
      <header className="text-center">
        <h1 className="text-4xl sm:text-5xl font-bold font-serif text-slate-900 tracking-tight">Pathology Didactic Series</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-3xl mx-auto">A teaching platform for pathology residents, board review, and diagnostic pattern reinforcement.</p>
      </header>

      <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-4">Welcome, Resident!</h2>
        <p className="text-slate-600 leading-relaxed">
          This platform began as a focused granulomatous-disease module and now serves as a broader didactic workspace for lectures, tutorials,
          atlas review, job aids, and case-based study. The aim is the same throughout: move from isolated pattern recognition to integrated diagnostic reasoning that holds up on sign-out and on boards.
        </p>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-6 text-center">Teaching Library</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {learningSections.map(item => (
            <SectionLinkCard key={item.section} {...item} onClick={onSectionChange} />
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-6 text-center">Lecture Pathways</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {[
            {
              title: 'Curated GU Lectures',
              description: 'Direct pathways to the original GU lecture imports.',
              lectures: curatedPromotedLectures,
            },
            {
              title: 'Core Principles Series',
              description: 'Direct pathways to the promoted topic-based core-principles lectures.',
              lectures: corePrinciplesPromotedLectures,
            },
          ].map((group) => (
            <Card key={group.title}>
              <h3 className="text-xl font-semibold font-serif text-slate-900">{group.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{group.description}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {group.lectures.map((lecture) => (
                  <button
                    key={lecture.id}
                    type="button"
                    onClick={() => openLecture(lecture)}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-900"
                  >
                    {lecture.title}
                  </button>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
      
      <div>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-6 text-center">About This Project (Instructional Design)</h2>
        <p className="text-slate-600 mb-6 text-center max-w-3xl mx-auto">
          The platform still uses the ADDIE model as its instructional backbone. The sections below document how the teaching experience was scoped, designed, built, and evaluated.
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
