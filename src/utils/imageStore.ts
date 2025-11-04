import { StoredImage } from '../types.ts';
import {
    apiGetGalleryImagesMock,
    apiUpdateImageMetadataMock,
    apiDeleteImageMock,
    apiUploadImageMock,
} from '../api/mockApi.ts';

export const getGalleryImages = async (): Promise<StoredImage[]> => {
    try {
        return await apiGetGalleryImagesMock();
    } catch (e) {
        console.error("Failed to get gallery images from mock API:", e);
        return [];
    }
};

export const getOfficialImages = async (): Promise<StoredImage[]> => {
    const allImages = await getGalleryImages();
    return allImages.filter(img => img.category === 'official');
};

export const getCommunityImages = async (): Promise<StoredImage[]> => {
    const allImages = await getGalleryImages();
    return allImages.filter(img => img.category === 'community');
};

export const updateImageMetadata = async (updatedImage: StoredImage): Promise<void> => {
    await apiUpdateImageMetadataMock(updatedImage);
};

export const deleteImage = async (image: StoredImage): Promise<void> => {
    await apiDeleteImageMock(image);
};

export const uploadImage = async (
    file: File,
    title: string,
    description: string,
    uploader: string,
    category: 'official' | 'community'
): Promise<StoredImage> => {
    return await apiUploadImageMock(file, title, description, uploader, category);
};