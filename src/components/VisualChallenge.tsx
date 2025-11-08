import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import Alert from './ui/Alert.tsx';
import { User, StoredImage } from '../types.ts';
import { getGalleryImages } from '../utils/imageStore.ts';

interface VisualChallengeProps {
  user: User | null;
}

const visualFallbackSarcoidosis: StoredImage = {
    id: 'visual_fallback_sarcoid',
    src: 'https://www.researchgate.net/publication/379027158/figure/fig3/AS:11431281229911746@1710678895381/Biopsy-from-lung-showing-non-caseating-granuloma.png,
    gcsPath: 'external/sarcoidosis/non_caseating_granuloma.jpg',
    title: 'Sarcoidosis – Non-necrotizing (non-caseating) granuloma (Wikimedia Commons)',
    description: 'Representative histology of sarcoidosis: tight non-necrotizing epithelioid granulomas with lymphocytic rim.',
    uploader: 'wikimedia',
    timestamp: Date.now(),
    category: 'official',
    tags: ['sarcoidosis','histopathology','non-caseating granuloma'],
    entity: 'sarcoidosis',
    difficulty: 'intermediate',
    cells: []
};

const visualFallbackHP: StoredImage = {
    id: 'visual_fallback_hp',
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Histology_of_chronic_hypersensitivity_pneumonitis.jpg/1200px-Histology_of_chronic_hypersensitivity_pneumonitis.jpg',
    gcsPath: 'external/hypersensitivity_pneumonitis/chronic_hp.jpg',
    title: 'Chronic hypersensitivity pneumonitis (Wikimedia Commons)',
    description: 'Chronic hypersensitivity pneumonitis with poorly formed peribronchiolar granulomas.',
    uploader: 'wikimedia',
    timestamp: Date.now(),
    category: 'official',
    tags: ['hypersensitivity pneumonitis', 'histopathology'],
    entity: 'hypersensitivity_pneumonitis',
    difficulty: 'intermediate',
    cells: []
};

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

                setSarcImage(sarcoidosisImage ? { ...sarcoidosisImage } : { ...visualFallbackSarcoidosis });
                setHpImage(hypersensitivityImage ? { ...hypersensitivityImage } : { ...visualFallbackHP });
            } catch (e) {
                console.error("Failed to load images for visual challenge", e);
                setSarcImage({ ...visualFallbackSarcoidosis });
                setHpImage({ ...visualFallbackHP });
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
        ) : (
            <div className="space-y-12">
                {/* Challenge 1 */}
                <div className="pb-8 border-b border-slate-200">
                    <div className="text-center mb-6">
                        <h3 className="font-semibold font-serif text-xl text-slate-900">Challenge 1: Granuloma Quality</h3>
                        <p className="text-slate-600 mt-1">Which slide shows the <strong>'tightly-formed, well-circumscribed'</strong> granuloma typical of Sarcoidosis?</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[{label:'Slide A (HP)', data: hpImage}, {label:'Slide B (Sarcoidosis)', data: sarcImage}].map(slide => (
                            <figure key={slide.label} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <p className="font-medium text-center py-2 text-slate-800 bg-slate-50">{slide.label}</p>
                                <img
                                    src={slide.data?.src || visualFallbackSarcoidosis.src}
                                    alt={slide.data?.alt || 'Histology image'}
                                    className="w-full h-64 object-cover"
                                    loading="lazy"
                                />
                                <figcaption className="text-xs text-slate-600 px-4 py-2 bg-slate-50 border-t border-slate-200">
                                    {slide.data?.description || slide.data?.title}
                                </figcaption>
                            </figure>
                        ))}
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
                        {[{label:'Slide A (HP)', data: hpImage}, {label:'Slide B (Sarcoidosis)', data: sarcImage}].map(slide => (
                            <figure key={`${slide.label}-dist`} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
                                <p className="font-medium text-center py-2 text-slate-800 bg-slate-50">{slide.label}</p>
                                <img
                                    src={slide.data?.src || visualFallbackSarcoidosis.src}
                                    alt={slide.data?.alt || 'Histology image'}
                                    className="w-full h-64 object-cover"
                                    loading="lazy"
                                />
                                <figcaption className="text-xs text-slate-600 px-4 py-2 bg-slate-50 border-t border-slate-200">
                                    {slide.data?.description || slide.data?.title}
                                </figcaption>
                            </figure>
                        ))}
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
