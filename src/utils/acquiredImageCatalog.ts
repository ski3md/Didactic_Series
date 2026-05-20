import acquiredLectureImagesSource from '../content/images/acquiredLectureImages.json';
import { StoredImage } from '../types.ts';
import { inferMagnification, inferStain, normalizePathologyTitle } from './pathologyImageReview.ts';

interface AcquiredLectureImageSource extends Omit<StoredImage, 'atlasCollection'> {
  originalUrl?: string;
  atlasCollection?: 'acquired';
  stain?: string;
}

const baseUrl = import.meta.env.BASE_URL || '/';

const withBaseUrl = (assetPath: string) => {
  if (/^https?:\/\//i.test(assetPath) || assetPath.startsWith('data:')) {
    return assetPath;
  }
  return `${baseUrl}${assetPath.replace(/^\/+/, '')}`;
};

const acquiredLectureImages = acquiredLectureImagesSource as AcquiredLectureImageSource[];

const cleanTeachingDescription = (description?: string, title?: string) => {
  const fallback = title ? `${title}.` : 'Histology image.';
  return (description || fallback)
    .replace(/^Acquired lecture image for /i, '')
    .replace(/\breference image\b/gi, 'histology image')
    .replace(/\bdifferential anchoring\b/gi, 'differential diagnosis')
    .replace(/\s*;\s*replace with exact.*$/i, '.')
    .trim();
};

const cleanTeachingTags = (tags?: string[]) =>
  (tags || []).filter((tag) => !/lecture-acquired|acquired|curated|promoted|manifest|source/i.test(tag));

const acquiredUrlMap = new Map(
  acquiredLectureImages
    .flatMap((image) =>
      [
        image.originalUrl,
        image.gcsPath,
        image.sourceUrl,
      ]
        .filter((url): url is string => Boolean(url))
        .map((url) => [url, withBaseUrl(image.src)] as const)
    )
);

export const getAcquiredLectureImages = (): StoredImage[] =>
  acquiredLectureImages.map((image) => ({
    ...image,
    src: withBaseUrl(image.src),
    title: normalizePathologyTitle(image.title),
    entity: image.entity ? normalizePathologyTitle(image.entity) : normalizePathologyTitle(image.title),
    description: cleanTeachingDescription(image.description, image.title),
    tags: Array.from(
      new Set(
        cleanTeachingTags(image.tags).concat([
          inferStain(image.stain, image.title, image.description),
          inferMagnification(image.title, image.description),
        ]).filter(Boolean)
      )
    ),
    gcsPath: image.gcsPath || image.originalUrl || image.src,
    category: 'official',
    atlasCollection: 'acquired',
    readOnly: true,
    magnification: image.magnification || inferMagnification(image.title, image.description),
  }));

export const resolveAcquiredImageUrl = (url?: string) => {
  if (!url) {
    return url;
  }
  return acquiredUrlMap.get(url) ?? url;
};
