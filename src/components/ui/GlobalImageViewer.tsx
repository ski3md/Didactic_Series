import React, { useState, useEffect, useCallback } from 'react';
// FIX: Corrected import path for imageStore by removing the file extension to fix module resolution error.
import { getOfficialImages, getCommunityImages } from '../../utils/imageStore';
import { StoredImage } from '../../types.ts';
import { PhotographIcon, XCircleIcon, ChevronLeftIcon, ChevronRightIcon } from '../icons.tsx';

const GlobalImageViewer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [images, setImages] = useState<StoredImage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchImages = async () => {
            setIsLoading(true);
            try {
                const official = await getOfficialImages();
                const community = await getCommunityImages();
                setImages([...official, ...community].sort((a,b) => b.timestamp - a.timestamp));
            } catch (error) {
                console.error("Failed to load images for global viewer:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchImages();
    }, []);

    const openModal = (index: number = 0) => {
        if (images.length > 0) {
            setCurrentIndex(index);
            setIsOpen(true);
        }
    };

    const closeModal = () => setIsOpen(false);

    const nextImage = useCallback(() => {
        if (images.length === 0) return;
        setCurrentIndex(prev => (prev + 1) % images.length);
    }, [images.length]);

    const prevImage = useCallback(() => {
        if (images.length === 0) return;
        setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextImage();
            if (e.key === 'ArrowLeft') prevImage();
            if (e.key === 'Escape') closeModal();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, nextImage, prevImage]);
    
    if (isLoading || images.length === 0) {
        return null; // Don't render if no images or still loading
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => openModal(0)}
                className="fixed bottom-5 right-5 z-40 bg-sky-600 text-white p-3 rounded-full shadow-lg hover:bg-sky-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 transition-transform hover:scale-110"
                aria-label="Open global image viewer"
            >
                <PhotographIcon className="h-6 w-6" />
            </button>

            {/* Modal */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
                    onClick={closeModal}
                    role="dialog"
                    aria-modal="true"
                >
                    <div className="relative w-full h-full flex items-center justify-center p-4" onClick={(e) => e.stopPropagation()}>
                        {/* Image Display */}
                        <div className="relative max-w-[90vw] max-h-[85vh] flex items-center justify-center">
                            <img
                                src={images[currentIndex].src}
                                alt={images[currentIndex].title}
                                loading="lazy"
                                className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
                            />
                            <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
                                <h3 className="text-white font-bold text-lg">{images[currentIndex].title}</h3>
                                <p className="text-slate-300 text-sm">{images[currentIndex].description}</p>
                            </div>
                        </div>

                        {/* Close Button */}
                        <button onClick={closeModal} className="absolute top-4 right-4 text-white hover:text-slate-300 transition-colors" aria-label="Close viewer">
                           <XCircleIcon className="h-10 w-10"/>
                        </button>

                        {/* Prev Button */}
                        <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 p-2 rounded-full" aria-label="Previous image">
                            <ChevronLeftIcon className="h-8 w-8"/>
                        </button>

                        {/* Next Button */}
                        <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/50 p-2 rounded-full" aria-label="Next image">
                            <ChevronRightIcon className="h-8 w-8"/>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default GlobalImageViewer;