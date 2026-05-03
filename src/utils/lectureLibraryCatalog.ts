import curatedLectureData from '../content/lectures/lectures.normalized.json';
import customLectureData from '../content/lectures/customLectures.ts';
import guWhoCompleteLectureData from '../content/lectures/gu_who_complete_lectures.normalized.json';
import downloadsLectureData from '../content/downloads_imports/normalized/lectures.normalized.json';
import algorithmsData from '../content/algorithms/algorithms.normalized.json';

export type LectureTrack = 'curated' | 'core-principles';

export interface ImportedLectureRecord {
  id: string;
  title: string;
  category: string | null;
  summary: string | null;
  body: string;
  sourceRepo: string;
  sourcePath: string;
  tags: string[];
  slides: Array<Record<string, unknown>>;
  provenance: Record<string, unknown>;
}

export interface ImportedAlgorithmRecord {
  id: string;
  title: string;
  category: string | null;
  summary: string | null;
}

export interface PromotedLectureRecord extends ImportedLectureRecord {
  lectureTrack: LectureTrack;
  sourceLabel: string;
}

const curatedLectures = ([
  ...(curatedLectureData as ImportedLectureRecord[]),
  ...(customLectureData as ImportedLectureRecord[]),
  ...(guWhoCompleteLectureData as ImportedLectureRecord[]),
])
  .map((lecture) => ({
  ...lecture,
  lectureTrack: 'curated' as const,
  sourceLabel: lecture.sourceRepo === 'didactic_series' ? 'P@thfndr Local' : 'Curated GU Imports',
}));

const corePrinciplesLectures = (downloadsLectureData as ImportedLectureRecord[])
  .filter((lecture) => lecture.sourceRepo === 'ioc-next-app')
  .map((lecture) => ({
    ...lecture,
    lectureTrack: 'core-principles' as const,
    sourceLabel: 'Core Principles Series',
  }));

export const promotedLectures: PromotedLectureRecord[] = [...curatedLectures, ...corePrinciplesLectures];
export const curatedPromotedLectures = curatedLectures;
export const corePrinciplesPromotedLectures = corePrinciplesLectures;
export const preservedAlgorithms = algorithmsData as ImportedAlgorithmRecord[];

export function getPromotedLectureById(id: string): PromotedLectureRecord | undefined {
  return promotedLectures.find((lecture) => lecture.id === id);
}
