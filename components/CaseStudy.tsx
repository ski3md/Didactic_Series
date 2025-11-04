import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import WSIViewer from './WSIViewer';
import { findRelevantImage } from '../utils/aiImageSelector';
import { StoredImage } from '../types';

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center h-full">
        <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-600">{text}</span>
    </div>
);


const CaseStudy: React.FC = () => {
    const [showAnswer, setShowAnswer] = useState(false);
    const [caseImage, setCaseImage] = useState<StoredImage | null>(null);
    const [isFindingImage, setIsFindingImage] = useState(true);

    const caseText = {
        clinical: "You receive a lung wedge biopsy from a 55-year-old man with a 6-month history of progressive shortness of breath and a dry cough. He is a non-smoker but has kept pigeons in his attic for over 20 years. A chest CT shows diffuse, bilateral ground-glass opacities with centrilobular nodules.",
        histology: "The biopsy shows a cellular interstitial pneumonia. There are numerous small, poorly-formed granulomas centered on the bronchioles (bronchiolocentric). The granulomas are composed of loose collections of epithelioid histiocytes and multinucleated giant cells. There is no necrosis. The surrounding interstitium is expanded by a dense lymphoplasmacytic infiltrate, and scattered eosinophils are present. You also note foci of organizing pneumonia."
    };
    
    useEffect(() => {
        const fetchImage = async () => {
            setIsFindingImage(true);
            const context = `The case is about Hypersensitivity Pneumonitis. ${caseText.clinical} ${caseText.histology}`;
            const image = await findRelevantImage(context);
            setCaseImage(image);
            setIsFindingImage(false);
        };
        fetchImage();
    }, []);

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Interactive Case Study</h1>
        <p className="mt-2 text-md text-slate-600">Applying knowledge to a clinical scenario.</p>
      </header>

       <Card>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Case: "The Bird Fancier's Cough"</h2>
        
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Part 1: Clinical & Radiologic Data</h3>
                <p className="text-slate-600">{caseText.clinical}</p>
            </div>
             <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Part 2: Histologic Findings</h3>
                 <div className="space-y-3">
                    {isFindingImage ? (
                         <div className="w-full h-64 sm:h-96 bg-slate-100 rounded-lg shadow-md flex items-center justify-center">
                            <LoadingSpinner text="Finding relevant image..." />
                         </div>
                    ) : (
                        <WSIViewer 
                            staticImageUrl={caseImage?.src} 
                            altText={caseImage?.title || 'AI-selected image for the case study.'} 
                        />
                    )}
                    {caseImage && (
                         <p className="text-center text-sm text-slate-600 font-semibold italic">
                            AI-selected image from gallery: "{caseImage.title}"
                        </p>
                    )}
                    {!isFindingImage && !caseImage && (
                         <div className="bg-sky-50 p-4 rounded-md border border-sky-200 text-sm text-sky-800">
                           <p>No relevant image was found in the galleries for this case. You can upload one in the Image Galleries section!</p>
                         </div>
                    )}
                    <p className="text-slate-600 flex-1 pt-2">{caseText.histology}</p>
                </div>
            </div>
             <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Part 3: The Diagnostic Task</h3>
                <p className="text-slate-600 mb-4">Given the integrated clinical, radiologic, and histologic findings, construct a ranked differential diagnosis. Justify your top two choices.</p>
                <button 
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="bg-primary-600 text-white font-medium py-2 px-5 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                    {showAnswer ? 'Hide Expert Answer' : 'Reveal Expert Answer'}
                </button>

                {showAnswer && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg animate-fade-in">
                        <h4 className="font-bold text-slate-800 mb-2">Expert's Answer:</h4>
                        <div className="space-y-3">
                            <div>
                                <p className="font-semibold text-green-700">1. Hypersensitivity Pneumonitis (Subacute/Chronic)</p>
                                <p className="text-slate-600 text-sm"><strong>Justification:</strong> This is the leading diagnosis. The clinical history (pigeon keeping), radiology (ground-glass, centrilobular nodules), and histology (cellular interstitial pneumonia, bronchiolocentric distribution, poorly-formed non-necrotizing granulomas) align perfectly.</p>
                            </div>
                            <div>
                                <p className="font-semibold text-orange-700">2. Sarcoidosis</p>
                                <p className="text-slate-600 text-sm"><strong>Justification:</strong> This is on the differential but less likely. In sarcoidosis, granulomas are typically well-formed and tight with a lymphangitic distribution, which is discordant with this case.</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default CaseStudy;
