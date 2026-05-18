import type {
  ActiveCurriculumModule,
  ActiveCurriculumPriority,
  ActiveCurriculumPromotionState,
} from '../types.ts';
import { readSessionState, writeSessionState } from './viewStateStorage.ts';

export interface CurriculumViewState {
  selectedId: string;
  query: string;
  domainFilter: 'all' | 'ap' | 'cp';
  subspecialtyFilter: 'all' | ActiveCurriculumModule['subspecialty'];
  priorityFilter: 'all' | ActiveCurriculumPriority;
  promotionFilter: 'all' | ActiveCurriculumPromotionState;
  patternFilter: 'all' | string;
  specimenFilter: 'all' | string;
  showAdvancedFilters: boolean;
  showAllModules: boolean;
}

export const CURRICULUM_VIEW_STATE_KEY = 'didactic_series_curriculum_view_state';
export const CURRICULUM_SIDEBAR_EVENT = 'pthfndr:curriculum-sidebar-select';

export const readCurriculumViewState = () => readSessionState<CurriculumViewState>(CURRICULUM_VIEW_STATE_KEY);

export const writeCurriculumViewState = (value: CurriculumViewState) => {
  writeSessionState<CurriculumViewState>(CURRICULUM_VIEW_STATE_KEY, value);
};

export const updateCurriculumSidebarSelection = (
  moduleId: string,
  subspecialty: ActiveCurriculumModule['subspecialty']
) => {
  const current = readCurriculumViewState();
  writeCurriculumViewState({
    selectedId: moduleId,
    query: current?.query ?? '',
    domainFilter: subspecialty === 'Clinical Pathology' ? 'cp' : current?.domainFilter ?? 'all',
    subspecialtyFilter: subspecialty,
    priorityFilter: current?.priorityFilter ?? 'all',
    promotionFilter: current?.promotionFilter ?? 'all',
    patternFilter: current?.patternFilter ?? 'all',
    specimenFilter: current?.specimenFilter ?? 'all',
    showAdvancedFilters: current?.showAdvancedFilters ?? false,
    showAllModules: true,
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CURRICULUM_SIDEBAR_EVENT, { detail: { moduleId, subspecialty } }));
  }
};
