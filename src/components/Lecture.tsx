import React, { useState, useEffect } from 'react';
import {
    ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassChartIcon, BullseyeIcon, BeakerIcon,
    ArrowRightToBracketIcon
} from './icons.tsx';
import Alert from './ui/Alert.tsx';

// Map slide placeholder IDs to actual image URLs hosted on the CDN.
// This map allows the lecture component to load real histology images instead of showing gray placeholders.
const lectureImageMap: Record<string, string> = {
    // Tuberculosis image illustrating well-formed granulomas with central caseous necrosis.
    lecture_tb_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/tuberculosis/lungtuberculosisanapath02.jpg',
    // Histoplasmosis image showing intracellular yeasts within macrophages.
    lecture_histo_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/histoplasmosis/Unclassified/histoplasmosis_histoplasmosis_06.jpg',
    // Blastomycosis image demonstrating broad-based budding yeast.
    lecture_blasto_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/blastomycosis/Unclassified/blastomycosis_blastomycosis_04.jpg',
    // Coccidioidomycosis image featuring large spherules with endospores.
    lecture_cocci_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/coccidioidomycosis/Unclassified/coccidioidomycosis_coccidioidomycosis_05.jpg',
    // Cryptococcus image showing encapsulated yeasts highlighted by mucicarmine stain.
    lecture_crypto_image:
        'https://storage.googleapis.com/granuloma-lecture-bucket/granulomas/cryptococcosis/Mucicarmine/cryptococcosis_cryptococcosis_05.jpg',
};

interface LectureProps {
    onComplete: () => void;
}

