import { StoredImage } from '../types';

const OFFICIAL_IMAGES_KEY = 'pathology_module_official_images';
const COMMUNITY_IMAGES_KEY = 'pathology_module_community_images';

// --- Official Images ---

export const getOfficialImages = (): StoredImage[] => {
  try {
    const images = localStorage.getItem(OFFICIAL_IMAGES_KEY);
    return images ? JSON.parse(images) : [];
  } catch (error) {
    console.error("Failed to parse official images from localStorage:", error);
    return [];
  }
};

export const saveOfficialImages = (images: StoredImage[]): void => {
  try {
    localStorage.setItem(OFFICIAL_IMAGES_KEY, JSON.stringify(images));
  } catch (error) {
    console.error("Failed to save official images to localStorage:", error);
  }
};

// --- Community Images ---

export const getCommunityImages = (): StoredImage[] => {
  try {
    const images = localStorage.getItem(COMMUNITY_IMAGES_KEY);
    return images ? JSON.parse(images) : [];
  } catch (error) {
    console.error("Failed to parse community images from localStorage:", error);
    return [];
  }
};

export const saveCommunityImages = (images: StoredImage[]): void => {
  try {
    localStorage.setItem(COMMUNITY_IMAGES_KEY, JSON.stringify(images));
  } catch (error) {
    console.error("Failed to save community images to localStorage:", error);
  }
};
