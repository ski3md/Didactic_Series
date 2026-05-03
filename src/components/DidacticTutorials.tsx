import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import MarkdownContent from './ui/MarkdownContent.tsx';
import { BookOpenIcon, DocumentTextIcon, SparklesIcon } from './icons.tsx';
import {
  findBestTutorialMatch,
  getDidacticTutorialById,
  loadDidacticTutorials,
  type DidacticTutorialRecord,
  type TutorialLane,
  type TutorialTrack,
} from '../utils/tutorialLibraryCatalog.ts';
import { consumeTutorialLibraryIntent } from '../utils/tutorialLibraryNavigation.ts';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import { Section } from '../types.ts';
import DidacticWorkspaceNav from './DidacticWorkspaceNav.tsx';

type TutorialTab = 'snapshot' | 'tutorial' | 'flashcards' | 'quiz';

interface DidacticTutorialsProps {
  preferences: LearningPreferences;
  onSectionChange: (section: Section) => void;
}

const DidacticTutorials: React.FC<DidacticTutorialsProps> = ({ preferences, onSectionChange }) => {
  const [tutorials, setTutorials] = useState<DidacticTutorialRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [query, setQuery] = useState('');
  const [laneFilter, setLaneFilter] = useState<'all' | TutorialLane>('all');
  const [trackFilter, setTrackFilter] = useState<'all' | TutorialTrack>('all');
  const [showAllTutorials, setShowAllTutorials] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TutorialTab>('snapshot');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const intent = consumeTutorialLibraryIntent();

    const initialize = async () => {
      setIsLoading(true);
      const loadedTutorials = await loadDidacticTutorials();
      if (!isMounted) {
        return;
      }
      setTutorials(loadedTutorials);
      setSelectedId(loadedTutorials[0]?.id ?? '');

      if (!intent) {
        setIsLoading(false);
        return;
      }

      if (intent.query) {
        setQuery(intent.query);
      }
      if (intent.lane) {
        setLaneFilter(intent.lane);
      }
      if (intent.track) {
        setTrackFilter(intent.track);
      }
      if (intent.selectedId) {
        const tutorial = getDidacticTutorialById(loadedTutorials, intent.selectedId);
        if (tutorial) {
          setSelectedId(tutorial.id);
          setLaneFilter(tutorial.lane);
          setTrackFilter(tutorial.track);
          setIsLoading(false);
          return;
        }
      }
      if (intent.query) {
        const matchedTutorial = findBestTutorialMatch(loadedTutorials, [intent.query]);
        if (matchedTutorial) {
          setSelectedId(matchedTutorial.id);
        }
      }
      setIsLoading(false);
    };

    initialize();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredTutorials = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    const scopedTutorials = tutorials.filter((tutorial) => {
      if (laneFilter !== 'all' && tutorial.lane !== laneFilter) {
        return false;
      }
      if (trackFilter !== 'all' && tutorial.track !== trackFilter) {
        return false;
      }
      return true;
    });

    if (!lowered) {
      return scopedTutorials;
    }

    return scopedTutorials.filter((tutorial) =>
      [
        tutorial.title,
        tutorial.summary,
        tutorial.category || '',
        tutorial.trackLabel,
        tutorial.sourceLabel,
        ...tutorial.tags,
        ...tutorial.topicChips,
      ]
        .some((value) => value.toLowerCase().includes(lowered))
    );
  }, [laneFilter, query, trackFilter, tutorials]);

  const selectedTutorial = filteredTutorials.find((tutorial) => tutorial.id === selectedId) ?? filteredTutorials[0];
  const visibleTutorials = useMemo(() => {
    const hasSearch = query.trim().length > 0;
    if (hasSearch || showAllTutorials) {
      return filteredTutorials;
    }
    const selected = filteredTutorials.find((tutorial) => tutorial.id === selectedId);
    const shortlist = filteredTutorials.slice(0, 5);
    return selected && !shortlist.some((tutorial) => tutorial.id === selected.id)
      ? [selected, ...shortlist].slice(0, 6)
      : shortlist;
  }, [filteredTutorials, query, selectedId, showAllTutorials]);
  const currentFlashcard = selectedTutorial?.flashcards[flashcardIndex] ?? null;
  const currentQuestion = selectedTutorial?.mcqs[questionIndex] ?? null;
  const activeRecallPrompts = useMemo(() => {
    if (!selectedTutorial) {
      return [];
    }
    return [
      `Explain the core distinction in ${selectedTutorial.title} in one or two sentences.`,
      `Name the board-relevant pitfall or mimic most likely to confuse this topic.`,
      `State one morphologic feature and one management-relevant implication for this topic.`,
    ];
  }, [selectedTutorial]);

  useEffect(() => {
    setActiveTab('snapshot');
    setFlashcardIndex(0);
    setFlashcardRevealed(false);
    setQuestionIndex(0);
    setSelectedChoice(null);
    setShowRationale(false);
  }, [selectedTutorial?.id]);

  const renderTabButton = (tab: TutorialTab, label: string) => {
    const isActive = activeTab === tab;
    return (
      <button
        key={tab}
        type="button"
        onClick={() => setActiveTab(tab)}
        className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
          isActive
            ? 'border-sky-400 bg-sky-50 text-sky-800'
            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div className={`space-y-8 ${preferences.reduceMotion ? '' : 'animate-fade-in'}`}>
      <SectionHeader
        title="Didactic Tutorials"
        subtitle="Choose a tutorial and move through one study sequence."
        icon={<BookOpenIcon className="h-10 w-10" />}
      />

      <Card>
        <div className="flex flex-col gap-4">
          <DidacticWorkspaceNav activeSection={Section.DIDACTIC_TUTORIALS} onSectionChange={onSectionChange} />
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold font-serif text-slate-900">Tutorials</h2>
            </div>
            <label className="block lg:w-96">
              <span className="sr-only">Search tutorials</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, topic, tag, or category"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All' },
              { id: 'surgical-path', label: 'Surgical' },
              { id: 'clinical-path', label: 'Clinical' },
              { id: 'cross-cutting', label: 'Cross-Cutting' },
            ].map((option) => {
              const isActive = trackFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setTrackFilter(option.id as 'all' | TutorialTrack)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? 'border-sky-400 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                    >
                  <span className="font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3">
            {[
              { id: 'all', label: 'All' },
              { id: 'board-prep', label: 'Board Prep' },
              { id: 'core-patterns', label: 'Patterns' },
              { id: 'granuloma', label: 'Granuloma' },
            ].map((option) => {
              const isActive = laneFilter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setLaneFilter(option.id as 'all' | TutorialLane)}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    isActive
                      ? 'border-sky-400 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                    >
                  <span className="font-semibold">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {isLoading ? (
        <Card>
          <p className="text-slate-600">Loading tutorials...</p>
        </Card>
      ) : (
        <div className="grid gap-8 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <div className="space-y-4">
            {visibleTutorials.map((tutorial) => {
              const isActive = tutorial.id === selectedTutorial?.id;
              return (
                <button
                  key={tutorial.id}
                  type="button"
                  onClick={() => setSelectedId(tutorial.id)}
                  className={`w-full rounded-xl border p-5 text-left shadow-sm transition-all ${
                    isActive
                      ? 'border-sky-400 bg-sky-50 shadow-sky-200/40'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span className="text-sky-700">{tutorial.category ?? 'Tutorial'}</span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                      {tutorial.laneLabel}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                      {tutorial.trackLabel}
                    </span>
                  </div>
                  <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{tutorial.title}</h3>
                  {!preferences.focusMode && <p className="mt-2 text-sm text-slate-600">{tutorial.summary}</p>}
                </button>
              );
            })}
            {!showAllTutorials && query.trim().length === 0 && filteredTutorials.length > visibleTutorials.length && (
              <button
                type="button"
                onClick={() => setShowAllTutorials(true)}
                className="w-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:text-sky-800"
              >
                Show all tutorials
              </button>
            )}
          </div>

          {selectedTutorial ? (
            <div className="space-y-6">
              <Card>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">
                        {selectedTutorial.category ?? 'Tutorial'}
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {selectedTutorial.laneLabel}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {selectedTutorial.trackLabel}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        selectedTutorial.promotionState === 'canonical'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {selectedTutorial.promotionLabel}
                      </span>
                    </div>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-900">{selectedTutorial.title}</h2>
                    <p className="mt-3 text-slate-600">{selectedTutorial.summary}</p>
                  </div>
                </div>
                {(selectedTutorial.topicChips.length > 0 || selectedTutorial.tags.length > 0) && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedTutorial.topicChips.concat(selectedTutorial.tags).slice(0, preferences.focusMode ? 6 : 10).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setQuery(tag)}
                        className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-5 flex flex-wrap gap-3">
                  {renderTabButton('snapshot', 'Snapshot')}
                  {renderTabButton('tutorial', 'Tutorial')}
                  {renderTabButton('flashcards', 'Flashcards')}
                  {renderTabButton('quiz', 'Quick Check')}
                </div>
              </Card>

              {activeTab === 'snapshot' && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <SparklesIcon className="mr-3 h-6 w-6 text-sky-600" />
                    Snapshot
                  </h3>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <ul className="space-y-2 text-sm text-slate-700">
                      {activeRecallPrompts.map((prompt) => (
                        <li key={prompt}>{prompt}</li>
                      ))}
                    </ul>
                  </div>
                </Card>
              )}

              {activeTab === 'tutorial' && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <DocumentTextIcon className="mr-3 h-6 w-6 text-sky-600" />
                    Tutorial Content
                  </h3>
                  <MarkdownContent content={selectedTutorial.body} />
                </Card>
              )}

              {activeTab === 'flashcards' && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <BookOpenIcon className="mr-3 h-6 w-6 text-sky-600" />
                    Flashcard Review
                  </h3>
                  {currentFlashcard ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Card {flashcardIndex + 1} of {selectedTutorial.flashcards.length}
                        </div>
                        <div className="mt-4 text-lg font-semibold text-slate-900">{currentFlashcard.front}</div>
                        {flashcardRevealed ? (
                          <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">{currentFlashcard.back}</div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setFlashcardRevealed(true)}
                            className="mt-4 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                          >
                            Reveal Answer
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button
                          type="button"
                          disabled={flashcardIndex === 0}
                          onClick={() => {
                            setFlashcardIndex((current) => Math.max(0, current - 1));
                            setFlashcardRevealed(false);
                          }}
                          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          type="button"
                          disabled={flashcardIndex >= selectedTutorial.flashcards.length - 1}
                          onClick={() => {
                            setFlashcardIndex((current) => Math.min(selectedTutorial.flashcards.length - 1, current + 1));
                            setFlashcardRevealed(false);
                          }}
                          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next Card
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No flashcards were imported for this tutorial yet.</p>
                  )}
                </Card>
              )}

              {activeTab === 'quiz' && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <SparklesIcon className="mr-3 h-6 w-6 text-sky-600" />
                    Quick Check
                  </h3>
                  {currentQuestion ? (
                    <div className="space-y-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Question {questionIndex + 1} of {selectedTutorial.mcqs.length}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <div className="text-lg font-semibold text-slate-900">{currentQuestion.question}</div>
                        <div className="mt-4 space-y-3">
                          {currentQuestion.choices.map((choice) => {
                            const isSelected = selectedChoice === choice;
                            const isCorrect = showRationale && choice === currentQuestion.answer;
                            const isIncorrectSelection = showRationale && isSelected && choice !== currentQuestion.answer;
                            return (
                              <button
                                key={choice}
                                type="button"
                                disabled={showRationale}
                                onClick={() => setSelectedChoice(choice)}
                                className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition ${
                                  isCorrect
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                    : isIncorrectSelection
                                      ? 'border-rose-300 bg-rose-50 text-rose-900'
                                      : isSelected
                                        ? 'border-sky-400 bg-sky-50 text-sky-900'
                                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                                }`}
                              >
                                {choice}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      {!showRationale ? (
                        <button
                          type="button"
                          onClick={() => setShowRationale(true)}
                          disabled={!selectedChoice}
                          className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Check Answer
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">Correct answer:</span> {currentQuestion.answer}
                            {currentQuestion.rationale && (
                              <p className="mt-2">{currentQuestion.rationale}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextIndex = Math.min(selectedTutorial.mcqs.length - 1, questionIndex + 1);
                              setQuestionIndex(nextIndex);
                              setSelectedChoice(null);
                              setShowRationale(false);
                            }}
                            disabled={questionIndex >= selectedTutorial.mcqs.length - 1}
                            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Next Question
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">No imported MCQs are available for this tutorial yet.</p>
                  )}
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

export default DidacticTutorials;
