import React, { useState } from 'react';
import Card from '../ui/Card.tsx';
import Alert from '../ui/Alert.tsx';
import { SparklesIcon, ArrowPathIcon } from '../icons.tsx';
import { generateCaseMappings } from '../../utils/caseGenerator.ts';

export const AdminImagePanel: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationResult, setGenerationResult] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateCases = async () => {
        setIsGenerating(true);
        setGenerationResult(null);
        setError(null);
        try {
            const result = await generateCaseMappings();
            setGenerationResult(`Case generation complete. ${result.casesCreated} created, ${result.casesUpdated} updated. Total cases: ${result.totalCases}.`);
        } catch (err: any) {
            console.error("Case generation failed:", err);
            setError(`An error occurred during case generation: ${err.message}`);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Card>
            <div className="flex items-center mb-4">
                <SparklesIcon className="h-6 w-6 mr-3 text-sky-600" />
                <h2 className="text-xl font-semibold font-serif text-slate-900">AI-Powered Case Authoring</h2>
            </div>
            <p className="text-slate-700 mb-6 text-sm">
                This tool uses the Gemini API to analyze all images in the gallery, enrich them with metadata, and automatically generate corresponding case studies for the "Sign-Out Simulator". This process can take a few moments.
            </p>
            
            {error && <Alert type="error" className="mb-4">{error}</Alert>}
            {generationResult && <Alert type="success" className="mb-4">{generationResult}</Alert>}

            <button
                onClick={handleGenerateCases}
                disabled={isGenerating}
                className="w-full flex items-center justify-center bg-sky-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 transition-all duration-200 shadow-sm hover:shadow-md disabled:bg-slate-400"
            >
                {isGenerating ? (
                    <>
                        <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                        Generating Cases...
                    </>
                ) : (
                    <>
                        <SparklesIcon className="h-5 w-5 mr-2" />
                        Run Case Generator
                    </>
                )}
            </button>
        </Card>
    );
};

export const ImagePlaceholder: React.FC<{ id: string; className?: string }> = ({ id, className }) => {
  return (
    <div className={`bg-slate-200 border rounded-lg flex items-center justify-center ${className}`}>
      <div className="text-center">
        <p className="text-slate-500">Image Placeholder</p>
        <p className="text-xs text-slate-400 font-mono">{id}</p>
      </div>
    </div>
  );
};