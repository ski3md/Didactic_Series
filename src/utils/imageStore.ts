import { StoredImage } from '../types.ts';
import {
    apiGetGalleryImagesMock,
    apiUpdateImageMetadataMock,
    apiDeleteImageMock,
    apiUploadImageMock,
} from '../api/mockApi.ts';

let cachedImages: StoredImage[] | null = null;
let inflightRequest: Promise<StoredImage[]> | null = null;

export const clearGalleryCache = () => {
    cachedImages = null;
};

export const getGalleryImages = async (forceRefresh = false): Promise<StoredImage[]> => {
    if (!forceRefresh && cachedImages) {
        return cachedImages;
    }

    if (!forceRefresh && inflightRequest) {
        return inflightRequest;
    }

    inflightRequest = apiGetGalleryImagesMock()
        .then(images => {
            cachedImages = images;
            return images;
        })
        .catch(e => {
            console.error("Failed to get gallery images from mock API:", e);
            return [];
        })
        .finally(() => {
            inflightRequest = null;
        });

    return inflightRequest;
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
    clearGalleryCache();
};

export const deleteImage = async (image: StoredImage): Promise<void> => {
    await apiDeleteImageMock(image);
    clearGalleryCache();
};

export const uploadImage = async (
    file: File,
    title: string,
    description: string,
    uploader: string,
    category: 'official' | 'community'
): Promise<StoredImage> => {
    const created = await apiUploadImageMock(file, title, description, uploader, category);
    clearGalleryCache();
    return created;
};
