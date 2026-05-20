import { useCallback, useEffect, useMemo, useState } from 'react';
import { Section } from '../types.ts';
import { canGoBackWithinStudyWorkspace } from '../utils/studyDestinationState.ts';
import { 
  WorkspaceKey, 
  getWorkspaceKeyForSection, 
  getSectionForWorkspaceKey 
} from '../utils/didacticWorkspaces.ts';

interface NavigationEntry {
  id: string;
  section: Section;
}

interface NavigationStore {
  entries: NavigationEntry[];
  index: number;
}

interface BrowserNavigationStore {
  entries: string[];
  index: number;
}

interface HistoryStateShape {
  didacticSeriesNavId?: string;
  didacticSeriesSection?: Section;
  didacticSeriesBrowserNavToken?: string;
}

export interface SectionNavigationController {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  pushSection: (section: Section) => void;
}

const STORAGE_KEY = 'didactic_series_section_navigation_history';
const BROWSER_STORAGE_KEY = 'didactic_series_browser_navigation_history';
const SECTION_NAVIGATION_EVENT = 'didactic-series-section-navigation-change';

const normalizePath = (pathname: string): string => pathname.toLowerCase().replace(/\/+$/, '') || '/';

const didacticsBasePath = (pathname: string): string => {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  const lower = normalized.toLowerCase();
  const adminIndex = lower.indexOf('/didactics/admin');
  if (adminIndex >= 0) {
    return normalized.slice(0, adminIndex + '/didactics'.length) || '/didactics';
  }
  const didacticsIndex = lower.indexOf('/didactics');
  if (didacticsIndex >= 0) {
    return normalized.slice(0, didacticsIndex + '/didactics'.length) || '/didactics';
  }
  return '/didactics';
};

const workspaceKeyForSection = (section: Section): string | null => {
  return getWorkspaceKeyForSection(section);
};

const sectionForWorkspaceKey = (workspace: string | null): Section | null => {
  return getSectionForWorkspaceKey(workspace);
};

const sectionFromLocation = (): Section => {
  if (typeof window === 'undefined') {
    return Section.HOME;
  }

  const pathname = normalizePath(window.location.pathname);
  const workspaceSection = sectionForWorkspaceKey(new URLSearchParams(window.location.search).get('workspace'));
  if (workspaceSection) {
    return workspaceSection;
  }
  if (pathname.endsWith('/didactics/admin')) {
    return Section.ADMIN;
  }
  if (pathname.endsWith('/didactics')) {
    return Section.DIDACTIC_LECTURES;
  }

  return Section.HOME;
};

const urlForSection = (section: Section): string => {
  if (typeof window === 'undefined') {
    return section === Section.ADMIN ? '/didactics/admin' : '/didactics/';
  }

  const basePath = didacticsBasePath(window.location.pathname);
  switch (section) {
    case Section.ADMIN:
      return `${basePath}/admin`;
    case Section.PATHOLOGY_CURRICULUM:
    case Section.DIDACTIC_LECTURES:
    case Section.DIDACTIC_TUTORIALS:
    case Section.DIDACTIC_ALGORITHMS:
    case Section.REFERENCE_LIBRARY: {
      const workspace = workspaceKeyForSection(section);
      return workspace ? `${basePath}/?workspace=${workspace}` : `${basePath}/`;
    }
    default:
      return `${basePath}/`;
  }
};

export const inferInitialSectionFromLocation = (): Section => {
  return sectionFromLocation();
};

const buildEntry = (section: Section): NavigationEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  section,
});

const defaultStore = (): NavigationStore => ({
  entries: [buildEntry(inferInitialSectionFromLocation())],
  index: 0,
});

const buildBrowserToken = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const defaultBrowserStore = (): BrowserNavigationStore => ({
  entries: [],
  index: -1,
});

const readStore = (): NavigationStore => {
  if (typeof window === 'undefined') {
    return defaultStore();
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultStore();
    }
    const parsed = JSON.parse(raw) as NavigationStore;
    if (!Array.isArray(parsed.entries) || typeof parsed.index !== 'number' || parsed.entries.length === 0) {
      return defaultStore();
    }
    return parsed;
  } catch {
    return defaultStore();
  }
};

