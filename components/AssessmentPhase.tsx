

import React, { useState } from 'react';
import Card from './Card';
import { CheckCircleIcon, XCircleIcon } from './icons';

interface Option {
  id: string;
  text: string;
}

const options: Option[] = [
  { id: 'A', text: 'Sarcoidosis' },
  { id: 'B', text: 'Hypersensitivity Pneumonitis' },
  { id: 'C', text: 'Tuberculosis' },
  { id: 'D', text: 'Berylliosis' },
];

const correctAnswerId = 'A';

const explanations: { [key: string]: { title: string; rationale: string; isCorrect: boolean } } = {
  A: {
    title: 'Sarcoidosis',
    rationale: 'This is the classic presentation. The combination of bilateral hilar lymphadenopathy in an asymptomatic young adult with well-formed, non-necrotizing granulomas in a lymphangitic distribution is pathognomonic.',
    isCorrect: true,
  },
  B: {
    title: 'Hypersensitivity Pneumonitis',
    rationale: 'Incorrect. The granulomas in HP are typically poorly-formed and bronchiolocentric, not well-formed and lymphangitic. The clinical picture is also not typical for HP.',
    isCorrect: false,
  },
  C: {
    title: 'Tuberculosis',
    rationale: 'Incorrect. The stem explicitly states the granulomas are "non-necrotizing." Classic post-primary tuberculosis is characterized by caseating necrotizing granulomas.',
    isCorrect: false,
  },
  D: {
    title: 'Berylliosis',
    rationale: 'Incorrect. While histologically indistinguishable from sarcoidosis, berylliosis requires a specific clinical history of exposure to beryllium, which is absent here. Sarcoidosis is far more common.',
    isCorrect: false,
  },
};


const AssessmentPhase: React.FC = () => {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSelect = (optionId: string) => {
        if (!isSubmitted) {
            setSelectedAnswer(optionId);
        }
    };
    
    const handleSubmit = () => {
        if(selectedAnswer) {
            setIsSubmitted(true);
        }
    };

    const getOptionClass = (optionId: string) => {
        if (!isSubmitted) {
            return selectedAnswer === optionId 
                ? 'bg-blue-100 border-blue-500 ring-2 ring-blue-300' 
                : 'bg-white border-slate-300 hover:bg-slate-50';
        }
        if (optionId === correctAnswerId) {
            return 'bg-green-50 border-green-500 text-green-900';
        }
        if (optionId === selectedAnswer) {
            return 'bg-red-50 border-red-500 text-red-900';
        }
        return 'bg-slate-50 border-slate-300 text-slate-500';
    };

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Board-Style Question</h1>
        <p className="mt-2 text-md text-slate-600">Measuring your ability to integrate findings and form a diagnosis.</p>
      </header>
      
      <Card>
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Question: Integrate and Diagnose</h2>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-slate-600 space-y-3 mb-6">
            <p><strong>Stem:</strong> A 35-year-old woman presents for a pre-employment physical. She is asymptomatic. A routine chest X-ray reveals an abnormality, prompting a CT scan and subsequent transbronchial biopsy. The chest CT demonstrates bilateral hilar lymphadenopathy and subtle perilymphatic nodularity.</p>
            <p><strong>Microscopic Findings:</strong> Examination shows numerous, discrete, and well-formed non-necrotizing granulomas. They are composed of tight clusters of epithelioid histiocytes with scattered multinucleated giant cells and a minimal lymphocytic cuff. They are observed in the submucosa of a bronchiole and expanding the interstitium of adjacent alveolar septa, consistent with a lymphangitic distribution.</p>
        </div>

        <p className="font-semibold text-slate-700 mb-4">Based on the integration of all findings, what is the most likely diagnosis?</p>
        
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={isSubmitted}
              className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center ${getOptionClass(option.id)}`}
            >
              <span className={`font-bold mr-4`}>{option.id}.</span>
              <span className="flex-1">{option.text}</span>
              {isSubmitted && option.id === correctAnswerId && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
              {isSubmitted && option.id === selectedAnswer && option.id !== correctAnswerId && <XCircleIcon className="h-6 w-6 text-red-600" />}
            </button>
          ))}
        </div>
        
        <div className="mt-6 text-center">
            <button 
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitted}
                className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                Submit Answer
            </button>
        </div>
        
        {isSubmitted && (
            <div className="mt-6 space-y-4 animate-fade-in">
                {Object.entries(explanations).map(([id, exp]) => (
                    selectedAnswer === id || id === correctAnswerId ? (
                        <div key={id} className={`p-4 rounded-lg border-l-4 ${exp.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                            <h4 className="font-bold">{exp.isCorrect ? 'Correct:' : 'Incorrect:'} {exp.title}</h4>
                            <p className="text-sm mt-1">{exp.rationale}</p>
                        </div>
                    ) : null
                ))}
            </div>
        )}
      </Card>
    </div>
  );
};

export default AssessmentPhase;