const slideData = [
    { type: 'title', title: 'Granulomatous Lung Disease', subtitle: 'A Diagnostic Approach: The Lecture Component' },
    { type: 'bullets', title: 'Learning Objectives', items: [
        { icon: <MagnifyingGlassChartIcon className="h-6 w-6"/>, text: '<strong>Analyze:</strong> Compare and contrast key histologic features, morphology, and location of common granulomatous diseases.' },
        { icon: <BullseyeIcon className="h-6 w-6"/>, text: '<strong>Apply:</strong> Correctly identify the most likely etiology (Infectious, Autoimmune, Inhalational) from a given histologic pattern.' },
        { icon: <BeakerIcon className="h-6 w-6"/>, text: '<strong>Evaluate:</strong> Justify the selection of the most appropriate ancillary test (e.g., special stains, serology) to confirm a diagnosis.' },
    ]},
    { type: 'section_title', title: 'The Core Framework', text: 'The key is not just <strong>if</strong> there is a granuloma, but its <strong>quality</strong>, <strong>distribution</strong>, and <strong>clinical context</strong>.' },
    { type: 'table', title: 'Core Differential Diagnosis', headers: ['Feature', 'Sarcoidosis', 'Tuberculosis (TB)', 'Hypersensitivity (HP)', 'GPA (Vasculitis)'], rows: [
        ['<strong>Granuloma Type</strong>', 'Well-formed, non-caseating', 'Well-formed, caseating', 'Poorly-formed', 'Palisading'],
        ['<strong>Necrosis</strong>', 'Absent', 'Caseous ("clean")', 'Absent', 'Geographic ("dirty")'],
        ['<strong>Distribution</strong>', 'Lymphangitic ("Stacks")', 'Apical, cavitary', 'Peribronchiolar ("Hugs")', 'Random, nodular'],
        ['<strong>Key Test</strong>', 'Diagnosis of Exclusion', 'AFB Stain / PCR', 'Exposure History', 'c-ANCA Serology'],
    ]},
    { type: 'quiz', title: 'Knowledge Check: Core Concepts', question: 'A biopsy shows caseating granulomas. Based on the table, which two ancillary tests are non-negotiable to order first?',
      options: ['c-ANCA and Serum ACE', 'AFB Stain and GMS Stain', 'Exposure History and BeLPT', 'None, it must be sarcoidosis'],
      correctAnswer: 'AFB Stain and GMS Stain',
      feedback: 'Correct. Caseating necrosis has a broad differential, but infectious causes (TB and Fungi) must be ruled out first with special stains before considering non-infectious mimics.'
    },
    { type: 'image_hotspot', title: 'Pattern 1: Infectious - Tuberculosis', text: '<h3>Histologic Clues:</h3><ul><li><strong>Granulomas:</strong> Well-formed, often confluent.</li><li><strong>Necrosis:</strong> Central <strong>caseous necrosis</strong> is the hallmark. It appears "clean" (acellular and eosinophilic).</li><li><strong>Stains:</strong> An Acid-Fast Bacilli (AFB) stain is mandatory to identify the organisms.</li></ul>', 
      placeholderId: 'lecture_tb_image',
      quiz: {
        question: 'Click the feature in the text that best describes the pink, acellular material in the center of the image.',
        options: ['Well-formed granulomas', 'Caseous necrosis', 'Acid-Fast Bacilli'],
        correctAnswer: 'Caseous necrosis',
        feedback: "Excellent. That central, eosinophilic debris is the classic 'caseous' (cheese-like) necrosis of TB."
      }
    },
    { type: 'image_hotspot', title: 'Infectious Mimic: Histoplasmosis', text: '<h3>Histologic Clues:</h3><ul><li><strong>Mimicry:</strong> Also presents with caseating granulomas, perfectly mimicking TB on H&E.</li><li><strong>Organisms:</strong> The key is finding small (2-5 µm), intracellular yeasts within macrophages.</li><li><strong>Stains:</strong> A Gomori Methenamine-Silver (GMS) stain is required to visualize the fungi.</li></ul>', 
      placeholderId: 'lecture_histo_image',
      quiz: {
          question: 'In this image of Histoplasmosis, what is the key diagnostic finding?',
          options: ['Broad-based budding', 'Intracellular yeasts', 'Spherules with endospores'],
          correctAnswer: 'Intracellular yeasts',
          feedback: "Correct! The tiny dots within the macrophages are the small yeasts of *Histoplasma capsulatum*."
      }
    },
    { type: 'three_column_image', title: 'Other Key Fungi', tiles: [
        { placeholderId: 'lecture_blasto_image', caption: '<strong>Blastomycosis:</strong> Large yeasts with broad-based budding.' },
        { placeholderId: 'lecture_cocci_image', caption: '<strong>Coccidioidomycosis:</strong> Large spherules with internal endospores.' },
        { placeholderId: 'lecture_crypto_image', caption: '<strong>Cryptococcus:</strong> Encapsulated yeasts, positive with Mucicarmine.' },
    ]},
    { type: 'launch', title: 'Next Steps', text: 'You have reviewed the core lecture content.', buttonText: 'Launch Interactive Module' },
];

const QuizComponent: React.FC<{
  question: string;
  options: string[];
  correctAnswer: string;
  feedback: string;
}> = ({ question, options, correctAnswer, feedback }) => {
    const [answer, setAnswer] = useState<string | null>(null);

    return (
        <div className="mt-4 bg-slate-100 p-4 rounded-lg border border-slate-300">
            <p className="font-semibold text-slate-800 mb-3">{question}</p>
            <div className="space-y-2">
                {options.map(option => {
                    const isAnswered = answer !== null;
                    const isSelected = answer === option;
                    const isCorrect = option === correctAnswer;

                    let optionClass = 'bg-white border-slate-300 hover:bg-slate-50';
                    if (isAnswered) {
                        if (isCorrect) optionClass = 'bg-teal-50 border-teal-500 text-teal-900';
                        else if (isSelected) optionClass = 'bg-rose-50 border-rose-500 text-rose-900';
                        else optionClass = 'bg-slate-50 border-slate-300 text-slate-600 opacity-70';
                    }
                    
                    return (
                        <button key={option} onClick={() => setAnswer(option)} disabled={isAnswered}
                            className={`w-full text-left p-3 border rounded-md transition-all text-sm ${optionClass}`}>
                            {option}
                        </button>
                    );
                })}
            </div>
            {answer && <div className="mt-3"><Alert type={answer === correctAnswer ? 'success' : 'error'}>{feedback}</Alert></div>}
        </div>
    );
};

