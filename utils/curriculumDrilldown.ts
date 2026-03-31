import { Section } from '../types';

const CURRICULUM_DRILLDOWN_KEY = 'didactic_series_curriculum_drilldown';

export interface CurriculumDrilldownPayload {
  sourceModuleId: string;
  targetSection: Section;
  query?: string;
  track?: string;
  filter?: string;
}

export function setCurriculumDrilldown(payload: CurriculumDrilldownPayload): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(CURRICULUM_DRILLDOWN_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Failed to persist curriculum drilldown state:', error);
  }
}

export function consumeCurriculumDrilldown(targetSection: Section): CurriculumDrilldownPayload | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CURRICULUM_DRILLDOWN_KEY);
    if (!raw) {
      return null;
    }

    const payload = JSON.parse(raw) as CurriculumDrilldownPayload;
    if (payload.targetSection !== targetSection) {
      return null;
    }

    window.sessionStorage.removeItem(CURRICULUM_DRILLDOWN_KEY);
    return payload;
  } catch (error) {
    console.error('Failed to consume curriculum drilldown state:', error);
    return null;
  }
}
