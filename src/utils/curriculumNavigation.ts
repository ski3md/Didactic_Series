import { ActiveCurriculumPriority, ActiveCurriculumPromotionState, ActiveCurriculumSubspecialty } from '../types.ts';

const CURRICULUM_INTENT_KEY = 'didactic_series_selected_curriculum_module';

export interface CurriculumIntent {
  moduleId?: string;
  query?: string;
  subspecialty?: 'all' | ActiveCurriculumSubspecialty;
  priority?: 'all' | ActiveCurriculumPriority;
  promotion?: 'all' | ActiveCurriculumPromotionState;
  pattern?: 'all' | string;
  specimen?: 'all' | string;
}

export const setCurriculumIntent = (intent: CurriculumIntent) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(CURRICULUM_INTENT_KEY, JSON.stringify(intent));
  } catch (error) {
    console.error('Failed to persist curriculum intent:', error);
  }
};

export const consumeCurriculumIntent = (): CurriculumIntent | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CURRICULUM_INTENT_KEY);
    if (!raw) {
      return null;
    }
    window.sessionStorage.removeItem(CURRICULUM_INTENT_KEY);
    return JSON.parse(raw) as CurriculumIntent;
  } catch (error) {
    console.error('Failed to consume curriculum intent:', error);
    return null;
  }
};