const SlideContent: React.FC<{ slide: (typeof slideData)[0], onComplete: () => void }> = ({ slide, onComplete }) => {
    // A simplified layout engine for lecture slides
    const renderLayout = (slide: any) => {
      const content = (
        <div className="font-lato text-slate-800 text-lg prose max-w-none" dangerouslySetInnerHTML={{ __html: slide.text }}></div>
      );
      let image: React.ReactNode = null;

      if (slide.placeholderId) {
        image = lectureImageMap[slide.placeholderId] ? (
          <img
            src={lectureImageMap[slide.placeholderId]}
            alt={slide.title}
            className="w-full aspect-video object-cover rounded-lg border"
          />
        ) : (
          <div className="w-full aspect-video bg-slate-200 border rounded-lg flex items-center justify-center">
            <p className="text-slate-500">Image Placeholder</p>
          </div>
        );
      }
      
      const quiz = slide.quiz ? <QuizComponent {...slide.quiz} /> : null;
  
      switch (slide.type) {
        case 'image_hotspot':
          return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>{content}{quiz}</div>
              {image}
            </div>
          );
        // Add more layout types here if needed
        default: return null;
      }
    };
  
    switch(slide.type) {
        case 'title': return <div className="text-center"><h1 className="font-roboto-slab text-5xl md:text-7xl font-bold text-slate-900">{slide.title}</h1><p className="font-lato text-xl md:text-2xl mt-4 text-slate-700">{slide.subtitle}</p></div>;
        case 'bullets': return <div className="w-full text-left max-w-4xl"><h2 className="font-roboto-slab text-3xl md:text-4xl font-bold text-slate-900 border-b-2 border-sky-400 pb-4 mb-8">{slide.title}</h2><ul className="space-y-6">{slide.items.map((item, i) => <li key={i} className="flex items-start text-lg md:text-xl font-lato text-slate-800"><span className="text-sky-600 mr-4 flex-shrink-0 mt-1">{item.icon}</span><span dangerouslySetInnerHTML={{ __html: item.text }} /></li>)}</ul></div>;
        case 'section_title': return <div className="text-center"><div className="w-24 h-1 bg-sky-400 mx-auto mb-6"></div><h2 className="font-roboto-slab text-4xl md:text-6xl font-bold text-sky-800 mb-6">{slide.title}</h2><p className="font-lato text-xl md:text-2xl text-slate-700 italic max-w-3xl" dangerouslySetInnerHTML={{ __html: slide.text }}></p></div>;
        case 'table': return <div className="w-full text-left max-w-6xl"><h2 className="font-roboto-slab text-3xl md:text-4xl font-bold text-slate-900 border-b-2 border-sky-400 pb-4 mb-8">{slide.title}</h2><div className="overflow-x-auto"><table className="w-full text-left border-collapse font-lato text-base md:text-lg"><thead><tr className="bg-sky-800 text-white"><th className="p-3">{slide.headers[0]}</th><th className="p-3">{slide.headers[1]}</th><th className="p-3">{slide.headers[2]}</th><th className="p-3">{slide.headers[3]}</th><th className="p-3">{slide.headers[4]}</th></tr></thead><tbody>{slide.rows.map((row, i) => <tr key={i} className="border-b border-slate-200 odd:bg-white even:bg-slate-50">{row.map((cell, j) => <td key={j} className="p-3 text-slate-800" dangerouslySetInnerHTML={{ __html: cell }}></td>)}</tr>)}</tbody></table></div></div>
        case 'quiz': return <div className="w-full max-w-2xl"><h2 className="font-roboto-slab text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-center">{slide.title}</h2><QuizComponent question={slide.question!} options={slide.options!} correctAnswer={slide.correctAnswer!} feedback={slide.feedback!} /></div>
        case 'image_hotspot': return <div className="w-full text-left max-w-5xl"><h2 className="font-roboto-slab text-3xl md:text-4xl font-bold text-slate-900 border-b-2 border-sky-400 pb-4 mb-8">{slide.title}</h2>{renderLayout(slide)}</div>
        case 'three_column_image': return <div className="w-full text-left max-w-6xl"><h2 className="font-roboto-slab text-3xl md:text-4xl font-bold text-slate-900 border-b-2 border-sky-400 pb-4 mb-8">{slide.title}</h2><div className="grid grid-cols-1 md:grid-cols-3 gap-8">{slide.tiles.map((tile, i) => {
            const captionText = typeof tile.caption === 'string' ? tile.caption.replace(/<[^>]*>/g, '') : slide.title;
            return (
                <div key={i} className="text-center">
                    {tile.placeholderId && lectureImageMap[tile.placeholderId] ? (
                        <img
                            src={lectureImageMap[tile.placeholderId]}
                            alt={captionText}
                            className="w-full rounded-lg shadow-lg border border-slate-200 mb-2 aspect-[4/3] object-cover"
                        />
                    ) : (
                        <div className="w-full rounded-lg shadow-lg border border-slate-200 mb-2 aspect-[4/3] bg-slate-200 flex items-center justify-center">
                            <p className="text-slate-500">Image Placeholder</p>
                        </div>
                    )}
                    <p className="font-lato text-base text-slate-700" dangerouslySetInnerHTML={{ __html: tile.caption }}></p>
                </div>
            );
        })}</div></div>
        case 'launch': return <div className="text-center"><h2 className="font-roboto-slab text-5xl md:text-6xl font-bold text-slate-900">{slide.title}</h2><p className="font-lato text-xl md:text-2xl mt-4 text-slate-700">{slide.text}</p><button onClick={onComplete} className="mt-8 bg-sky-600 text-white font-bold font-roboto-slab text-xl py-4 px-8 rounded-lg hover:bg-sky-700 transition-transform hover:scale-105 shadow-lg flex items-center mx-auto"><ArrowRightToBracketIcon className="h-6 w-6 mr-3"/>{slide.buttonText}</button></div>
        default: return null;
    }
}

