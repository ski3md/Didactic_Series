import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card.tsx';
import { SparklesIcon } from './icons.tsx';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import { type ActiveStudyDestination, Section } from '../types.ts';
import { getInteractivePromotedLecture } from '../utils/interactiveLectureCatalog.ts';
import LectureAlgorithmPlayer from './lectures/LectureAlgorithmPlayer.tsx';
import { setLectureLibraryIntent } from '../utils/lectureLibraryNavigation.ts';
import { setTutorialLibraryIntent } from '../utils/tutorialLibraryNavigation.ts';
import { setReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import { setCurriculumIntent } from '../utils/curriculumNavigation.ts';
import {
  ALGORITHM_NAVIGATOR_INTENT_EVENT,
  consumeAlgorithmNavigatorIntent,
  describeAlgorithmNavigatorLaunchContext,
  readAlgorithmNavigatorLaunchContext,
  writeAlgorithmNavigatorState,
} from '../utils/algorithmNavigatorNavigation.ts';
import { didacticAlgorithms } from '../utils/algorithmCatalog.ts';
import { buildAlgorithmStudyTree } from '../utils/studyCatalogScopes.ts';
import {
  getDefaultStudyDestination,
  pushStudyDestination,
  replaceStudyDestination,
  restoreStudyDestination,
  STUDY_DESTINATION_EVENT,
} from '../utils/studyDestinationState.ts';
import { resolveStudyDestinationForRender } from '../utils/studyDestinationResolver.ts';

interface AlgorithmNavigatorProps {
  preferences: LearningPreferences;
  onSectionChange: (section: Section) => void;
}

const formatAlgorithmDestinationLabel = (destination: ActiveStudyDestination | null | undefined, entries: typeof didacticAlgorithms) => {
  if (!destination) {
    return 'Workups';
  }

  if (destination.kind === 'item_detail' && destination.itemId) {
    return entries.find((entry) => entry.id === destination.itemId)?.title ?? 'Algorithm detail';
  }

  if (destination.kind === 'subtopic_overview' && destination.subtopicId) {
    return destination.subtopicId;
  }

  if (destination.kind === 'topic_overview' && destination.majorTopicId) {
    return destination.majorTopicId;
  }

  return 'Workups';
};

const isMeaningfulAlgorithmReturn = (destination: ActiveStudyDestination | null | undefined) =>
  Boolean(destination && destination.kind !== 'landing');

const estimateAlgorithmEffort = (nodeCount: number) => {
  if (nodeCount >= 12) {
    return '10-12 min';
  }
  if (nodeCount >= 8) {
    return '6-8 min';
  }
  return '3-5 min';
};

const collectAlgorithmPitfalls = (algorithm: NonNullable<typeof didacticAlgorithms[number]['algorithm']>) =>
  Array.from(
    new Set(
      Object.values(algorithm.nodes)
        .flatMap((node) => node.pitfalls ?? [])
        .filter(Boolean)
    )
  );

const formatAlgorithmPath = (segments: Array<string | null | undefined>) =>
  segments.filter(Boolean).join(' > ');

const mergeSupportTerms = (...groups: Array<Array<string | null | undefined> | null | undefined>) =>
  Array.from(
    new Set(
      groups
        .flatMap((group) => group ?? [])
        .filter((term): term is string => Boolean(term))
    )
  );

const scrollToTopIfAvailable = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const AlgorithmNavigator: React.FC<AlgorithmNavigatorProps> = ({ preferences, onSectionChange }) => {
  const entries = didacticAlgorithms;
  const [destination, setDestination] = useState<ActiveStudyDestination>(() =>
    getDefaultStudyDestination('algorithms')
  );
  const [sourceModuleTitle, setSourceModuleTitle] = useState<string | null>(null);
  const algorithmStudyTree = useMemo(() => buildAlgorithmStudyTree(entries), [entries]);
  const resolvedDestination = useMemo(
    () =>
      resolveStudyDestinationForRender({
        destination,
        validRoots: algorithmStudyTree.roots.map((root) => root.id),
        subtopicsByRoot: Object.fromEntries(
          Object.entries(algorithmStudyTree.subtopicsByRoot).map(([root, scopes]) => [root, scopes.map((scope) => ({ id: scope.id }))])
        ),
        isValidItemId: (itemId) => Boolean(itemId && entries.some((entry) => entry.id === itemId)),
        resolveItemLocation: (itemId) => {
          const entry = entries.find((item) => item.id === itemId);
          return entry
            ? {
                majorTopicId: entry.subspecialtyLabel,
                subtopicId: entry.patternFamily,
              }
            : null;
        },
      }),
    [destination, algorithmStudyTree.roots, entries, algorithmStudyTree.subtopicsByRoot]
  );
  const effectiveDestination = resolvedDestination.destination;
  const effectiveKind = resolvedDestination.renderedKind;
  useEffect(() => {
    if (!resolvedDestination.resolved) {
      return;
    }
    const nextDestination = effectiveDestination;
    if (JSON.stringify(nextDestination) !== JSON.stringify(destination)) {
      replaceStudyDestination(nextDestination);
      setDestination(nextDestination);
    }
  }, [destination, effectiveDestination, resolvedDestination.resolved]);

  useEffect(() => {
    const applyIntent = (intent: ReturnType<typeof consumeAlgorithmNavigatorIntent> | null) => {
      setSourceModuleTitle(intent?.sourceModuleTitle ?? null);

      if (!intent) {
        return;
      }

      if (intent.category) {
        const nextDestination = pushStudyDestination('algorithms', {
          kind: intent.patternFamily ? 'subtopic_overview' : 'topic_overview',
          majorTopicId: intent.category,
          subtopicId: intent.patternFamily,
        });
        setDestination(nextDestination);
      }
      if (intent.selectedId) {
        const selected = entries.find((item) => item.id === intent.selectedId);
        const nextDestination = pushStudyDestination('algorithms', {
          kind: 'item_detail',
          majorTopicId: selected?.subspecialtyLabel,
          subtopicId: selected?.patternFamily,
          itemId: intent.selectedId,
        });
        setDestination(nextDestination);
        return;
      }
      if (intent.lectureId) {
        const entry = entries.find((item) => item.lectureId === intent.lectureId);
        if (entry) {
          const nextDestination = pushStudyDestination('algorithms', {
            kind: 'item_detail',
            majorTopicId: entry.subspecialtyLabel,
            subtopicId: entry.patternFamily,
            itemId: entry.id,
          });
          setDestination(nextDestination);
        }
      }
    };

    setDestination(restoreStudyDestination('algorithms'));
    applyIntent(consumeAlgorithmNavigatorIntent());

    const handleIntent = (event: Event) => {
      applyIntent((event as CustomEvent<ReturnType<typeof consumeAlgorithmNavigatorIntent>>).detail ?? null);
    };

    window.addEventListener(ALGORITHM_NAVIGATOR_INTENT_EVENT, handleIntent as EventListener);
    return () => {
      window.removeEventListener(ALGORITHM_NAVIGATOR_INTENT_EVENT, handleIntent as EventListener);
    };
  }, [entries]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const nextDestination = (event.state?.didacticsStudyDestination as ActiveStudyDestination | undefined);
      if (nextDestination?.workspace === 'algorithms') {
        setDestination(nextDestination);
      }
    };
    const handleDestinationChange = (event: Event) => {
      const nextDestination = (event as CustomEvent<ActiveStudyDestination>).detail;
      if (nextDestination?.workspace === 'algorithms') {
        setDestination(nextDestination);
      }
    };
    window.addEventListener('popstate', handlePopState);
    window.addEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange as EventListener);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange as EventListener);
    };
  }, []);

  const activeAlgorithmRoot = effectiveDestination.majorTopicId;
  const activeAlgorithmSubtopics = activeAlgorithmRoot ? algorithmStudyTree.subtopicsByRoot[activeAlgorithmRoot] ?? [] : [];
  const activeAlgorithmSubtopic = activeAlgorithmSubtopics.find((scope) => scope.id === effectiveDestination.subtopicId) ?? null;
  const filteredEntries = useMemo(
    () => entries.filter((entry) => (activeAlgorithmRoot ? entry.subspecialtyLabel === activeAlgorithmRoot : true)),
    [activeAlgorithmRoot, entries]
  );
  const activeSubtopicEntries = useMemo(
    () =>
      activeAlgorithmSubtopic
        ? filteredEntries.filter((entry) => entry.patternFamily === activeAlgorithmSubtopic.id)
        : [],
    [activeAlgorithmSubtopic, filteredEntries]
  );
  const selectedEntry = effectiveDestination.kind === 'item_detail' && effectiveDestination.itemId
    ? entries.find((entry) => entry.id === effectiveDestination.itemId)
    : undefined;
  const selectedModuleTitle = sourceModuleTitle ?? selectedEntry?.moduleTitle;
  const selectedAlgorithm = selectedEntry?.algorithm;
  const selectedLecture = selectedEntry?.lectureId ? getInteractivePromotedLecture(selectedEntry.lectureId) : undefined;
  const hasLectureSupport = Boolean(selectedEntry?.lectureId);
  const hasTutorialSupport = Boolean(selectedEntry?.tutorialQueries?.length);
  const hasImageReviewSupport = Boolean(selectedEntry?.imageReviewTerms?.length);
  const hasSupportingReview = hasLectureSupport || hasTutorialSupport || hasImageReviewSupport;
  const launchContext = readAlgorithmNavigatorLaunchContext();
  const launchContextLabel = describeAlgorithmNavigatorLaunchContext(launchContext);
  const previousDestination = effectiveDestination.previous ?? null;
  const returnLabel = formatAlgorithmDestinationLabel(previousDestination, entries);
  const hasMeaningfulAlgorithmReturn = isMeaningfulAlgorithmReturn(previousDestination);
  const returnToCurriculumLabel = launchContext?.sourceModuleTitle ?? 'Review set';
  const launchedFromCurriculum = Boolean(launchContext?.sourceModuleId);
  const shouldPreferCurriculumReturn = launchedFromCurriculum && !hasMeaningfulAlgorithmReturn;
  const activeModuleTitles = useMemo(
    () => Array.from(new Set(filteredEntries.map((entry) => entry.moduleTitle).filter(Boolean))),
    [filteredEntries]
  );
  const activeAlgorithmOverview =
    activeAlgorithmRoot === 'Clinical Pathology'
      ? 'Clinical Pathology diagnostic workups for QC response, method oversight, LIS safety, and assay-planning decisions.'
      : 'Choose one differential or workup to review.';
  const landingResumeLabel = formatAlgorithmDestinationLabel(previousDestination, entries);
  const activeNodeCount = selectedAlgorithm ? Object.keys(selectedAlgorithm.nodes).length : 0;
  const activePitfalls = selectedAlgorithm ? collectAlgorithmPitfalls(selectedAlgorithm) : [];
  const commonTrap = activePitfalls[0] ?? selectedEntry?.summary;
  const launchRequestedTopic = launchContext?.sourceRequestedTopic;
  const familyLeadEntry = activeSubtopicEntries[0];
  const imageSupportTerms = mergeSupportTerms(selectedEntry?.imageReviewTerms, selectedEntry?.focusTerms).slice(0, 8);
  const contextualSupportTerms = mergeSupportTerms(
    selectedEntry?.focusTerms?.filter((term) => !imageSupportTerms.includes(term)),
    selectedEntry?.tutorialQueries,
    selectedModuleTitle ? [selectedModuleTitle] : []
  ).slice(0, 6);
  const selectedPathLabel = formatAlgorithmPath([
    selectedEntry?.subspecialtyLabel,
    selectedEntry?.patternFamily,
    selectedEntry?.title,
  ]);

  const returnToCurriculumModule = () => {
    if (!launchContext?.sourceModuleId) {
      return;
    }

    setCurriculumIntent({
      moduleId: launchContext.sourceModuleId,
      query: launchContext.sourceModuleTitle,
      subspecialty:
        launchContext.sourceSubspecialty === 'Clinical Pathology'
          ? 'Clinical Pathology'
          : 'all',
    });
    onSectionChange(Section.PATHOLOGY_CURRICULUM);
  };

  const openRouteFamily = () => {
    if (!selectedEntry) {
      return;
    }
    openAlgorithmSubtopicOverview(selectedEntry.subspecialtyLabel, selectedEntry.patternFamily);
  };

  const openTopicFromDetail = () => {
    if (!selectedEntry) {
      return;
    }
    openAlgorithmTopicOverview(selectedEntry.subspecialtyLabel);
  };

  useEffect(() => {
    if (effectiveKind !== 'item_detail' || !selectedEntry) {
      return;
    }

    const launchContext = readAlgorithmNavigatorLaunchContext();
    setSourceModuleTitle(launchContext?.sourceModuleTitle ?? null);
  }, [effectiveKind, selectedEntry]);

  useEffect(() => {
    writeAlgorithmNavigatorState({
      category: activeAlgorithmRoot,
      selectedId: selectedEntry?.id,
    });
  }, [activeAlgorithmRoot, selectedEntry?.id]);

  const openLecture = () => {
    if (!selectedEntry?.lectureId) {
      return;
    }
    setLectureLibraryIntent({
      selectedId: selectedEntry.lectureId,
      query: selectedEntry.lectureTitle,
      initialMode: 'algorithm',
    });
    onSectionChange(Section.DIDACTIC_LECTURES);
  };

  const openTutorials = (queryText?: string) => {
    setTutorialLibraryIntent({
      query: queryText ?? selectedEntry?.tutorialQueries[0] ?? selectedEntry?.title,
      lane: 'all',
      track: selectedEntry?.subspecialtyLabel === 'Clinical Pathology' ? 'clinical-path' : 'surgical-path',
    });
    onSectionChange(Section.DIDACTIC_TUTORIALS);
  };

  const openReference = (terms?: string[]) => {
    const mappedReferenceTerms = mergeSupportTerms(terms, imageSupportTerms).slice(0, 8);
    setReferenceLibraryIntent({
      lectureId: selectedEntry?.lectureId,
      title: selectedEntry?.title,
      summary: selectedEntry?.summary,
      focusTerms: mappedReferenceTerms,
      tutorialTopics: selectedEntry?.tutorialQueries ?? [],
      algorithmTopics: selectedEntry ? [selectedEntry.title, selectedEntry.patternFamily, selectedEntry.subspecialtyLabel] : [],
    });
    onSectionChange(Section.REFERENCE_LIBRARY);
  };

  const returnToAlgorithmLane = () => {
    const previousDestination = effectiveDestination.previous ?? getDefaultStudyDestination('algorithms');
    replaceStudyDestination(previousDestination);
    setDestination(previousDestination);
    scrollToTopIfAvailable();
  };

  const openAlgorithmTopicOverview = (majorTopicId: string) => {
    const nextDestination = pushStudyDestination('algorithms', {
      kind: 'topic_overview',
      majorTopicId,
    });
    setDestination(nextDestination);
    scrollToTopIfAvailable();
  };

  const openAlgorithmSubtopicOverview = (majorTopicId: string, subtopicId: string) => {
    const nextDestination = pushStudyDestination('algorithms', {
      kind: 'subtopic_overview',
      majorTopicId,
      subtopicId,
    });
    setDestination(nextDestination);
    scrollToTopIfAvailable();
  };

  const openAlgorithmDetail = (entryId: string) => {
    const entry = entries.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }
    const nextDestination = pushStudyDestination('algorithms', {
      kind: 'item_detail',
      majorTopicId: entry.subspecialtyLabel,
      subtopicId: entry.patternFamily,
      itemId: entryId,
    });
    setDestination(nextDestination);
    scrollToTopIfAvailable();
  };

  if (effectiveKind !== 'item_detail' || !selectedEntry || !selectedAlgorithm) {
    return (
      <div className="space-y-6">
        {effectiveKind === 'landing' && (
          <>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Workups</div>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-900">Choose a diagnostic workup</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Choose a diagnostic area, narrow to one differential or workup, then open the approach you want to review.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Current review: Workups</span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800">Next: open one diagnostic area</span>
                  </div>
                </div>
                <div className="min-w-[220px] rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Current area</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Workups</div>
                  <div className="mt-1 text-sm text-slate-600">{algorithmStudyTree.roots.length} diagnostic areas ready</div>
                </div>
              </div>
            </Card>
            {launchedFromCurriculum && (
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Opened from</div>
                    <div className="mt-2 font-serif text-xl font-semibold text-slate-900">{returnToCurriculumLabel}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {launchContext?.sourceModuleSummary ?? 'This page was opened from the current review set.'}
                    </p>
                    {launchRequestedTopic && (
                      <div className="mt-3 text-sm text-slate-500">Requested area: {launchRequestedTopic}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={returnToCurriculumModule}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-900"
                  >
                    Return to review set
                  </button>
                </div>
              </Card>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  if (shouldPreferCurriculumReturn) {
                    returnToCurriculumModule();
                    return;
                  }
                  if (previousDestination) {
                    replaceStudyDestination(previousDestination);
                    setDestination(previousDestination);
                  }
                }}
                disabled={!shouldPreferCurriculumReturn && !previousDestination}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {shouldPreferCurriculumReturn ? 'Return to topic' : 'Resume last workup'}
                </div>
                <div className="mt-3 font-serif text-xl font-semibold text-slate-900">
                  {shouldPreferCurriculumReturn ? returnToCurriculumLabel : landingResumeLabel}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  {shouldPreferCurriculumReturn
                    ? 'Go back to the review set that opened this page.'
                    : previousDestination
                    ? 'Return to the last diagnostic workup you opened without going back through the full list.'
                    : 'Your last algorithm page will appear here after you open one.'}
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstRoot = algorithmStudyTree.roots[0];
                  if (firstRoot) {
                    openAlgorithmTopicOverview(firstRoot.id);
                  }
                }}
                className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start here</div>
                <div className="mt-3 font-serif text-xl font-semibold text-slate-900">
                  {algorithmStudyTree.roots[0]?.label ?? 'Choose a diagnostic area'}
                </div>
                <p className="mt-2 text-sm text-slate-600">
                  Open one diagnostic area, narrow to a differential or workup, then start the diagnostic approach itself.
                </p>
              </button>
            </div>
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic areas</div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {algorithmStudyTree.roots.slice(0, preferences.focusMode ? 3 : 4).map((root) => (
                <button
                  key={root.id}
                  type="button"
                  onClick={() => openAlgorithmTopicOverview(root.id)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                >
                  <div className="font-semibold text-slate-900">{root.label}</div>
                  <div className="mt-2 text-sm text-slate-600">
                    {(algorithmStudyTree.subtopicsByRoot[root.id] ?? []).length} differentials or workups
                  </div>
                </button>
              ))}
              </div>
            </div>
          </>
        )}
        {effectiveKind === 'topic_overview' && activeAlgorithmRoot && (
          <>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Workups</div>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-900">{activeAlgorithmRoot}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {activeAlgorithmOverview}
                  </p>
                  {launchRequestedTopic && (
                    <p className="mt-2 text-sm text-slate-500">
                      Requested from {returnToCurriculumLabel}: {launchRequestedTopic}
                    </p>
                  )}
                </div>
                <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review next</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {activeAlgorithmSubtopics[0]?.label ?? filteredEntries[0]?.title ?? 'Open a workup'}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {activeAlgorithmSubtopics.length > 0
                      ? 'Choose one differential or workup.'
                      : 'This diagnostic area opens directly into the available workups.'}
                  </div>
                  {activeAlgorithmSubtopics.length > 0 && familyLeadEntry && (
                    <div className="mt-2 text-xs text-slate-500">Then review {familyLeadEntry.title}</div>
                  )}
                </div>
              </div>
              {launchedFromCurriculum && (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    From {returnToCurriculumLabel}
                  </span>
                  <button
                    type="button"
                    onClick={returnToCurriculumModule}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-900"
                  >
                    Return to review set
                  </button>
                </div>
              )}
              {activeModuleTitles.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {activeModuleTitles.slice(0, 2).map((title) => (
                    <span key={title} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {title}
                    </span>
                  ))}
                </div>
              )}
            </Card>
            <div className="grid gap-4 lg:grid-cols-2">
              {activeAlgorithmSubtopics.length > 0 ? (
                activeAlgorithmSubtopics.map((scope, index) => (
                  <button
                    key={scope.id}
                    type="button"
                    onClick={() => openAlgorithmSubtopicOverview(activeAlgorithmRoot, scope.id)}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
                  >
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {index === 0 ? 'Start here' : 'Differential / workup'}
                      </div>
                      <div className="mt-3 font-serif text-xl font-semibold text-slate-900">{scope.label}</div>
                    <div className="mt-2 text-sm text-slate-600">
                      {filteredEntries.filter((entry) => entry.patternFamily === scope.id).length} workup
                      {filteredEntries.filter((entry) => entry.patternFamily === scope.id).length === 1 ? '' : 's'}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {filteredEntries.find((entry) => entry.patternFamily === scope.id)?.title ?? 'Open this differential'}
                    </div>
                  </button>
                ))
              ) : (
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <p className="text-slate-700">
                      No narrower differentials are listed for this diagnostic area. Open one of the workups directly.
                    </p>
                  </Card>
                  {filteredEntries.length === 0 ? (
                    <Card>
                      <p className="text-slate-600">No diagnostic workups are currently available in this area.</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredEntries.map((entry, index) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => openAlgorithmDetail(entry.id)}
                          className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                        >
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            {index === 0 ? 'Start here' : 'Diagnostic workup'}
                          </div>
                          <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{entry.title}</h3>
                          <p className="mt-2 text-sm text-slate-600">{entry.summary}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
        {effectiveKind === 'subtopic_overview' && activeAlgorithmRoot && activeAlgorithmSubtopic && (
          <>
            <Card>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Workups</div>
                  <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-900">{activeAlgorithmSubtopic.label}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {activeAlgorithmRoot} {'>'} {activeAlgorithmSubtopic.label}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {activeSubtopicEntries.length} diagnostic workup{activeSubtopicEntries.length === 1 ? '' : 's'} in this differential.
                  </p>
                  {launchRequestedTopic && (
                    <p className="mt-2 text-sm text-slate-500">
                      Requested from {returnToCurriculumLabel}: {launchRequestedTopic}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                      Scope: {activeSubtopicEntries[0]?.title ?? activeAlgorithmSubtopic.label}
                    </span>
                    <span className="rounded-full bg-sky-50 px-3 py-1 font-medium text-sky-800">
                      Next: open the first workup
                    </span>
                  </div>
                </div>
                <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start here</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{activeSubtopicEntries[0]?.title ?? 'Open a workup'}</div>
                  <div className="mt-1 text-sm text-slate-600">Open the main diagnostic workup.</div>
                  <div className="mt-2 text-xs text-slate-500">You can return to the differential, diagnostic area, or review set.</div>
                </div>
              </div>
            </Card>
            <div className="space-y-4">
              {activeSubtopicEntries.map((entry, index) => (
                <button
                  key={entry.id}
                  type="button"
                  onClick={() => openAlgorithmDetail(entry.id)}
                  className="w-full rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {index === 0 ? 'Start here' : 'Diagnostic workup'}
                  </div>
                  <h3 className="mt-3 font-serif text-xl font-semibold text-slate-900">{entry.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{entry.summary}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={shouldPreferCurriculumReturn ? returnToCurriculumModule : returnToAlgorithmLane}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
          >
            Back to {shouldPreferCurriculumReturn ? returnToCurriculumLabel : returnLabel}
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={openTopicFromDetail}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
            >
              Diagnostic areas
            </button>
            <button
              type="button"
              onClick={openRouteFamily}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
            >
              This differential
            </button>
            {launchedFromCurriculum && (
              <button
                type="button"
                onClick={returnToCurriculumModule}
                className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
              >
                Review set
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Diagnostic workup</div>
          <div className="text-sm text-slate-500">{selectedPathLabel}</div>
          <h2 className="font-serif text-3xl font-semibold text-slate-900">{selectedEntry.title}</h2>
          <p className="max-w-4xl text-slate-600">{selectedEntry.summary}</p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {selectedEntry.subspecialtyLabel}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {selectedEntry.patternFamily}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              {estimateAlgorithmEffort(activeNodeCount)}
            </span>
            {selectedModuleTitle && (
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {selectedModuleTitle}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-slate-600">
            <span>{activeNodeCount} steps</span>
            <span className="text-slate-300">|</span>
            <span>{commonTrap}</span>
            {launchContextLabel && (
              <>
                <span className="text-slate-300">|</span>
                <span>Opened from {launchContextLabel}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <LectureAlgorithmPlayer
        algorithm={selectedAlgorithm}
        entityCards={selectedLecture?.entityCards ?? []}
        onOpenTutorial={(queryText) => openTutorials(queryText)}
        onOpenReference={(terms) => openReference(terms)}
      />

      {selectedLecture && (
        <Card>
          <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
            <SparklesIcon className="mr-3 h-6 w-6 text-sky-600" />
            Related lecture points
          </h3>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning objectives</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {(selectedLecture.learningObjectives ?? []).slice(0, 4).map((objective) => (
                  <li key={objective}>• {objective}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mapped image/context support</div>
              {selectedModuleTitle && (
                <div className="mt-3 text-sm font-semibold text-slate-900">{selectedModuleTitle}</div>
              )}
              {selectedEntry.lectureTitle && selectedEntry.lectureTitle !== selectedEntry.title && (
                <div className="mt-1 text-sm text-slate-600">{selectedEntry.lectureTitle}</div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {imageSupportTerms.slice(0, 6).map((term) => (
                  <span key={term} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {term}
                  </span>
                ))}
              </div>
              {contextualSupportTerms.length > 0 && (
                <>
                  <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Broader context</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {contextualSupportTerms.map((term) => (
                      <span key={term} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                        {term}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>
      )}

      {hasSupportingReview && (
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related review</div>
              <h3 className="mt-1 text-xl font-semibold font-serif text-slate-900">Optional follow-up review</h3>
              <p className="mt-2 text-sm text-slate-600">
                Keep the workup primary. Open these afterward when you want more teaching text, board review, or mapped morphology context.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              {hasLectureSupport && (
                <button
                  type="button"
                  onClick={openLecture}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Open related lecture
                </button>
              )}
              {hasTutorialSupport && (
                <button
                  type="button"
                  onClick={() => openTutorials()}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Open related tutorial
                </button>
              )}
              {hasImageReviewSupport && (
                <button
                  type="button"
                  onClick={() => openReference()}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Open mapped morphology review
                </button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default AlgorithmNavigator;
