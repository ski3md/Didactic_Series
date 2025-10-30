
import React, { useEffect, useRef } from 'react';

// Inform TypeScript about the global OpenSeadragon variable from the script tag
declare var OpenSeadragon: any;

interface WSIViewerProps {
  dziUrl?: string;
  staticImageUrl?: string;
  altText?: string;
}

const WSIViewer: React.FC<WSIViewerProps> = ({ dziUrl, staticImageUrl, altText }) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: any = null;
    // Only initialize OpenSeadragon if a DZI URL is provided
    if (viewerRef.current && dziUrl) {
      viewer = OpenSeadragon({
        element: viewerRef.current,
        prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.1/images/',
        tileSources: dziUrl,
        animationTime: 0.5,
        blendTime: 0.1,
        constrainDuringPan: true,
        maxZoomPixelRatio: 2,
        minZoomLevel: 1,
        visibilityRatio: 1,
        zoomPerScroll: 2,
        showNavigator: true,
        navigatorPosition: 'BOTTOM_RIGHT',
        navigatorHeight: 120,
        navigatorWidth: 150,
      });
    }

    // Cleanup when component unmounts
    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };
  }, [dziUrl]);

  // Render OpenSeadragon viewer if dziUrl is provided
  if (dziUrl) {
    return (
      <div 
        ref={viewerRef} 
        className="w-full h-64 sm:h-96 bg-black rounded-lg shadow-md openseadragon-container"
        aria-label={altText || "Interactive whole slide image viewer"}
      >
      </div>
    );
  }

  // Render static image fallback if staticImageUrl is provided
  if (staticImageUrl) {
    return (
      <div className="w-full h-64 sm:h-96 bg-black rounded-lg shadow-md flex items-center justify-center overflow-hidden openseadragon-container">
        <img 
          src={staticImageUrl} 
          alt={altText || 'Pathology slide image'} 
          className="max-w-full max-h-full object-contain"
        />
      </div>
    );
  }

  // Render a placeholder if neither URL is provided
  return (
    <div 
        className="w-full h-64 sm:h-96 bg-black rounded-lg shadow-md flex items-center justify-center openseadragon-container"
        aria-label="Image viewer placeholder"
    >
        <p className="text-slate-300">No image available</p>
    </div>
  );
};

export default WSIViewer;