const writeStore = (store: NavigationStore) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Best-effort persistence only.
  }
};

const readBrowserStore = (): BrowserNavigationStore => {
  if (typeof window === 'undefined') {
    return defaultBrowserStore();
  }

  try {
    const raw = window.sessionStorage.getItem(BROWSER_STORAGE_KEY);
    if (!raw) {
      return defaultBrowserStore();
    }
    const parsed = JSON.parse(raw) as BrowserNavigationStore;
    if (!Array.isArray(parsed.entries) || typeof parsed.index !== 'number') {
      return defaultBrowserStore();
    }
    return parsed;
  } catch {
    return defaultBrowserStore();
  }
};

const writeBrowserStore = (store: BrowserNavigationStore) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.sessionStorage.setItem(BROWSER_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Best-effort persistence only.
  }
};

const flagsFor = (store: NavigationStore) => ({
  canGoBack: store.index > 0,
  canGoForward: store.index < store.entries.length - 1,
});

const browserFlagsFor = (store: BrowserNavigationStore) => ({
  canGoBack: store.index > 0,
  canGoForward: store.index >= 0 && store.index < store.entries.length - 1,
});

const toHistoryState = (entry: NavigationEntry): HistoryStateShape => ({
  didacticSeriesNavId: entry.id,
  didacticSeriesSection: entry.section,
});

const dispatchSectionNavigationEvent = () => {
  if (typeof window === 'undefined') {
    return;
  }
  window.dispatchEvent(new Event(SECTION_NAVIGATION_EVENT));
};

const replaceHistoryForEntry = (entry: NavigationEntry) => {
  window.history.replaceState(
    { ...(window.history.state || {}), ...toHistoryState(entry) },
    '',
    urlForSection(entry.section)
  );
};

const pushHistoryForEntry = (entry: NavigationEntry) => {
  window.history.pushState(
    { ...(window.history.state || {}), ...toHistoryState(entry) },
    '',
    urlForSection(entry.section)
  );
};

const pushSectionEntry = (section: Section): NavigationStore => {
  const store = readStore();
  const currentEntry = store.entries[store.index];
  if (currentEntry?.section === section) {
    replaceHistoryForEntry(currentEntry);
    dispatchSectionNavigationEvent();
    return store;
  }

  const nextEntry = buildEntry(section);
  const nextStore = {
    entries: [...store.entries.slice(0, store.index + 1), nextEntry],
    index: store.index + 1,
  };
  writeStore(nextStore);
  pushHistoryForEntry(nextEntry);
  dispatchSectionNavigationEvent();
  return nextStore;
};

