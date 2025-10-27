import React, { useState } from 'react';
import Card from './Card';
import { CheckCircleIcon, XCircleIcon, LightbulbIcon } from './icons';

type StepId = 'start' | 'evaluateDistribution' | 'refineDifferential' | 'ancillaryTests' | 'finalDx' | 'endEarly';

interface Option {
  id: string;
  text: string;
  nextStep: StepId;
  feedback: string;
  isCorrect: boolean;
}

interface Step {
  id: StepId;
  title: string;
  question: string;
  information?: string;
  options?: Option[];
  conclusion?: string;
}

const pathwayData: Record<StepId, Step> = {
  start: {
    id: 'start',
    title: 'Step 1: Initial Presentation & Morphologic Assessment',
    information:
      'You receive a transbronchial biopsy from a 45-year-old patient with bilateral hilar lymphadenopathy. Microscopic examination reveals multiple, well-formed, non-necrotizing granulomas.',
    question: 'What is the most important *initial* step in your evaluation?',
    options: [
      {
        id: 'a',
        text: 'Immediately sign out as Sarcoidosis based on classic features.',
        nextStep: 'endEarly',
        feedback:
          "This is a common pitfall. While the features are classic for Sarcoidosis, it's a diagnosis of exclusion. A pathologist's primary duty is to rule out mimics, especially infection.",
        isCorrect: false,
      },
      {
        id: 'b',
        text: 'Evaluate the architectural distribution of the granulomas.',
        nextStep: 'evaluateDistribution',
        feedback:
          'Excellent choice. Assessing the location of the granulomas (e.g., lymphangitic, bronchiolocentric, or random) is the key next step to narrowing the differential diagnosis.',
        isCorrect: true,
      },
      {
        id: 'c',
        text: 'Order GMS and AFB stains immediately.',
        nextStep: 'evaluateDistribution',
        feedback:
          'While ordering these stains is crucial, it should be done in parallel with a complete morphologic assessment. First, analyze the distribution to fully inform your differential.',
        isCorrect: false,
      },
    ],
  },
  evaluateDistribution: {
    id: 'evaluateDistribution',
    title: 'Step 2: Distribution Analysis',
    information:
      'You carefully examine the biopsy at low power and determine the granulomas are tracking along the bronchovascular bundles and interlobular septa.',
    question: 'This pattern is best described as:',
    options: [
      {
        id: 'a',
        text: 'Bronchiolocentric distribution',
        nextStep: 'refineDifferential',
        feedback:
          'Incorrect. A bronchiolocentric pattern is centered on small airways and is more typical of Hypersensitivity Pneumonitis.',
        isCorrect: false,
      },
      {
        id: 'b',
        text: 'Random (miliary) distribution',
        nextStep: 'refineDifferential',
        feedback:
          'Incorrect. A random or miliary pattern suggests hematogenous spread, often from infections like Tuberculosis or fungi.',
        isCorrect: false,
      },
      {
        id: 'c',
        text: 'Lymphangitic distribution',
        nextStep: 'refineDifferential',
        feedback: 'Correct. This pattern follows the lung\'s lymphatic pathways and is a hallmark feature of Sarcoidosis.',
        isCorrect: true,
      },
    ],
  },
  refineDifferential: {
      id: 'refineDifferential',
      title: 'Step 3: Ancillary Testing',
      information: 'The findings of well-formed, non-necrotizing granulomas in a lymphangitic distribution strongly suggest Sarcoidosis.',
      question: 'Which ancillary tests are essential to perform to rule out mimics before suggesting Sarcoidosis in your report?',
      options: [
          {id: 'a', text: 'GMS and AFB stains.', nextStep: 'finalDx', feedback: 'Correct. It is mandatory to rule out fungal and mycobacterial organisms, as they can present with similar granulomatous patterns.', isCorrect: true},
          {id: 'b', text: 'Congo Red stain.', nextStep: 'finalDx', feedback: 'Incorrect. Congo Red is used to detect amyloid, not to rule out infectious granulomas.', isCorrect: false},
          {id: 'c', text: 'No stains are needed; the morphology is classic.', nextStep: 'endEarly', feedback: 'Incorrect. Sarcoidosis is a diagnosis of exclusion. Failing to perform stains to rule out infection is a critical error.', isCorrect: false},
      ]
  },
  finalDx: {
      id: 'finalDx',
      title: 'Step 4: Final Diagnosis & Correlation',
      // FIX: Added missing 'question' property to satisfy the 'Step' interface.
      question: '',
      conclusion: 'The GMS and AFB stains are negative for microorganisms. You can now confidently report the findings. \n\n**Diagnosis:** Non-necrotizing granulomatous inflammation, consistent with Sarcoidosis in the appropriate clinical context. \n\n**Comment:** The presence of well-formed, non-necrotizing granulomas with a lymphangitic distribution, combined with negative stains for organisms, are classic features of Sarcoidosis. Clinical and radiologic correlation is recommended.'
  },
  endEarly: {
      id: 'endEarly',
      title: 'Pathway Terminated: A Learning Opportunity',
      // FIX: Added missing 'question' property to satisfy the 'Step' interface.
      question: '',
      conclusion: 'This diagnostic path has been terminated because a critical error was made. Jumping to conclusions or failing to perform necessary ancillary studies can have significant consequences. The primary role of the pathologist in granulomatous disease is to first exclude infection and consider the full differential diagnosis based on a systematic evaluation of all morphologic clues.'
  }
};

