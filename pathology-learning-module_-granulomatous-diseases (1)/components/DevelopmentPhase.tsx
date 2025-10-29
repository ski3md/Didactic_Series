import React, { useState } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Alert from './ui/Alert';

const DevelopmentPhase: React.FC = () => {
    const [showAnswer, setShowAnswer] = useState(false);

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
                <p className="text-slate-600">You receive a lung wedge biopsy from a 55-year-old man with a 6-month history of progressive shortness of breath and a dry cough. He is a non-smoker but has kept pigeons in his attic for over 20 years. A chest CT shows diffuse, bilateral ground-glass opacities with centrilobular nodules.</p>
            </div>
             <div>
                <h3 className="font-bold text-lg font-serif text-slate-800 mb-2">Part 2: Histologic Findings</h3>
                <div className="flex flex-col sm:flex-row items-start gap-6">
                     <img src="https://picsum.photos/seed/pathology1/400/300" alt="Histology slide of hypersensitivity pneumonitis" className="rounded-lg shadow-md mt-1 w-full sm:w-48" />
                    <p className="text-slate-600 flex-1">The biopsy shows a cellular interstitial pneumonia. There are numerous small, poorly-formed granulomas centered on the bronchioles (bronchiolocentric). The granulomas are composed of loose collections of epithelioid histiocytes and multinucleated giant cells. There is no necrosis. The surrounding interstitium is expanded by a dense lymphoplasmacytic infiltrate, and scattered eosinophils are present. You also note foci of organizing pneumonia.</p>
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
