import React, { useState } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import Alert from './ui/Alert.tsx';
import { UsersIcon, TargetIcon, LightbulbIcon, MicroscopeIcon, CheckCircleIcon, XCircleIcon } from './icons.tsx';
import { User } from '../types.ts';

const SubSectionHeader: React.FC<{ icon: React.ReactNode; title: string }> = ({ icon, title }) => (
    <div className="flex items-center mb-4">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center mr-4">
            <div className="text-sky-600">{icon}</div>
        </div>
        <h2 className="text-2xl font-semibold font-serif text-slate-900">{title}</h2>
    </div>
);

const quizQuestions = [
    {
        question: "Based on the learner profile, what is the primary motivation for a pathology resident using this module?",
        options: [
            { id: 'a', text: 'General interest in lung diseases.' },
            { id: 'b', text: 'A requirement for their academic curriculum.' },
            { id: 'c', text: 'Achieving diagnostic competence for daily work and board exams.' },
            { id: 'd', text: 'Learning basic histology from scratch.' },
        ],
        correctAnswer: 'c',
        feedback: {
            a: 'While interest is a factor, their primary driver is more practical and goal-oriented.',
            b: 'This might be true, but their personal motivation is tied to professional competence.',
            c: 'Correct. Residents are goal-oriented and focused on practical skills for their job and high-stakes exams.',
            d: 'Incorrect. The analysis shows they already have a strong foundation in basic histology.',
        },
    },
    {
        question: "What is the core diagnostic challenge this module aims to address?",
        options: [
            { id: 'a', text: 'The inability to identify a granuloma on a slide.' },
            { id: 'b', text: 'The significant morphologic overlap between different causes of granulomas.' },
            { id: 'c', text: 'A lack of knowledge about special stains.' },
            { id: 'd', text: 'Difficulty in using a microscope.' },
        ],
        correctAnswer: 'b',
        feedback: {
            a: 'Incorrect. The analysis specifies that residents can already identify a granuloma; the problem is differentiating them.',
            b: 'Correct. The key difficulty is that many different diseases can produce very similar-looking granulomas, requiring integrated reasoning.',
            c: 'While important, knowing which stain to order is secondary to first understanding the differential diagnosis based on morphology.',
            d: 'This is a basic skill assumed to be competent in pathology residents.',
        }
    }
];

interface AnalysisPhaseProps {
  user: User | null;
}

