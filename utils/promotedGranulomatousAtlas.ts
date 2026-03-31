import { StoredImage } from '../types';
import promotedGranulomatousImages from '../src/content/downloads_imports/normalized/images.normalized.json';

interface PromotedGranulomatousSourceImage {
  id: string;
  description: string;
  src: string;
  entity?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  provenance?: {
    cells?: string[];
  };
}

const GRANULOMATOUS_ENTITY_LABELS: Record<string, string> = {
  'blastomycosis': 'Blastomycosis',
  'coccidioidomycosis': 'Coccidioidomycosis',
  'cryptococcosis': 'Cryptococcosis',
  'foreign-body': 'Foreign Body Granuloma',
  'gpa': 'Granulomatosis with Polyangiitis',
  'histoplasmosis': 'Histoplasmosis',
  'hypersensitivity-pneumonitis': 'Hypersensitivity Pneumonitis',
  'sarcoidosis': 'Sarcoidosis',
};

function toDisplayEntity(entity?: string): string {
  if (!entity) {
    return 'Granulomatous Disease';
  }

  if (GRANULOMATOUS_ENTITY_LABELS[entity]) {
    return GRANULOMATOUS_ENTITY_LABELS[entity];
  }

  return entity
    .split(/[-_]/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

const promotedAtlasImages: StoredImage[] = (promotedGranulomatousImages as PromotedGranulomatousSourceImage[]).map((image, index) => {
  const displayEntity = toDisplayEntity(image.entity);
  const cells = image.provenance?.cells || [];
  const cellSummary = cells.length > 0 ? ` Key cells: ${cells.slice(0, 3).join(', ')}.` : '';

  return {
    id: `promoted_${image.id}_${index}`,
    src: image.src,
    title: displayEntity,
    description: `${image.description}${cellSummary}`.trim(),
    uploader: 'Promoted Downloads Atlas',
    timestamp: 0,
    entity: displayEntity,
    family: displayEntity,
    difficulty: image.difficulty,
    cells,
    collection: 'promoted',
    readOnly: true,
  };
});

export const getPromotedGranulomatousAtlasImages = (): StoredImage[] => promotedAtlasImages;

export const getPromotedGranulomatousAtlasFamilies = (): string[] =>
  Array.from(
    new Set(
      promotedAtlasImages
        .map((image) => image.family)
        .filter((family): family is string => Boolean(family))
    )
  ).sort((left, right) => left.localeCompare(right));
