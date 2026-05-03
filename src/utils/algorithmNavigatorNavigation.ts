const ALGORITHM_NAVIGATOR_KEY = 'didactic_series_selected_algorithm';

export interface AlgorithmNavigatorIntent {
  selectedId?: string;
  lectureId?: string;
  query?: string;
  category?: string;
  patternFamily?: string;
}

export const setAlgorithmNavigatorIntent = (intent: AlgorithmNavigatorIntent) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(ALGORITHM_NAVIGATOR_KEY, JSON.stringify(intent));
  } catch (error) {
    console.error('Failed to persist algorithm navigator intent:', error);
  }
};

export const consumeAlgorithmNavigatorIntent = (): AlgorithmNavigatorIntent | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ALGORITHM_NAVIGATOR_KEY);
    if (!raw) {
      return null;
    }
    window.sessionStorage.removeItem(ALGORITHM_NAVIGATOR_KEY);
    return JSON.parse(raw) as AlgorithmNavigatorIntent;
  } catch (error) {
    console.error('Failed to consume algorithm navigator intent:', error);
    return null;
  }
};
