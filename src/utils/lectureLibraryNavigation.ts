import { LecturePlayerMode } from '../types.ts';

const LECTURE_LIBRARY_KEY = 'didactic_series_selected_lecture';

export interface LectureLibraryIntent {
  selectedId?: string;
  query?: string;
  track?: 'all' | 'curated' | 'core-principles';
  initialMode?: LecturePlayerMode;
  initialSlideId?: string;
  initialNodeId?: string;
  imageLayerSetId?: string;
}

export function setLectureLibraryIntent(intent: LectureLibraryIntent): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(LECTURE_LIBRARY_KEY, JSON.stringify(intent));
  } catch (error) {
    console.error('Failed to persist lecture library intent:', error);
  }
}

export function consumeLectureLibraryIntent(): LectureLibraryIntent | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(LECTURE_LIBRARY_KEY);
    if (!raw) {
      return null;
    }

    window.sessionStorage.removeItem(LECTURE_LIBRARY_KEY);
    return JSON.parse(raw) as LectureLibraryIntent;
  } catch (error) {
    console.error('Failed to consume lecture library intent:', error);
    return null;
  }
}
