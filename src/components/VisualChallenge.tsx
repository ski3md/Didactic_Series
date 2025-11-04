import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import Alert from './ui/Alert.tsx';
import WSIViewer from './WSIViewer.tsx';
import { User, StoredImage } from '../types.ts';
import { getGalleryImages } from '../utils/imageStore.ts';

interface VisualChallengeProps {
  user: User | null;
}

const VisualChallenge: React.FC<VisualChallengeProps> = ({ user }) => {
    const [challenge1Answer, setChallenge1Answer] = useState<string | null>(null);
    const [challenge2Answer, setChallenge2Answer] = useState<string | null>(null);
    const [sarcImage, setSarcImage] = useState<StoredImage | null>(null);
    const [hpImage, setHpImage] = useState<StoredImage | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const normalizeTag = (tag: string) =>
        tag.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');

    const tagMatches = (image: StoredImage | null, candidates: string[]) => {
        if (!image?.tags || image.tags.length === 0) return false;
        const normalizedImageTags = new Set(image.tags.map(normalizeTag));
        return candidates.some(candidate => normalizedImageTags.has(normalizeTag(candidate)));
    };

    const sarcoidTagCandidates = useMemo(
        () => ['sarcoidosis', 'sarcoid'],
        []
    );
    const hpTagCandidates = useMemo(
        () => ['hypersensitivity_pneumonitis', 'hypersensitivity-pneumonitis', 'hot_tub_lung', 'hp'],
        []
    );

    useEffect(() => {
        const loadChallengeImages = async () => {
            setIsLoading(true);
            try {
                const allImages = await getGalleryImages();
                
                // Find images by tag
                const sarcoidosisImage = allImages.find(img => tagMatches(img, sarcoidTagCandidates));
                const hypersensitivityImage = allImages.find(img => tagMatches(img, hpTagCandidates));

                setSarcImage(sarcoidosisImage || null);
                setHpImage(hypersensitivityImage || null);
            } catch (e) {
                console.error("Failed to load images for visual challenge", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadChallengeImages();
    }, [hpTagCandidates, sarcoidTagCandidates]);

    const handleChallenge1 = (choice: string) => {
      if (!challenge1Answer) {
        setChallenge1Answer(choice);
      }
    };
    const handleChallenge2 = (choice: string) => {
      if (!challenge2Answer) {
        setChallenge2Answer(choice);
      }
    };

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title="Visual Discrimination Challenge"
        subtitle="Sharpening your eye for Sarcoidosis vs. Hypersensitivity Pneumonitis."
      />

      <Card>
        <p className="text-slate-700 mb-8 text-center max-w-2xl mx-auto">This activity forces a direct, side-by-side comparison of key visual features. Pan and zoom on each digital slide to find the key features, then make your choice.</p>
        
        {isLoading ? (
            <p className="text-center text-slate-600 py-8">Loading dynamic challenge images...</p>
        ) : !sarcImage || !hpImage ? (
             <Alert type="info" title="Content Not Available">
                This challenge requires at least one image tagged for Sarcoidosis and one tagged for Hypersensitivity Pneumonitis (for example <code>sarcoidosis</code> or <code>hypersensitivity_pneumonitis</code>). Please ask an admin to upload and tag relevant images in the gallery manifest.
             </Alert>
        ) : (
            <div className="space-y-12">
                {/* Challenge 1 */}
                <div className="pb-8 border-b border-slate-200">
                    <div className="text-center mb-6">
                        <h3 className="font-semibold font-serif text-xl text-slate-900">Challenge 1: Granuloma Quality</h3>
                        <p className="text-slate-600 mt-1">Which slide shows the <strong>'tightly-formed, well-circumscribed'</strong> granuloma typical of Sarcoidosis?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="font-medium text-center mb-2 text-slate-800">Slide A (HP)</p>
                            <WSIViewer staticImageUrl={hpImage.src} altText={hpImage.title}/>
                        </div>
                        <div>
                            <p className="font-medium text-center mb-2 text-slate-800">Slide B (Sarcoidosis)</p>
                            <WSIViewer staticImageUrl={sarcImage.src} altText={sarcImage.title} />
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => handleChallenge1('A')} disabled={!!challenge1Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Select Slide A
                        </button>
                        <button onClick={() => handleChallenge1('B')} disabled={!!challenge1Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
                        <h3 className="font-semibold font-serif text-xl text-slate-900">Challenge 2: Architectural Distribution</h3>
                        <p className="text-slate-600 mt-1">Which slide shows the <strong>'lymphangitic distribution'</strong> typical of Sarcoidosis?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <p className="font-medium text-center mb-2 text-slate-800">Slide A (HP)</p>
                            <WSIViewer staticImageUrl={hpImage.src} altText={hpImage.title} />
                        </div>
                        <div>
                            <p className="font-medium text-center mb-2 text-slate-800">Slide B (Sarcoidosis)</p>
                            <WSIViewer staticImageUrl={sarcImage.src} altText={sarcImage.title} />
                        </div>
                    </div>
                    <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
                        <button onClick={() => handleChallenge2('A')} disabled={!!challenge2Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Select Slide A
                        </button>
                        <button onClick={() => handleChallenge2('B')} disabled={!!challenge2Answer} className="px-6 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
        )}
      </Card>
      
       <Card>
        <h2 className="text-2xl font-semibold font-serif text-slate-900 mb-4 text-center">High-Yield Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600">
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

export default VisualChallenge;
