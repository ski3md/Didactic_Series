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
import {
  consumeAlgorithmNavigatorIntent,
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

const AlgorithmNavigator: React.FC<AlgorithmNavigatorProps> = ({ preferences, onSectionChange }) => {
  const entries = didacticAlgorithms;
  const [destination, setDestination] = useState<ActiveStudyDestination>(() =>
    getDefaultStudyDestination('algorithms')
  );
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
    const intent = consumeAlgorithmNavigatorIntent();
    setDestination(restoreStudyDestination('algorithms'));

    if (!intent) {
      return;
    }

    if (intent.category) {
      const nextDestination = pushStudyDestination('algorithms', {
        kind: 'topic_overview',
        majorTopicId: intent.category,
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
  const selectedAlgorithm = selectedEntry?.algorithm;
  const selectedLecture = selectedEntry?.lectureId ? getInteractivePromotedLecture(selectedEntry.lectureId) : undefined;

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
    setReferenceLibraryIntent({
      lectureId: selectedEntry?.lectureId,
      title: selectedEntry?.lectureTitle ?? selectedEntry?.title,
      summary: selectedEntry?.summary,
      focusTerms: terms ?? selectedEntry?.focusTerms ?? [],
      tutorialTopics: selectedEntry?.tutorialQueries ?? [],
      algorithmTopics: selectedEntry ? [selectedEntry.title, selectedEntry.patternFamily] : [],
    });
    onSectionChange(Section.REFERENCE_LIBRARY);
  };

  const returnToAlgorithmLane = () => {
    const previousDestination = effectiveDestination.previous ?? getDefaultStudyDestination('algorithms');
    replaceStudyDestination(previousDestination);
    setDestination(previousDestination);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openAlgorithmTopicOverview = (majorTopicId: string) => {
    const nextDestination = pushStudyDestination('algorithms', {
      kind: 'topic_overview',
      majorTopicId,
    });
    setDestination(nextDestination);
  };

  const openAlgorithmSubtopicOverview = (majorTopicId: string, subtopicId: string) => {
    const nextDestination = pushStudyDestination('algorithms', {
      kind: 'subtopic_overview',
      majorTopicId,
      subtopicId,
    });
    setDestination(nextDestination);
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
  };

  if (effectiveKind !== 'item_detail' || !selectedEntry || !selectedAlgorithm) {
    return (
        <div className="space-y-6">
          {effectiveKind === 'landing' && (
          <>
            <Card>
              <h2 className="font-serif text-2xl font-semibold text-slate-900">Algorithms</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Choose a diagnostic lane, then open a focused pattern family.
              </p>
            </Card>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {algorithmStudyTree.roots.slice(0, preferences.focusMode ? 4 : 6).map((root) => (
                <button
                  key={root.id}
                  type="button"
                  onClick={() => openAlgorithmTopicOverview(root.id)}
                  className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                >
                  <div className="font-semibold text-slate-900">{root.label}</div>
                  <div className="mt-2 text-sm text-slate-600">
                    {(algorithmStudyTree.subtopicsByRoot[root.id] ?? []).length} pattern families
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        {effectiveKind === 'topic_overview' && activeAlgorithmRoot && (
          <>
            <Card>
              <h2 className="font-serif text-2xl font-semibold text-slate-900">{activeAlgorithmRoot}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Open one pattern family to review.
              </p>
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
                      {index === 0 ? 'Start here' : 'Pattern family'}
                    </div>
                    <div className="mt-3 font-serif text-xl font-semibold text-slate-900">{scope.label}</div>
                  </button>
                ))
              ) : (
                <div className="lg:col-span-2 space-y-4">
                  <Card>
                    <p className="text-slate-700">
                      No smaller pattern families are defined for this lane. Open one of the lane items directly.
                    </p>
                  </Card>
                  {filteredEntries.length === 0 ? (
                    <Card>
                      <p className="text-slate-600">No algorithms are currently available in this lane.</p>
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
                            {index === 0 ? 'Recommended first item' : 'Algorithm'}
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
              <h2 className="font-serif text-2xl font-semibold text-slate-900">{activeAlgorithmSubtopic.label}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {activeAlgorithmRoot} {'>'} {activeAlgorithmSubtopic.label}
              </p>
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
                    {index === 0 ? 'Recommended first item' : 'Algorithm'}
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
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={returnToAlgorithmLane}
            className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
          >
            Back
          </button>
          <span className="text-xs font-medium text-slate-500">
            {selectedEntry?.topicChips?.length
              ? `Connected to ${selectedEntry.topicChips.length} curriculum-linked tags`
              : 'Connected to algorithm workspace'}
          </span>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">{selectedEntry.category}</p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  selectedEntry.promotionState === 'canonical'
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {selectedEntry.promotionLabel}
              </span>
              {selectedEntry.moduleTitle && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {selectedEntry.moduleTitle}
                </span>
              )}
            </div>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{selectedEntry.title}</h2>
            <p className="mt-3 text-slate-600">{selectedEntry.summary}</p>
          </div>
        </div>

        {selectedEntry.topicChips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {selectedEntry.topicChips.slice(0, preferences.focusMode ? 4 : 6).map((chip) => (
              <span key={chip} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                {chip}
              </span>
            ))}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={openLecture}
            disabled={!selectedEntry.lectureId}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Open linked lecture
          </button>
          <button
            type="button"
            onClick={() => openTutorials()}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Open tutorial
          </button>
          <button
            type="button"
            onClick={() => openReference()}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Open image review
          </button>
        </div>
      </Card>

      {selectedLecture && (
        <Card>
          <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
            <SparklesIcon className="mr-3 h-6 w-6 text-sky-600" />
            Related lecture findings
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
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image review terms</div>
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedEntry.focusTerms.slice(0, 6).map((term) => (
                  <span key={term} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      <LectureAlgorithmPlayer
        algorithm={selectedAlgorithm}
        entityCards={selectedLecture?.entityCards ?? []}
        onOpenTutorial={(queryText) => openTutorials(queryText)}
        onOpenReference={(terms) => openReference(terms)}
      />
    </div>
  );
};

export default AlgorithmNavigator;
