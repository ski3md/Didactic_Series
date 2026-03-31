import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import MarkdownContent from './ui/MarkdownContent';
import { CollectionIcon, DocumentTextIcon } from './icons';
import { ImportedContentRecord, Section, TutorialFlashcard, TutorialMCQ } from '../types';
import tutorialsDataUrl from '../src/content/tutorials/tutorials.normalized.json?url';
import downloadsTutorialsDataUrl from '../src/content/downloads_imports/normalized/tutorials.normalized.json?url';
import { getCanonicalBoardPrepTutorials, getPromotedClinicalPathTutorials } from '../utils/promotedContentRegistry';
import { consumeCurriculumDrilldown } from '../utils/curriculumDrilldown';

type TutorialTrack = 'clinical-path' | 'board-prep';

type PromotedTutorialRecord = ImportedContentRecord & {
  tutorialTrack: TutorialTrack;
  sourceLabel: string;
  focusArea: string;
};

function getClinicalPathFocusArea(record: ImportedContentRecord): string {
  const title = `${record.title} ${record.summary ?? ''}`.toLowerCase();

  if (
    title.includes('coag') ||
    title.includes('thrombo') ||
    title.includes('platelet') ||
    title.includes('bleeding') ||
    title.includes('antithrombotic')
  ) {
    return 'Coagulation & Hemostasis';
  }

  if (
    title.includes('transfusion') ||
    title.includes('blood banking') ||
    title.includes('cell and tissue therapy') ||
    title.includes('hla') ||
    title.includes('tissue banking') ||
    title.includes('platelet product') ||
    title.includes('corrected platelet count increment') ||
    title.includes('cci')
  ) {
    return 'Transfusion & Cellular Therapy';
  }

  return 'Hematology';
}

