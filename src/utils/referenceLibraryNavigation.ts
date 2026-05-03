export interface ReferenceLibraryIntent {
  moduleId?: string;
  lectureId?: string;
  title?: string;
  summary?: string;
  focusTerms?: string[];
  tutorialTopics?: string[];
  syllabusTopics?: string[];
  algorithmTopics?: string[];
  imageLayerSetId?: string;
}

const STORAGE_KEY = 'didactic_series_reference_library_intent';

export const setReferenceLibraryIntent = (intent: ReferenceLibraryIntent) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
};

export const consumeReferenceLibraryIntent = (): ReferenceLibraryIntent | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  window.sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as ReferenceLibraryIntent;
  } catch {
    return null;
  }
};
