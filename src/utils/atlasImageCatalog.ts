import curatedAtlasSource from '../content/derived/stainbrain_printable/histology_images.from_service.json';
import promotedAtlasSource from '../content/downloads_imports/normalized/images.normalized.json';
import { StoredImage } from '../types.ts';
import { getAcquiredLectureImages } from './acquiredImageCatalog.ts';

interface CuratedAtlasSourceImage {
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

interface PromotedAtlasSourceImage {
  id: string;
  title: string;
  description: string;
  src: string;
  category: 'official' | 'community';
  uploader: string;
  timestamp: number;
  entity?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  provenance?: {
    gcsPath?: string;
    cells?: string[];
  };
}

export interface AtlasCollectionSummary {
  id: 'curated' | 'promoted' | 'acquired';
  title: string;
  description: string;
  imageCount: number;
  highlightedTerms: string[];
}

const toLabel = (value: string) =>
  value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

const curatedAtlasImages: StoredImage[] = (curatedAtlasSource as CuratedAtlasSourceImage[]).map((image) => ({
  id: `atlas_curated_${image.id}`,
  src: image.fullUrl || image.thumbUrl,
  gcsPath: image.sourcePageUrl || image.fullUrl || image.thumbUrl,
  title: image.title,
  description: image.entity ? `Histology image for ${image.entity}.` : 'Histology image.',
  uploader: 'Faculty Image Set',
  timestamp: 0,
  category: 'official',
  tags: [image.family, image.stain].filter((value): value is string => Boolean(value)),
  entity: image.entity,
  family: image.family,
  magnification: image.magnification,
  sourceUrl: image.sourcePageUrl,
  atlasCollection: 'curated',
  readOnly: true,
}));

const promotedAtlasImages: StoredImage[] = (promotedAtlasSource as PromotedAtlasSourceImage[]).map((image) => ({
  id: `atlas_promoted_${image.id}`,
  src: image.src,
  gcsPath: image.provenance?.gcsPath || image.src,
  title: image.title,
  description: image.description,
  uploader: image.uploader,
  timestamp: image.timestamp,
  category: image.category,
  tags: image.tags || [],
  entity: image.entity,
  family: image.entity,
  difficulty: image.difficulty,
  cells: image.provenance?.cells || [],
  atlasCollection: 'promoted',
  readOnly: true,
}));

const acquiredAtlasImages = getAcquiredLectureImages();

const buildHighlightedTerms = (values: string[]) =>
  Array.from(new Set(values.filter(Boolean))).slice(0, 5).map(toLabel);

export const getAtlasImages = (): StoredImage[] => [...acquiredAtlasImages, ...promotedAtlasImages, ...curatedAtlasImages];

export const getAtlasCollectionSummaries = (): AtlasCollectionSummary[] => [
  {
    id: 'acquired',
    title: 'Lecture Microscopy',
    description: 'Histology and ancillary images used in the active pathology lectures.',
    imageCount: acquiredAtlasImages.length,
    highlightedTerms: buildHighlightedTerms(acquiredAtlasImages.map((image) => image.entity || image.family || image.title)),
  },
  {
    id: 'curated',
    title: 'Histology Reference Set',
    description: 'Stained examples organized for diagnostic comparison.',
    imageCount: curatedAtlasImages.length,
    highlightedTerms: buildHighlightedTerms(curatedAtlasImages.map((image) => image.family || image.entity || '')),
  },
  {
    id: 'promoted',
    title: 'Granulomatous Disease Images',
    description: 'Examples of infectious and inflammatory granulomatous patterns.',
    imageCount: promotedAtlasImages.length,
    highlightedTerms: buildHighlightedTerms(promotedAtlasImages.map((image) => image.entity || image.title)),
  },
];
