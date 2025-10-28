import React from 'react';
import Card from './Card';
import { Section } from '../types';

const Home: React.FC = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <header className="text-center">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Granulomatous Diseases of the Lung</h1>
        <p className="mt-4 text-lg text-slate-600">An Interactive Learning Module for Pathology Residents</p>
      </header>

      <Card>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Welcome, Resident!</h2>
        <p className="text-slate-600 leading-relaxed">
          This module is designed to elevate your diagnostic skills in evaluating granulomatous diseases of the lung. The primary challenge in this area is not just identifying a granuloma, but navigating the significant morphologic overlap between different etiologies. Our goal is to move you from simple identification to integrated diagnostic reasoning—a crucial skill for both daily sign-out and board examinations.
        </p>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Use the sidebar to navigate through the learning experience. Here’s a guide to the sections:
        </p>
      </Card>

      <Card>
        <h3 className="text-xl font-semibold text-slate-800 mb-4">The Learning Module</h3>
        <ul className="space-y-4 text-slate-600">
          <li>
            <strong className="text-slate-700">{Section.JOB_AID}</strong>
            <p className="text-sm">A quick-reference table comparing high-yield features of Sarcoidosis and Tuberculosis.</p>
          </li>
          <li>
            <strong className="text-slate-700">{Section.CASE_STUDY}</strong>
            <p className="text-sm">Work through a classic case of Hypersensitivity Pneumonitis with an interactive whole-slide image viewer.</p>
          </li>
          <li>
            <strong className="text-slate-700">{Section.VISUAL_CHALLENGE}</strong>
            <p className="text-sm">Sharpen your morphologic eye by comparing Sarcoidosis and HP side-by-side on digital slides.</p>
          </li>
          <li>
            <strong className="text-slate-700">{Section.DIAGNOSTIC_PATHWAY}</strong>
            <p className="text-sm">A comprehensive, multi-step quiz that guides you through the differential diagnosis of a wide range of granulomatous diseases.</p>
          </li>
          <li>
            <strong className="text-slate-700">{Section.AI_CASE_GENERATOR}</strong>
            <p className="text-sm">Leverage the Gemini AI to generate unique, board-style cases on less common entities and receive instant feedback on your diagnostic skills.</p>
          </li>
        </ul>
      </Card>

      <Card>
        <h3 className="text-xl font-semibold text-slate-800 mb-4">About This Project (Instructional Design)</h3>
        <p className="text-slate-600 mb-4">
          This module was built using the ADDIE model of instructional design. The sections below provide a meta-narrative on how this learning experience was constructed, from initial analysis to final evaluation.
        </p>
        <ul className="space-y-2 text-slate-600 list-disc list-inside">
          <li>{Section.ANALYSIS}</li>
          <li>{Section.DESIGN}</li>
          <li>{Section.DEVELOPMENT}</li>
          <li>{Section.EVALUATION}</li>
        </ul>
      </Card>
    </div>
  );
};

export default Home;
