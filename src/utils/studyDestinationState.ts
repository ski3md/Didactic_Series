import { Section, type ActiveStudyDestination, type StudyWorkspace } from '../types.ts';
import { clearAlgorithmNavigatorLaunchContext } from './algorithmNavigatorNavigation.ts';
import { readSessionState, writeSessionState } from './viewStateStorage.ts';

const STORAGE_KEY = 'didactic_series_study_destinations';
export const STUDY_DESTINATION_EVENT = 'didactics-study-destination-change';

type StoredStudyDestinations = Partial<Record<StudyWorkspace, ActiveStudyDestination>>;

interface HistoryStateWithStudyDestination {
  didacticsStudyDestination?: ActiveStudyDestination;
}

const defaultDestination = (workspace: StudyWorkspace): ActiveStudyDestination => ({
  workspace,
  kind: 'landing',
  previous: null,
});

const currentUrl = () => {
  if (typeof window === 'undefined') {
    return '/didactics/';
  }
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

const readAllStudyDestinations = (): StoredStudyDestinations =>
  readSessionState<StoredStudyDestinations>(STORAGE_KEY) ?? {};

const writeAllStudyDestinations = (value: StoredStudyDestinations) => {
  writeSessionState<StoredStudyDestinations>(STORAGE_KEY, value);
};

export const workspaceForSection = (section: Section): StudyWorkspace | null => {
  switch (section) {
    case Section.LECTURE:
    case Section.DIDACTIC_LECTURES:
      return 'lectures';
    case Section.DIDACTIC_TUTORIALS:
      return 'tutorials';
    case Section.DIDACTIC_ALGORITHMS:
      return 'algorithms';
    default:
      return null;
  }
};

export const sectionForWorkspace = (workspace: StudyWorkspace): Section => {
  switch (workspace) {
    case 'tutorials':
      return Section.DIDACTIC_TUTORIALS;
    case 'lectures':
      return Section.DIDACTIC_LECTURES;
    case 'algorithms':
      return Section.DIDACTIC_ALGORITHMS;
  }
};

export const readStudyDestination = (workspace: StudyWorkspace): ActiveStudyDestination =>
  readAllStudyDestinations()[workspace] ?? defaultDestination(workspace);

export const readHistoryStudyDestination = (
  state: unknown,
  workspace?: StudyWorkspace
): ActiveStudyDestination | null => {
  const candidate = (state as HistoryStateWithStudyDestination | null | undefined)?.didacticsStudyDestination;
  if (!candidate) {
    return null;
  }
  if (workspace && candidate.workspace !== workspace) {
    return null;
  }
  return candidate;
};

const persistStudyDestination = (destination: ActiveStudyDestination) => {
  const current = readAllStudyDestinations();
  writeAllStudyDestinations({
    ...current,
    [destination.workspace]: destination,
  });
};

const broadcastStudyDestination = (destination: ActiveStudyDestination) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(
    new CustomEvent<ActiveStudyDestination>(STUDY_DESTINATION_EVENT, {
      detail: destination,
    })
  );
};

export const replaceStudyDestination = (
  destination: ActiveStudyDestination,
  options?: { replaceHistory?: boolean }
) => {
  if (typeof window === 'undefined') {
    return destination;
  }

  persistStudyDestination(destination);
  const state = {
    ...(window.history.state || {}),
    didacticsStudyDestination: destination,
  };

  if (options?.replaceHistory ?? true) {
    window.history.replaceState(state, '', currentUrl());
  } else {
    window.history.pushState(state, '', currentUrl());
  }

  broadcastStudyDestination(destination);

  return destination;
};

export const pushStudyDestination = (
  workspace: StudyWorkspace,
  next: Omit<ActiveStudyDestination, 'workspace' | 'previous'> & { previous?: ActiveStudyDestination | null }
) => {
  const current = readStudyDestination(workspace);
  const destination: ActiveStudyDestination = {
    workspace,
    ...next,
    previous: next.previous === undefined ? current : next.previous,
  };
  replaceStudyDestination(destination, { replaceHistory: false });
  return destination;
};

export const resetStudyWorkspaceEntry = (section: Section): ActiveStudyDestination | null => {
  switch (section) {
    case Section.LECTURE:
    case Section.DIDACTIC_LECTURES:
      return pushStudyDestination('lectures', { kind: 'landing', previous: null });
    case Section.DIDACTIC_TUTORIALS:
      return pushStudyDestination('tutorials', { kind: 'landing', previous: null });
    case Section.DIDACTIC_ALGORITHMS:
      clearAlgorithmNavigatorLaunchContext();
      return pushStudyDestination('algorithms', { kind: 'landing', previous: null });
    default:
      return null;
  }
};

export const setStudyDestinationActiveTab = (
  workspace: StudyWorkspace,
  activeTab: string
): ActiveStudyDestination => {
  const current = readStudyDestination(workspace);
  const destination = {
    ...current,
    activeTab,
  };
  replaceStudyDestination(destination);
  return destination;
};

export const restoreStudyDestination = (workspace: StudyWorkspace): ActiveStudyDestination => {
  if (typeof window === 'undefined') {
    return defaultDestination(workspace);
  }
  const fromHistory = readHistoryStudyDestination(window.history.state, workspace);
  if (fromHistory) {
    return fromHistory;
  }

  return readStudyDestination(workspace) ?? defaultDestination(workspace);
};

export const canGoBackWithinStudyWorkspace = (section: Section): boolean => {
  const workspace = workspaceForSection(section);
  if (!workspace) {
    return false;
  }
  return Boolean(readStudyDestination(workspace).previous);
};

export const getDefaultStudyDestination = defaultDestination;
