import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../types.ts';
import Card from './ui/Card.tsx';
import Alert from './ui/Alert.tsx';
import { CheckCircleIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from './icons.tsx';

// Data structure
interface DiagnosticPathwayQuestion {
  id: number;
  focus: string;
  vignette: string;
  question: string;
  choices: string[];
  correctAnswer: string;
  explanation: string;
  reasoning: string;
}

const pathwayQuestions: DiagnosticPathwayQuestion[] = [
    {
        id: 1,
        focus: "Necrotizing Granuloma",
        vignette: "A 45-year-old immigrant from Southeast Asia presents with chronic cough, night sweats, and weight loss. Chest X-ray shows apical cavitary lesions. A lung biopsy reveals multiple necrotizing granulomas with central caseous necrosis. Special stains for acid-fast bacilli (AFB) are negative.",
        question: "Given these findings, which of the following is the most appropriate next diagnostic step to identify the likely etiology?",
        choices: ["Perform a Gomori Methenamine Silver (GMS) stain.", "Order an ANCA panel (c-ANCA and p-ANCA).", "Initiate empirical anti-tuberculosis therapy.", "Re-biopsy the patient for a larger tissue sample."],
        correctAnswer: "Perform a Gomori Methenamine Silver (GMS) stain.",
        explanation: "Necrotizing granulomas with central caseous necrosis are characteristic of both tuberculosis and certain fungal infections (e.g., Histoplasmosis, Cryptococcosis, Coccidioidomycosis, Blastomycosis). While AFB stains were negative, this does not completely rule out TB due to sensitivity issues or paucibacillary disease. However, the combination of clinical symptoms and classic morphology strongly suggests an infectious cause. Fungal infections are common in immunocompromised patients or those from endemic areas, and their morphology can closely mimic TB. A GMS stain is essential for identifying fungal organisms within tissue. An ANCA panel is relevant for vasculitides like GPA, but the morphology points more strongly to infection, especially with caseous necrosis. Empirical therapy without definitive diagnosis is not ideal when a stain can confirm. Re-biopsy is premature.",
        reasoning: "Patient presents with symptoms suggestive of chronic infection (cough, night sweats, weight loss) and CXR findings (apical cavitary lesions) commonly seen in tuberculosis or severe fungal disease. Lung biopsy shows necrotizing granulomas with central caseous necrosis, a key morphological feature for both TB and certain deep fungal infections. AFB stains are negative, reducing the immediate likelihood of typical TB but not ruling it out entirely. This necessitates considering other causes that produce similar morphology. Fungal infections frequently cause necrotizing granulomas that can be morphologically indistinguishable from TB, particularly in endemic areas or in immunocompromised individuals. A GMS stain specifically highlights fungal cell walls and is the most direct and rapid next step to identify a fungal etiology in a tissue sample exhibiting necrotizing granulomas where AFB is negative."
    },
    // ... (rest of the questions are the same)
];


interface DiagnosticPathwayProps {
  user: User | null; // For potential future tracking
}

const DiagnosticPathway: React.FC<DiagnosticPathwayProps> = ({ user }) => {
    const pathways = useMemo(() => {
        // Create a unique, ordered list of pathways from the data
        const uniquePathways = new Map<string, string>();
        pathwayQuestions.forEach(q => {
            const focusKey = q.focus.replace(/ /g, '-');
            if (!uniquePathways.has(focusKey)) {
                uniquePathways.set(focusKey, q.focus);
            }
        });
        return Array.from(uniquePathways.keys());
    }, []);

    const [activePathway, setActivePathway] = useState(pathways[0] || '');
    
    const currentPathwayQuestions = useMemo(() => {
        return pathwayQuestions.filter(q => q.focus.replace(/ /g, '-') === activePathway);
    }, [activePathway]);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(string | null)[]>([]);

    useEffect(() => {
        setCurrentIndex(0);
        setAnswers(new Array(currentPathwayQuestions.length).fill(null));
    }, [activePathway, currentPathwayQuestions.length]);
    
    const currentQuestion = currentPathwayQuestions[currentIndex];

    const selectedAnswer = answers[currentIndex];
    const isAnswered = selectedAnswer !== null;

    const handleSelectAnswer = (choice: string) => {
        if (isAnswered) return;
        const newAnswers = [...answers];
        newAnswers[currentIndex] = choice;
        setAnswers(newAnswers);
    };

    const handleNext = () => {
        if (currentIndex < currentPathwayQuestions.length - 1) {
            setCurrentIndex(currentIndex + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
        }
    };

    const getOptionClass = (choice: string) => {
        if (!isAnswered) {
            return 'bg-white border-slate-300 hover:bg-slate-50';
        }
        if (choice === currentQuestion.correctAnswer) {
            return 'bg-teal-50 border-teal-500 text-teal-900';
        }
        if (choice === selectedAnswer) {
            return 'bg-rose-50 border-rose-500 text-rose-900';
        }
        return 'bg-slate-100 border-slate-300 text-slate-600 cursor-default';
    };

    if (!currentQuestion) {
        return <p>Loading pathway...</p>
    }

    return (
        <div className="animate-fade-in">
            <div className="flex flex-wrap items-center justify-center gap-2 border border-slate-200 p-1 rounded-lg mb-6 bg-slate-50">
                {pathways.map(pathwayKey => (
                    <button
                        key={pathwayKey}
                        onClick={() => setActivePathway(pathwayKey)}
                        className={`flex-grow px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                            activePathway === pathwayKey
                            ? 'bg-white text-sky-700 shadow'
                            : 'text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        {pathwayKey.replace(/-/g, ' ')}
                    </button>
                ))}
            </div>

            <Card>
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold uppercase tracking-wider text-sky-700">{currentQuestion.focus}</p>
                    <p className="text-sm font-medium text-slate-600">Question {currentIndex + 1} of {currentPathwayQuestions.length}</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <h3 className="font-semibold text-slate-800 mb-2">Clinical Vignette</h3>
                    <p className="text-slate-700 leading-relaxed">{currentQuestion.vignette}</p>
                </div>

                <p className="font-semibold text-slate-800 mb-4">{currentQuestion.question}</p>

                <div className="space-y-3">
                    {currentQuestion.choices.map((choice, index) => (
                        <button
                            key={index}
                            onClick={() => handleSelectAnswer(choice)}
                            disabled={isAnswered}
                            className={`w-full text-left p-4 border rounded-lg transition-all duration-200 flex items-center justify-between ${getOptionClass(choice)} ${!isAnswered ? 'cursor-pointer' : 'cursor-default'}`}
                        >
                            <span>{choice}</span>
                            {isAnswered && choice === currentQuestion.correctAnswer && <CheckCircleIcon className="h-5 w-5 text-teal-600 flex-shrink-0" />}
                            {isAnswered && choice === selectedAnswer && choice !== currentQuestion.correctAnswer && <XCircleIcon className="h-5 w-5 text-rose-600 flex-shrink-0" />}
                        </button>
                    ))}
                </div>

                {isAnswered && (
                    <div className="mt-6 space-y-4 animate-fade-in">
                        <Alert type="success" title="Explanation">
                            {currentQuestion.explanation}
                        </Alert>
                        <Alert type="info" title="Chain of Reasoning">
                           <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: currentQuestion.reasoning.replace(/\n/g, '<br />') }}></div>
                        </Alert>
                    </div>
                )}
            </Card>

            <div className="mt-6 flex justify-between items-center">
                 <button onClick={handlePrev} disabled={currentIndex === 0} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    <ChevronLeftIcon className="h-5 w-5 mr-2" /> Previous
                </button>
                 <button onClick={handleNext} disabled={currentIndex === currentPathwayQuestions.length - 1} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                    Next <ChevronRightIcon className="h-5 w-5 ml-2" />
                </button>
            </div>
        </div>
    );
};

export default DiagnosticPathway;