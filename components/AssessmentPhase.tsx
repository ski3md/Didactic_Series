import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Alert from './ui/Alert';
import { CheckCircleIcon, XCircleIcon } from './icons';
import { User, Section, StoredImage } from '../types';
import { trackEvent } from '../utils/tracking';
import { findRelevantImage } from '../utils/aiImageSelector';
import WSIViewer from './WSIViewer';

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

const caseStem = {
    clinical: "A 35-year-old woman presents for a pre-employment physical. She is asymptomatic. A routine chest X-ray reveals an abnormality, prompting a CT scan and subsequent transbronchial biopsy. The chest CT demonstrates bilateral hilar lymphadenopathy and subtle perilymphatic nodularity.",
    histology: "Examination shows numerous, discrete, and well-formed non-necrotizing granulomas. They are composed of tight clusters of epithelioid histiocytes with scattered multinucleated giant cells and a minimal lymphocytic cuff. They are observed in the submucosa of a bronchiole and expanding the interstitium of adjacent alveolar septa, consistent with a lymphangitic distribution."
};

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center h-full my-4">
        <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-600">{text}</span>
    </div>
);


interface AssessmentPhaseProps {
  user: User;
}

const AssessmentPhase: React.FC<AssessmentPhaseProps> = ({ user }) => {
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [caseImage, setCaseImage] = useState<StoredImage | null>(null);
    const [isFindingImage, setIsFindingImage] = useState(true);

    useEffect(() => {
        const fetchImage = async () => {
            setIsFindingImage(true);
            const context = `The case is about Sarcoidosis. ${caseStem.clinical} ${caseStem.histology}`;
            const image = await findRelevantImage(context);
            setCaseImage(image);
            setIsFindingImage(false);
        };
        fetchImage();
    }, []);

    const handleSelect = (optionId: string) => {
        if (!isSubmitted) {
            setSelectedAnswer(optionId);
        }
    };
    
    const handleSubmit = () => {
        if(selectedAnswer) {
            setIsSubmitted(true);

            // Tracking
            const selectedOption = options.find(o => o.id === selectedAnswer);
            trackEvent(
                user.username,
                Section.EVALUATION,
                'finalQuestion',
                {
                    question: "Based on the integration of all findings, what is the most likely diagnosis?",
                    selectedAnswer: selectedOption?.text || 'N/A',
                    isCorrect: selectedAnswer === correctAnswerId,
                    timestamp: Date.now()
                }
            );
        }
    };

    const getOptionClass = (optionId: string) => {
        if (!isSubmitted) {
            return selectedAnswer === optionId 
                ? 'bg-primary-100 border-primary-400 ring-2 ring-primary-300' 
                : 'bg-white border-slate-300 hover:bg-slate-50 hover:border-slate-400';
        }
        if (optionId === correctAnswerId) {
            return 'bg-green-50 border-green-500 text-green-900';
        }
        if (optionId === selectedAnswer) {
            return 'bg-red-50 border-red-500 text-red-900';
        }
        return 'bg-slate-100 border-slate-300 text-slate-500 cursor-default';
    };

  return (
    <div className="animate-fade-in">
      <SectionHeader 
        title="Board-Style Question"
        subtitle="Measuring your ability to integrate findings and form a diagnosis."
      />
      
      <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-2">Question: Integrate and Diagnose</h2>
        
        <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 text-slate-600 space-y-4 mb-6">
            <p><strong>Stem:</strong> {caseStem.clinical}</p>
            <div>
                <p><strong>Microscopic Findings:</strong></p>
                {isFindingImage && <LoadingSpinner text="Finding relevant image..." />}
                {caseImage && (
                    <div className="my-4 space-y-2 animate-fade-in">
                        <WSIViewer staticImageUrl={caseImage.src} altText={caseImage.title} />
                        <p className="text-center text-sm text-slate-600 font-semibold italic">
                            AI-selected image from gallery: "{caseImage.title}"
                        </p>
                    </div>
                )}
                <p>{caseStem.histology}</p>
            </div>
        </div>

        <p className="font-semibold text-slate-700 mb-4">Based on the integration of all findings, what is the most likely diagnosis?</p>
        
        <div className="space-y-3">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              disabled={isSubmitted}
              className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center ${getOptionClass(option.id)} ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className={`font-bold mr-4 text-slate-500`}>{option.id}.</span>
              <span className="flex-1">{option.text}</span>
              {isSubmitted && option.id === correctAnswerId && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
              {isSubmitted && option.id === selectedAnswer && option.id !== correctAnswerId && <XCircleIcon className="h-6 w-6 text-red-600" />}
            </button>
          ))}
        </div>
        
        <div className="mt-8 border-t border-slate-200 pt-6 text-center">
            <button 
                onClick={handleSubmit}
                disabled={!selectedAnswer || isSubmitted}
                className="bg-primary-600 text-white font-semibold py-2.5 px-8 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 shadow-sm">
                Submit Answer
            </button>
        </div>
        
        {isSubmitted && (
            <div className="mt-8 space-y-4 animate-fade-in">
                {selectedAnswer && (
                  <Alert
                    type={explanations[selectedAnswer].isCorrect ? 'success' : 'error'}
                    title={explanations[selectedAnswer].isCorrect ? `Correct: ${explanations[selectedAnswer].title}` : `Incorrect: ${explanations[selectedAnswer].title}`}
                  >
                    {explanations[selectedAnswer].rationale}
                  </Alert>
                )}
                {selectedAnswer !== correctAnswerId && (
                   <Alert
                    type="info"
                    title={`The Correct Answer was: ${explanations[correctAnswerId].title}`}
                  >
                    {explanations[correctAnswerId].rationale}
                  </Alert>
                )}
            </div>
        )}
      </Card>
    </div>
  );
};

export default AssessmentPhase;