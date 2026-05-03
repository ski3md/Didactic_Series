import bladderAtlasSupplement from '../content/images/bladderAtlasSupplement.json';

export interface LectureAtlasImage {
  id: string;
  lectureId: string;
  title: string;
  entity: string;
  family?: string;
  pairId?: string;
  pairTitle?: string;
  pairSummary?: string;
  viewLabel?: string;
  viewOrder?: number;
  description?: string;
  stain?: string;
  fullUrl: string;
  thumbUrl?: string;
  sourcePageUrl?: string;
  organ?: string;
  system?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  cells?: string[];
  tags?: string[];
  teachingPoint?: string;
}

export interface LectureAtlasPair {
  pairId: string;
  title: string;
  summary?: string;
  images: LectureAtlasImage[];
}

const lectureAtlasImages = bladderAtlasSupplement as LectureAtlasImage[];

export const getLectureAtlasPairs = (lectureId: string): LectureAtlasPair[] => {
  const groups = new Map<string, LectureAtlasPair>();

  lectureAtlasImages
    .filter((image) => image.lectureId === lectureId && image.pairId)
    .forEach((image) => {
      const pairId = image.pairId!;
      const existing = groups.get(pairId) ?? {
        pairId,
        title: image.pairTitle ?? image.title,
        summary: image.pairSummary,
        images: [],
      };
      existing.images.push(image);
      groups.set(pairId, existing);
    });

  return Array.from(groups.values())
    .map((pair) => ({
      ...pair,
      images: [...pair.images].sort((left, right) => (left.viewOrder ?? 99) - (right.viewOrder ?? 99)),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
};

export const getLectureAtlasSingletons = (lectureId: string): LectureAtlasImage[] =>
  lectureAtlasImages
    .filter((image) => image.lectureId === lectureId && !image.pairId)
    .sort((left, right) => left.title.localeCompare(right.title));