const AnalysisPhase: React.FC<AnalysisPhaseProps> = ({ user }) => {
  const [answers, setAnswers] = useState<(string | null)[]>([null, null]);

  const handleSelectAnswer = (questionIndex: number, optionId: string) => {
    if (answers[questionIndex] === null) {
        const newAnswers = [...answers];
        newAnswers[questionIndex] = optionId;
        setAnswers(newAnswers);
    }
  };

  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Phase 1: Analysis"
        subtitle="Defining the learner, their knowledge gaps, and the context for learning."
      />

      <Card>
        <SubSectionHeader icon={<UsersIcon className="h-6 w-6" />} title="1. Identify the Learner" />
        <ul className="space-y-4 text-slate-700 list-disc list-inside">
          <li><strong>Who are they?</strong> Pathology residents (PGY 1-3) with foundational medical knowledge.</li>
          <li><strong>Background Knowledge:</strong> Strong understanding of general medicine, basic pathophysiology, and histology. They can define and identify a granuloma.</li>
          <li><strong>Experience Level:</strong> Novice-to-Intermediate diagnosticians transitioning from theory to practice.</li>
          <li><strong>Motivations:</strong> Goal-oriented, seeking diagnostic competence for daily work and board certification. They are practical, time-constrained, and highly visual learners.</li>
        </ul>
      </Card>
      
      <Card>
        <SubSectionHeader icon={<MicroscopeIcon className="h-6 w-6" />} title="2. Analyze the Topic" />
        <p className="text-slate-700 mb-4">The core difficulty is not identifying a granuloma, but differentiating between causes due to <strong>significant morphologic overlap</strong>.</p>
        <ul className="space-y-4 text-slate-700 list-disc list-inside">
          <li><strong>Vast Differential Diagnosis:</strong> Spans infectious, autoimmune, environmental, and drug-induced categories.</li>
          <li><strong>Non-Specific Histology:</strong> Histologic patterns alone are often insufficient for a definitive diagnosis.</li>
          <li><strong>Necessity of Clinical Correlation:</strong> Diagnosis requires skillful integration of clinical history, radiology, and microbiology with histology.</li>
          <li><strong>Use of Ancillary Studies:</strong> A critical skill is knowing which special stains to order and how to interpret them.</li>
        </ul>
      </Card>

      <Card>
        <SubSectionHeader icon={<TargetIcon className="h-6 w-6" />} title="3. Define the Knowledge Gap" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Current State (What they can do)</h3>
            <ul className="space-y-2 text-slate-700 list-disc list-inside">
              <li>Define a granuloma.</li>
              <li>Identify a granuloma on a slide.</li>
              <li>Broadly classify as "necrotizing" or "non-necrotizing."</li>
              <li>List a few classic causes.</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 mb-2">Desired State (What they need to do)</h3>
            <ul className="space-y-2 text-slate-700 list-disc list-inside">
              <li>Systematically evaluate morphology (quality, distribution).</li>
              <li>Formulate a pattern-based differential diagnosis.</li>
              <li>Integrate multi-modal data (clinical, radiologic).</li>
              <li>Guide the clinical workup with appropriate recommendations.</li>
            </ul>
          </div>
        </div>
        <div className="mt-8">
            <Alert type="info" title="The Core Challenge">
                The fundamental gap is the transition from <span className="font-bold">simple identification</span> to <span className="font-bold">integrated diagnostic reasoning</span>.
            </Alert>
        </div>
      </Card>

      <Card>
        <SubSectionHeader icon={<LightbulbIcon className="h-6 w-6" />} title="Output of this Phase: The Recipe" />
        <ul className="space-y-3 text-slate-700 list-disc list-inside">
            <li><strong className="text-slate-800">Instructional Goal:</strong> Advance from simple identification to clinically-integrated differential diagnosis.</li>
            <li><strong className="text-slate-800">Core Problem to Solve:</strong> The vast and histologically overlapping differential diagnosis.</li>
            <li><strong className="text-slate-800">Instructional Approach:</strong> Must be case-based and highly visual, structured by histologic pattern to mimic the actual diagnostic process.</li>
        </ul>
      </Card>

      <Card>
        <SubSectionHeader icon={<LightbulbIcon className="h-6 w-6" />} title="Knowledge Check" />
        <div className="space-y-8">
          {quizQuestions.map((q, index) => (
            <div key={index}>
              <p className="font-semibold text-slate-800 mb-4">{index + 1}. {q.question}</p>
              <div className="space-y-3">
                {q.options.map(option => {
                  const isAnswered = answers[index] !== null;
                  const isSelected = answers[index] === option.id;
                  const isCorrect = option.id === q.correctAnswer;
                  
                  let optionClass = 'bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500';
                  if (isAnswered) {
                      if (isCorrect) {
                          optionClass = 'bg-teal-50 border-teal-500 text-teal-900';
                      } else if (isSelected) {
                          optionClass = 'bg-rose-50 border-rose-500 text-rose-900';
                      } else {
                          optionClass = 'bg-slate-50 border-slate-300 text-slate-600 cursor-default';
                      }
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectAnswer(index, option.id)}
                      disabled={isAnswered}
                      className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center justify-between ${optionClass} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <span>{option.text}</span>
                      {isAnswered && isCorrect && isSelected && <CheckCircleIcon className="h-5 w-5 text-teal-600" />}
                      {isAnswered && isSelected && !isCorrect && <XCircleIcon className="h-5 w-5 text-rose-600" />}
                    </button>
                  );
                })}
              </div>
              {answers[index] && (
                <div className="mt-4">
                  <Alert type={answers[index] === q.correctAnswer ? 'success' : 'error'}>
                    {q.feedback[answers[index]!]}
                  </Alert>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AnalysisPhase;