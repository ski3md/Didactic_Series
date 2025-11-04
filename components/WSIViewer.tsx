import React, { useRef, useEffect } from 'react';
import OpenSeadragon from 'openseadragon';

interface WSIViewerProps {
  dziUrl?: string;
  staticImageUrl?: string;
  altText?: string;
}

/**
 * Whole Slide Image (WSI) Viewer Component
 * - Uses OpenSeadragon for interactive DZI image viewing
 * - Falls back to static image if DZI not available
 * - Renders a placeholder if no image is provided
 */
const WSIViewer: React.FC<WSIViewerProps> = ({ dziUrl, staticImageUrl, altText }) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: OpenSeadragon.Viewer | null = null;

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

    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };
  }, [dziUrl]);

  // Priority 1: DZI interactive viewer
  if (dziUrl) {
    return (
      <div
        ref={viewerRef}
        className="w-full h-64 sm:h-96 bg-black rounded-lg shadow-md openseadragon-container"
        aria-label={altText || 'Interactive whole slide image viewer'}
      />
    );
  }

  // Priority 2: Static fallback image
  if (staticImageUrl) {
    return (
      <div className="w-full h-64 sm:h-96 bg-black rounded-lg shadow-md flex items-center justify-center overflow-hidden openseadragon-container">
        <img
          src={staticImageUrl}
          alt={altText || 'Pathology slide image'}
          className="max-w-full max-h-full object-contain rounded-lg"
        />
      </div>
    );
  }

  // Priority 3: Placeholder
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