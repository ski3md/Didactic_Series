import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import { getAllUserData } from '../utils/tracking';
import { UserActivity, QuizAnswer, AICaseLog } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';

const AdminView: React.FC = () => {
    const [userData, setUserData] = useState<Record<string, UserActivity>>({});
    const [selectedUser, setSelectedUser] = useState<string | null>(null);

    useEffect(() => {
        setUserData(getAllUserData());
    }, []);
    
    const toggleUser = (username: string) => {
        setSelectedUser(selectedUser === username ? null : username);
    };

    const users = Object.keys(userData);

    return (
        <div className="animate-fade-in">
            <SectionHeader
                title="Admin Dashboard"
                subtitle={`Tracking responses from ${users.length} user(s).`}
            />

            {users.length === 0 ? (
                <Card><p className="text-slate-500 text-center">No user data has been recorded yet.</p></Card>
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
                                    
                                    {userData[username].AnalysisPhase && <QuizDataDisplay title="Analysis Phase Quiz" data={userData[username].AnalysisPhase!} />}
                                    {userData[username].AssessmentPhase && <QuizDataDisplay title="Assessment Phase Quiz" data={{ 'Final Question': userData[username].AssessmentPhase! }} />}
                                    {userData[username].VisualChallenge && <QuizDataDisplay title="Visual Challenge" data={userData[username].VisualChallenge!} />}
                                    {userData[username].DiagnosticPathway && <QuizDataDisplay title="Diagnostic Pathway" data={userData[username].DiagnosticPathway!} />}
                                    {userData[username].AICaseGenerator && <AIDataDisplay title="AI Case Generator" data={userData[username].AICaseGenerator!} />}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const QuizDataDisplay: React.FC<{ title: string; data: Record<string, QuizAnswer> }> = ({ title, data }) => (
    <Card className="!shadow-md !mb-0 border border-slate-200 bg-slate-50/50">
        <h3 className="text-lg font-semibold font-serif text-slate-800 mb-4">{title}</h3>
        <ul className="space-y-4">
            {Object.entries(data).map(([key, answer]) => (
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
            ))}
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
