
import React, { useEffect, useRef } from 'react';

// Inform TypeScript about the global OpenSeadragon variable from the script tag
declare var OpenSeadragon: any;

interface WSIViewerProps {
  dziUrl: string;
}

const WSIViewer: React.FC<WSIViewerProps> = ({ dziUrl }) => {
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let viewer: any = null;
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

  return (
    <div 
        ref={viewerRef} 
        className="w-full h-96 bg-black rounded-lg shadow-md openseadragon-container"
        aria-label="Interactive whole slide image viewer"
    >
    </div>
  );
};

export default WSIViewer;
