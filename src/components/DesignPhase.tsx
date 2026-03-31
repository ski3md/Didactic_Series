import React from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';

const DesignPhase: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Phase 2: Design"
        subtitle="Creating specific, measurable learning objectives based on the analysis."
      />

      <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-900 mb-4">Selecting Bloom's Taxonomy Levels</h2>
        <p className="text-slate-700 leading-relaxed mb-4">
          The analysis revealed that the core problem is not a lack of foundational knowledge, but the inability to apply and synthesize it. Therefore, this module targets higher-order thinking skills.
        </p>
        <div className="flex flex-wrap gap-2">
            <span className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full">Remember</span>
            <span className="bg-slate-100 text-slate-700 text-sm font-medium px-3 py-1 rounded-full">Understand</span>
            <span className="bg-sky-100 text-sky-800 text-sm font-bold px-3 py-1 rounded-full">Apply</span>
            <span className="bg-sky-100 text-sky-800 text-sm font-bold px-3 py-1 rounded-full">Analyze</span>
            <span className="bg-sky-100 text-sky-800 text-sm font-bold px-3 py-1 rounded-full">Evaluate</span>
            <span className="bg-sky-100 text-sky-800 text-sm font-bold px-3 py-1 rounded-full">Create</span>
        </div>
        <p className="mt-4 text-slate-700 leading-relaxed">
          Instruction will operate primarily at the <strong>Apply, Analyze, and Evaluate</strong> levels, culminating in a <strong>Create</strong> task (formulating a diagnostic report).
        </p>
      </Card>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold font-serif text-slate-900 mb-2 text-center">Learning Objectives</h2>
        <p className="text-slate-700 leading-relaxed mb-8 text-center">Upon completion of this module, the learner will be able to:</p>
        
        <div className="space-y-6">
          <Card className="!mb-0 border-l-4 border-sky-500 bg-sky-50/50">
            <h3 className="font-bold text-lg font-serif text-slate-900 mb-2">Objective 1: Analyze</h3>
            <p className="text-slate-700">Given a high-resolution digital image of a lung biopsy containing granulomas, the pathology resident will <strong className="text-slate-900">differentiate</strong> the key morphologic features by correctly identifying the type of granuloma, its architectural distribution, and any associated findings.</p>
          </Card>
          
          <Card className="!mb-0 border-l-4 border-teal-500 bg-teal-50/50">
            <h3 className="font-bold text-lg font-serif text-slate-900 mb-2">Objective 2: Evaluate & Create</h3>
            <p className="text-slate-700">Given a case study that includes a histologic pattern, a brief clinical history, and radiologic findings, the resident will <strong className="text-slate-900">synthesize</strong> the information to construct a clinically relevant, ranked differential diagnosis, justifying the top two diagnoses with specific evidence.</p>
          </Card>

          <Card className="!mb-0 border-l-4 border-indigo-500 bg-indigo-50/50">
            <h3 className="font-bold text-lg font-serif text-slate-900 mb-2">Objective 3: Apply & Evaluate</h3>
            <p className="text-slate-700">Based on a formulated differential diagnosis for a case, the resident will <strong className="text-slate-900">propose</strong> the most appropriate ancillary studies and correctly interpret the diagnostic implications of both a positive and a negative result, including limitations.</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DesignPhase;