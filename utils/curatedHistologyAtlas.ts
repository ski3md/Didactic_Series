import { StoredImage } from '../types';
import curatedHistologyImages from '../src/content/derived/stainbrain_printable/histology_images.from_service.json';

interface CuratedHistologySourceImage {
  id: string;
  title: string;
  entity?: string;
  family?: string;
  thumbUrl: string;
  fullUrl?: string;
  stain?: string;
  magnification?: string;
  sourcePageUrl?: string;
}

const curatedAtlasImages: StoredImage[] = (curatedHistologyImages as CuratedHistologySourceImage[]).map((image) => {
  return {
    id: `curated_${image.id}`,
    src: image.fullUrl || image.thumbUrl,
    title: image.title,
    description: image.entity
      ? `Curated histology atlas image for ${image.entity}.`
      : 'Imported curated histology atlas image.',
    uploader: 'Migrated Atlas',
    timestamp: 0,
    entity: image.entity,
    family: image.family,
    stain: image.stain,
    magnification: image.magnification,
    sourceUrl: image.sourcePageUrl,
    collection: 'curated',
    readOnly: true,
  };
});

export const getCuratedAtlasImages = (): StoredImage[] => curatedAtlasImages;

export const getCuratedAtlasFamilies = (): string[] =>
  Array.from(
    new Set(
      curatedAtlasImages
        .map((image) => image.family)
        .filter((family): family is string => Boolean(family))
    )
  ).sort((left, right) => left.localeCompare(right));
