import React, { useEffect, useRef } from 'react';

interface WSIViewerProps {
  dziUrl?: string;
  staticImageUrl?: string; // Fallback for simple images
  altText?: string;
}

const WSIViewer: React.FC<WSIViewerProps> = ({ dziUrl, staticImageUrl, altText }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const osdViewer = useRef<any>(null);

  useEffect(() => {
    let isCancelled = false;

    const initViewer = async () => {
        if ((!dziUrl && !staticImageUrl) || !viewerRef.current) {
            return;
        }

        if (osdViewer.current) {
            osdViewer.current.destroy();
            osdViewer.current = null;
        }

        try {
            const { default: OpenSeadragon } = await import('openseadragon');
            if (isCancelled || !viewerRef.current) return;

            let tileSources: any;
            if (dziUrl) {
                tileSources = {
                    type: 'image',
                    url: dziUrl,
                    buildPyramid: false
                };
            } else if (staticImageUrl) {
                tileSources = {
                    type: 'image',
                    url: staticImageUrl,
                };
            }

            osdViewer.current = OpenSeadragon({
                element: viewerRef.current,
                prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/',
                tileSources,
                crossOriginPolicy: 'Anonymous',
                animationTime: 0.5,
                blendTime: 0.1,
                constrainDuringPan: true,
                maxZoomPixelRatio: 2,
                minZoomImageRatio: 0.9,
                visibilityRatio: 1,
                zoomPerScroll: 2,
                showNavigator: true,
                navigatorPosition: 'BOTTOM_RIGHT',
                navigatorSizeRatio: 0.2,
                springStiffness: 10
            });
        } catch (error) {
            console.error('Failed to initialize OpenSeadragon viewer', error);
        }
    };

    initViewer();

    return () => {
        isCancelled = true;
        if (osdViewer.current) {
            osdViewer.current.destroy();
            osdViewer.current = null;
        }
    };
  }, [dziUrl, staticImageUrl]);

  // If no image source, show a placeholder.
  if (!dziUrl && !staticImageUrl) {
    return (
        <div 
            className="w-full h-[clamp(16rem,24vw,26rem)] lg:h-[clamp(20rem,26vw,32rem)] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl shadow-slate-900/40 ring-1 ring-slate-700/40 flex items-center justify-center openseadragon-container"
            aria-label={altText || "Image viewer placeholder"}
        >
            <p className="text-slate-200 text-[clamp(1rem,0.95rem+0.2vw,1.2rem)]">No Image Available</p>
        </div>
    );
  }

    return (
        <div 
            ref={viewerRef}
            className="w-full h-[clamp(16rem,24vw,26rem)] lg:h-[clamp(20rem,26vw,32rem)] bg-black rounded-3xl shadow-2xl shadow-slate-900/40 ring-1 ring-slate-800/60 overflow-hidden openseadragon-container"
            aria-label={altText || "Whole Slide Image viewer"}
        />
  );
};

export default WSIViewer;
