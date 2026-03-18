import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import Card from './Card';
import { LightbulbIcon, XCircleIcon } from './icons';

interface CaseData {
    clinicalHistory: string;
    radiologicFindings: string;
    histologicDescription: string;
    diagnosis: string;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex items-center justify-center">
        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-600">Generating...</span>
    </div>
);

const AICaseGenerator: React.FC = () => {
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
            
            const generatedCase = JSON.parse(response.text) as CaseData;
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
                Keep your tone supportive and educational. Format the response using markdown for clarity.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: feedbackPrompt,
            });

            setFeedback(response.text);

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
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="animate-fade-in space-y-8">
            <header>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">AI-Powered Case Generator</h1>
                <p className="mt-2 text-md text-slate-600">Generate unique cases and get instant feedback from a virtual attending.</p>
            </header>

            <Card>
                <div className="flex justify-center">
                    <button
                        onClick={handleGenerateCase}
                        disabled={isLoadingCase}
                        className="bg-blue-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                        {isLoadingCase ? 'Generating...' : 'Generate New Case Study'}
                    </button>
                </div>
                {isLoadingCase && <div className="mt-4"><LoadingSpinner /></div>}
            </Card>

            {error && (
                <Card className="bg-red-50 border-red-300">
                    <div className="flex items-center text-red-800">
                        <XCircleIcon className="h-5 w-5 mr-3" />
                        <p className="font-medium">{error}</p>
                    </div>
                </Card>
            )}

            {caseData && (
                <div className="space-y-6">
                    <Card>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">Clinical History</h2>
                        <p className="text-slate-600 leading-relaxed">{caseData.clinicalHistory}</p>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">Radiologic Findings</h2>
                        <p className="text-slate-600 leading-relaxed">{caseData.radiologicFindings}</p>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">Histologic Description</h2>
                        <p className="text-slate-600 leading-relaxed">{caseData.histologicDescription}</p>
                    </Card>
                    <Card>
                        <h2 className="text-xl font-semibold text-slate-800 mb-3">Your Diagnosis</h2>
                        <p className="text-sm text-slate-500 mb-4">Provide a ranked differential diagnosis and a brief justification.</p>
                        <textarea
                            value={userDx}
                            onChange={(e) => setUserDx(e.target.value)}
                            rows={5}
                            className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="e.g., 1. Diagnosis A - because of feature X.&#10;2. Diagnosis B - less likely due to feature Y."
                        />
                        <div className="mt-4 text-center">
                            <button
                                onClick={handleGetFeedback}
                                disabled={isGettingFeedback || !userDx}
                                className="bg-green-600 text-white font-medium py-2 px-6 rounded-lg hover:bg-green-700 transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
                            >
                                {isGettingFeedback ? 'Getting Feedback...' : 'Submit for Feedback'}
                            </button>
                        </div>
                         {isGettingFeedback && <div className="mt-4"><LoadingSpinner /></div>}
                    </Card>
                </div>
            )}
            
            {feedback && (
                <Card className="bg-slate-50 border-slate-200">
                    <div className="flex items-start">
                        <LightbulbIcon className="h-8 w-8 text-blue-500 mr-4 flex-shrink-0 mt-1" />
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-3">Virtual Attending Feedback</h2>
                            <div className="text-slate-700 leading-relaxed prose">
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
