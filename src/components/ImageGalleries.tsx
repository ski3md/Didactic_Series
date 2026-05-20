import React, { useState, useEffect, useCallback } from 'react';
import { StoredImage, User } from '../types.ts';
import Card from './ui/Card.tsx';
import { getGalleryImages, updateImageMetadata, deleteImage } from '../utils/imageStore.ts';
import { XCircleIcon, CloudArrowUpIcon, ShieldCheckIcon, EyeIcon, EditIcon } from './icons.tsx';
import { ImageUploadForm } from './ImageUploadForm.tsx';
import { ReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import {
  buildPathologySearchText,
  inferMagnification,
  inferMorphologyTags,
  inferStain,
  normalizePathologyTitle,
} from '../utils/pathologyImageReview.ts';

type CombinedImage = StoredImage & { isOfficial: boolean };

const normalizeDedupeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeImageSrc = (value?: string) =>
  (value || '')
    .replace(/^https:\/\/storage\.googleapis\.com\/granuloma-lecture-bucket\//, '')
    .replace(/^\/?Didactic_Series\//, '')
    .replace(/^\/+/, '')
    .split(/[?#]/)[0]
    .toLowerCase();

const dedupeGalleryImages = (images: CombinedImage[]) => {
  const seen = new Set<string>();
  return images.filter((image) => {
    const srcKey = normalizeImageSrc(image.src || image.gcsPath);
    const displayKey = [
      normalizeDedupeText(image.entity || image.title),
      normalizeDedupeText(image.family),
      normalizeDedupeText(image.category),
      normalizeDedupeText(image.atlasCollection),
    ]
      .filter(Boolean)
      .join('|');
    const key = displayKey || srcKey || image.id;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const imageFallback =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 240"><rect width="320" height="240" fill="#f1f5f9"/><path d="M86 76h148v88H86z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="3"/><circle cx="128" cy="112" r="17" fill="#94a3b8"/><path d="M98 154l44-38 30 27 20-18 30 29z" fill="#cbd5e1"/><text x="160" y="198" text-anchor="middle" fill="#475569" font-family="Arial" font-size="16">Image unavailable</text></svg>'
  );

const ImageGrid: React.FC<{
  images: CombinedImage[];
  onImageClick: (image: StoredImage) => void;
  onDelete?: (image: StoredImage) => void;
  onEdit?: (image: StoredImage) => void;
  currentUser?: User | null;
}> = ({ images, onImageClick, onDelete, onEdit, currentUser }) => {
  if (images.length === 0) {
    return (
      <p className="text-center text-slate-600 py-8">
        No images match the current search.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {images.map((image, index) => (
        <div key={`${image.atlasCollection || image.category}-${image.id}-${index}`} className="group relative">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="cursor-pointer bg-slate-950" onClick={() => onImageClick(image)}>
              <img
                src={image.src}
                alt={image.title}
                loading="lazy"
                className="h-44 w-full object-contain transition-transform duration-300 group-hover:scale-[1.02]"
                onError={(e) => (e.currentTarget.src = imageFallback)}
              />
            </div>
            <div className="space-y-2 p-3">
              <div className="flex flex-wrap gap-1.5">
                {[inferStain(image.title, image.description, ...(image.tags || [])), image.magnification || inferMagnification(image.title, image.description)]
                  .filter(Boolean)
                  .map((chip) => (
                    <span key={chip} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {chip}
                    </span>
                  ))}
              </div>
              <h3 className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950">
                {normalizePathologyTitle(image.entity || image.title)}
              </h3>
              <p className="line-clamp-2 text-xs leading-4 text-slate-600">
                {[image.family, ...inferMorphologyTags(image.title, image.description, ...(image.tags || []))].filter(Boolean).slice(0, 3).join(' • ') || 'Pathology review image'}
              </p>
            </div>
          </div>
          {image.isOfficial && (
            <div
              className="absolute top-1.5 left-1.5 bg-sky-600 text-white rounded-full p-1 shadow-md"
              title="Teaching image"
            >
              <ShieldCheckIcon className="h-4 w-4" />
            </div>
          )}
          {currentUser?.isAdmin && (onDelete || onEdit) && (
            <div className="absolute -top-2 -right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(image);
                  }}
                  className="bg-white text-rose-600 rounded-full p-0.5 shadow-md hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-1"
                  aria-label={`Delete image titled ${image.title}`}
                >
                  <XCircleIcon className="h-6 w-6" />
                </button>
              )}
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(image);
                  }}
                  className="bg-white text-sky-600 rounded-full p-0.5 shadow-md hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1"
                  aria-label={`Edit image details for ${image.title}`}
                >
                  <EditIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ImageDetailsModal: React.FC<{
  image: StoredImage;
  onClose: () => void;
  onSave: (updatedImage: StoredImage) => void;
  isAdmin: boolean;
}> = ({ image, onClose, onSave, isAdmin }) => {
  const [title, setTitle] = useState(image.title);
  const [description, setDescription] = useState(image.description);
  const [tags, setTags] = useState((image.tags || []).join(', '));

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    const updatedImage: StoredImage = {
      ...image,
      title,
      description,
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    };
    onSave(updatedImage);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative p-4 bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full flex flex-col sm:flex-row gap-6 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full sm:w-1/2 flex-shrink-0">
          <img
            src={image.src}
            alt={image.title}
            loading="lazy"
            className="object-contain w-full h-full max-h-[85vh] rounded"
            onError={(e) => (e.currentTarget.src = imageFallback)}
          />
        </div>
        <div className="w-full sm:w-1/2 space-y-4 flex flex-col">
          <h2 className="text-xl font-bold font-serif text-slate-900 flex items-center">
            <EditIcon className="h-5 w-5 mr-2 text-sky-700" />{' '}
            {isAdmin ? 'Edit Image Details' : 'Image Review'}
          </h2>
          <div className="flex-grow space-y-4">
            <label className="block text-sm font-medium text-slate-800">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2"
              readOnly={!isAdmin}
            />
            <label className="block text-sm font-medium text-slate-800">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full border border-slate-300 rounded-md p-2"
              readOnly={!isAdmin}
            />
            <label className="block text-sm font-medium text-slate-800">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full border border-slate-300 rounded-md p-2"
              placeholder="e.g., sarcoidosis, noncaseating, fungal"
              readOnly={!isAdmin}
            />
            <p className="text-xs text-slate-500 mt-1">Separate tags with commas.</p>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md"
            >
              Close
            </button>
            {isAdmin && (
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-md"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 bg-white rounded-full p-1 shadow-lg text-slate-600 hover:text-slate-900 focus:ring-2 focus:ring-sky-500 transition-colors"
        >
          <XCircleIcon className="h-8 w-8" />
        </button>
      </div>
    </div>
  );
};

interface ImageGalleriesProps {
  user: User | null;
  focusIntent?: ReferenceLibraryIntent | null;
}

const ImageGalleries: React.FC<ImageGalleriesProps> = ({ user, focusIntent }) => {
  const [view, setView] = useState<'browse' | 'upload' | 'moderate'>('browse');
  const [allImages, setAllImages] = useState<CombinedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<StoredImage | null>(null);
  const [isLoadingGalleries, setIsLoadingGalleries] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setSearchQuery((focusIntent?.focusTerms || []).join(' '));
    setView('browse');
  }, [focusIntent]);

  const loadGalleries = useCallback(async () => {
    setIsLoadingGalleries(true);
    setError(null);
    try {
      const imagesFromDb = await getGalleryImages();
      const combined = imagesFromDb
        .map((img) => ({ ...img, isOfficial: img.category === 'official' }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setAllImages(dedupeGalleryImages(combined));
    } catch (e: any) {
      console.error(e);
      setError(`Error loading gallery: ${e.message}`);
    } finally {
      setIsLoadingGalleries(false);
    }
  }, []);

  useEffect(() => {
    loadGalleries();
  }, [loadGalleries]);

  const handleSaveImageDetails = async (updatedImage: StoredImage) => {
    try {
      await updateImageMetadata(updatedImage);
      setSelectedImage(null);
      loadGalleries();
    } catch (error: any) {
      console.error('Failed to save image details:', error);
      setError(`Failed to save changes: ${error.message}`);
    }
  };

  const handleDeleteImage = async (imageToDelete: StoredImage) => {
    if (!window.confirm(`Delete "${imageToDelete.title}"?`)) return;
    try {
      await deleteImage(imageToDelete);
      loadGalleries();
    } catch (error: any) {
      console.error('Failed to delete image:', error);
      setError(`Failed to delete image: ${error.message}`);
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
        className={`flex items-center justify-center w-full sm:w-auto px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
          isActive
            ? 'bg-sky-100 text-sky-800 font-bold shadow-md'
            : 'text-slate-700 hover:bg-slate-200'
        }`}
      >
        <div className="mr-2">{icon}</div>
        {children}
      </button>
    );
  };

  const communitySubmissions = allImages.filter((img) => !img.isOfficial);
  const browseImages = allImages.filter((image) => {
    const lowered = searchQuery.trim().toLowerCase();
    if (!lowered) {
      return true;
    }
    return buildPathologySearchText(
      image.title,
      image.description,
      image.entity || '',
      image.family || '',
      ...(image.tags || []),
      ...(image.cells || []),
    ).includes(lowered);
  });

  return (
    <div className="animate-fade-in space-y-8">
      <Card>
        {error && (
          <div className="mb-4">
            <Card className="!mb-0 bg-rose-50 border-rose-400 text-rose-800">{error}</Card>
          </div>
        )}

        <div className="mb-6 flex flex-col sm:flex-row gap-2 border-b border-slate-200 pb-4">
          <NavTab targetView="browse" currentView={view} onClick={setView} icon={<EyeIcon className="h-5 w-5" />}>
            Browse Images
          </NavTab>
          {user?.isAdmin && (
            <>
              <NavTab targetView="upload" currentView={view} onClick={setView} icon={<CloudArrowUpIcon className="h-5 w-5" />}>
                Add Teaching Image
              </NavTab>
              <NavTab targetView="moderate" currentView={view} onClick={setView} icon={<ShieldCheckIcon className="h-5 w-5" />}>
                Review Submissions
              </NavTab>
            </>
          )}
        </div>

        {isLoadingGalleries ? (
          <p className="text-center text-slate-600 py-8">Loading galleries...</p>
        ) : (
          <>
            {view === 'browse' && (
              <Card className="!shadow-none border-dashed border-2 bg-slate-50/50">
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h3 className="text-xl font-semibold font-serif text-slate-900">Image Review</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {focusIntent?.title
                        ? `Focused on ${focusIntent.title}. Adjust or clear the search to review additional images.`
                        : 'Browse the image library or narrow it with diagnosis, stain, magnification, morphology, or differential terms.'}
                    </p>
                  </div>
                  <label className="block lg:w-80">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search</span>
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search diagnosis, stain, magnification, morphology, buzzword, or organ system"
                      className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                    />
                  </label>
                </div>
                {focusIntent?.focusTerms && focusIntent.focusTerms.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {focusIntent.focusTerms.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => setSearchQuery(term)}
                        className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-800 transition hover:border-sky-300 hover:bg-sky-50"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
                <ImageGrid
                  images={browseImages}
                  onImageClick={setSelectedImage}
                  currentUser={user}
                  onDelete={user?.isAdmin ? (image) => (!image.readOnly ? handleDeleteImage(image) : undefined) : undefined}
                  onEdit={user?.isAdmin ? (image) => (!image.readOnly ? setSelectedImage(image) : undefined) : undefined}
                />
              </Card>
            )}

            {view === 'upload' && (
              <Card className="!shadow-none border-dashed border-2 bg-slate-50/50">
                <ImageUploadForm onUploadSuccess={loadGalleries} user={user} showGallerySelector={!!user?.isAdmin} />
              </Card>
            )}

            {view === 'moderate' && user?.isAdmin && (
              <Card className="!shadow-none border-dashed border-2 bg-slate-50/50">
                <h3 className="text-xl font-semibold font-serif text-slate-900 mb-4">
                  Moderate Community Submissions
                </h3>
                <ImageGrid
                  images={communitySubmissions.filter((image) => !image.readOnly)}
                  onImageClick={setSelectedImage}
                  onDelete={handleDeleteImage}
                  onEdit={setSelectedImage}
                  currentUser={user}
                />
              </Card>
            )}
          </>
        )}
      </Card>

      {selectedImage && (
        <ImageDetailsModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onSave={handleSaveImageDetails}
          isAdmin={!!user?.isAdmin}
        />
      )}
    </div>
  );
};

export default ImageGalleries;
