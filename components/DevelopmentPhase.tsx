import React, { useState, useEffect } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Alert from './ui/Alert';
import { StoredImage } from '../types';
import { findRelevantImage } from '../utils/aiImageSelector';
import WSIViewer from './WSIViewer';

const LoadingSpinner: React.FC<{ text?: string }> = ({ text = "Loading..." }) => (
    <div className="flex items-center justify-center h-full my-4">
        <svg className="animate-spin h-5 w-5 text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="ml-3 text-slate-600">{text}</span>
    </div>
);

const DevelopmentPhase: React.FC = () => {
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
      <SectionHeader 
        title="Phase 3: Development"
        subtitle="Creating the instructional content, media, and activities."
      />

      <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-4">Comparative Job Aid: Sarcoidosis vs. Tuberculosis</h2>
        <p className="text-slate-600 mb-6">This table highlights key distinguishing features between two common entities. Use it as a quick reference at the microscope.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold rounded-l-lg">Feature</th>
                <th scope="col" className="px-6 py-4 font-semibold">Classic Finding in Sarcoidosis</th>
                <th scope="col" className="px-6 py-4 font-semibold rounded-r-lg">Classic Finding in Tuberculosis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Granuloma Type</th>
                <td className="px-6 py-4">Tightly formed, well-circumscribed, "naked" (scant lymphocytes).</td>
                <td className="px-6 py-4">Can be well-formed or poorly-formed, often confluent, prominent rim of lymphocytes.</td>
              </tr>
              <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Necrosis</th>
                <td className="px-6 py-4"><strong>Non-necrotizing</strong> ("non-caseating").</td>
                <td className="px-6 py-4"><strong>Caseating necrosis</strong> (eosinophilic, granular, acellular debris).</td>
              </tr>
              <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Distribution</th>
                <td className="px-6 py-4"><strong>Lymphangitic</strong> (along bronchovascular bundles, septa, pleura).</td>
                <td className="px-6 py-4"><strong>Apical and cavitary</strong> (typically upper lobes).</td>
              </tr>
               <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Associated Findings</th>
                <td className="px-6 py-4">Schaumann bodies, Asteroid bodies.</td>
                <td className="px-6 py-4">Acid-fast bacilli (AFB) visible with special stain.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-4">Interactive Case Study: "The Bird Fancier's Cough"</h2>
        
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-lg font-serif text-slate-800 mb-2">Part 1: Clinical & Radiologic Data</h3>
                <p className="text-slate-600">{caseText.clinical}</p>
            </div>
             <div>
                <h3 className="font-bold text-lg font-serif text-slate-800 mb-2">Part 2: Histologic Findings</h3>
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
                    <p className="text-slate-600 flex-1 pt-2">{caseText.histology}</p>
                </div>
            </div>
             <div>
                <h3 className="font-bold text-lg font-serif text-slate-800 mb-2">Part 3: The Diagnostic Task</h3>
                <p className="text-slate-600 mb-4">Given the integrated clinical, radiologic, and histologic findings, construct a ranked differential diagnosis. Justify your top two choices.</p>
                <button 
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="bg-primary-600 text-white font-medium py-2 px-5 rounded-lg hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 transition-colors shadow-sm">
                    {showAnswer ? 'Hide Expert Answer' : 'Reveal Expert Answer'}
                </button>

                {showAnswer && (
                    <div className="mt-6 space-y-4 animate-fade-in">
                      <Alert type="success" title="1. Hypersensitivity Pneumonitis (Subacute/Chronic)">
                        <strong>Justification:</strong> This is the leading diagnosis. The clinical history (pigeon keeping), radiology (ground-glass, centrilobular nodules), and histology (cellular interstitial pneumonia, bronchiolocentric distribution, poorly-formed non-necrotizing granulomas) align perfectly.
                      </Alert>
                      <Alert type="info" title="2. Sarcoidosis">
                        <strong>Justification:</strong> This is on the differential but less likely. In sarcoidosis, granulomas are typically well-formed and tight with a lymphangitic distribution, which is discordant with this case.
                      </Alert>
                    </div>
                )}
            </div>
        </div>
      </Card>
    </div>
  );
};

export default DevelopmentPhase;