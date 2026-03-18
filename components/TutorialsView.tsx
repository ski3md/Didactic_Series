import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import MarkdownContent from './ui/MarkdownContent';
import { CollectionIcon, DocumentTextIcon } from './icons';
import { ImportedContentRecord, TutorialFlashcard, TutorialMCQ } from '../types';
import tutorialsDataUrl from '../src/content/tutorials/tutorials.normalized.json?url';

const TutorialsView: React.FC = () => {
  const [tutorials, setTutorials] = useState<ImportedContentRecord[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    const loadTutorials = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        const response = await fetch(tutorialsDataUrl);
        if (!response.ok) {
          throw new Error(`Unable to load tutorial corpus (${response.status})`);
        }

        const data = (await response.json()) as ImportedContentRecord[];
        if (!isCancelled) {
          setTutorials(data);
          setSelectedId((currentId) => currentId || data[0]?.id || '');
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

  const filteredTutorials = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    if (!lowered) {
      return tutorials;
    }

    return tutorials.filter((tutorial) =>
      [tutorial.title, tutorial.summary, tutorial.body]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(lowered))
    );
  }, [query, tutorials]);

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
        title="Imported Tutorials"
        subtitle="Board-style topic tutorials with markdown content, MCQs, and flashcards imported from the board prep corpus."
        icon={<CollectionIcon className="h-9 w-9" />}
      />

      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold font-serif text-slate-900">Tutorial Corpus</h2>
            <p className="mt-1 text-sm text-slate-500">{tutorials.length} tutorial records available.</p>
          </div>
          <label className="block lg:w-96">
            <span className="sr-only">Search tutorials</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tutorial title or content"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
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
