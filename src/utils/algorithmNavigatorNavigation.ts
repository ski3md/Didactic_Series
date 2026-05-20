const ALGORITHM_NAVIGATOR_KEY = 'didactic_series_selected_algorithm';
const ALGORITHM_NAVIGATOR_LAUNCH_CONTEXT_KEY = 'didactic_series_algorithm_launch_context';
export const ALGORITHM_NAVIGATOR_INTENT_EVENT = 'didactic-series:algorithm-intent';

export interface AlgorithmNavigatorIntent {
  selectedId?: string;
  lectureId?: string;
  query?: string;
  category?: string;
  patternFamily?: string;
  sourceModuleId?: string;
  sourceModuleTitle?: string;
  sourceModuleSummary?: string;
  sourceSubspecialty?: string;
  sourceRequestedTopic?: string;
}

interface AlgorithmNavigatorLaunchContext {
  sourceModuleId?: string;
  sourceModuleTitle?: string;
  sourceModuleSummary?: string;
  sourceSubspecialty?: string;
  sourceRequestedTopic?: string;
}

export const describeAlgorithmNavigatorLaunchContext = (
  context: AlgorithmNavigatorLaunchContext | null
): string | null => {
  if (!context) {
    return null;
  }

  if (context.sourceModuleTitle) {
    return context.sourceModuleTitle;
  }

  if (context.sourceModuleId) {
    return context.sourceModuleId;
  }

  return null;
};

export const readAlgorithmNavigatorState = (): AlgorithmNavigatorIntent | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ALGORITHM_NAVIGATOR_KEY);
    return raw ? (JSON.parse(raw) as AlgorithmNavigatorIntent) : null;
  } catch (error) {
    console.error('Failed to read algorithm navigator state:', error);
    return null;
  }
};

export const setAlgorithmNavigatorIntent = (intent: AlgorithmNavigatorIntent) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(ALGORITHM_NAVIGATOR_KEY, JSON.stringify(intent));
    if (intent.sourceModuleId || intent.sourceModuleTitle) {
      window.sessionStorage.setItem(
        ALGORITHM_NAVIGATOR_LAUNCH_CONTEXT_KEY,
        JSON.stringify({
          sourceModuleId: intent.sourceModuleId,
          sourceModuleTitle: intent.sourceModuleTitle,
          sourceModuleSummary: intent.sourceModuleSummary,
          sourceSubspecialty: intent.sourceSubspecialty,
          sourceRequestedTopic: intent.sourceRequestedTopic,
        } satisfies AlgorithmNavigatorLaunchContext)
      );
    } else {
      window.sessionStorage.removeItem(ALGORITHM_NAVIGATOR_LAUNCH_CONTEXT_KEY);
    }
    window.dispatchEvent(new CustomEvent<AlgorithmNavigatorIntent>(ALGORITHM_NAVIGATOR_INTENT_EVENT, { detail: intent }));
  } catch (error) {
    console.error('Failed to persist algorithm navigator intent:', error);
  }
};

export const readAlgorithmNavigatorLaunchContext = (): AlgorithmNavigatorLaunchContext | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(ALGORITHM_NAVIGATOR_LAUNCH_CONTEXT_KEY);
    return raw ? (JSON.parse(raw) as AlgorithmNavigatorLaunchContext) : null;
  } catch (error) {
    console.error('Failed to read algorithm launch context:', error);
    return null;
  }
};

export const clearAlgorithmNavigatorLaunchContext = () => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.removeItem(ALGORITHM_NAVIGATOR_LAUNCH_CONTEXT_KEY);
  } catch (error) {
    console.error('Failed to clear algorithm launch context:', error);
  }
};

export const writeAlgorithmNavigatorState = (intent: AlgorithmNavigatorIntent) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(ALGORITHM_NAVIGATOR_KEY, JSON.stringify(intent));
  } catch (error) {
    console.error('Failed to persist algorithm navigator state:', error);
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
