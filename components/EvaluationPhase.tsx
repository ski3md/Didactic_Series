import React, { useState } from 'react';
import Card from './Card';
import { CheckCircleIcon, XCircleIcon } from './icons';
import WSIViewer from './WSIViewer'; // Import the new component

const EvaluationPhase: React.FC = () => {
    const [challenge1Answer, setChallenge1Answer] = useState<string | null>(null);
    const [challenge2Answer, setChallenge2Answer] = useState<string | null>(null);

    const handleChallenge1 = (choice: string) => !challenge1Answer && setChallenge1Answer(choice);
    const handleChallenge2 = (choice: string) => !challenge2Answer && setChallenge2Answer(choice);
    
    // Using real, public DZI URLs for pathology slides to create a more authentic challenge.
    // Slide A (HP) shows a more diffuse, cellular pattern.
    const challenge1_HP_DziUrl = "https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1.svs.dzi";
    // Slide B (Sarcoidosis) shows more discrete, nodular granulomas.
    const challenge1_Sarc_DziUrl = "https://openseadragon.github.io/example-images/aperio/aperio.dzi";
    
    // These are repeated for the second challenge, but in a real scenario would point to slides
    // specifically chosen to highlight distribution patterns.
    const challenge2_HP_DziUrl = "https://openslide.cs.cmu.edu/download/openslide-testdata/Aperio/CMU-1.svs.dzi";
    const challenge2_Sarc_DziUrl = "https://openseadragon.github.io/example-images/aperio/aperio.dzi";


  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Visual Discrimination Challenge</h1>
        <p className="mt-2 text-md text-slate-600">Sharpening your eye for Sarcoidosis vs. Hypersensitivity Pneumonitis.</p>
      </header>

      <Card>
        <p className="text-slate-600 mb-6">This activity forces a direct, side-by-side comparison of key visual features. Pan and zoom on each digital slide to find the key features, then make your choice.</p>
        
        {/* Challenge 1 */}
        <div className="mb-10 pb-8 border-b border-slate-200">
            <h3 className="font-semibold text-lg text-slate-700 mb-3">Challenge 1: Granuloma Quality</h3>
            <p className="mb-4">Which slide shows the <strong>'tightly-formed, well-circumscribed'</strong> granuloma typical of Sarcoidosis?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="font-medium text-center mb-2 text-slate-700">Slide A</p>
                    <WSIViewer dziUrl={challenge1_HP_DziUrl} />
                </div>
                <div>
                    <p className="font-medium text-center mb-2 text-slate-700">Slide B</p>
                    <WSIViewer dziUrl={challenge1_Sarc_DziUrl} />
                </div>
            </div>
            <div className="mt-4 flex justify-center gap-4">
                <button onClick={() => handleChallenge1('A')} disabled={!!challenge1Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Select Slide A
                </button>
                <button onClick={() => handleChallenge1('B')} disabled={!!challenge1Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Select Slide B
                </button>
            </div>
             {challenge1Answer && (
                <div className="mt-4">
                    {challenge1Answer === 'A' && (
                        <div className="p-3 rounded text-red-800 bg-red-50 border border-red-200 flex items-start">
                             <XCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                             <p><strong>Slide A (Incorrect):</strong> This slide represents a 'poorly-formed' granuloma typical of HP. Notice how the cells are loosely aggregated and blend into the surrounding inflammation.</p>
                        </div>
                    )}
                     {challenge1Answer === 'B' && (
                        <div className="p-3 rounded text-green-800 bg-green-50 border border-green-200 flex items-start">
                           <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                           <p><strong>Slide B (Correct):</strong> Notice the sharp borders and how the epithelioid histiocytes are tightly packed together. This is a classic 'sarcoidal' granuloma.</p>
                        </div>
                    )}
                </div>
             )}
        </div>

        {/* Challenge 2 */}
        <div>
            <h3 className="font-semibold text-lg text-slate-700 mb-3">Challenge 2: Architectural Distribution</h3>
            <p className="mb-4">Which slide shows the <strong>'lymphangitic distribution'</strong> typical of Sarcoidosis?</p>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p className="font-medium text-center mb-2 text-slate-700">Slide A</p>
                    <WSIViewer dziUrl={challenge2_HP_DziUrl} />
                </div>
                <div>
                    <p className="font-medium text-center mb-2 text-slate-700">Slide B</p>
                    <WSIViewer dziUrl={challenge2_Sarc_DziUrl} />
                </div>
            </div>
             <div className="mt-4 flex justify-center gap-4">
                <button onClick={() => handleChallenge2('A')} disabled={!!challenge2Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Select Slide A
                </button>
                <button onClick={() => handleChallenge2('B')} disabled={!!challenge2Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-md font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed">
                    Select Slide B
                </button>
            </div>
            {challenge2Answer && (
                <div className="mt-4">
                    {challenge2Answer === 'A' && (
                         <div className="p-3 rounded text-red-800 bg-red-50 border border-red-200 flex items-start">
                            <XCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                             <p><strong>Slide A (Incorrect):</strong> This represents a 'bronchiolocentric' pattern, a key feature of HP. The inflammation is centered on the small airways.</p>
                        </div>
                    )}
                     {challenge2Answer === 'B' && (
                         <div className="p-3 rounded text-green-800 bg-green-50 border border-green-200 flex items-start">
                            <CheckCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                             <p><strong>Slide B (Correct):</strong> This represents a lymphangitic distribution. The granulomas are following the lung's lymphatic drainage routes along the bronchovascular bundles and septa.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
      </Card>
      
       <Card>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">High-Yield Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-3 rounded-l-lg">Feature</th>
                <th scope="col" className="px-6 py-3">Sarcoidosis</th>
                <th scope="col" className="px-6 py-3 rounded-r-lg">Hypersensitivity Pneumonitis</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Quality</th>
                <td className="px-6 py-4">Tight, Well-Formed, "Naked"</td>
                <td className="px-6 py-4">Loose, Poorly-Formed, Cellular</td>
              </tr>
              <tr className="bg-slate-50">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Location</th>
                <td className="px-6 py-4">Lymphangitic (along bundles)</td>
                <td className="px-6 py-4">Bronchiolocentric (around airways)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default EvaluationPhase;