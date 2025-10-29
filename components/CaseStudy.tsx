import React, { useState } from 'react';
import Card from './ui/Card';

const CaseStudy: React.FC = () => {
  const [showAnswer, setShowAnswer] = useState(false);

  // Static histology image for hypersensitivity pneumonitis
  const hpImageUrl =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Chronic_hypersensitivity_pneumonitis_-_histology.jpg/1280px-Chronic_hypersensitivity_pneumonitis_-_histology.jpg";

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Interactive Case Study</h1>
        <p className="mt-2 text-md text-slate-600">Applying knowledge to a clinical scenario.</p>
      </header>

      <Card>
        <h2 className="text-2xl font-semibold text-slate-800 mb-4">
          Case: "The Bird Fancier's Cough"
        </h2>

        <div className="space-y-6">
          {/* Part 1 */}
          <section>
            <h3 className="font-bold text-lg text-slate-800 mb-2">
              Part 1: Clinical & Radiologic Data
            </h3>
            <p className="text-slate-600">
              You receive a lung wedge biopsy from a 55-year-old man with a 6-month history of
              progressive shortness of breath and a dry cough. He is a non-smoker but has kept pigeons
              in his attic for over 20 years. A chest CT shows diffuse, bilateral ground-glass opacities
              with centrilobular nodules.
            </p>
          </section>

          {/* Part 2 */}
          <section>
            <h3 className="font-bold text-lg text-slate-800 mb-2">
              Part 2: Histologic Findings
            </h3>
            <img
              src={hpImageUrl}
              alt="Chronic hypersensitivity pneumonitis showing bronchiolocentric granulomas"
              className="w-full h-auto rounded-lg shadow"
            />
            <p className="text-slate-600 pt-2">
              The biopsy shows a cellular interstitial pneumonia with numerous small, poorly-formed
              bronchiolocentric granulomas composed of epithelioid histiocytes and multinucleated
              giant cells. There is no necrosis. The interstitium shows a dense lymphoplasmacytic
              infiltrate with scattered eosinophils and foci of organizing pneumonia.
            </p>
          </section>

          {/* Part 3 */}
          <section>
            <h3 className="font-bold text-lg text-slate-800 mb-2">Part 3: The Diagnostic Task</h3>
            <p className="text-slate-600 mb-4">
              Given the integrated clinical, radiologic, and histologic findings, construct a ranked
              differential diagnosis. Justify your top two choices.
            </p>

            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="bg-primary-600 text-white font-medium py-2 px-5 rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
            >
              {showAnswer ? "Hide Expert Answer" : "Reveal Expert Answer"}
            </button>

            {showAnswer && (
              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                <h4 className="font-bold text-slate-800 mb-2">Expert Answer:</h4>
                <ol className="space-y-3 list-decimal list-inside text-slate-700">
                  <li>
                    <p className="font-semibold text-green-700">
                      Hypersensitivity Pneumonitis (Subacute/Chronic)
                    </p>
                    <p className="text-sm">
                      Strongly supported by the history of pigeon exposure, CT pattern, and
                      bronchiolocentric granulomas without necrosis.
                    </p>
                  </li>
                  <li>
                    <p className="font-semibold text-orange-700">Sarcoidosis</p>
                    <p className="text-sm">
                      Less likely—granulomas in sarcoidosis tend to be well-formed and along lymphatic
                      routes, which is not seen here.
                    </p>
                  </li>
                </ol>
              </div>
            )}
          </section>
        </div>
      </Card>
    </div>
  );
};

export default CaseStudy;
