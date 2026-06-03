import { TutorialLane, TutorialTrack } from './tutorialLibraryCatalog.ts';

export interface TutorialLibraryIntent {
  selectedId?: string;
  query?: string;
  queries?: string[];
  lane?: 'all' | TutorialLane;
  track?: 'all' | TutorialTrack;
}

const STORAGE_KEY = 'didactic_series_selected_tutorial';

export const setTutorialLibraryIntent = (intent: TutorialLibraryIntent) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
};

export const consumeTutorialLibraryIntent = (): TutorialLibraryIntent | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  window.sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as TutorialLibraryIntent;
  } catch {
    return null;
  }
};