const Lecture: React.FC<LectureProps> = ({ onComplete }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const nextSlide = () => setCurrentSlide(prev => Math.min(prev + 1, slideData.length - 1));
    const prevSlide = () => setCurrentSlide(prev => Math.max(prev - 1, 0));
    const goToSlide = (index: number) => setCurrentSlide(index);

    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            if (currentSlide < slideData.length - 1 && slideData[currentSlide].type !== 'launch') {
                nextSlide();
            }
        } else if (isRightSwipe) {
            if (currentSlide > 0) {
                prevSlide();
            }
        }
        setTouchStart(null);
        setTouchEnd(null);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextSlide();
            if (e.key === 'ArrowLeft') prevSlide();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentSlide]);

    return (
        <div 
            className="w-full h-full bg-slate-50 relative overflow-hidden flex flex-col"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <div className="flex-grow relative">
                {slideData.map((slide, index) => (
                    <div 
                        key={index} 
                        className={`slide-container ${index === currentSlide ? 'active' : ''} ${index < currentSlide ? 'prev' : ''}`}
                        aria-hidden={index !== currentSlide}
                    >
                        <SlideContent slide={slide} onComplete={onComplete} />
                    </div>
                ))}
            </div>

            <div className="absolute top-1/2 left-5 transform -translate-y-1/2 z-10">
              <button onClick={prevSlide} disabled={currentSlide === 0} className="bg-black/30 text-white rounded-full p-2 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all" aria-label="Previous slide">
                  <ChevronLeftIcon className="h-8 w-8"/>
              </button>
            </div>
            <div className="absolute top-1/2 right-5 transform -translate-y-1/2 z-10">
              <button onClick={nextSlide} disabled={currentSlide === slideData.length - 1 || slideData[currentSlide].type === 'launch'} className="bg-black/30 text-white rounded-full p-2 hover:bg-black/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all" aria-label="Next slide">
                  <ChevronRightIcon className="h-8 w-8"/>
              </button>
            </div>
            <div className="absolute bottom-5 left-1/2 transform -translateX-1/2 z-10 flex space-x-2">
                {slideData.map((_, index) => (
                    <button 
                        key={index} 
                        onClick={() => goToSlide(index)} 
                        className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-sky-600' : 'bg-slate-300 hover:bg-slate-400'}`}
                        aria-label={`Go to slide ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Lecture;
