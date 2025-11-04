import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import { getAllUserData } from '../utils/tracking';
import { UserActivity, QuizAnswer, AICaseLog } from '../types';
import { CheckCircleIcon, XCircleIcon, SparklesIcon } from './icons';
import { generateCaseMappings } from '../utils/caseGenerator';
import Alert from './ui/Alert';

const AdminView: React.FC = () => {
    const [userData, setUserData] = useState<Record<string, UserActivity>>({});
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState<string | null>(null);
    const [generationError, setGenerationError] = useState<string | null>(null);

    useEffect(() => {
        setUserData(getAllUserData());
    }, []);
    
    const toggleUser = (username: string) => {
        setSelectedUser(selectedUser === username ? null : username);
    };

    const handleGenerateCases = async () => {
        setIsGenerating(true);
        setGenerationResult(null);
        setGenerationError(null);
        try {
            const result = await generateCaseMappings();
            setGenerationResult(`Case mapping complete. ${result.casesCreated} new cases created, ${result.casesUpdated} cases updated. A total of ${result.totalCases} cases are now in the library.`);
        } catch(e: any) {
            console.error("Case generation failed", e);
            setGenerationError(`Failed to generate cases: ${e.message}`);
        } finally {
            setIsGenerating(false);
        }
    }

    const users = Object.keys(userData);

    return (
        <div className="animate-fade-in">
            <SectionHeader
                title="Admin Dashboard"
                subtitle="Manage module data and user activity."
            />

            <Card>
                <h2 className="text-xl font-semibold font-serif text-slate-800 mb-4">Case Management</h2>
                <p className="text-slate-600 text-sm mb-4">
                    Use the button below to automatically generate case studies. This process will:
                </p>
                 <ul className="list-disc list-inside text-sm text-slate-600 mb-6 space-y-1">
                    <li>Scan all images in the Official and Community galleries.</li>
                    <li>Use Gemini AI to analyze image titles and descriptions to determine the disease entity and difficulty.</li>
                    <li>Group related images together to form new cases or update existing ones.</li>
                    <li>Generate detailed case study data for the new "Case Library" section.</li>
                </ul>
                
                {generationResult && <Alert type="success">{generationResult}</Alert>}
                {generationError && <Alert type="error">{generationError}</Alert>}
                
                <div className="text-center mt-4">
                    <button 
                        onClick={handleGenerateCases}
                        disabled={isGenerating}
                        className="bg-primary-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-primary-700 transition-colors disabled:bg-slate-400 flex items-center justify-center mx-auto"
                    >
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        {isGenerating ? 'Generating Cases...' : 'Generate & Update Case Library'}
                    </button>
                </div>
            </Card>

            <Card>
                 <h2 className="text-xl font-semibold font-serif text-slate-800 mb-4">User Activity</h2>
                 <p className="text-slate-600 text-sm mb-4">
                    Tracking responses from {users.length} user(s). Click on a user to expand their activity log.
                </p>
                {users.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No user data has been recorded yet.</p>
                ) : (
                    <div className="space-y-4">
                        {users.map(username => (
                            <div key={username} className="border border-slate-200 rounded-lg overflow-hidden">
                                <button
                                    onClick={() => toggleUser(username)}
                                    className="w-full text-left p-4 bg-slate-50 hover:bg-slate-100 transition-colors flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                                    aria-expanded={selectedUser === username}
                                    aria-controls={`user-data-${username}`}
                                >
                                    <span className="font-semibold text-slate-800">{username}</span>
                                    <span className={`transform transition-transform duration-200 ${selectedUser === username ? 'rotate-180' : ''}`}>
                                        <svg className="h-5 w-5 text-slate-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </button>
                                {selectedUser === username && (
                                    <div id={`user-data-${username}`} className="p-4 sm:p-6 bg-white space-y-6">
                                        {Object.keys(userData[username]).length === 0 && <p>No activity recorded for this user.</p>}
                                        
                                        {userData[username].Analysis && <QuizDataDisplay title="Analysis Phase Quiz" data={userData[username].Analysis!} />}
                                        {userData[username].Evaluation && <QuizDataDisplay title="Evaluation Phase Quiz" data={{ 'Final Question': userData[username].Evaluation! }} />}
                                        {userData[username].VisualChallenge && <QuizDataDisplay title="Visual Challenge" data={userData[username].VisualChallenge!} />}
                                        {userData[username].DiagnosticPathway && <QuizDataDisplay title="Diagnostic Pathway" data={userData[username].DiagnosticPathway!} />}
                                        {userData[username].AICaseGenerator && <AIDataDisplay title="AI Case Generator" data={userData[username].AICaseGenerator!} />}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
};

const QuizDataDisplay: React.FC<{ title: string; data: Record<string, QuizAnswer> }> = ({ title, data }) => (
    <Card className="!shadow-md !mb-0 border border-slate-200 bg-slate-50/50">
        <h3 className="text-lg font-semibold font-serif text-slate-800 mb-4">{title}</h3>
        <ul className="space-y-4">
            {/* Fix: Changed from Object.entries to Object.keys to ensure proper type inference for 'answer'. */}
            {Object.keys(data).map((key) => {
                const answer = data[key];
                return (
                    <li key={key} className="p-3 bg-white rounded-md border border-slate-200">
                        <p className="font-semibold text-sm text-slate-700">{answer.question}</p>
                        <div className="flex items-center mt-2">
                            {answer.isCorrect
                                ? <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                                : <XCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                            }
                            <p className="text-sm text-slate-600">Answered: <span className="font-medium">{answer.selectedAnswer}</span></p>
                        </div>
                    </li>
                );
            })}
        </ul>
    </Card>
);

const AIDataDisplay: React.FC<{ title: string; data: AICaseLog[] }> = ({ title, data }) => (
     <Card className="!shadow-md !mb-0 border border-slate-200 bg-slate-50/50">
        <h3 className="text-lg font-semibold font-serif text-slate-800 mb-4">{title}</h3>
        <div className="space-y-6">
            {data.map((log, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-slate-200">
                    <h4 className="font-semibold text-md text-slate-700 mb-3 pb-2 border-b">Case #{index + 1} - Diagnosis: <span className="font-bold">{log.caseData.diagnosis}</span></h4>
                    <div className="space-y-3 text-sm">
                        <div><strong className="text-slate-600">Clinical:</strong> <p className="text-slate-500 italic mt-1">{log.caseData.clinicalHistory}</p></div>
                        <div><strong className="text-slate-600">User's Diagnosis:</strong> <p className="text-slate-500 italic mt-1">{log.userDx}</p></div>
                        <div><strong className="text-slate-600">AI Feedback:</strong> <p className="text-slate-500 italic mt-1">{log.feedback}</p></div>
                    </div>
                </div>
            ))}
        </div>
    </Card>
);


export default AdminView;
