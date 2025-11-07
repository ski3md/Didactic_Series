import React, { useState } from 'react';
import { User, ModuleData } from '../types.ts';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { modules } from '../data/modules.ts';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import WSIViewer from './WSIViewer.tsx';
import { CheckCircleIcon, LightbulbIcon, ArrowPathIcon } from './icons.tsx';

type SimulatorState = 'intro' | 'clinical' | 'histology' | 'ancillaries' | 'reporting' | 'feedback';

const ancillaryTests = [
    { id: 'afb', name: 'AFB (for Mycobacteria)', resultText: 'AFB stain is negative for acid-fast bacilli.' },
    { id: 'gms', name: 'GMS (for Fungi)', resultText: 'GMS stain is negative for fungal organisms.' },
    { id: 'c-anca', name: 'c-ANCA (Serology)', resultText: 'Serology result: c-ANCA (anti-PR3) is POSITIVE.' },
    { id: 'p-anca', name: 'p-ANCA (Serology)', resultText: 'Serology result: p-ANCA (anti-MPO) is negative.' },
];

const histologyImageMap: Record<string, { src: string; alt: string; caption: string }> = {
    'Granulomatosis with Polyangiitis (GPA)': {
        src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/Wegener%27s_granulomatosis_-b-_intermed_mag.jpg/1200px-Wegener%27s_granulomatosis_-b-_intermed_mag.jpg',
        alt: 'Granulomatosis with Polyangiitis showing necrotizing vasculitis and dirty necrosis',
        caption: 'Granulomatosis with Polyangiitis – necrotizing granulomatous inflammation with vasculitis.'
    },
    Histoplasmosis: {
        src: 'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/histoplasmosis/GMS/histoplasmosis_histoplasmosis_06.jpg',
        alt: 'Histoplasmosis demonstrating GMS-positive intracellular yeasts',
        caption: 'Histoplasmosis – GMS stain highlighting clustered 2–5 µm intracellular yeasts.'
    },
    'Chronic Beryllium Disease': {
        src: 'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/sarcoidosis/Unclassified/sarcoidosis_sarcoidosis_60.jpg',
        alt: 'Chronic Beryllium Disease with non-caseating granulomas mimicking sarcoidosis',
        caption: 'Chronic Beryllium Disease – tight non-caseating granulomas indistinguishable from sarcoidosis.'
    },
};

const defaultHistologyImage = {
    src: 'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/sarcoidosis/Unclassified/sarcoidosis_granulomas_05.jpg',
    alt: 'Representative granulomatous lung histology',
    caption: 'Representative granulomatous inflammation.'
};

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center h-full my-4">
        <svg className="animate-spin h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24" stroke="currentColor">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-700">{text}</span>
    </div>
);

const renderMarkdown = (text: string) => {
    const html = text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br />');
    return <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: html }} />;
};

const Stepper: React.FC<{ steps: string[], currentStepIndex: number }> = ({ steps, currentStepIndex }) => (
    <nav aria-label="Progress">
        <ol role="list" className="flex items-center">
            {steps.map((step, stepIdx) => (
                <li key={step} className={`relative ${stepIdx !== steps.length - 1 ? 'flex-1' : ''}`}>
                    {stepIdx <= currentStepIndex ? (
                        <div className="flex items-center">
                            <span className="flex h-9 items-center">
                                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-sky-600">
                                    <CheckCircleIcon className="h-4 w-4 text-white" />
                                </span>
                            </span>
                            <span className="ml-2 text-xs font-semibold text-sky-700 uppercase hidden sm:block">{step}</span>
                        </div>
                    ) : (
                        <div className="flex items-center">
                            <span className="flex h-9 items-center">
                                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 bg-white" />
                            </span>
                             <span className="ml-2 text-xs font-medium text-slate-500 uppercase hidden sm:block">{step}</span>
                        </div>
                    )}

                    {stepIdx < steps.length - 1 ? (
                        <div className={`absolute left-3 top-4 -ml-px mt-0.5 h-0.5 w-full ${stepIdx < currentStepIndex ? 'bg-sky-600' : 'bg-slate-300'}`} aria-hidden="true" />
                    ) : null}
                </li>
            ))}
        </ol>
    </nav>
);

