import React, { useState, useEffect } from 'react';
import { XCircleIcon, CodeBracketIcon, ClockIcon, ShieldCheckIcon } from '../icons.tsx';
import { GoogleGenAI } from '@google/genai';

interface CodeAuditorModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileContent?: string;
}

const mockAuditReport = `
**Gemini API Code Audit Report**

This is a simulated analysis. In a real-world scenario, this would involve sending code snippets to a specialized model for review.

*   **Overall Assessment:** The code appears to follow Gemini API best practices.

*   **Recommendations:**
    *   **API Key Management:** The use of \`process.env.API_KEY\` is correct and secure.
    *   **Model Selection:** The use of 'gemini-2.5-flash' is appropriate for this task's complexity.
    *   **Error Handling:** Consider adding a more robust \`try...catch\` block around the API call to handle potential network errors or API-specific exceptions gracefully.
`;

const CodeAuditorModal: React.FC<CodeAuditorModalProps> = ({ isOpen, onClose, fileContent }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState('');

    useEffect(() => {
        if (isOpen) {
            setIsLoading(true);
            // Simulate an API call to an audit model
            setTimeout(() => {
                setReport(mockAuditReport);
                setIsLoading(false);
            }, 1500);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const renderReport = (text: string) => {
         const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
            .replace(/\n/g, '<br />')
            .replace(/(\* .*?)(?=<br \/>|$)/g, '<li class="flex items-start"><span class="mr-2 mt-1 text-sky-600">&rarr;</span><span>$1</span></li>')
        return <ul className="space-y-2" dangerouslySetInnerHTML={{ __html: html.replace(/\* /g, '') }} />;
    }

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative bg-white w-full max-w-2xl p-8 rounded-2xl shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                 <button onClick={onClose} className="absolute top-4 right-4 text-slate-600 hover:text-slate-900"><XCircleIcon className="h-8 w-8" /></button>
                 
                 <div className="flex items-center mb-6">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-sky-100 flex items-center justify-center mr-4">
                        <CodeBracketIcon className="h-6 w-6 text-sky-600"/>
                    </div>
                    <h2 className="text-2xl font-bold font-serif text-slate-900">Gemini API Code Auditor</h2>
                </div>
                
                {isLoading ? (
                    <div className="flex items-center justify-center h-48">
                         <ClockIcon className="h-6 w-6 mr-3 animate-spin text-sky-600" />
                         <span className="text-slate-700">Analyzing code for best practices...</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center text-sm p-3 bg-teal-50 text-teal-800 border border-teal-200 rounded-lg">
                            <ShieldCheckIcon className="h-5 w-5 mr-3" />
                            <span>Analysis complete. No critical issues found.</span>
                        </div>
                        <div className="p-4 border rounded-lg bg-slate-50 text-sm text-slate-700 leading-relaxed">
                            {renderReport(report)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeAuditorModal;