import React, { useState, useCallback } from 'react';
import { User } from '../types.ts';
import { uploadImage } from '../utils/imageStore.ts';
import Alert from './ui/Alert.tsx';
// FIX: Imported the Card component to resolve reference errors.
import Card from './ui/Card.tsx';
import { CloudArrowUpIcon, CheckCircleIcon } from './icons.tsx';

interface FileUploadProgress {
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const BulkUpload: React.FC<{
    onBulkUploadSuccess: () => void;
    showGallerySelector?: boolean;
    user: User | null;
}> = ({ onBulkUploadSuccess, showGallerySelector, user }) => {
    const [files, setFiles] = useState<FileUploadProgress[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const handleFiles = useCallback((fileList: FileList) => {
        const newFiles: FileUploadProgress[] = Array.from(fileList)
            .filter(file => file.type.startsWith('image/'))
            .map(file => ({ name: file.name, status: 'pending' }));
        setFiles(prev => [...prev, ...newFiles]);

        const startUpload = async () => {
            setIsUploading(true);
            for (let i = 0; i < fileList.length; i++) {
                const file = fileList[i];
                if (!file.type.startsWith('image/')) continue;
                
                setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'uploading' } : f));
                try {
                    const title = file.name.split('.').slice(0, -1).join('.') || file.name;
                    await uploadImage(file, title, '', user?.username || 'anonymous', 'community');
                    setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'success' } : f));
                } catch (e: any) {
                    setFiles(prev => prev.map(f => f.name === file.name ? { ...f, status: 'error', error: e.message } : f));
                }
            }
            setIsUploading(false);
            onBulkUploadSuccess();
        };
        startUpload();
    }, [user, onBulkUploadSuccess]);

    const dropHandler = useCallback((ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        setIsDragging(false);
        if (ev.dataTransfer.files) {
            handleFiles(ev.dataTransfer.files);
        }
    }, [handleFiles]);
    
    const dragOverHandler = (ev: React.DragEvent<HTMLDivElement>) => {
        ev.preventDefault();
        setIsDragging(true);
    };

    const dragLeaveHandler = () => setIsDragging(false);
    
    const getStatusIcon = (status: FileUploadProgress['status']) => {
        switch (status) {
            case 'uploading': return <div className="h-4 w-4 border-2 border-slate-400 border-t-sky-600 rounded-full animate-spin"></div>;
            case 'success': return <CheckCircleIcon className="h-5 w-5 text-teal-500" />;
            case 'error': return <CheckCircleIcon className="h-5 w-5 text-rose-500" />;
            default: return <div className="h-4 w-4 border-2 border-slate-300 rounded-full"></div>;
        }
    };

    return (
        <div className="space-y-4">
             <div 
                onDrop={dropHandler}
                onDragOver={dragOverHandler}
                onDragLeave={dragLeaveHandler}
                className={`flex justify-center rounded-lg border border-dashed px-6 py-10 transition-colors ${isDragging ? 'border-sky-600 bg-sky-50' : 'border-slate-900/25'}`}
            >
                <div className="text-center">
                    <CloudArrowUpIcon className="mx-auto h-12 w-12 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold text-slate-800">Drag &amp; Drop to Bulk Upload</p>
                    <p className="text-xs text-slate-600">All images will be added to the Community gallery.</p>
                </div>
            </div>
            {files.length > 0 && (
                <Card className="!mt-4 max-h-60 overflow-y-auto">
                    <h3 className="text-sm font-semibold mb-2">Upload Progress</h3>
                    <ul className="space-y-2">
                        {files.map(file => (
                            <li key={file.name} className="flex items-center justify-between text-sm">
                                <span className="truncate pr-4">{file.name}</span>
                                <span className="flex-shrink-0">{getStatusIcon(file.status)}</span>
                            </li>
                        ))}
                    </ul>
                </Card>
            )}
            {isUploading && <Alert type="info">Uploading in progress. Please wait...</Alert>}
        </div>
    );
};

export default BulkUpload;