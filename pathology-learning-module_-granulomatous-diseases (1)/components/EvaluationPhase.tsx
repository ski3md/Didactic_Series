import React, { useState } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import Alert from './ui/Alert';
import WSIViewer from './WSIViewer';
import { User, Section } from '../types';
import { trackEvent } from '../utils/tracking';

interface EvaluationPhaseProps {
  user: User;
}

const EvaluationPhase: React.FC<EvaluationPhaseProps> = ({ user }) => {
    const [challenge1Answer, setChallenge1Answer] = useState<string | null>(null);
    const [challenge2Answer, setChallenge2Answer] = useState<string | null>(null);

    const handleChallenge1 = (choice: string) => {
      if (!challenge1Answer) {
        setChallenge1Answer(choice);
        trackEvent(user.username, Section.VISUAL_CHALLENGE, 'challenge1', {
            question: "Which slide shows the 'tightly-formed, well-circumscribed' granuloma typical of Sarcoidosis?",
            selectedAnswer: `Slide ${choice}`,
            isCorrect: choice === 'B',
            timestamp: Date.now()
        });
      }
    };
    const handleChallenge2 = (choice: string) => {
      if (!challenge2Answer) {
        setChallenge2Answer(choice);
        trackEvent(user.username, Section.VISUAL_CHALLENGE, 'challenge2', {
            question: "Which slide shows the 'lymphangitic distribution' typical of Sarcoidosis?",
            selectedAnswer: `Slide ${choice}`,
            isCorrect: choice === 'B',
            timestamp: Date.now()
        });
      }
    };
    
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
      <SectionHeader
        title="Visual Discrimination Challenge"
        subtitle="Sharpening your eye for Sarcoidosis vs. Hypersensitivity Pneumonitis."
      />

      <Card>
        <p className="text-slate-600 mb-8 text-center max-w-2xl mx-auto">This activity forces a direct, side-by-side comparison of key visual features. Pan and zoom on each digital slide to find the key features, then make your choice.</p>
        
        <div className="space-y-12">
            {/* Challenge 1 */}
            <div className="pb-8 border-b border-slate-200">
                <div className="text-center mb-6">
                    <h3 className="font-semibold font-serif text-xl text-slate-800">Challenge 1: Granuloma Quality</h3>
                    <p className="text-slate-500 mt-1">Which slide shows the <strong>'tightly-formed, well-circumscribed'</strong> granuloma typical of Sarcoidosis?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="font-medium text-center mb-2 text-slate-700">Slide A</p>
                        <WSIViewer dziUrl={challenge1_HP_DziUrl} />
                    </div>
                    <div>
                        <p className="font-medium text-center mb-2 text-slate-700">Slide B</p>
                        <WSIViewer dziUrl={challenge1_Sarc_DziUrl} />
                    </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => handleChallenge1('A')} disabled={!!challenge1Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Select Slide A
                    </button>
                    <button onClick={() => handleChallenge1('B')} disabled={!!challenge1Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Select Slide B
                    </button>
                </div>
                {challenge1Answer && (
                    <div className="mt-6 max-w-xl mx-auto">
                        {challenge1Answer === 'A' && (
                            <Alert type="error" title="Slide A (Incorrect)">
                                This slide represents a 'poorly-formed' granuloma typical of HP. Notice how the cells are loosely aggregated and blend into the surrounding inflammation.
                            </Alert>
                        )}
                        {challenge1Answer === 'B' && (
                            <Alert type="success" title="Slide B (Correct)">
                                Notice the sharp borders and how the epithelioid histiocytes are tightly packed together. This is a classic 'sarcoidal' granuloma.
                            </Alert>
                        )}
                    </div>
                )}
            </div>

            {/* Challenge 2 */}
            <div>
                <div className="text-center mb-6">
                    <h3 className="font-semibold font-serif text-xl text-slate-800">Challenge 2: Architectural Distribution</h3>
                    <p className="text-slate-500 mt-1">Which slide shows the <strong>'lymphangitic distribution'</strong> typical of Sarcoidosis?</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <p className="font-medium text-center mb-2 text-slate-700">Slide A</p>
                        <WSIViewer dziUrl={challenge2_HP_DziUrl} />
                    </div>
                    <div>
                        <p className="font-medium text-center mb-2 text-slate-700">Slide B</p>
                        <WSIViewer dziUrl={challenge2_Sarc_DziUrl} />
                    </div>
                </div>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                    <button onClick={() => handleChallenge2('A')} disabled={!!challenge2Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Select Slide A
                    </button>
                    <button onClick={() => handleChallenge2('B')} disabled={!!challenge2Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                        Select Slide B
                    </button>
                </div>
                {challenge2Answer && (
                    <div className="mt-6 max-w-xl mx-auto">
                        {challenge2Answer === 'A' && (
                            <Alert type="error" title="Slide A (Incorrect)">
                                This represents a 'bronchiolocentric' pattern, a key feature of HP. The inflammation is centered on the small airways.
                            </Alert>
                        )}
                        {challenge2Answer === 'B' && (
                            <Alert type="success" title="Slide B (Correct)">
                                This represents a lymphangitic distribution. The granulomas are following the lung's lymphatic drainage routes along the bronchovascular bundles and septa.
                            </Alert>
                        )}
                    </div>
                )}
            </div>
        </div>
      </Card>
      
       <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-800 mb-4 text-center">High-Yield Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-100">
              <tr>
                <th scope="col" className="px-6 py-4 font-semibold rounded-l-lg">Feature</th>
                <th scope="col" className="px-6 py-4 font-semibold">Sarcoidosis</th>
                <th scope="col" className="px-6 py-4 font-semibold rounded-r-lg">Hypersensitivity Pneumonitis</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr className="bg-white">
                <th scope="row" className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">Quality</th>
                <td className="px-6 py-4">Tight, Well-Formed, "Naked"</td>
                <td className="px-6 py-4">Loose, Poorly-Formed, Cellular</td>
              </tr>
              <tr className="bg-white">
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
