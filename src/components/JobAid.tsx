import React, { useState } from 'react';
import { Flashcard } from '../types.ts';
import { modules } from '../data/modules.ts';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import { ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon, CollectionIcon } from './icons.tsx';

const allFlashcards: Flashcard[] = modules.flatMap(m => m.flashcards);

const JobAid: React.FC = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);

    const shuffleAndStart = () => {
        const shuffled = [...allFlashcards].sort(() => Math.random() - 0.5);
        setFlashcards(shuffled);
        setCurrentIndex(0);
        setIsFlipped(false);
    };

    React.useEffect(() => {
        shuffleAndStart();
    }, []);

    const handleNext = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(prev => (prev + 1) % flashcards.length);
        }, 150); // wait for flip back animation
    };

    const handlePrev = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCurrentIndex(prev => (prev - 1 + flashcards.length) % flashcards.length);
        }, 150);
    };

    const currentCard = flashcards[currentIndex];

    if (!currentCard) {
        return <p>Loading flashcards...</p>;
    }

    return (
        <div className="animate-fade-in">
            <SectionHeader title="Atlas & Flashcards" subtitle="Quick-reference job aids for high-yield facts." icon={<CollectionIcon className="h-8 w-8" />} />
            
            <Card>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold font-serif text-slate-900">Flashcards</h2>
                    <button onClick={shuffleAndStart} className="flex items-center text-sm font-semibold text-sky-700 hover:text-sky-900">
                        <ArrowPathIcon className="h-4 w-4 mr-1.5" />
                        Shuffle Deck
                    </button>
                </div>
                
                <div className="relative">
                    <div 
                        className="w-full max-w-lg mx-auto h-64 perspective-1000"
                        onClick={() => setIsFlipped(!isFlipped)}
                    >
                        <div 
                            className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}
                        >
                            {/* Front */}
                            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-white border-2 border-sky-300 rounded-xl shadow-lg">
                                <p className="text-center text-xl font-semibold text-slate-800">{currentCard.front}</p>
                            </div>
                            {/* Back */}
                            <div className="absolute w-full h-full backface-hidden flex items-center justify-center p-6 bg-sky-100 border-2 border-sky-300 rounded-xl shadow-lg rotate-y-180">
                                 <p className="text-center text-lg text-slate-900">{currentCard.back}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-6 max-w-lg mx-auto">
                     <button onClick={handlePrev} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                        <ChevronLeftIcon className="h-5 w-5 mr-2" /> Prev
                    </button>
                    <p className="text-sm font-medium text-slate-600">Card {currentIndex + 1} of {flashcards.length}</p>
                     <button onClick={handleNext} className="flex items-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors">
                        Next <ChevronRightIcon className="h-5 w-5 ml-2" />
                    </button>
                </div>
                 <style>{`
                    .perspective-1000 { perspective: 1000px; }
                    .transform-style-preserve-3d { transform-style: preserve-3d; }
                    .rotate-y-180 { transform: rotateY(180deg); }
                    .backface-hidden { backface-visibility: hidden; }
                `}</style>
            </Card>
        </div>
    );
};

export default JobAid;