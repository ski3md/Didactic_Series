import lecturesData from '../src/content/lectures/lectures.normalized.json';
import promotedLecturesData from '../src/content/downloads_imports/normalized/lectures.normalized.json';
import { ImportedContentRecord } from '../types';
import { enrichLectureWithTraceability } from './benchmarkTraceability';
import { getPromotedDownloadsLectures } from './promotedContentRegistry';

export type LectureTrack = 'curated' | 'core-principles';

export type PromotedLectureRecord = ImportedContentRecord & {
  lectureTrack: LectureTrack;
  sourceLabel: string;
};

export const curatedPromotedLectures: PromotedLectureRecord[] = (lecturesData as ImportedContentRecord[]).map((lecture) => ({
  ...lecture,
  lectureTrack: 'curated',
  sourceLabel: 'Curated Lecture Imports',
}));

export const corePrinciplesPromotedLectures: PromotedLectureRecord[] = getPromotedDownloadsLectures(
  promotedLecturesData as ImportedContentRecord[]
).map((lecture) => ({
  ...enrichLectureWithTraceability(lecture),
  lectureTrack: 'core-principles',
  sourceLabel: 'Core Principles Library',
}));

export const allPromotedLectures: PromotedLectureRecord[] = [
  ...curatedPromotedLectures,
  ...corePrinciplesPromotedLectures,
];

export function getPromotedLectureById(id: string): PromotedLectureRecord | undefined {
  return allPromotedLectures.find((lecture) => lecture.id === id);
}