const DiagnosticPathway: React.FC = () => {
  const [currentStepId, setCurrentStepId] = useState<StepId>('start');
  const [history, setHistory] = useState<({step: Step, answerId: string})[]>([]);

  const currentStep = pathwayData[currentStepId];

  const handleSelectOption = (option: Option) => {
    setHistory([...history, {step: currentStep, answerId: option.id}]);
    setCurrentStepId(option.nextStep);
  };

  const restartPathway = () => {
    setCurrentStepId('start');
    setHistory([]);
  }

  const renderOption = (option: Option, step: Step) => {
      const isAnswered = history.some(h => h.step.id === step.id);
      const isSelected = isAnswered && history.find(h => h.step.id === step.id)?.answerId === option.id;

      let optionClass = 'bg-white border-slate-300 hover:bg-slate-50';
      if (isSelected) {
          optionClass = option.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500';
      } else if (isAnswered) {
          optionClass = 'bg-slate-50 border-slate-300 text-slate-500';
      }

      return (
          <div key={option.id}>
              <button
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(option)}
                  className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center justify-between ${optionClass} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
              >
                  <span className="flex-1">{option.text}</span>
                  {isSelected && option.isCorrect && <CheckCircleIcon className="h-6 w-6 text-green-600" />}
                  {isSelected && !option.isCorrect && <XCircleIcon className="h-6 w-6 text-red-600" />}
              </button>
               {isSelected && (
                <div className={`mt-2 text-sm p-3 rounded-lg ${option.isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                    {option.feedback}
                </div>
              )}
          </div>
      )
  }

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Diagnostic Pathway</h1>
        <p className="mt-2 text-md text-slate-600">Simulating real-world diagnostic decision-making.</p>
      </header>
      
      {history.map(({step, answerId}, index) => {
          const answeredOption = step.options?.find(o => o.id === answerId);
          return (
               <Card key={index} className="opacity-60">
                   <h2 className="text-xl font-semibold text-slate-700 mb-2">{step.title}</h2>
                   {step.information && <p className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-slate-600 mb-4">{step.information}</p>}
                   <p className="font-semibold text-slate-600 mb-3">{step.question}</p>
                   <div className="space-y-3">
                       {step.options?.map(option => renderOption(option, step))}
                   </div>
               </Card>
          )
      })}

      <Card>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">{currentStep.title}</h2>
        {currentStep.information && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500 text-blue-800 space-y-3 mb-6">
                <p>{currentStep.information}</p>
            </div>
        )}
        {currentStep.question && <p className="font-semibold text-slate-700 mb-4">{currentStep.question}</p>}
        
        {currentStep.options && (
            <div className="space-y-3">
                {currentStep.options.map(option => renderOption(option, currentStep))}
            </div>
        )}

        {currentStep.conclusion && (
             <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in whitespace-pre-line">
                 <div className="flex items-center text-lg font-semibold text-slate-800 mb-3">
                     <LightbulbIcon className="h-6 w-6 text-blue-600 mr-2" />
                     Conclusion
                 </div>
                 <p className="text-slate-700 leading-relaxed">{currentStep.conclusion}</p>
                 <div className="mt-6 text-center">
                    <button 
                        onClick={restartPathway}
                        className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                        Restart Pathway
                    </button>
                </div>
             </div>
        )}
      </Card>
    </div>
  );
};

export default DiagnosticPathway;