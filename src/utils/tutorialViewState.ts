import type { TutorialTrack } from './tutorialLibraryCatalog.ts';
import { readSessionState, writeSessionState } from './viewStateStorage.ts';

export type TutorialTab = 'snapshot' | 'tutorial' | 'flashcards' | 'quiz';

export interface TutorialViewState {
  selectedId: string;
  query: string;
  rootFilter: 'all' | string;
  subtopicFilter: 'all' | string;
  trackFilter: 'all' | TutorialTrack;
  showAllTutorials: boolean;
  activeTab: TutorialTab;
  flashcardIndex: number;
  questionIndex: number;
  interactiveAssetIndex: number;
  visualMode: string;
}

export const TUTORIAL_VIEW_STATE_KEY = 'pthfndr-didactics-tutorial-view-state';

export const readTutorialViewState = () => readSessionState<TutorialViewState>(TUTORIAL_VIEW_STATE_KEY);

export const writeTutorialViewState = (value: TutorialViewState) => {
  writeSessionState<TutorialViewState>(TUTORIAL_VIEW_STATE_KEY, value);
};

export const updateTutorialTopicState = (topicId: 'all' | string) => {
  const current = readTutorialViewState();
  writeTutorialViewState({
    selectedId: '',
    query: current?.query ?? '',
    rootFilter: topicId,
    subtopicFilter: 'all',
    trackFilter: 'all',
    showAllTutorials: true,
    activeTab: current?.activeTab ?? 'snapshot',
    flashcardIndex: 0,
    questionIndex: 0,
    interactiveAssetIndex: 0,
    visualMode: current?.visualMode ?? 'cockpit_dashboard',
  });
};

export const updateTutorialSubtopicState = (rootId: string, subtopicId: 'all' | string) => {
  const current = readTutorialViewState();
  writeTutorialViewState({
    selectedId: '',
    query: current?.query ?? '',
    rootFilter: rootId,
    subtopicFilter: subtopicId,
    trackFilter: current?.trackFilter ?? 'all',
    showAllTutorials: true,
    activeTab: current?.activeTab ?? 'snapshot',
    flashcardIndex: 0,
    questionIndex: 0,
    interactiveAssetIndex: 0,
    visualMode: current?.visualMode ?? 'cockpit_dashboard',
  });
};
