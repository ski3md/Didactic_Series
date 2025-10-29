import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Alert from './ui/Alert';
import { LightbulbIcon, SparklesIcon, XCircleIcon } from './icons';
import { User, Section, CaseData } from '../types';
import { trackEvent } from '../utils/tracking';

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center">
        <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-600">Generating...</span>
    </div>
);

interface AICaseGeneratorProps {
  user: User;
}

const AICaseGenerator: React.FC<AICaseGeneratorProps> = ({ user }) => {
    const [caseData, setCaseData] = useState<CaseData | null>(null);
    const [userDx, setUserDx] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isLoadingCase, setIsLoadingCase] = useState(false);
    const [isGettingFeedback, setIsGettingFeedback] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateCase = async () => {
        setIsLoadingCase(true);
        setError(null);
        setCaseData(null);
        setFeedback(null);
        setUserDx('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const casePrompt = `
                You are a pathology professor creating a board-style case study for a resident.
                Generate a unique, realistic case of a granulomatous disease of the lung.
                Do NOT use Sarcoidosis, Tuberculosis, or Hypersensitivity Pneumonitis as the final diagnosis. Pick a less common but important entity.
                Provide a clinical history, radiologic findings, and a detailed histologic description.
                Return the output as a single, minified JSON object with no markdown formatting.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-pro',
                contents: casePrompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            clinicalHistory: { type: Type.STRING },
                            radiologicFindings: { type: Type.STRING },
                            histologicDescription: { type: Type.STRING },
                            diagnosis: { type: Type.STRING },
                        },
                        required: ["clinicalHistory", "radiologicFindings", "histologicDescription", "diagnosis"],
                    }
                }
            });
            
            const generatedCase = JSON.parse(response.text.trim()) as CaseData;
            setCaseData(generatedCase);

        } catch (e) {
            console.error(e);
            setError('Failed to generate a case. Please try again.');
        } finally {
            setIsLoadingCase(false);
        }
    };

    const handleGetFeedback = async () => {
        if (!caseData || !userDx) return;
        
        setIsGettingFeedback(true);
        setError(null);
        setFeedback(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const feedbackPrompt = `
                You are a senior pathology attending providing feedback to a resident.
                The case is as follows:
                - Clinical History: ${caseData.clinicalHistory}
                - Radiologic Findings: ${caseData.radiologicFindings}
                - Histologic Description: ${caseData.histologicDescription}
                The final diagnosis is: ${caseData.diagnosis}.

                The resident's submitted differential diagnosis and justification is: "${userDx}"

                Your task is to:
                1. First, clearly state the correct final diagnosis.
                2. Evaluate the resident's answer. If they were correct, praise them and highlight why their reasoning was good.
                3. If they were incorrect, gently correct them. Explain why their answer is less likely and what key features from the case they might have missed.
                4. Provide a brief, high-yield summary of the key diagnostic features of the correct entity.
                Keep your tone supportive and educational. Format the response using markdown for clarity (bolding with **text** and newlines).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: feedbackPrompt,
            });

            const feedbackText = response.text.trim();
            setFeedback(feedbackText);

            // Tracking
            trackEvent(
                user.username,
                Section.AI_CASE_GENERATOR,
                `case_${Date.now()}`, // unique key for the event
                {
                    caseData: caseData,
                    userDx: userDx,
                    feedback: feedbackText,
                    timestamp: Date.now()
                }
            );

        } catch (e) {
            console.error(e);
            setError('Failed to get feedback. Please try again.');
        } finally {
            setIsGettingFeedback(false);
        }
    };
    
    // A simple markdown to HTML converter for feedback
    const renderMarkdown = (text: string) => {
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
            .replace(/\n/g, '<br />'); // Newlines
        return <div className="prose prose-sm max-w-none prose-slate" dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="animate-fade-in space-y-8">
            <SectionHeader 
                title="AI-Powered Case Generator"
                subtitle="Generate unique cases and get instant feedback from a virtual attending."
            />

            <Card>
                <div className="flex flex-col items-center text-center">
                     <p className="text-slate-600 mb-4 max-w-lg">Challenge yourself with novel cases on less common entities to broaden your differential diagnosis and sharpen your skills.</p>
                    <button
                        onClick={handleGenerateCase}
                        disabled={isLoadingCase}
                        className="bg-primary-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed flex items-center shadow-sm"
                    >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {isLoadingCase ? 'Generating...' : 'Generate New Case Study'}
                    </button>
                </div>
                {isLoadingCase && <div className="mt-4"><LoadingSpinner /></div>}
            </Card>

            {error && (
                <Alert type="error">{error}</Alert>
            )}

            {caseData && (
                <div className="space-y-6 animate-fade-in">
                    <Card>
                        <h2 className="text-xl font-semibold font-serif text-slate-800 mb-3">Clinical History</h2>
                        <p className="text-slate-600 leading-relaxed">{caseData.clinicalHistory}</p>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold font-serif text-slate-800 mb-3">Radiologic Findings</h2>
                        <p className="text-slate-600 leading-relaxed">{caseData.radiologicFindings}</p>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold font-serif text-slate-800 mb-3">Histologic Description</h2>
                        <p className="text-slate-600 leading-relaxed">{caseData.histologicDescription}</p>
                    </Card>
                    <Card>
                        <h2 id="user-dx-heading" className="text-xl font-semibold font-serif text-slate-800 mb-3">Your Diagnosis</h2>
                        <p className="text-sm text-slate-500 mb-4">Provide a ranked differential diagnosis and a brief justification.</p>
                        <label htmlFor="user-dx-textarea" className="sr-only">Your Diagnosis and Justification</label>
                        <textarea
                            id="user-dx-textarea"
                            name="userDiagnosis"
                            value={userDx}
                            onChange={(e) => setUserDx(e.target.value)}
                            rows={5}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-primary-500 focus:border-primary-500 transition shadow-sm"
                            placeholder="e.g., 1. Diagnosis A - because of feature X.&#10;2. Diagnosis B - less likely due to feature Y."
                            aria-labelledby="user-dx-heading"
                        />
                        <div className="mt-6 text-center">
                            <button
                                onClick={handleGetFeedback}
                                disabled={isGettingFeedback || !userDx}
                                className="bg-green-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed shadow-sm"
                            >
                                {isGettingFeedback ? 'Getting Feedback...' : 'Submit for Feedback'}
                            </button>
                        </div>
                         {isGettingFeedback && <div className="mt-4"><LoadingSpinner /></div>}
                    </Card>
                </div>
            )}
            
            {feedback && (
                <Card className="bg-slate-50 border-slate-200 animate-fade-in">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-4">
                            <LightbulbIcon className="h-6 w-6 text-primary-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold font-serif text-slate-800 mb-3">Virtual Attending Feedback</h2>
                            <div className="text-slate-700 leading-relaxed">
                                {renderMarkdown(feedback)}
                            </div>
                        </div>
                    </div>
                </Card>
            )}

        </div>
    );
};

export default AICaseGenerator;
