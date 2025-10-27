
import React, { useState } from 'react';
import Card from './Card';

const CaseStudy: React.FC = () => {
    const [showAnswer, setShowAnswer] = useState(false);

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Interactive Case Study</h1>
        <p className="mt-2 text-md text-slate-600">Applying knowledge to a clinical scenario.</p>
      </header>

       <Card>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">Case: "The Bird Fancier's Cough"</h2>
        
        <div className="space-y-4">
            <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Part 1: Clinical & Radiologic Data</h3>
                <p className="text-slate-600">You receive a lung wedge biopsy from a 55-year-old man with a 6-month history of progressive shortness of breath and a dry cough. He is a non-smoker but has kept pigeons in his attic for over 20 years. A chest CT shows diffuse, bilateral ground-glass opacities with centrilobular nodules.</p>
            </div>
             <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Part 2: Histologic Findings</h3>
                <div className="flex items-start gap-4">
                     <img src="https://picsum.photos/seed/pathology1/200/150" alt="Histology slide" className="rounded-lg shadow-md mt-1" />
                    <p className="text-slate-600 flex-1">The biopsy shows a cellular interstitial pneumonia. There are numerous small, poorly-formed granulomas centered on the bronchioles (bronchiolocentric). The granulomas are composed of loose collections of epithelioid histiocytes and multinucleated giant cells. There is no necrosis. The surrounding interstitium is expanded by a dense lymphoplasmacytic infiltrate, and scattered eosinophils are present. You also note foci of organizing pneumonia.</p>
                </div>
            </div>
             <div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Part 3: The Diagnostic Task</h3>
                <p className="text-slate-600 mb-4">Given the integrated clinical, radiologic, and histologic findings, construct a ranked differential diagnosis. Justify your top two choices.</p>
                <button 
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
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
