import React, { useState, useCallback } from 'react';
import { User } from '../types.ts';
import Alert from './ui/Alert.tsx';
import { uploadImage } from '../utils/imageStore.ts';

type TargetGallery = 'official' | 'community';

interface ImageUploadFormProps {
    onUploadSuccess: () => void;
    showGallerySelector?: boolean;
    user: User | null;
}

export const ImageUploadForm: React.FC<ImageUploadFormProps> = ({ onUploadSuccess, showGallerySelector = false, user }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [targetGallery, setTargetGallery] = useState<TargetGallery>('community');
    const [isProcessing, setIsProcessing] = useState(false);
    
    const handleFile = useCallback(async (file: File) => {
        if (!file.type.startsWith('image/')) {
            setError('Please upload a valid image file (e.g., JPG, PNG, GIF).');
            return;
        }
        setError(null);
        setTitle(file.name.split('.').slice(0, -1).join('.') || file.name); // Auto-fill title
        
        // Use FileReader to create a preview
        const reader = new FileReader();
        reader.onload = (e) => {
            setImageSrc(e.target?.result as string);
        };
        reader.readAsDataURL(file);
        
        setSelectedFile(file);
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile || !title) {
            setError('An image and a title are required to submit.');
            return;
        }
        setIsProcessing(true);
        setError(null);

        try {
            await uploadImage(
                selectedFile,
                title,
                description,
                user?.username || 'anonymous',
                showGallerySelector ? targetGallery : 'community'
            );
            
            // Reset form and let the parent component know the upload is done
            setTitle('');
            setDescription('');
            setImageSrc(null);
            setSelectedFile(null);
            onUploadSuccess();

        } catch (err: any) {
            setError(`Upload failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const dropHandler = useCallback((ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        setIsDragging(false);
        if (ev.dataTransfer.items && ev.dataTransfer.items[0].kind === 'file') {
            const file = ev.dataTransfer.items[0].getAsFile();
            if (file) handleFile(file);
        }
    }, [handleFile]);

    const dragOverHandler = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        setIsDragging(true);
    };
    
    const dragLeaveHandler = () => {
        setIsDragging(false);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg mx-auto">
            {error && <Alert type="error">{error}</Alert>}
            
            <div 
                onDrop={dropHandler}
                onDragOver={dragOverHandler}
                onDragLeave={dragLeaveHandler}
                className={`mt-2 flex justify-center rounded-lg border border-dashed px-6 py-10 transition-colors ${isDragging ? 'border-sky-600 bg-sky-50' : 'border-slate-900/25'}`}
            >
                <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-300" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                    </svg>
                    <div className="mt-4 flex text-sm leading-6 text-slate-700">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-sky-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-sky-600 focus-within:ring-offset-2 hover:text-sky-600">
                            <span>Upload a file</span>
                            <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 text-slate-700">PNG, JPG, GIF up to 10MB</p>
                </div>
            </div>

            {isProcessing && (
                <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-sky-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm text-slate-600">Processing...</span>
                </div>
            )}

            {imageSrc && !isProcessing && (
                 <div className="mt-4 text-center">
                    <p className="text-sm font-medium text-slate-800 mb-2">Image Preview:</p>
                    <img src={imageSrc} alt="Preview" className="max-h-40 mx-auto rounded-md border p-1" />
                </div>
            )}
            
            <div>
                <label htmlFor="title" className="block text-sm font-medium leading-6 text-slate-900">Title <span className="text-rose-600">*</span></label>
                <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required className="mt-1 block w-full rounded-md border-2 border-sky-500 shadow-sm focus:border-sky-600 focus:ring-sky-600 sm:text-sm p-2" />
            </div>

            <div>
                <label htmlFor="description" className="block text-sm font-medium leading-6 text-slate-900">Description</label>
                <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-2 border-sky-500 shadow-sm focus:border-sky-600 focus:ring-sky-600 sm:text-sm p-2"></textarea>
            </div>

            {showGallerySelector && (
                 <div>
                    <label className="block text-sm font-medium leading-6 text-slate-900">Target Gallery</label>
                    <fieldset className="mt-2">
                        <legend className="sr-only">Choose a gallery to upload to</legend>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center">
                                <input id="community" name="gallery-type" type="radio" value="community" checked={targetGallery === 'community'} onChange={(e) => setTargetGallery(e.target.value as TargetGallery)} className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-600" />
                                <label htmlFor="community" className="ml-2 block text-sm font-medium text-slate-800">Community Gallery</label>
                            </div>
                            <div className="flex items-center">
                                <input id="official" name="gallery-type" type="radio" value="official" checked={targetGallery === 'official'} onChange={(e) => setTargetGallery(e.target.value as TargetGallery)} className="h-4 w-4 border-gray-300 text-sky-600 focus:ring-sky-600" />
                                <label htmlFor="official" className="ml-2 block text-sm font-medium text-slate-800">Official Atlas</label>
                            </div>
                        </div>
                    </fieldset>
                </div>
            )}
            
            <div className="text-right pt-2">
                <button type="submit" className="inline-flex justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:bg-slate-300 disabled:text-slate-600 disabled:cursor-not-allowed" disabled={!selectedFile || !title || isProcessing}>
                    {isProcessing ? 'Uploading...' : 'Submit Image'}
                </button>
            </div>
        </form>
    );
};