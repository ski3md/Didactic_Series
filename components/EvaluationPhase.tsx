
import React, { useState } from 'react';
import Card from './Card';
import { CheckCircleIcon, XCircleIcon } from './icons';

const EvaluationPhase: React.FC = () => {
    const [challenge1Answer, setChallenge1Answer] = useState<string | null>(null);
    const [challenge2Answer, setChallenge2Answer] = useState<string | null>(null);

    const handleChallenge1 = (choice: string) => !challenge1Answer && setChallenge1Answer(choice);
    const handleChallenge2 = (choice: string) => !challenge2Answer && setChallenge2Answer(choice);

  return (
    <div className="animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Visual Discrimination Challenge</h1>
        <p className="mt-2 text-md text-slate-600">Sharpening your eye for Sarcoidosis vs. Hypersensitivity Pneumonitis.</p>
      </header>

      <Card>
        <p className="text-slate-600 mb-6">This activity forces a direct, side-by-side comparison of key visual features to bridge the learning gap. This will sharpen your eye for the key differences.</p>
        
        {/* Challenge 1 */}
        <div className="mb-8">
            <h3 className="font-semibold text-lg text-slate-700 mb-3">Challenge 1: Granuloma Quality</h3>
            <p className="mb-4">Which image shows the <strong>'tightly-formed, well-circumscribed'</strong> granuloma typical of Sarcoidosis?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageChoice 
                    label="Image A"
                    imageUrl="https://picsum.photos/seed/pathologyHP/300/200"
                    isCorrect={false}
                    isSelected={challenge1Answer === 'A'}
                    feedback="Not quite. This is a 'poorly-formed' granuloma typical of HP. Notice how the cells are loosely aggregated and blend into the surrounding inflammation."
                    onClick={() => handleChallenge1('A')}
                    isAnswered={!!challenge1Answer}
                />
                 <ImageChoice 
                    label="Image B"
                    imageUrl="https://picsum.photos/seed/pathologySarc/300/200"
                    isCorrect={true}
                    isSelected={challenge1Answer === 'B'}
                    feedback="Correct! Notice the sharp borders and how the epithelioid histiocytes are tightly packed together. This is a classic 'sarcoidal' granuloma."
                    onClick={() => handleChallenge1('B')}
                    isAnswered={!!challenge1Answer}
                />
            </div>
        </div>

        {/* Challenge 2 */}
        <div>
            <h3 className="font-semibold text-lg text-slate-700 mb-3">Challenge 2: Architectural Distribution</h3>
            <p className="mb-4">Which image shows the <strong>'lymphangitic distribution'</strong> typical of Sarcoidosis?</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <ImageChoice 
                    label="Image A"
                    imageUrl="https://picsum.photos/seed/pathologyHP2/300/200"
                    isCorrect={false}
                    isSelected={challenge2Answer === 'A'}
                    feedback="This is a 'bronchiolocentric' pattern, a key feature of HP. The inflammation is centered on the small airways."
                    onClick={() => handleChallenge2('A')}
                    isAnswered={!!challenge2Answer}
                />
                <ImageChoice 
                    label="Image B"
                    imageUrl="https://picsum.photos/seed/pathologySarc2/300/200"
                    isCorrect={true}
                    isSelected={challenge2Answer === 'B'}
                    feedback="Exactly! The granulomas are following the lung's lymphatic drainage routes along the bronchovascular bundles and septa."
                    onClick={() => handleChallenge2('B')}
                    isAnswered={!!challenge2Answer}
                />
            </div>
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

interface ImageChoiceProps {
    label: string;
    imageUrl: string;
    isCorrect: boolean;
    isSelected: boolean;
    isAnswered: boolean;
    feedback: string;
    onClick: () => void;
}

const ImageChoice: React.FC<ImageChoiceProps> = ({ label, imageUrl, isCorrect, isSelected, isAnswered, feedback, onClick }) => {
    
    const getBorderColor = () => {
        if (!isAnswered) return 'border-slate-300 hover:border-blue-500';
        if (isSelected) {
            return isCorrect ? 'border-green-500' : 'border-red-500';
        }
        return 'border-slate-300';
    };

    return (
        <div>
            <button 
                onClick={onClick}
                disabled={isAnswered}
                className={`w-full rounded-lg border-2 p-2 transition-all ${getBorderColor()} ${isAnswered ? 'cursor-default' : 'cursor-pointer'}`}>
                <img src={imageUrl} alt={label} className="w-full h-auto rounded-md" />
                <div className="flex items-center justify-between mt-2 px-1">
                    <span className="font-semibold text-slate-700">{label}</span>
                     {isAnswered && isSelected && (isCorrect ? <CheckCircleIcon className="h-6 w-6 text-green-500" /> : <XCircleIcon className="h-6 w-6 text-red-500" />)}
                </div>
            </button>
            {isAnswered && isSelected && (
                 <div className={`mt-2 text-sm p-2 rounded ${isCorrect ? 'text-green-800 bg-green-50' : 'text-red-800 bg-red-50'}`}>
                    {feedback}
                </div>
            )}
        </div>
    );
}

export default EvaluationPhase;