export const useSectionNavigation = (
  currentSection: Section,
  setCurrentSection: (section: Section) => void
): SectionNavigationController => {
  const [storeSnapshot, setStoreSnapshot] = useState<NavigationStore>(() => readStore());
  const [browserStoreSnapshot, setBrowserStoreSnapshot] = useState<BrowserNavigationStore>(() => readBrowserStore());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const rawPushState = window.history.pushState.bind(window.history);
    const rawReplaceState = window.history.replaceState.bind(window.history);
    const syncBrowserStoreForCurrentState = (): BrowserNavigationStore => {
      const currentState = (window.history.state || {}) as HistoryStateShape;
      const existingToken = currentState.didacticSeriesBrowserNavToken;
      const currentStore = readBrowserStore();

      if (existingToken) {
        const matchedIndex = currentStore.entries.indexOf(existingToken);
        const nextStore =
          matchedIndex >= 0
            ? { ...currentStore, index: matchedIndex }
            : {
                entries: [...currentStore.entries.slice(0, currentStore.index + 1), existingToken],
                index: currentStore.index + 1,
              };
        writeBrowserStore(nextStore);
        return nextStore;
      }

      const nextToken = buildBrowserToken();
      const nextStore = { entries: [nextToken], index: 0 };
      writeBrowserStore(nextStore);
      rawReplaceState({ ...currentState, didacticSeriesBrowserNavToken: nextToken }, '', window.location.href);
      return nextStore;
    };

    const patchedPushState: History['pushState'] = (state, unused, url) => {
      const nextToken = buildBrowserToken();
      const latestStore = readBrowserStore();
      const nextStore = {
        entries: [...latestStore.entries.slice(0, latestStore.index + 1), nextToken],
        index: latestStore.index + 1,
      };
      writeBrowserStore(nextStore);
      setBrowserStoreSnapshot(nextStore);
      rawPushState({ ...(state || {}), didacticSeriesBrowserNavToken: nextToken }, unused, url);
      dispatchSectionNavigationEvent();
    };

    const patchedReplaceState: History['replaceState'] = (state, unused, url) => {
      const latestStore = readBrowserStore();
      const fallbackToken =
        ((window.history.state || {}) as HistoryStateShape).didacticSeriesBrowserNavToken ??
        latestStore.entries[Math.max(latestStore.index, 0)] ??
        buildBrowserToken();
      const nextToken = ((state || {}) as HistoryStateShape).didacticSeriesBrowserNavToken ?? fallbackToken;
      const normalizedIndex = Math.max(latestStore.index, 0);
      const nextEntries =
        latestStore.entries.length === 0
          ? [nextToken]
          : latestStore.entries.map((entry, index) => (index === normalizedIndex ? nextToken : entry));
      const nextStore = {
        entries: nextEntries,
        index: nextEntries.length === 0 ? -1 : Math.min(normalizedIndex, nextEntries.length - 1),
      };
      writeBrowserStore(nextStore);
      setBrowserStoreSnapshot(nextStore);
      rawReplaceState({ ...(state || {}), didacticSeriesBrowserNavToken: nextToken }, unused, url);
      dispatchSectionNavigationEvent();
    };

    window.history.pushState = patchedPushState;
    window.history.replaceState = patchedReplaceState;
    const initialBrowserStore = syncBrowserStoreForCurrentState();
    setBrowserStoreSnapshot(initialBrowserStore);

    let store = readStore();
    const browserState = (window.history.state || {}) as HistoryStateShape;
    const routeSection = sectionFromLocation();
    const browserSection = browserState.didacticSeriesSection;
    const resolvedSection =
      routeSection !== Section.HOME && browserSection && browserSection !== routeSection
        ? routeSection
        : browserSection ?? routeSection;

    if (browserState.didacticSeriesNavId) {
      const matchedIndex = store.entries.findIndex((entry) => entry.id === browserState.didacticSeriesNavId);
      if (matchedIndex >= 0) {
        const matchedEntry = store.entries[matchedIndex];
        store =
          matchedEntry?.section === resolvedSection
            ? { ...store, index: matchedIndex }
            : {
                entries: store.entries.map((entry, index) =>
                  index === matchedIndex ? { ...entry, section: resolvedSection } : entry
                ),
                index: matchedIndex,
              };
      } else if (resolvedSection !== Section.HOME) {
        store = {
          entries: [
            ...store.entries.slice(0, store.index + 1),
            {
              id: browserState.didacticSeriesNavId,
              section: resolvedSection,
            },
          ],
          index: store.index + 1,
        };
      }
    }

    const currentEntryAfterBrowserState = store.entries[store.index];
    const shouldHonorRouteLanding =
      resolvedSection !== Section.HOME &&
      (currentEntryAfterBrowserState?.section === Section.HOME || browserSection === Section.HOME);

    if (shouldHonorRouteLanding) {
      store = {
        entries: [buildEntry(resolvedSection)],
        index: 0,
      };
    } else if (!browserState.didacticSeriesNavId) {
      const currentEntry = store.entries[store.index];
      if (resolvedSection !== Section.HOME && currentEntry?.section !== resolvedSection) {
        store = {
          entries: [buildEntry(resolvedSection)],
          index: 0,
        };
      }
    }

    const currentEntry = store.entries[store.index];
    if (
      currentEntry &&
      (!browserState.didacticSeriesNavId ||
        currentEntry.section !== browserSection ||
        resolvedSection !== routeSection)
    ) {
      replaceHistoryForEntry(currentEntry);
      dispatchSectionNavigationEvent();
    }

    writeStore(store);
    setStoreSnapshot(store);
    if (currentEntry?.section && currentEntry.section !== currentSection) {
      setCurrentSection(currentEntry.section);
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = (event.state || {}) as HistoryStateShape;
      const routeSection = sectionFromLocation();
      const resolvedSection =
        routeSection !== Section.HOME && state.didacticSeriesSection && state.didacticSeriesSection !== routeSection
          ? routeSection
          : state.didacticSeriesSection ?? routeSection;
      if (resolvedSection === Section.HOME) {
        return;
      }

      const latestStore = readStore();
      const matchedIndex = state.didacticSeriesNavId
        ? latestStore.entries.findIndex((entry) => entry.id === state.didacticSeriesNavId)
        : -1;

      let nextStore =
        matchedIndex >= 0
          ? { ...latestStore, index: matchedIndex }
          : {
              entries: [
                ...latestStore.entries.slice(0, latestStore.index + 1),
                {
                  id: state.didacticSeriesNavId || `${Date.now()}-popstate`,
                  section: resolvedSection,
                },
              ],
              index: latestStore.index + 1,
            };

      if (nextStore.entries[nextStore.index]?.section !== resolvedSection) {
        nextStore = {
          ...nextStore,
          entries: nextStore.entries.map((entry, index) =>
            index === nextStore.index ? { ...entry, section: resolvedSection } : entry
          ),
        };
      }

      writeStore(nextStore);
      const nextBrowserStore = syncBrowserStoreForCurrentState();
      setBrowserStoreSnapshot(nextBrowserStore);
      setStoreSnapshot(nextStore);
      setCurrentSection(resolvedSection);
      window.scrollTo(0, 0);
    };

    const handleSectionNavigationChange = () => {
      const latestStore = readStore();
      const historyState = (window.history.state || {}) as HistoryStateShape;
      const routeSection = sectionFromLocation();
      const fallbackSection = latestStore.entries[latestStore.index]?.section ?? Section.HOME;
      const nextSection =
        routeSection !== Section.HOME ? routeSection : historyState.didacticSeriesSection ?? fallbackSection;

      setBrowserStoreSnapshot(readBrowserStore());
      setStoreSnapshot(latestStore);
      setCurrentSection(nextSection);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener(SECTION_NAVIGATION_EVENT, handleSectionNavigationChange);
    return () => {
      window.history.pushState = rawPushState;
      window.history.replaceState = rawReplaceState;
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(SECTION_NAVIGATION_EVENT, handleSectionNavigationChange);
    };
  }, [setCurrentSection]);

  const goBack = useCallback(() => {
    const browserStore = readBrowserStore();
    if (typeof window === 'undefined') {
      return;
    }
    if (browserStore.index <= 0 && !canGoBackWithinStudyWorkspace(currentSection)) {
      return;
    }
    window.history.back();
  }, [currentSection]);

  const goForward = useCallback(() => {
    const browserStore = readBrowserStore();
    if (browserStore.index >= browserStore.entries.length - 1 || typeof window === 'undefined') {
      return;
    }
    window.history.forward();
  }, []);

  const pushSection = useCallback((section: Section) => {
    if (typeof window === 'undefined') {
      return;
    }
    const nextStore = pushSectionEntry(section);
    setStoreSnapshot(nextStore);
  }, []);

  const flags = useMemo(() => flagsFor(storeSnapshot), [storeSnapshot]);
  const browserFlags = useMemo(() => browserFlagsFor(browserStoreSnapshot), [browserStoreSnapshot]);

  return {
    ...flags,
    canGoBack: browserFlags.canGoBack || flags.canGoBack || canGoBackWithinStudyWorkspace(currentSection),
    canGoForward: browserFlags.canGoForward || flags.canGoForward,
    goBack,
    goForward,
    pushSection,
  };
};