const TutorialsView: React.FC = () => {
  const [tutorials, setTutorials] = useState<PromotedTutorialRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [trackFilter, setTrackFilter] = useState<TutorialTrack>('clinical-path');
  const [focusFilter, setFocusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const drilldown = consumeCurriculumDrilldown(Section.TUTORIALS);
    if (!drilldown) {
      return;
    }

    if (drilldown.query) {
      setQuery(drilldown.query);
    }
    if (drilldown.track === 'clinical-path' || drilldown.track === 'board-prep') {
      setTrackFilter(drilldown.track);
    }
    if (drilldown.filter) {
      setFocusFilter(drilldown.filter);
    }
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadTutorials = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const [boardPrepResponse, downloadsResponse] = await Promise.all([
          fetch(tutorialsDataUrl),
          fetch(downloadsTutorialsDataUrl),
        ]);

        if (!boardPrepResponse.ok) {
          throw new Error(`Unable to load tutorial corpus (${boardPrepResponse.status})`);
        }
        if (!downloadsResponse.ok) {
          throw new Error(`Unable to load promoted tutorial track (${downloadsResponse.status})`);
        }

        const [boardPrepData, downloadsData] = await Promise.all([
          boardPrepResponse.json() as Promise<ImportedContentRecord[]>,
          downloadsResponse.json() as Promise<ImportedContentRecord[]>,
        ]);

        const promotedClinicalPathTutorials = getPromotedClinicalPathTutorials(downloadsData);

        const curatedClinicalPathTrack = promotedClinicalPathTutorials
          .map((record) => ({
            ...record,
            tutorialTrack: 'clinical-path' as const,
            sourceLabel: 'Clinical Pathology Track',
            focusArea: getClinicalPathFocusArea(record),
          }))
          .sort((left, right) => left.title.localeCompare(right.title));

        const canonicalBoardPrepTutorials = getCanonicalBoardPrepTutorials(boardPrepData, promotedClinicalPathTutorials);

        const boardPrepTrack = canonicalBoardPrepTutorials.map((record) => ({
          ...record,
          tutorialTrack: 'board-prep' as const,
          sourceLabel: 'Board Prep Corpus',
          focusArea: 'Anatomic Pathology Board Review',
        }));

        const data = [...curatedClinicalPathTrack, ...boardPrepTrack];
        if (!isCancelled) {
          setTutorials(data);
          setSelectedId((currentId) => currentId || curatedClinicalPathTrack[0]?.id || boardPrepTrack[0]?.id || '');
        }
      } catch (error) {
        if (!isCancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load tutorial corpus.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadTutorials();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    setFocusFilter('all');
    setSelectedId('');
  }, [trackFilter]);

  const trackScopedTutorials = useMemo(() => {
    return tutorials.filter((tutorial) => tutorial.tutorialTrack === trackFilter);
  }, [trackFilter, tutorials]);

  const trackCounts = useMemo(
    () => ({
      clinicalPath: tutorials.filter((tutorial) => tutorial.tutorialTrack === 'clinical-path').length,
      boardPrep: tutorials.filter((tutorial) => tutorial.tutorialTrack === 'board-prep').length,
    }),
    [tutorials]
  );

  const focusOptions = useMemo(() => {
    return ['all', ...new Set(trackScopedTutorials.map((tutorial) => tutorial.focusArea).filter(Boolean))];
  }, [trackScopedTutorials]);

  const filteredTutorials = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const scopedByFocus = focusFilter === 'all'
      ? trackScopedTutorials
      : trackScopedTutorials.filter((tutorial) => tutorial.focusArea === focusFilter);

    if (!lowered) {
      return scopedByFocus;
    }

    return scopedByFocus.filter((tutorial) =>
      [tutorial.title, tutorial.summary, tutorial.body, tutorial.focusArea, tutorial.sourceLabel]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowered))
    );
  }, [focusFilter, query, trackScopedTutorials]);

  useEffect(() => {
    if (filteredTutorials.length === 0) {
      return;
    }

    const hasSelectedTutorial = filteredTutorials.some((tutorial) => tutorial.id === selectedId);
    if (!hasSelectedTutorial) {
      setSelectedId(filteredTutorials[0].id);
    }
  }, [filteredTutorials, selectedId]);

  const selectedTutorial = filteredTutorials.find((tutorial) => tutorial.id === selectedId) ?? filteredTutorials[0];
  const mcqs = (selectedTutorial?.mcqs as TutorialMCQ[] | undefined) ?? [];
  const flashcards = (selectedTutorial?.flashcards as TutorialFlashcard[] | undefined) ?? [];

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Didactic Tutorials"
        subtitle="Promoted tutorial tracks now include a curated clinical pathology lane alongside the preserved board-prep corpus."
        icon={<CollectionIcon className="h-9 w-9" />}
      />

      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold font-serif text-slate-900">Tutorial Tracks</h2>
              <p className="mt-1 text-sm text-slate-500">
                {trackCounts.clinicalPath} curated clinical-path tutorials and {trackCounts.boardPrep} preserved board-prep tutorials.
              </p>
            </div>
            <label className="block lg:w-96">
              <span className="sr-only">Search tutorials</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tutorial title, focus area, or content"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'clinical-path', label: 'Clinical Path Track', detail: `${trackCounts.clinicalPath} tutorials` },
              { id: 'board-prep', label: 'Board Prep Corpus', detail: `${trackCounts.boardPrep} tutorials` },
            ].map((option) => {
              const isActive = trackFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTrackFilter(option.id as TutorialTrack)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? 'border-primary-400 bg-primary-50 text-primary-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <span className="font-semibold">{option.label}</span>
                  <span className="ml-2 text-xs text-slate-500">{option.detail}</span>
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">Curated promotion:</span> the clinical-path track promotes a coherent hematology,
              coagulation, and transfusion-medicine lane out of the Downloads import pipeline. Overlapping titles are removed from the board-prep lane so the
              promoted track remains canonical.
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Focus Area</span>
              <select
                value={focusFilter}
                onChange={(event) => setFocusFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                {focusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option === 'all' ? 'All focus areas' : option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Card>

      {isLoading && (
        <Card>
          <p className="text-slate-600">Loading tutorial corpus...</p>
        </Card>
      )}

      {loadError && !isLoading && (
        <Card>
          <p className="text-red-700">{loadError}</p>
        </Card>
      )}

      {!isLoading && !loadError && (
        <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="space-y-4">
            {filteredTutorials.map((tutorial) => {
              const isActive = tutorial.id === selectedTutorial?.id;
              return (
                <button
                  key={tutorial.id}
                  type="button"
                  onClick={() => setSelectedId(tutorial.id)}
                  className={`w-full rounded-xl border p-5 text-left shadow-sm transition-all ${
                    isActive
                      ? 'border-primary-400 bg-primary-50 shadow-primary-200/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary-700">{tutorial.focusArea}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] text-slate-600">{tutorial.sourceLabel}</span>
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-slate-900">{tutorial.title}</h3>
                  {tutorial.summary && <p className="mt-2 text-sm text-slate-600">{tutorial.summary}</p>}
                  <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                    <span>{(tutorial.provenance.mcqCount as number | undefined) ?? 0} MCQs</span>
                    <span>{(tutorial.provenance.flashcardCount as number | undefined) ?? 0} flashcards</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedTutorial ? (
            <div className="space-y-6">
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold uppercase tracking-wide text-primary-700">
                        {selectedTutorial.focusArea}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {selectedTutorial.sourceLabel}
                      </span>
                    </div>
                    <h2 className="font-serif text-3xl font-semibold text-slate-900">{selectedTutorial.title}</h2>
                    {selectedTutorial.summary && <p className="mt-3 text-slate-600">{selectedTutorial.summary}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="rounded-lg bg-slate-50 px-4 py-3">
                      <div className="font-semibold text-slate-900">MCQs</div>
                      <div>{(selectedTutorial.provenance.mcqCount as number | undefined) ?? mcqs.length}</div>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-4 py-3">
                      <div className="font-semibold text-slate-900">Flashcards</div>
                      <div>{(selectedTutorial.provenance.flashcardCount as number | undefined) ?? flashcards.length}</div>
                    </div>
                  </div>
                </div>
              </Card>

              {selectedTutorial.tutorialTrack === 'clinical-path' && (
                <Card>
                  <h3 className="mb-3 text-xl font-semibold font-serif text-slate-900">Track Context</h3>
                  <p className="text-sm text-slate-600">
                    This tutorial is part of the promoted clinical-path track, curated to form a coherent lane in hematology,
                    coagulation, and transfusion medicine rather than leaving these cases buried in the broader staging corpus.
                  </p>
                </Card>
              )}

              <Card>
                <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                  <DocumentTextIcon className="mr-3 h-6 w-6 text-primary-600" />
                  Tutorial Content
                </h3>
                <MarkdownContent content={selectedTutorial.body} />
              </Card>

              {mcqs.length > 0 && (
                <Card>
                  <h3 className="mb-4 text-xl font-semibold font-serif text-slate-900">MCQ Set</h3>
                  <div className="space-y-4">
                    {mcqs.map((mcq, index) => (
                      <div key={`${mcq.question}-${index}`} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="inline-flex rounded-full bg-primary-100 px-2.5 py-1 text-xs font-semibold text-primary-800">
                            Question {index + 1}
                          </span>
                          {mcq.type && (
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                              {mcq.type}
                            </span>
                          )}
                        </div>
                        <p className="mt-3 font-medium text-slate-900">{mcq.question}</p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {mcq.choices.map((choice) => (
                            <li key={choice} className={`rounded-lg border px-3 py-2 ${choice === mcq.answer ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                              {choice}
                            </li>
                          ))}
                        </ul>
                        {mcq.rationale && <p className="mt-3 text-sm text-slate-600">{mcq.rationale}</p>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {flashcards.length > 0 && (
                <Card>
                  <h3 className="mb-4 text-xl font-semibold font-serif text-slate-900">Flashcards</h3>
                  <div className="grid gap-4 lg:grid-cols-2">
                    {flashcards.map((flashcard, index) => (
                      <div key={`${flashcard.front}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        {flashcard.tag && (
                          <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {flashcard.tag}
                          </span>
                        )}
                        <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Front</div>
                        <p className="mt-1 text-sm font-medium text-slate-900">{flashcard.front}</p>
                        <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Back</div>
                        <p className="mt-1 text-sm text-slate-700">{flashcard.back}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <p className="text-slate-600">No tutorials matched the current search.</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TutorialsView;
