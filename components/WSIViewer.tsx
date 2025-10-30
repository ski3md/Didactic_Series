import React from 'react';

interface WSIViewerProps {
  src: string;
}

const WSIViewer: React.FC<WSIViewerProps> = ({ src }) => {
  return (
    <img src={src} alt="Static slide" style={{ width: '100%', height: 'auto', borderRadius: '8px' }} />
  );
};

export default WSIViewer;
