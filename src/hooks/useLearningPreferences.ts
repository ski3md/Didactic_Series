import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'didactic_series_learning_preferences';

export interface LearningPreferences {
  focusMode: boolean;
}

const DEFAULT_PREFERENCES: LearningPreferences = {
  focusMode: true,
};

const readStoredPreferences = (): LearningPreferences => {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }

    return {
      ...DEFAULT_PREFERENCES,
      ...(JSON.parse(raw) as Partial<LearningPreferences>),
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
};

export const useLearningPreferences = () => {
  const [preferences, setPreferences] = useState<LearningPreferences>(readStoredPreferences);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // ignore storage failures
    }
  }, [preferences]);

  const api = useMemo(
    () => ({
      preferences,
      toggleFocusMode: () => {
        setPreferences((current) => ({ ...current, focusMode: !current.focusMode }));
      },
      setPreferences,
    }),
    [preferences]
  );

  return api;
};