const SignOutSimulator: React.FC<{ user: User | null }> = ({ user }) => {
    const [caseData, setCaseData] = useState<ModuleData | null>(null);
    const [currentState, setCurrentState] = useState<SimulatorState>('intro');
    const [selectedAncillaries, setSelectedAncillaries] = useState<string[]>([]);
    const [userReport, setUserReport] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
    
    const startNewCase = () => {
        const randomCase = modules[Math.floor(Math.random() * modules.length)];
        setCaseData(randomCase);
        setCurrentState('clinical');
        setSelectedAncillaries([]);
        setUserReport('');
        setFeedback(null);
    };
    
    const handleAncillaryToggle = (testId: string) => {
        setSelectedAncillaries(prev => 
            prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId]
        );
    };

    const handleSubmitForFeedback = async () => {
        if (!caseData || !userReport) return;
        
        setIsLoadingFeedback(true);
        setFeedback(null);
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const goldStandard = caseData.case_tutorial.goldStandardReport;
            const feedbackPrompt = `
                You are a senior pathology attending providing feedback to a resident on their diagnostic report.
                The case is ${caseData.topic}. The gold standard report is:
                - Final Diagnosis: ${goldStandard.finalDiagnosis}
                - Microscopic Description: ${goldStandard.microscopicDescription}
                - Comment: ${goldStandard.comment}

                The resident's submitted report is: "${userReport}"

                Your task is to:
                1. Praise the resident for what they got right in their report.
                2. Gently point out any inaccuracies or omissions compared to the gold standard.
                3. Offer a high-yield teaching point related to the diagnosis.
                Keep your tone supportive, professional, and educational. Format the response using markdown with bolding and newlines.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: feedbackPrompt,
            });
            const feedbackText = response.text.trim();
            setFeedback(feedbackText);

        } catch (e) {
            console.error(e);
            setFeedback("Error generating feedback. Please try again.");
        } finally {
            setIsLoadingFeedback(false);
            setCurrentState('feedback');
        }
    };
    
    const StepCard: React.FC<{ title: string; children: React.ReactNode; isCompleted: boolean }> = ({ title, children, isCompleted }) => (
        <Card className={isCompleted ? 'bg-slate-50 opacity-70' : ''}>
            <div className="flex justify-between items-start">
                <h2 className="text-xl font-semibold font-serif text-slate-900 mb-4">{title}</h2>
                {isCompleted && <span className="flex items-center text-sm font-semibold text-teal-600 bg-teal-100 px-3 py-1 rounded-full"><CheckCircleIcon className="h-4 w-4 mr-1.5" />Completed</span>}
            </div>
            {children}
        </Card>
    );
    
    const simulatorSteps: SimulatorState[] = ['clinical', 'histology', 'ancillaries', 'reporting', 'feedback'];
    const currentStepIndex = simulatorSteps.indexOf(currentState);

    return (
        <div className="animate-fade-in space-y-6">
            <SectionHeader title="Virtual Sign-Out Simulator" subtitle="Work through an unknown case from start to finish." />
            
            {currentState !== 'intro' && (
                <div className="mb-8 px-2 sm:px-0">
                    <Stepper steps={['Clinical', 'Histology', 'Ancillaries', 'Report', 'Feedback']} currentStepIndex={currentStepIndex-1} />
                </div>
            )}

            {currentState === 'intro' && (
                <Card>
                    <div className="text-center">
                        <h2 className="text-2xl font-semibold font-serif text-slate-900 mb-4">Welcome to the Simulator</h2>
                        <p className="text-slate-700 max-w-xl mx-auto mb-6">This capstone exercise mimics the real-world diagnostic process. You'll receive a clinical history, examine histology, order tests, and write a final report for AI-powered feedback.</p>
                        <button onClick={startNewCase} className="bg-sky-600 text-white font-semibold py-2.5 px-8 rounded-lg hover:bg-sky-700 transition-colors shadow-sm">Start New Case</button>
                    </div>
                </Card>
            )}

            {caseData && (
                <>
                    <StepCard title="1. Clinical History" isCompleted={currentState !== 'clinical'}>
                        <p className="text-slate-700">{caseData.case_tutorial.clinicalVignette}</p>
                        {currentState === 'clinical' && (
                            <div className="text-center mt-6">
                                <button onClick={() => setCurrentState('histology')} className="bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors">View Histology</button>
                            </div>
                        )}
                    </StepCard>
                    
                    {currentState !== 'clinical' && (
                        <StepCard title="2. Histologic Examination" isCompleted={currentState !== 'histology'}>
                            {(() => {
                                const histologyImage = histologyImageMap[caseData.topic] ?? defaultHistologyImage;
                                return (
                                    <figure className="w-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                                        <img
                                            src={histologyImage.src}
                                            alt={histologyImage.alt}
                                            className="w-full h-72 object-cover"
                                            loading="lazy"
                                        />
                                        <figcaption className="text-sm text-slate-600 px-4 py-2 bg-white border-t border-slate-200">
                                            {histologyImage.caption}
                                        </figcaption>
                                    </figure>
                                );
                            })()}
                            <div className="mt-4">
                                <WSIViewer />
                            </div>
                            <p className="text-slate-700 mt-4">{caseData.case_tutorial.caseDiscussion}</p>
                             {currentState === 'histology' && (
                                <div className="text-center mt-6">
                                    <button onClick={() => setCurrentState('ancillaries')} className="bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors">Order Ancillary Tests</button>
                                </div>
                            )}
                        </StepCard>
                    )}
                    
                    {['ancillaries', 'reporting', 'feedback'].includes(currentState) && (
                        <StepCard title="3. Ancillary Studies" isCompleted={currentState !== 'ancillaries'}>
                             <p className="text-slate-700 mb-4">Select the most appropriate ancillary tests to confirm your diagnosis or rule out mimics.</p>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {ancillaryTests.map(test => (
                                    <label key={test.id} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${selectedAncillaries.includes(test.id) ? 'bg-sky-100 border-sky-400' : 'bg-white border-slate-300'}`}>
                                        <input type="checkbox" checked={selectedAncillaries.includes(test.id)} onChange={() => handleAncillaryToggle(test.id)} className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                                        <span className="ml-3 text-sm font-medium text-slate-800">{test.name}</span>
                                    </label>
                                ))}
                             </div>
                              {currentState === 'ancillaries' && (
                                <div className="text-center mt-6">
                                    <button onClick={() => setCurrentState('reporting')} className="bg-sky-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-sky-700 transition-colors">View Results & Write Report</button>
                                </div>
                            )}
                        </StepCard>
                    )}
                    
                    {['reporting', 'feedback'].includes(currentState) && (
                         <StepCard title="4. Final Report" isCompleted={currentState !== 'reporting'}>
                            <div className="mb-4">
                                <h3 className="font-semibold text-slate-800">Ancillary Results:</h3>
                                <ul className="list-disc list-inside text-slate-700 mt-2">
                                    {selectedAncillaries.length > 0 
                                     ? ancillaryTests.filter(t => selectedAncillaries.includes(t.id)).map(t => <li key={t.id}>{t.resultText}</li>)
                                     : <li>No tests ordered.</li>
                                    }
                                </ul>
                            </div>
                            <textarea value={userReport} onChange={(e) => setUserReport(e.target.value)} rows={8}
                                      className="w-full p-3 border-2 border-sky-500 rounded-lg focus:ring-sky-600 focus:border-sky-600 transition shadow-sm"
                                      placeholder="Write your final report here (e.g., Final Diagnosis, Comment)..." />
                            {currentState === 'reporting' && (
                                <div className="text-center mt-6">
                                    <button onClick={handleSubmitForFeedback} disabled={!userReport || isLoadingFeedback}
                                            className="bg-teal-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-teal-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                                        {isLoadingFeedback ? "Getting Feedback..." : "Submit for Feedback"}
                                    </button>
                                </div>
                            )}
                        </StepCard>
                    )}

                    {currentState === 'feedback' && (
                        <Card>
                             <div className="flex items-start">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center mr-4">
                                    <LightbulbIcon className="h-6 w-6 text-sky-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold font-serif text-slate-900 mb-3">Virtual Attending Feedback</h2>
                                    {isLoadingFeedback ? <LoadingSpinner text="Generating feedback..." /> : 
                                     feedback ? <div className="text-slate-800 leading-relaxed">{renderMarkdown(feedback)}</div> : null
                                    }
                                </div>
                            </div>
                            <div className="text-center mt-8">
                                <button onClick={startNewCase} className="bg-slate-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-slate-700 transition-colors flex items-center mx-auto">
                                    <ArrowPathIcon className="h-5 w-5 mr-2"/>
                                    Start Another Case
                                </button>
                            </div>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};

export default SignOutSimulator;
