import React, { useState, useEffect, useRef } from 'react';
import { StoredImage, User } from '../types';
import SectionHeader from './ui/SectionHeader';
import Card from './ui/Card';
import { getOfficialImages, saveOfficialImages, getCommunityImages, saveCommunityImages } from '../utils/imageStore';
import { XCircleIcon, PhotographIcon, CloudArrowUpIcon, ArrowDownTrayIcon, ShieldCheckIcon, EyeIcon, GlobeAltIcon } from './icons';
import ImageUploadForm from './ImageUploadForm';
import Alert from './ui/Alert';

const ImageGrid: React.FC<{
  images: StoredImage[];
  onImageClick: (image: StoredImage) => void;
  onDelete?: (imageId: string) => void;
  currentUser?: User;
  isModerationView?: boolean;
}> = ({ images, onImageClick, onDelete, currentUser, isModerationView = false }) => {
  if (images.length === 0) {
    return <p className="text-center text-slate-500 py-8">No images have been submitted to this gallery yet.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map(image => (
        <div key={image.id} className="group relative">
          <button
            onClick={() => onImageClick(image)}
            className="aspect-square w-full bg-slate-100 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            <img src={image.src} alt={image.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 p-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <h3 className="font-semibold text-sm leading-tight">{image.title}</h3>
              <p className="text-xs text-slate-300">by {image.uploader}</p>
            </div>
          </button>
          {currentUser?.isAdmin && onDelete && isModerationView && (
            <button
              onClick={() => onDelete(image.id)}
              className="absolute -top-2 -right-2 bg-white text-red-600 rounded-full p-0.5 shadow-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 opacity-100 transition-opacity"
              aria-label={`Delete image titled ${image.title}`}
            >
              <XCircleIcon className="h-6 w-6" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
};


const ImageModal: React.FC<{ image: StoredImage; onClose: () => void }> = ({ image, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
        window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    return (
        <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-modal-title"
        >
        <div className="relative p-4 bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            <img src={image.src} alt={image.title} className="object-contain max-w-full max-h-[calc(85vh-80px)] rounded" />
            <div className="pt-4 px-2 flex-shrink-0">
                <h2 id="image-modal-title" className="text-lg font-bold text-slate-800">{image.title}</h2>
                <p className="text-sm text-slate-600 mt-1">{image.description}</p>
                <p className="text-xs text-slate-400 mt-2">Uploaded by: {image.uploader}</p>
            </div>
            <button
            onClick={onClose}
            className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg text-slate-600 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
            aria-label="Close image viewer"
            >
            <XCircleIcon className="h-8 w-8" />
            </button>
        </div>
        </div>
    );
};


interface ImageGalleriesProps {
  user: User;
}

const ImageGalleries: React.FC<ImageGalleriesProps> = ({ user }) => {
  const [view, setView] = useState<'browse' | 'upload' | 'moderate'>('browse');
  const [officialImages, setOfficialImages] = useState<StoredImage[]>([]);
  const [communityImages, setCommunityImages] = useState<StoredImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<StoredImage | null>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [githubUrl, setGithubUrl] = useState('');
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);
  const importFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setOfficialImages(getOfficialImages());
    setCommunityImages(getCommunityImages());
  }, []);

  const handleUpload = (imageData: Omit<StoredImage, 'id' | 'uploader' | 'timestamp'>, targetGallery: 'official' | 'community') => {
    const newImage: StoredImage = {
      ...imageData,
      id: `img_${Date.now()}`,
      uploader: targetGallery === 'official' ? 'admin' : user.username,
      timestamp: Date.now(),
    };

    if (targetGallery === 'official' && user.isAdmin) {
      const updatedImages = [...officialImages, newImage];
      setOfficialImages(updatedImages);
      saveOfficialImages(updatedImages);
    } else {
      const updatedImages = [...communityImages, newImage];
      setCommunityImages(updatedImages);
      saveCommunityImages(updatedImages);
    }
    setMessage({type: 'success', text: `Image "${newImage.title}" uploaded successfully to ${targetGallery === 'official' ? 'Official Atlas' : 'Community Gallery'}.`})
    setView('browse'); // Switch back to browse view after upload
  };
  
  const handleDeleteCommunityImage = (imageId: string) => {
      const updatedImages = communityImages.filter(img => img.id !== imageId);
      setCommunityImages(updatedImages);
      saveCommunityImages(updatedImages);
  };

  const handleExport = () => {
    setMessage(null);
    try {
        const dataToExport = {
            official: getOfficialImages(),
            community: getCommunityImages(),
        };
        const dataStr = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gallery.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Gallery data exported successfully as gallery.json.' });
    } catch (e) {
        console.error("Export failed", e);
        setMessage({ type: 'error', text: 'Failed to export gallery data.' });
    }
  };
  
  const handleLoadFromUrl = async () => {
    if (!githubUrl || !githubUrl.startsWith('https')) {
        setMessage({ type: 'error', text: 'Please enter a valid HTTPS URL.' });
        return;
    }
    setMessage(null);
    setIsLoadingFromUrl(true);
    try {
        const response = await fetch(githubUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();

        if (Array.isArray(data.official) && Array.isArray(data.community)) {
            saveOfficialImages(data.official);
            saveCommunityImages(data.community);
            setOfficialImages(data.official);
            setCommunityImages(data.community);
            setMessage({ type: 'success', text: 'Gallery successfully synced from URL.' });
            setGithubUrl('');
        } else {
            throw new Error('Invalid file format. The JSON must contain "official" and "community" arrays.');
        }
    } catch (err: any) {
        console.error("Import from URL failed", err);
        setMessage({ type: 'error', text: `Import failed: ${err.message}` });
    } finally {
        setIsLoadingFromUrl(false);
    }
  };

  const NavTab: React.FC<{
    targetView: 'browse' | 'upload' | 'moderate';
    currentView: 'browse' | 'upload' | 'moderate';
    onClick: (view: 'browse' | 'upload' | 'moderate') => void;
    icon: React.ReactNode;
    children: React.ReactNode;
  }> = ({ targetView, currentView, onClick, icon, children }) => {
    const isActive = targetView === currentView;
    return (
        <button
            onClick={() => onClick(targetView)}
            className={`flex items-center justify-center w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 text-left ${
                isActive
                ? 'bg-primary-200 text-primary-900 font-bold shadow-md'
                : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
        >
            <div className="mr-2">{icon}</div>
            {children}
        </button>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader 
        title="Image Galleries"
        subtitle="Browse curated images or contribute to the community collection."
        icon={<PhotographIcon className="h-10 w-10"/>}
      />
      
      <Card>
        <h3 className="text-xl font-semibold font-serif text-slate-800 mb-4 text-center">Sync with GitHub Repository</h3>
        <div className="text-slate-600 text-sm mb-6 max-w-3xl mx-auto space-y-4 prose prose-sm prose-slate">
            <p>
                To use GitHub as a dedicated storage area for your galleries, follow this secure workflow. This method allows you to version-control your gallery data without exposing any sensitive credentials in the application.
            </p>
            <ol>
                <li>
                    <strong>Export Gallery Data:</strong> Click the "Export Gallery" button to download a single <code>gallery.json</code> file. This file contains all image data and metadata.
                </li>
                <li>
                    <strong>Commit to GitHub:</strong> Add the downloaded <code>gallery.json</code> file to your GitHub repository. Commit and push the changes. This creates a persistent, version-controlled backup.
                </li>
                <li>
                    <strong>Load from GitHub:</strong> Navigate to the <code>gallery.json</code> file in your GitHub repository, click the "Raw" button to get the direct file URL, and paste it into the "Load from URL" field below to sync the application.
                </li>
            </ol>
        </div>

        {message && (
            <div className="mb-4">
                <Alert type={message.type}>{message.text}</Alert>
            </div>
        )}
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <button
                    onClick={handleExport}
                    className="w-full sm:w-auto flex items-center justify-center bg-sky-600 text-white font-semibold py-2.5 px-6 rounded-lg hover:bg-sky-700 transition-colors shadow-sm"
                >
                    <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                    Export Gallery
                </button>
            </div>
            <div className="pt-4 border-t border-slate-200 max-w-xl mx-auto">
                <label htmlFor="github-url" className="block text-sm font-medium text-center text-slate-700 mb-2">Load from URL (e.g., raw GitHub link)</label>
                <div className="flex gap-2">
                    <input 
                        id="github-url"
                        type="url"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        className="w-full border border-slate-400 rounded-md shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm p-2"
                        placeholder="https://raw.githubusercontent.com/.../gallery.json"
                    />
                    <button
                        onClick={handleLoadFromUrl}
                        disabled={isLoadingFromUrl}
                        className="flex-shrink-0 flex items-center justify-center bg-slate-600 text-white font-semibold px-4 rounded-lg hover:bg-slate-700 transition-colors shadow-sm disabled:bg-slate-300"
                    >
                        <GlobeAltIcon className="h-5 w-5 mr-2" />
                        {isLoadingFromUrl ? 'Loading...' : 'Load'}
                    </button>
                </div>
            </div>
        </div>
      </Card>

      <Card>
        <div className="mb-6 flex flex-col sm:flex-row gap-2 border-b border-slate-200 pb-4">
            <NavTab targetView="browse" currentView={view} onClick={setView} icon={<EyeIcon className="h-5 w-5"/>}>Browse Galleries</NavTab>
            <NavTab targetView="upload" currentView={view} onClick={setView} icon={<CloudArrowUpIcon className="h-5 w-5"/>}>Upload an Image</NavTab>
            {user.isAdmin && (
                <NavTab targetView="moderate" currentView={view} onClick={setView} icon={<ShieldCheckIcon className="h-5 w-5"/>}>Moderate Submissions</NavTab>
            )}
        </div>
        
        {view === 'browse' && (
            <div className="space-y-8">
                <Card className="!shadow-none border-dashed border-2 bg-slate-50/50">
                    <h3 className="text-xl font-semibold font-serif text-slate-800 mb-4">Official Atlas</h3>
                    <ImageGrid images={officialImages} onImageClick={setSelectedImage} />
                </Card>
                <Card className="!shadow-none border-dashed border-2 bg-slate-50/50">
                    <h3 className="text-xl font-semibold font-serif text-slate-800 mb-4">Community Submissions</h3>
                    <ImageGrid images={communityImages} onImageClick={setSelectedImage} currentUser={user} />
                </Card>
            </div>
        )}

        {view === 'upload' && (
             <Card className="!shadow-none border-dashed border-2 bg-slate-50/50">
                <h3 className="font-semibold text-slate-800 mb-4 text-center">Contribute an Image</h3>
                <ImageUploadForm onUpload={handleUpload} showGallerySelector={user.isAdmin}/>
            </Card>
        )}

        {view === 'moderate' && user.isAdmin && (
             <Card className="!shadow-none border-dashed border-2 bg-slate-50/50">
                <h3 className="text-xl font-semibold font-serif text-slate-800 mb-4">Moderate Community Submissions</h3>
                <ImageGrid 
                    images={communityImages} 
                    onImageClick={setSelectedImage} 
                    onDelete={handleDeleteCommunityImage}
                    currentUser={user}
                    isModerationView={true}
                />
            </Card>
        )}
      </Card>
      
      {selectedImage && <ImageModal image={selectedImage} onClose={() => setSelectedImage(null)} />}
    </div>
  );
};

export default ImageGalleries;