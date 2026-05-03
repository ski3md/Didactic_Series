import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import { BeakerIcon, SparklesIcon } from './icons.tsx';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import { Section } from '../types.ts';
import { getInteractivePromotedLecture } from '../utils/interactiveLectureCatalog.ts';
import LectureAlgorithmPlayer from './lectures/LectureAlgorithmPlayer.tsx';
import { setLectureLibraryIntent } from '../utils/lectureLibraryNavigation.ts';
import { setTutorialLibraryIntent } from '../utils/tutorialLibraryNavigation.ts';
import { setReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import { consumeAlgorithmNavigatorIntent } from '../utils/algorithmNavigatorNavigation.ts';
import { didacticAlgorithms } from '../utils/algorithmCatalog.ts';
import DidacticWorkspaceNav from './DidacticWorkspaceNav.tsx';

interface AlgorithmNavigatorProps {
  preferences: LearningPreferences;
  onSectionChange: (section: Section) => void;
}

const AlgorithmNavigator: React.FC<AlgorithmNavigatorProps> = ({ preferences, onSectionChange }) => {
  const entries = didacticAlgorithms;
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | string>('all');
  const [patternFilter, setPatternFilter] = useState<'all' | string>('all');
  const [selectedId, setSelectedId] = useState(entries[0]?.id ?? '');
  const [showAllAlgorithms, setShowAllAlgorithms] = useState(false);

  useEffect(() => {
    const intent = consumeAlgorithmNavigatorIntent();
    if (!intent) {
      return;
    }

    if (intent.query) {
      setQuery(intent.query);
    }
    if (intent.category) {
      setCategoryFilter(intent.category);
    }
    if (intent.patternFamily) {
      setPatternFilter(intent.patternFamily);
    }
    if (intent.selectedId) {
      setSelectedId(intent.selectedId);
      return;
    }
    if (intent.lectureId) {
      const entry = entries.find((item) => item.lectureId === intent.lectureId);
      if (entry) {
        setSelectedId(entry.id);
        setCategoryFilter(entry.subspecialtyLabel);
        setPatternFilter(entry.patternFamily);
      }
    }
  }, [entries]);

  const categoryOptions = useMemo(
    () => Array.from(new Set(entries.map((entry) => entry.subspecialtyLabel))).sort((left, right) => left.localeCompare(right)),
    [entries]
  );

  const patternOptions = useMemo(() => {
    const scopedEntries = categoryFilter === 'all'
      ? entries
      : entries.filter((entry) => entry.subspecialtyLabel === categoryFilter);
    return Array.from(new Set(scopedEntries.map((entry) => entry.patternFamily))).sort((left, right) => left.localeCompare(right));
  }, [categoryFilter, entries]);

  const filteredEntries = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (categoryFilter !== 'all' && entry.subspecialtyLabel !== categoryFilter) {
        return false;
      }
      if (patternFilter !== 'all' && entry.patternFamily !== patternFilter) {
        return false;
      }
      if (!lowered) {
        return true;
      }

      return [
        entry.title,
        entry.summary,
        entry.lectureTitle,
        entry.moduleTitle,
        entry.subspecialtyLabel,
        entry.patternFamily,
        ...entry.focusTerms,
        ...entry.topicChips,
      ]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowered));
    });
  }, [categoryFilter, entries, patternFilter, query]);

  const selectedEntry = filteredEntries.find((entry) => entry.id === selectedId) ?? filteredEntries[0];
  const visibleEntries = useMemo(() => {
    const hasSearch = query.trim().length > 0;
    if (hasSearch || showAllAlgorithms) {
      return filteredEntries;
    }
    const selected = filteredEntries.find((entry) => entry.id === selectedId);
    const shortlist = filteredEntries.slice(0, 5);
    return selected && !shortlist.some((entry) => entry.id === selected.id)
      ? [selected, ...shortlist].slice(0, 6)
      : shortlist;
  }, [filteredEntries, query, selectedId, showAllAlgorithms]);
  const selectedAlgorithm = selectedEntry?.algorithm;
  const selectedLecture = selectedEntry?.lectureId ? getInteractivePromotedLecture(selectedEntry.lectureId) : undefined;

  useEffect(() => {
    if (selectedEntry && selectedEntry.id !== selectedId) {
      setSelectedId(selectedEntry.id);
    }
  }, [selectedEntry, selectedId]);

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

  return (
    <div className={`space-y-8 ${preferences.reduceMotion ? '' : 'animate-fade-in'}`}>
      <SectionHeader
        title="Didactic Algorithms"
        subtitle="Choose an algorithm and keep the next move simple."
        icon={<BeakerIcon className="h-10 w-10" />}
      />

      <Card>
        <div className="flex flex-col gap-4">
          <DidacticWorkspaceNav activeSection={Section.DIDACTIC_ALGORITHMS} onSectionChange={onSectionChange} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold font-serif text-slate-900">Algorithms</h2>
            </div>
            <label className="block lg:w-96">
              <span className="sr-only">Search algorithms</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search algorithm, lecture, module, pattern, or focus term"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </label>
          </div>
          <div className="grid gap-3 lg:grid-cols-[16rem_minmax(0,1fr)]">
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Area</span>
              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPatternFilter('all');
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="all">All</option>
                {categoryOptions.map((categoryLabel) => (
                  <option key={categoryLabel} value={categoryLabel}>{categoryLabel}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Pattern</span>
              <select
                value={patternFilter}
                onChange={(event) => setPatternFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="all">All</option>
                {patternOptions.map((pattern) => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-4">
          {visibleEntries.map((entry) => {
            const isActive = entry.id === selectedEntry?.id;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setSelectedId(entry.id)}
                className={`w-full rounded-xl border p-5 text-left shadow-sm transition-all ${
                  isActive
                    ? 'border-sky-400 bg-sky-50 shadow-sky-200/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                  <span className="text-sky-700">{entry.subspecialtyLabel}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                    {entry.patternFamily}
                  </span>
                  {entry.lectureTitle && (
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                      {entry.lectureTitle}
                    </span>
                  )}
                </div>
                <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{entry.title}</h3>
                {!preferences.focusMode && <p className="mt-2 text-sm text-slate-600">{entry.summary}</p>}
              </button>
            );
          })}
          {!showAllAlgorithms && query.trim().length === 0 && filteredEntries.length > visibleEntries.length && (
            <button
              type="button"
              onClick={() => setShowAllAlgorithms(true)}
              className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-800"
            >
              Show all algorithms
            </button>
          )}
        </div>

        {selectedEntry && selectedAlgorithm ? (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">{selectedEntry.category}</p>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                      selectedEntry.promotionState === 'canonical'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-amber-50 text-amber-700'
                    }`}>
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

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedEntry.topicChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setQuery(chip)}
                    className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={openLecture}
                  disabled={!selectedEntry.lectureId}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Open in lecture player
                </button>
                <button
                  type="button"
                  onClick={() => openTutorials()}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  Open supporting tutorial
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
        ) : (
          <Card>
            <p className="text-slate-600">No algorithms matched the current filter.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AlgorithmNavigator;
