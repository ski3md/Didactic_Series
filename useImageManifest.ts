// React Hook for Image Manifest
// Provides utilities to query and use granuloma images in dashboard components

import { useEffect, useState, useMemo } from 'react';
import imageManifest from '../assets/data/image_manifest.json';

// Type definitions
interface ImageMetadata {
  id: string;
  entity: string;
  category: string;
  pattern: string;
  cells: string[];
  stain: string;
  stainRole: string;
  organ: string;
  system: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  path: string;
  tags: string[];
  teachingPoint: string;
  source: string;
  filename: string;
  aiEnhanced?: boolean;
  aiEnrichmentDate?: string;
  aiEnrichmentError?: string;
}

interface ManifestData {
  generated: string;
  ai_enhanced: boolean;
  version: string;
  schema: string;
  categories: {
    [category: string]: {
      [entity: string]: {
        [stain: string]: ImageMetadata[];
      };
    };
  };
}

// Hook to use image manifest
export const useImageManifest = () => {
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app, you might fetch this data
    // For now, we'll use the imported JSON
    try {
      setManifest(imageManifest as ManifestData);
      setLoading(false);
    } catch (err) {
      setError('Failed to load image manifest');
      setLoading(false);
    }
  }, []);

  // Get all images by entity
  const getImagesByEntity = useMemo(() => {
    if (!manifest) return () => [];
    
    return (entity: string, stain?: string): ImageMetadata[] => {
      const images: ImageMetadata[] = [];
      
      Object.values(manifest.categories).forEach(category => {
        if (category[entity]) {
          Object.entries(category[entity]).forEach(([stainName, stainImages]) => {
            if (!stain || stain === stainName) {
              images.push(...stainImages);
            }
          });
        }
      });
      
      return images;
    };
  }, [manifest]);

  // Get all images by category
  const getImagesByCategory = useMemo(() => {
    if (!manifest) return () => [];
    
    return (category: string, stain?: string): ImageMetadata[] => {
      const images: ImageMetadata[] = [];
      
      if (manifest.categories[category]) {
        Object.values(manifest.categories[category]).forEach(entity => {
          Object.entries(entity).forEach(([stainName, stainImages]) => {
            if (!stain || stain === stainName) {
              images.push(...stainImages);
            }
          });
        });
      }
      
      return images;
    };
  }, [manifest]);

  // Get all images by stain
  const getImagesByStain = useMemo(() => {
    if (!manifest) return () => [];
    
    return (stain: string): ImageMetadata[] => {
      const images: ImageMetadata[] = [];
      
      Object.values(manifest.categories).forEach(category => {
        Object.values(category).forEach(entity => {
          if (entity[stain]) {
            images.push(...entity[stain]);
          }
        });
      });
      
      return images;
    };
  }, [manifest]);

  // Get random images for case studies
  const getRandomImages = useMemo(() => {
    if (!manifest) return () => [];
    
    return (count: number, difficulty?: 'beginner' | 'intermediate' | 'advanced'): ImageMetadata[] => {
      const allImages: ImageMetadata[] = [];
      
      Object.values(manifest.categories).forEach(category => {
        Object.values(category).forEach(entity => {
          Object.values(entity).forEach(stainImages => {
            allImages.push(...stainImages);
          });
        });
      });
      
      // Filter by difficulty if specified
      const filteredImages = difficulty 
        ? allImages.filter(img => img.difficulty === difficulty)
        : allImages;
      
      // Shuffle and return requested count
      const shuffled = [...filteredImages].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    };
  }, [manifest]);

  // Get images by tags
  const getImagesByTags = useMemo(() => {
    if (!manifest) return () => [];
    
    return (tags: string[], matchAll: boolean = false): ImageMetadata[] => {
      const allImages: ImageMetadata[] = [];
      
      Object.values(manifest.categories).forEach(category => {
        Object.values(category).forEach(entity => {
          Object.values(entity).forEach(stainImages => {
            allImages.push(...stainImages);
          });
        });
      });
      
      // Filter by tags
      return allImages.filter(img => {
        if (matchAll) {
          return tags.every(tag => img.tags.includes(tag));
        } else {
          return tags.some(tag => img.tags.includes(tag));
        }
      });
    };
  }, [manifest]);

  return {
    manifest,
    loading,
    error,
    getImagesByEntity,
    getImagesByCategory,
    getImagesByStain,
    getRandomImages,
    getImagesByTags
  };
};

// Export types for use in components
export type { ImageMetadata, ManifestData };