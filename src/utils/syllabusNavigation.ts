export interface SyllabusIntent {
  selectedId?: string;
  query?: string;
  category?: string;
}

const STORAGE_KEY = 'didactic_series_syllabus_intent';

export const setSyllabusIntent = (intent: SyllabusIntent) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(intent));
};

export const consumeSyllabusIntent = (): SyllabusIntent | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }
  window.sessionStorage.removeItem(STORAGE_KEY);
  try {
    return JSON.parse(raw) as SyllabusIntent;
  } catch {
    return null;
  }
};
