import { ImportedContentRecord } from '../types';

export const PROMOTED_CP_SOURCE_REPOS = new Set([
  'cp-content-specification-tutorial-batch-ready',
  'cp-content-specification-tutorial_11.11.25',
]);

export const PROMOTED_CP_EXCLUDED_IDS = new Set([
  'clinical-practice',
  'TUT004',
]);

export function normalizeContentTitle(title: string | null | undefined): string {
  return (title ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getPromotedDownloadsLectures(downloadsLectures: ImportedContentRecord[]): ImportedContentRecord[] {
  return downloadsLectures.filter((record) => record.sourceRepo === 'ioc-next-app');
}

export function getStagingDownloadsLectures(downloadsLectures: ImportedContentRecord[]): ImportedContentRecord[] {
  const promotedIds = new Set(getPromotedDownloadsLectures(downloadsLectures).map((record) => record.id));
  return downloadsLectures.filter((record) => !promotedIds.has(record.id));
}

export function getPromotedClinicalPathTutorials(downloadsTutorials: ImportedContentRecord[]): ImportedContentRecord[] {
  return downloadsTutorials.filter(
    (record) => PROMOTED_CP_SOURCE_REPOS.has(record.sourceRepo) && !PROMOTED_CP_EXCLUDED_IDS.has(record.id)
  );
}

export function getCanonicalBoardPrepTutorials(
  primaryTutorials: ImportedContentRecord[],
  promotedClinicalPathTutorials: ImportedContentRecord[]
): ImportedContentRecord[] {
  const promotedTitleKeys = new Set(
    promotedClinicalPathTutorials.map((record) => normalizeContentTitle(record.title)).filter(Boolean)
  );

  return primaryTutorials.filter((record) => !promotedTitleKeys.has(normalizeContentTitle(record.title)));
}

export function getStagingDownloadsTutorials(
  downloadsTutorials: ImportedContentRecord[],
  canonicalPrimaryTutorials: ImportedContentRecord[]
): ImportedContentRecord[] {
  const promotedTutorialIds = new Set(getPromotedClinicalPathTutorials(downloadsTutorials).map((record) => record.id));
  const canonicalPrimaryTitleKeys = new Set(
    canonicalPrimaryTutorials.map((record) => normalizeContentTitle(record.title)).filter(Boolean)
  );

  return downloadsTutorials.filter((record) => {
    if (promotedTutorialIds.has(record.id)) {
      return false;
    }

    return !canonicalPrimaryTitleKeys.has(normalizeContentTitle(record.title));
  });
}
