import { useCallback, useEffect, useMemo, useState } from 'react';
import { Section } from '../types.ts';
import { canGoBackWithinStudyWorkspace } from '../utils/studyDestinationState.ts';

interface NavigationEntry {
  id: string;
  section: Section;
}

interface NavigationStore {
  entries: NavigationEntry[];
  index: number;
}

interface HistoryStateShape {
  didacticSeriesNavId?: string;
  didacticSeriesSection?: Section;
}

export interface SectionNavigationController {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  pushSection: (section: Section) => void;
}

const STORAGE_KEY = 'didactic_series_section_navigation_history';

const normalizePath = (pathname: string): string => pathname.toLowerCase().replace(/\/+$/, '') || '/';

const urlForSection = (section: Section): string => {
  switch (section) {
    case Section.ADMIN:
      return '/didactics/admin';
    default:
      return '/didactics/';
  }
};

export const inferInitialSectionFromLocation = (): Section => {
  if (typeof window === 'undefined') {
    return Section.HOME;
  }

  const pathname = normalizePath(window.location.pathname);
  if (pathname === '/didactics/admin') {
    return Section.ADMIN;
  }
  if (pathname === '/didactics') {
    return Section.DIDACTIC_LECTURES;
  }

  return Section.HOME;
};

const buildEntry = (section: Section): NavigationEntry => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  section,
});

const defaultStore = (): NavigationStore => ({
  entries: [buildEntry(inferInitialSectionFromLocation())],
  index: 0,
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

const flagsFor = (store: NavigationStore) => ({
  canGoBack: store.index > 0,
  canGoForward: store.index < store.entries.length - 1,
});

const toHistoryState = (entry: NavigationEntry): HistoryStateShape => ({
  didacticSeriesNavId: entry.id,
  didacticSeriesSection: entry.section,
});

const pushSectionEntry = (section: Section): NavigationStore => {
  const store = readStore();
  const currentEntry = store.entries[store.index];
  if (currentEntry?.section === section) {
    window.history.replaceState(
      { ...(window.history.state || {}), ...toHistoryState(currentEntry) },
      '',
      urlForSection(currentEntry.section)
    );
    return store;
  }

  const nextEntry = buildEntry(section);
  const nextStore = {
    entries: [...store.entries.slice(0, store.index + 1), nextEntry],
    index: store.index + 1,
  };
  writeStore(nextStore);
  window.history.pushState(
    { ...(window.history.state || {}), ...toHistoryState(nextEntry) },
    '',
    urlForSection(nextEntry.section)
  );
  return nextStore;
};

export const useSectionNavigation = (
  currentSection: Section,
  setCurrentSection: (section: Section) => void
): SectionNavigationController => {
  const [storeSnapshot, setStoreSnapshot] = useState<NavigationStore>(() => readStore());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let store = readStore();
    const browserState = (window.history.state || {}) as HistoryStateShape;
    const routeSection = inferInitialSectionFromLocation();

    if (browserState.didacticSeriesNavId) {
      const matchedIndex = store.entries.findIndex((entry) => entry.id === browserState.didacticSeriesNavId);
      if (matchedIndex >= 0) {
        store = { ...store, index: matchedIndex };
      } else if (browserState.didacticSeriesSection) {
        store = {
          entries: [
            ...store.entries.slice(0, store.index + 1),
            {
              id: browserState.didacticSeriesNavId,
              section: browserState.didacticSeriesSection,
            },
          ],
          index: store.index + 1,
        };
      }
    }

    const currentEntryAfterBrowserState = store.entries[store.index];
    const shouldHonorRouteLanding =
      routeSection !== Section.HOME &&
      (currentEntryAfterBrowserState?.section === Section.HOME || browserState.didacticSeriesSection === Section.HOME);

    if (shouldHonorRouteLanding) {
      store = {
        entries: [buildEntry(routeSection)],
        index: 0,
      };
    } else if (!browserState.didacticSeriesNavId) {
      const currentEntry = store.entries[store.index];
      if (routeSection !== Section.HOME && currentEntry?.section !== routeSection) {
        store = {
          entries: [buildEntry(routeSection)],
          index: 0,
        };
      }
    }

    const currentEntry = store.entries[store.index];
    if (!browserState.didacticSeriesNavId && currentEntry) {
      window.history.replaceState(
        { ...(window.history.state || {}), ...toHistoryState(currentEntry) },
        '',
        urlForSection(currentEntry.section)
      );
    }

    writeStore(store);
    setStoreSnapshot(store);
    if (currentEntry?.section && currentEntry.section !== currentSection) {
      setCurrentSection(currentEntry.section);
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = (event.state || {}) as HistoryStateShape;
      if (!state.didacticSeriesSection) {
        return;
      }

      const latestStore = readStore();
      const matchedIndex = state.didacticSeriesNavId
        ? latestStore.entries.findIndex((entry) => entry.id === state.didacticSeriesNavId)
        : -1;

      const nextStore =
        matchedIndex >= 0
          ? { ...latestStore, index: matchedIndex }
          : {
              entries: [
                ...latestStore.entries.slice(0, latestStore.index + 1),
                {
                  id: state.didacticSeriesNavId || `${Date.now()}-popstate`,
                  section: state.didacticSeriesSection,
                },
              ],
              index: latestStore.index + 1,
            };

      writeStore(nextStore);
      setStoreSnapshot(nextStore);
      setCurrentSection(state.didacticSeriesSection);
      window.scrollTo(0, 0);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentSection, setCurrentSection]);

  const goBack = useCallback(() => {
    const store = readStore();
    if (typeof window === 'undefined') {
      return;
    }
    if (store.index <= 0 && !canGoBackWithinStudyWorkspace(currentSection)) {
      return;
    }
    window.history.back();
  }, [currentSection]);

  const goForward = useCallback(() => {
    const store = readStore();
    if (store.index >= store.entries.length - 1 || typeof window === 'undefined') {
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

  return {
    ...flags,
    canGoBack: flags.canGoBack || canGoBackWithinStudyWorkspace(currentSection),
    goBack,
    goForward,
    pushSection,
  };
};
