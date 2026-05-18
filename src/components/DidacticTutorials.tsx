import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card.tsx';
import MarkdownContent from './ui/MarkdownContent.tsx';
import { DocumentTextIcon, SparklesIcon } from './icons.tsx';
import {
  deriveTutorialSubtopic,
  findBestTutorialMatch,
  getGovernancePendingTutorial,
  getDidacticTutorialById,
  loadDidacticTutorialCatalog,
  type DidacticTutorialRecord,
  type TutorialTrack,
} from '../utils/tutorialLibraryCatalog.ts';
import { consumeTutorialLibraryIntent } from '../utils/tutorialLibraryNavigation.ts';
import { getAnswerChoiceReasoning } from '../utils/answerChoiceReasoning.ts';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import {
  Section,
  type ActiveStudyDestination,
  type BoardPassingPredictorInputs,
  type DidacticsVisualMode,
} from '../types.ts';
import { readSessionState, writeSessionState } from '../utils/viewStateStorage.ts';
import { type TutorialTab } from '../utils/tutorialViewState.ts';
import {
  buildBoardPassingPrediction,
  buildPerformanceForecast,
  buildPerformanceSnapshot,
  buildReviewGridTiles,
  buildWeakClusterSummary,
  mcqToImportedQuestion,
  PTHFNDR_DIDACTICS_COMMAND_CENTER_SCHEMA,
  type QuestionSessionRecord,
  validateImportedQuestionAnswerKey,
} from '../utils/pthfndrDidacticsCommandCenter.ts';
import { resolveStudyDestinationForRender } from '../utils/studyDestinationResolver.ts';
import {
  getDefaultStudyDestination,
  pushStudyDestination,
  replaceStudyDestination,
  restoreStudyDestination,
  setStudyDestinationActiveTab,
  STUDY_DESTINATION_EVENT,
} from '../utils/studyDestinationState.ts';
import type { ValidatedMappingsManifest } from '../types.ts';

const TUTORIAL_VIEW_STATE_KEY = 'pthfndr-didactics-tutorial-view-state';

interface TutorialViewState {
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
  visualMode: DidacticsVisualMode;
}

const TUTORIAL_VIEW_STATE_DEFAULTS: TutorialViewState = {
  selectedId: '',
  query: '',
  rootFilter: 'all',
  subtopicFilter: 'all',
  trackFilter: 'all',
  showAllTutorials: true,
  activeTab: 'snapshot',
  flashcardIndex: 0,
  questionIndex: 0,
  interactiveAssetIndex: 0,
  visualMode: 'cockpit_dashboard',
};

const persistTutorialViewState = (updates: Partial<TutorialViewState> = {}) => {
  const current = readSessionState<TutorialViewState>(TUTORIAL_VIEW_STATE_KEY);
  const next = {
    ...TUTORIAL_VIEW_STATE_DEFAULTS,
    ...(current || {}),
    ...updates,
  };
  writeSessionState<TutorialViewState>(TUTORIAL_VIEW_STATE_KEY, next);
};

interface DidacticTutorialsProps {
  preferences: LearningPreferences;
  onSectionChange: (section: Section) => void;
}

const QUESTION_SESSION_STORAGE_KEY = 'pthfndr-didactics-question-sessions';
const READINESS_INPUTS_STORAGE_KEY = 'pthfndr-didactics-readiness-inputs';

interface TutorialSessionSection {
  id: string;
  label: string;
  content: string;
}

const DEFAULT_READINESS_INPUTS: BoardPassingPredictorInputs = {
  mcqPracticeSessions: 3,
  pthfndrSessions: 2,
  inServiceScore: 58,
  ankiAccuracy: 72,
  studyHoursPerWeek: 6,
  grossingExperience: 6,
  feedbackQuality: 6,
  wellBeingScore: 6,
};

const TEACHING_SESSION_SECTION_ORDER = [
  'Clinical Vignette',
  'Learning Objectives',
  'Case Discussion',
  'Differential Diagnosis',
  'Diagnostic Workup',
  'Laboratory Findings',
  'Microscopic Findings',
  'Histologic Features',
  'Key Features',
  'Teaching Points',
  'Management',
  'Final Diagnosis',
  'Gold Standard Report',
  'References',
] as const;

const normalizeTutorialSectionLabel = (label: string) => {
  const compact = label.replace(/_/g, ' ').replace(/[:\-]+$/g, '').trim().toLowerCase();
  switch (compact) {
    case 'objective':
    case 'objectives':
    case 'learning objectives':
      return 'Learning Objectives';
    case 'clinical vignette':
      return 'Clinical Vignette';
    case 'case discussion':
    case 'discussion':
      return 'Case Discussion';
    case 'teaching points':
    case 'pearls':
      return 'Teaching Points';
    case 'pitfall':
    case 'pitfalls':
      return 'Pitfalls';
    case 'references':
      return 'References';
    default:
      return label.replace(/_/g, ' ').replace(/[:\-]+$/g, '').trim();
  }
};

const normalizeTutorialBodyForSession = (content: string) => {
  let normalized = content
    .replace(/\[\[([^\]|#]+)(?:#[^\]|]+)?\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]|#]+)(?:#[^\]]+)?\]\]/g, '$1')
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/\bClinical_Vignette\b/g, 'Clinical Vignette')
    .replace(/\bCase_Discussion\b/g, 'Case Discussion')
    .replace(/(^|\n)(Objective|Objectives)\s*-\s*/gi, '$1## Learning Objectives\n\n- ');

  TEACHING_SESSION_SECTION_ORDER.forEach((label) => {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    normalized = normalized
      .replace(new RegExp(`(^|\\n)#{1,6}\\s*${escaped}\\s*:?\\s*`, 'gi'), `$1## ${label}\n\n`)
      .replace(new RegExp(`(^|\\n)${escaped}\\s*:?\\s*`, 'gi'), `$1## ${label}\n\n`);
  });

  return normalized
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const parseTutorialSessionSections = (content: string): TutorialSessionSection[] => {
  const normalized = normalizeTutorialBodyForSession(content);
  const blocks = normalized.split(/\n(?=##\s+)/g).map((block) => block.trim()).filter(Boolean);

  if (blocks.length === 0) {
    return [];
  }

  return blocks
    .map((block, index) => {
      const match = block.match(/^##\s+([^\n]+)\n+([\s\S]*)$/);
      if (!match) {
        return index === 0
          ? {
              id: 'session-overview',
              label: 'Session Overview',
              content: block,
            }
          : null;
      }

      const label = normalizeTutorialSectionLabel(match[1]);
      const sectionId = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return {
        id: sectionId || `section-${index + 1}`,
        label,
        content: match[2].trim(),
      };
    })
    .filter((section): section is TutorialSessionSection => Boolean(section?.content));
};

const DidacticTutorials: React.FC<DidacticTutorialsProps> = ({ preferences }) => {
  const [tutorials, setTutorials] = useState<DidacticTutorialRecord[]>([]);
  const [governanceManifest, setGovernanceManifest] = useState<ValidatedMappingsManifest | null>(null);
  const [destination, setDestination] = useState<ActiveStudyDestination>(() =>
    getDefaultStudyDestination('tutorials')
  );
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TutorialTab>('snapshot');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [showRationale, setShowRationale] = useState(false);
  const [interactiveAssetIndex, setInteractiveAssetIndex] = useState(0);
  const [visualMode, setVisualMode] = useState<DidacticsVisualMode>('cockpit_dashboard');
  const [questionSessionMap, setQuestionSessionMap] = useState<Record<string, QuestionSessionRecord[]>>({});
  const [readinessInputs, setReadinessInputs] = useState<BoardPassingPredictorInputs>(DEFAULT_READINESS_INPUTS);
  const [questionStartedAt, setQuestionStartedAt] = useState<number>(() => Date.now());

  useEffect(() => {
    let isMounted = true;
    const intent = consumeTutorialLibraryIntent();

    try {
      const storedSessions = window.localStorage.getItem(QUESTION_SESSION_STORAGE_KEY);
      if (storedSessions) {
        setQuestionSessionMap(JSON.parse(storedSessions) as Record<string, QuestionSessionRecord[]>);
      }
      const storedInputs = window.localStorage.getItem(READINESS_INPUTS_STORAGE_KEY);
      if (storedInputs) {
        setReadinessInputs({ ...DEFAULT_READINESS_INPUTS, ...(JSON.parse(storedInputs) as Partial<BoardPassingPredictorInputs>) });
      }
    } catch {
      // Ignore local persistence errors and continue with in-memory state.
    }

    const initialize = async () => {
      setIsLoading(true);
      const loadedCatalog = await loadDidacticTutorialCatalog();
      const loadedTutorials = loadedCatalog.tutorials;
      if (!isMounted) {
        return;
      }
      setTutorials(loadedTutorials);
      setGovernanceManifest(loadedCatalog.governanceManifest);
      const restoredDestination = restoreStudyDestination('tutorials');
      setDestination(restoredDestination);
      setActiveTab(restoredDestination.activeTab === 'tutorial' || restoredDestination.activeTab === 'flashcards' || restoredDestination.activeTab === 'quiz' || restoredDestination.activeTab === 'snapshot'
        ? restoredDestination.activeTab
        : 'snapshot');

      if (intent?.selectedId) {
        const tutorial = getDidacticTutorialById(loadedTutorials, intent.selectedId);
        if (tutorial) {
          const nextDestination: ActiveStudyDestination = {
            workspace: 'tutorials',
            kind: 'item_detail',
            majorTopicId: tutorial.abpathScope?.root,
            subtopicId: deriveTutorialSubtopic(tutorial)?.id,
            itemId: tutorial.id,
            activeTab: 'snapshot',
            previous: {
              workspace: 'tutorials',
              kind: tutorial.abpathScope?.root ? 'subtopic_overview' : 'landing',
              majorTopicId: tutorial.abpathScope?.root,
              subtopicId: deriveTutorialSubtopic(tutorial)?.id,
              previous: tutorial.abpathScope?.root
                ? {
                    workspace: 'tutorials',
                    kind: 'topic_overview',
                    majorTopicId: tutorial.abpathScope?.root,
                    previous: getDefaultStudyDestination('tutorials'),
                  }
                : getDefaultStudyDestination('tutorials'),
            },
          };
          replaceStudyDestination(nextDestination);
          setDestination(nextDestination);
          setActiveTab('snapshot');
          setIsLoading(false);
          return;
        }
        const blockedTutorial = getGovernancePendingTutorial(loadedCatalog.governanceManifest, intent.selectedId);
        if (blockedTutorial) {
          const nextDestination: ActiveStudyDestination = {
            workspace: 'tutorials',
            kind: 'item_detail',
            majorTopicId: blockedTutorial.abpathRoot,
            itemId: blockedTutorial.id,
            activeTab: 'snapshot',
            previous: getDefaultStudyDestination('tutorials'),
          };
          replaceStudyDestination(nextDestination);
          setDestination(nextDestination);
          setActiveTab('snapshot');
          setIsLoading(false);
          return;
        }
      }

      if (intent?.query) {
        const matchedTutorial = findBestTutorialMatch(loadedTutorials, [intent.query]);
        if (matchedTutorial) {
          const nextDestination: ActiveStudyDestination = {
            workspace: 'tutorials',
            kind: 'item_detail',
            majorTopicId: matchedTutorial.abpathScope?.root,
            subtopicId: deriveTutorialSubtopic(matchedTutorial)?.id,
            itemId: matchedTutorial.id,
            activeTab: 'snapshot',
            previous: {
              workspace: 'tutorials',
              kind: matchedTutorial.abpathScope?.root ? 'subtopic_overview' : 'landing',
              majorTopicId: matchedTutorial.abpathScope?.root,
              subtopicId: deriveTutorialSubtopic(matchedTutorial)?.id,
              previous: matchedTutorial.abpathScope?.root
                ? {
                    workspace: 'tutorials',
                    kind: 'topic_overview',
                    majorTopicId: matchedTutorial.abpathScope?.root,
                    previous: getDefaultStudyDestination('tutorials'),
                  }
                : getDefaultStudyDestination('tutorials'),
            },
          };
          replaceStudyDestination(nextDestination);
          setDestination(nextDestination);
          setActiveTab('snapshot');
        }
      }
      setIsLoading(false);
    };

    initialize();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const nextDestination = (event.state?.didacticsStudyDestination as ActiveStudyDestination | undefined);
      if (nextDestination?.workspace === 'tutorials') {
        setDestination(nextDestination);
        if (nextDestination.activeTab === 'tutorial' || nextDestination.activeTab === 'flashcards' || nextDestination.activeTab === 'quiz' || nextDestination.activeTab === 'snapshot') {
          setActiveTab(nextDestination.activeTab);
        }
      }
    };

    const handleDestinationChange = (event: Event) => {
      const nextDestination = (event as CustomEvent<ActiveStudyDestination>).detail;
      if (nextDestination?.workspace === 'tutorials') {
        setDestination(nextDestination);
        if (nextDestination.activeTab === 'tutorial' || nextDestination.activeTab === 'flashcards' || nextDestination.activeTab === 'quiz' || nextDestination.activeTab === 'snapshot') {
          setActiveTab(nextDestination.activeTab);
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange as EventListener);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener(STUDY_DESTINATION_EVENT, handleDestinationChange as EventListener);
    };
  }, []);

  const tutorialsByRoot = useMemo(() => {
    return tutorials.reduce<Record<string, DidacticTutorialRecord[]>>((accumulator, tutorial) => {
      const root = tutorial.abpathScope?.root;
      if (!root) {
        return accumulator;
      }
      accumulator[root] ||= [];
      accumulator[root].push(tutorial);
      return accumulator;
    }, {});
  }, [tutorials]);

  const subtopicsByRoot = useMemo(() => {
    return tutorials.reduce<Record<string, { id: string; label: string; tutorials: DidacticTutorialRecord[] }[]>>((accumulator, tutorial) => {
      const root = tutorial.abpathScope?.root;
      const scope = deriveTutorialSubtopic(tutorial);
      if (!root || !scope) {
        return accumulator;
      }
      accumulator[root] ||= [];
      const existing = accumulator[root].find((entry) => entry.id === scope.id);
      if (existing) {
        existing.tutorials.push(tutorial);
      } else {
        accumulator[root].push({ ...scope, tutorials: [tutorial] });
      }
      return accumulator;
    }, {});
  }, [tutorials]);

  const tutorialRoots = useMemo(() => Object.keys(tutorialsByRoot).sort((left, right) => left.localeCompare(right)), [tutorialsByRoot]);
  const resolvedDestination = useMemo(
    () =>
      resolveStudyDestinationForRender({
        destination,
        validRoots: tutorialRoots,
        subtopicsByRoot: Object.fromEntries(
          Object.entries(subtopicsByRoot).map(([rootId, entries]) => [rootId, entries.map((entry) => ({ id: entry.id }))])
        ),
        isValidItemId: (itemId) => Boolean(itemId && tutorials.some((tutorial) => tutorial.id === itemId)),
        isGovernancePendingItemId: (itemId) =>
          Boolean(itemId && governanceManifest?.rows.find((row) => row.id === itemId && row.governancePending)),
      }),
    [destination, tutorialRoots, subtopicsByRoot, tutorials, governanceManifest]
  );
  const effectiveDestination = resolvedDestination.destination;
  const effectiveKind = resolvedDestination.renderedKind;
  const governancePendingTutorial =
    effectiveDestination.kind === 'item_detail' && governanceManifest
      ? getGovernancePendingTutorial(
          {
            rowsById: Object.fromEntries(governanceManifest.rows.map((row) => [row.id, row])),
          },
          effectiveDestination.itemId
        )
      : undefined;
  useEffect(() => {
    if (!resolvedDestination.resolved) {
      return;
    }
    const nextDestination = effectiveDestination;
    if (JSON.stringify(nextDestination) !== JSON.stringify(destination)) {
      replaceStudyDestination(nextDestination);
      setDestination(nextDestination);
      const syncedTab =
        nextDestination.activeTab === 'tutorial' ||
        nextDestination.activeTab === 'flashcards' ||
        nextDestination.activeTab === 'quiz' ||
        nextDestination.activeTab === 'snapshot'
          ? nextDestination.activeTab
          : undefined;
      if (syncedTab) {
        setActiveTab(syncedTab);
      }
    }
  }, [destination, effectiveDestination, resolvedDestination.resolved]);
  const activeRoot = effectiveDestination.majorTopicId;
  const activeSubtopic = effectiveDestination.subtopicId;
  const activeTopicTutorials = activeRoot ? tutorialsByRoot[activeRoot] ?? [] : [];
  const activeSubtopics = activeRoot ? (subtopicsByRoot[activeRoot] ?? []).slice().sort((left, right) => left.label.localeCompare(right.label)) : [];
  const activeSubtopicEntry = activeSubtopics.find((entry) => entry.id === activeSubtopic) ?? null;
  const activeSubtopicTutorials = activeSubtopicEntry?.tutorials ?? [];
  const activeTutorial =
    effectiveDestination.kind === 'item_detail' && effectiveDestination.itemId
      ? tutorials.find((tutorial) => tutorial.id === effectiveDestination.itemId) ?? null
      : null;
  const currentFlashcard = activeTutorial?.flashcards[flashcardIndex] ?? null;
  const currentQuestion = activeTutorial?.mcqs[questionIndex] ?? null;
  const activeRecallPrompts = useMemo(() => {
    if (!activeTutorial) {
      return [];
    }
    return [
      `Explain the core distinction in ${activeTutorial.title} in one or two sentences.`,
      `Name the board-relevant pitfall or mimic most likely to confuse this topic.`,
      `State one morphologic feature and one management-relevant implication for this topic.`,
    ];
  }, [activeTutorial]);
  const questionSessionRecords = activeTutorial ? questionSessionMap[activeTutorial.id] || [] : [];
  const performanceSnapshot = useMemo(
    () =>
      activeTutorial
        ? buildPerformanceSnapshot(
            activeTutorial.abpathScope?.root || activeTutorial.title,
            activeTutorial.mcqs,
            questionSessionRecords
          )
        : null,
    [activeTutorial, questionSessionRecords]
  );
  const reviewTiles = useMemo(
    () =>
      activeTutorial
        ? buildReviewGridTiles(activeTutorial.mcqs, questionSessionRecords, activeTutorial.abpathScope)
        : [],
    [activeTutorial, questionSessionRecords]
  );
  const currentQuestionRecord = questionSessionRecords.find((record) => record.questionNumber === questionIndex + 1);
  const weakClusterSummary = useMemo(() => buildWeakClusterSummary(reviewTiles), [reviewTiles]);
  const currentImportedQuestion = useMemo(
    () =>
      currentQuestion
        ? mcqToImportedQuestion(currentQuestion, activeTutorial?.abpathScope, selectedChoice || undefined)
        : null,
    [activeTutorial?.abpathScope, currentQuestion, selectedChoice]
  );
  const answerKeyAlerts = useMemo(
    () => (currentImportedQuestion ? validateImportedQuestionAnswerKey(currentImportedQuestion) : []),
    [currentImportedQuestion]
  );
  const readinessPrediction = useMemo(
    () => (performanceSnapshot ? buildBoardPassingPrediction(readinessInputs, performanceSnapshot) : null),
    [performanceSnapshot, readinessInputs]
  );
  const performanceForecast = useMemo(() => {
    if (!performanceSnapshot) {
      return null;
    }
    return buildPerformanceForecast(performanceSnapshot.subject, 'percentCorrect', [
      { label: 'Start', value: Math.max(40, performanceSnapshot.percentCorrect - 8) },
      { label: 'Current', value: performanceSnapshot.percentCorrect },
    ]);
  }, [performanceSnapshot]);

  useEffect(() => {
    setFlashcardRevealed(false);
    setSelectedChoice(null);
    setShowRationale(false);
    setQuestionStartedAt(Date.now());
  }, [activeTutorial?.id]);

  useEffect(() => {
    try {
      window.localStorage.setItem(QUESTION_SESSION_STORAGE_KEY, JSON.stringify(questionSessionMap));
    } catch {
      // Best-effort persistence only.
    }
  }, [questionSessionMap]);

  useEffect(() => {
    try {
      window.localStorage.setItem(READINESS_INPUTS_STORAGE_KEY, JSON.stringify(readinessInputs));
    } catch {
      // Best-effort persistence only.
    }
  }, [readinessInputs]);

  useEffect(() => {
    setStudyDestinationActiveTab('tutorials', activeTab);
  }, [activeTab]);

  useEffect(() => {
    setQuestionStartedAt(Date.now());
  }, [activeTutorial?.id, questionIndex]);

  const resolveInteractiveAssetUrl = (assetPath: string) =>
    `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${assetPath.replace(/^\/+/, '')}`;

  const currentInteractiveAsset =
    activeTutorial?.interactiveAssets?.[Math.min(interactiveAssetIndex, (activeTutorial.interactiveAssets?.length || 1) - 1)] ?? null;
  const tutorialSessionSections = useMemo(
    () => (activeTutorial ? parseTutorialSessionSections(activeTutorial.body) : []),
    [activeTutorial]
  );
  const tutorialVignetteSection = tutorialSessionSections.find((section) => section.label === 'Clinical Vignette') ?? null;
  const tutorialObjectivesSection = tutorialSessionSections.find((section) => section.label === 'Learning Objectives') ?? null;
  const tutorialTeachingPointsSection = tutorialSessionSections.find((section) => section.label === 'Teaching Points') ?? null;
  const tutorialReferencesSection = tutorialSessionSections.find((section) => section.label === 'References') ?? null;
  const tutorialCoreSections = tutorialSessionSections.filter(
    (section) =>
      !['Clinical Vignette', 'Learning Objectives', 'Teaching Points', 'References'].includes(section.label)
  );

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

  const upsertQuestionSessionRecord = (updater: (existing?: QuestionSessionRecord) => QuestionSessionRecord) => {
    if (!activeTutorial) {
      return;
    }
    const targetQuestionNumber = questionIndex + 1;
    setQuestionSessionMap((current) => {
      const existing = current[activeTutorial.id] || [];
      const next = [...existing];
      const foundIndex = next.findIndex((record) => record.questionNumber === targetQuestionNumber);
      const previous = foundIndex >= 0 ? next[foundIndex] : undefined;
      const updated = updater(previous);
      if (foundIndex >= 0) {
        next[foundIndex] = updated;
      } else {
        next.push(updated);
      }
      return {
        ...current,
        [activeTutorial.id]: next.sort((left, right) => left.questionNumber - right.questionNumber),
      };
    });
  };

  const openTutorial = (tutorialId: string) => {
    const tutorial = tutorials.find((entry) => entry.id === tutorialId);
    if (!tutorial) {
      return;
    }
    const nextDestination = pushStudyDestination('tutorials', {
      kind: 'item_detail',
      majorTopicId: tutorial.abpathScope?.root,
      subtopicId: deriveTutorialSubtopic(tutorial)?.id,
      itemId: tutorialId,
      activeTab: 'snapshot',
    });
    setDestination(nextDestination);
    setActiveTab('snapshot');
    setFlashcardIndex(0);
    setQuestionIndex(0);
    setInteractiveAssetIndex(0);
    setVisualMode('cockpit_dashboard');
    setShowRationale(false);
    setSelectedChoice(null);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openTopicOverview = (topicId: string) => {
    const nextDestination = pushStudyDestination('tutorials', {
      kind: 'topic_overview',
      majorTopicId: topicId,
    });
    setDestination(nextDestination);
  };

  const openSubtopicOverview = (topicId: string, subtopicId: string) => {
    const nextDestination = pushStudyDestination('tutorials', {
      kind: 'subtopic_overview',
      majorTopicId: topicId,
      subtopicId,
    });
    setDestination(nextDestination);
  };

  const returnToTutorialLibrary = () => {
    const previousDestination = effectiveDestination.previous ?? getDefaultStudyDestination('tutorials');
    replaceStudyDestination(previousDestination);
    setDestination(previousDestination);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    persistTutorialViewState({
      selectedId: activeTutorial?.id ?? '',
      rootFilter: activeRoot ?? 'all',
      subtopicFilter: activeSubtopic ?? 'all',
      trackFilter: (activeTutorial?.trackLabel as TutorialTrack | undefined) ?? 'all',
      showAllTutorials: effectiveKind === 'landing' || activeTab === 'snapshot',
      activeTab,
      flashcardIndex,
      questionIndex,
      interactiveAssetIndex,
      visualMode,
    });
  }, [
    activeTutorial?.id,
    activeRoot,
    activeSubtopic,
    effectiveKind,
    activeTab,
    flashcardIndex,
    questionIndex,
    interactiveAssetIndex,
    visualMode,
  ]);

  return (
    <div className="space-y-3">
      <div className="space-y-6">
      {isLoading ? (
        <Card>
          <p className="text-slate-600">Loading tutorials...</p>
        </Card>
      ) : activeTutorial ? (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={returnToTutorialLibrary}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
              >
                Back
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div className="max-w-5xl">
                <h2 className="mt-2 font-serif text-2xl font-semibold leading-tight text-slate-900">{activeTutorial.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {activeTutorial.abpathScope?.primaryPath ?? activeTutorial.summary}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {renderTabButton('snapshot', 'Snapshot')}
              {renderTabButton('tutorial', 'Tutorial')}
              {renderTabButton('flashcards', 'Flashcards')}
              {renderTabButton('quiz', 'Quick Check')}
            </div>
          </Card>

          {activeTab === 'snapshot' && (
            <Card>
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">ABPath scope & study framing</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">ABPath scope:</span>{' '}
                  {activeTutorial?.abpathScope?.primaryPath || activeTutorial?.abpathScope?.root || activeTutorial?.title}
                </p>
                <p className="text-sm text-slate-700">
                  <span className="font-semibold">Study sequence:</span>{' '}
                  {activeTutorial?.trackLabel ? `${activeTutorial.trackLabel} → ${activeTutorial.summary}` : activeTutorial?.summary}
                </p>
              </div>
                  <p className="mt-2 text-xs text-slate-500">Why It Matters · Common Board Trap · Estimated time and difficulty are tracked in this module.</p>
              <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                <SparklesIcon className="mr-3 h-6 w-6 text-sky-600" />
                Snapshot
              </h3>
              {activeTutorial.cpGovernance && (
                <div className="mb-5 space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Official ABPath Scope</div>
                    <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{activeTutorial.cpGovernance.abpathRootTopic}</div>
                        <div className="mt-1 text-sm text-slate-600">{activeTutorial.cpGovernance.abpathPrimaryPath}</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">{activeTutorial.cpGovernance.abpathSpecVersion}</span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">{activeTutorial.cpGovernance.abpathPrimaryLevel}</span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">{activeTutorial.cpGovernance.abpathPrecisionMode}</span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">{activeTutorial.cpGovernance.abpathAnchorConfidence} confidence</span>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">{activeTutorial.cpGovernance.abpathExamRisk}</span>
                        </div>
                        <div className="mt-4">
                          <a
                            href={activeTutorial.cpGovernance.abpathSourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-sky-700 underline decoration-sky-300 underline-offset-2"
                          >
                            Open official ABPath source
                          </a>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Testable tasks</div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {activeTutorial.cpGovernance.abpathTestableTask.map((task) => (
                            <span key={task} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Anchor set</div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {activeTutorial.cpGovernance.abpathAnchorSet.map((anchor) => (
                          <li key={anchor}>{anchor}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board-Mastery Teaching Focus</div>
                    <div className="mt-3 text-base font-semibold text-slate-900">
                      {activeTutorial.cpGovernance.boardMasteryFocusTitle}
                    </div>
                    <div className="mt-4 grid gap-4 lg:grid-cols-2">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Must know concepts</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {activeTutorial.cpGovernance.mustKnowConcepts.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Must-not-miss pitfalls</div>
                        <ul className="mt-2 space-y-2 text-sm text-slate-700">
                          {activeTutorial.cpGovernance.mustNotMissPitfalls.slice(0, 3).map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!activeTutorial.cpGovernance && activeTutorial.abpathScope && (
                <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Official ABPath Scope</div>
                  <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">{activeTutorial.abpathScope.root}</div>
                      <div className="mt-1 text-sm text-slate-600">{activeTutorial.abpathScope.primaryPath}</div>
                    </div>
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">ABPath target</div>
                      <div className="mt-3 text-sm text-slate-700">{activeTutorial.abpathScope.title}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <ul className="space-y-2 text-sm text-slate-700">
                  {activeRecallPrompts.map((prompt) => (
                    <li key={prompt}>{prompt}</li>
                  ))}
                </ul>
              </div>
            </Card>
          )}
          {activeTab !== 'snapshot' && <></>}
        </div>
      ) : governancePendingTutorial ? (
        <div className="space-y-6">
          <Card>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={returnToTutorialLibrary}
                className="rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
              >
                Back
              </button>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-800">Governance pending</div>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-slate-900">{governancePendingTutorial.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                This tutorial is not in the validated promotion set yet, so it is blocked from canonical `/didactics` routing until the ABPath mapping review is completed.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mapped fallback domain</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{governancePendingTutorial.abpathRoot}</div>
                  <div className="mt-1 text-sm text-slate-600">{governancePendingTutorial.abpathPrimaryPath}</div>
                </div>
                <div className="rounded-xl border border-amber-200 bg-white p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Review action</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">
                    {governancePendingTutorial.reviewAction ?? 'Resolve validated ABPath anchor before promotion'}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    Owner: {governancePendingTutorial.reviewOwner ?? 'CP governance review'}
                  </div>
                </div>
              </div>
              {governancePendingTutorial.conflictFlags && governancePendingTutorial.conflictFlags.length > 0 && (
                <div className="mt-4 text-sm text-slate-700">
                  {governancePendingTutorial.conflictFlags.join(' · ')}
                </div>
              )}
              {governancePendingTutorial.abpathRoot && tutorialRoots.includes(governancePendingTutorial.abpathRoot) && (
                <button
                  type="button"
                  onClick={() => openTopicOverview(governancePendingTutorial.abpathRoot)}
                  className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Open validated topic instead
                </button>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {effectiveKind === 'landing' && (
            <>
              <Card className="border-slate-200">
                <h2 className="font-serif text-2xl font-semibold text-slate-900">Tutorials</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Resume a lesson or open a major topic from the sidebar.
                </p>
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    if (effectiveDestination.previous?.itemId) {
                      setDestination(effectiveDestination.previous);
                      replaceStudyDestination(effectiveDestination.previous);
                    }
                  }}
                  disabled={!effectiveDestination.previous?.itemId}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume</div>
                  <div className="mt-3 font-serif text-xl font-semibold text-slate-900">
                    {effectiveDestination.previous?.itemId
                      ? tutorials.find((tutorial) => tutorial.id === effectiveDestination.previous?.itemId)?.title ?? 'Last tutorial'
                      : 'Choose a topic to begin'}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {effectiveDestination.previous?.itemId
                      ? 'Return to your last active tutorial.'
                      : 'Your active study item will appear here once you open one.'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const continueTopic = tutorialRoots[0];
                    if (continueTopic) {
                      openTopicOverview(continueTopic);
                    }
                  }}
                  className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
                >
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Resume topic</div>
                  <div className="mt-3 font-serif text-xl font-semibold text-slate-900">
                    {tutorialRoots[0] ?? 'Open a major topic'}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Continue from the current topic map.
                  </p>
                </button>
              </div>
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="font-serif text-xl font-semibold text-slate-900">Recommended major topics</h3>
                    <p className="mt-1 text-sm text-slate-600">Open a major topic to start your focused lane.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {tutorialRoots.length} topics
                  </span>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {tutorialRoots.slice(0, preferences.focusMode ? 4 : 6).map((root) => (
                    <button
                      key={root}
                      type="button"
                      onClick={() => openTopicOverview(root)}
                      className="rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                    >
                      <div className="font-semibold text-slate-900">{root}</div>
                      <div className="mt-2 text-sm text-slate-600">
                        {(tutorialsByRoot[root] ?? []).length} tutorial{(tutorialsByRoot[root] ?? []).length === 1 ? '' : 's'}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {effectiveKind === 'topic_overview' && activeRoot && (
            <>
              <Card className="border-slate-200">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="max-w-4xl">
                    <h2 className="font-serif text-2xl font-semibold text-slate-900">{activeRoot}</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Review this ABPath topic by moving through one subtopic at a time, then opening the strongest tutorial inside that lane.
                    </p>
                    <p className="mt-3 text-sm font-medium text-slate-700">
                      Scope: {activeTopicTutorials[0]?.abpathScope?.root ?? activeRoot}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1">{activeSubtopics.length} subtopics</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">
                      {activeTopicTutorials.length} tutorial{activeTopicTutorials.length === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
                {activeSubtopics.length > 0 ? (
                  activeSubtopics.map((scope, index) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => openSubtopicOverview(activeRoot, scope.id)}
                      className="rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-sky-300"
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {index === 0 ? 'Open first subtopic' : 'Subtopic'}
                      </div>
                      <div className="mt-3 font-serif text-xl font-semibold text-slate-900">{scope.label}</div>
                      <p className="mt-2 text-sm text-slate-600">
                        {scope.tutorials.length} tutorial{scope.tutorials.length === 1 ? '' : 's'} in this lane.
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="lg:col-span-2 space-y-4">
                    <Card>
                      <p className="text-slate-700">
                        No finer subtopics are defined. Open a tutorial from this topic list.
                      </p>
                    </Card>
                    {activeTopicTutorials.length === 0 ? (
                      <Card>
                        <p className="text-slate-600">No tutorials are currently available for this topic.</p>
                      </Card>
                    ) : (
                      <div className="space-y-4">
                        {activeTopicTutorials.map((tutorial, index) => (
                          <button
                            key={tutorial.id}
                            type="button"
                            onClick={() => openTutorial(tutorial.id)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                          >
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              {index === 0 ? 'Open first item' : 'Item'}
                            </div>
                            <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{tutorial.title}</h3>
                            <p className="mt-2 text-sm text-slate-600">{tutorial.summary}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {effectiveKind === 'subtopic_overview' && activeRoot && activeSubtopicEntry && (
            <>
              <Card className="border-slate-200">
                <h2 className="font-serif text-2xl font-semibold text-slate-900">{activeSubtopicEntry.label}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {activeRoot} {'>'} {activeSubtopicEntry.label}
                </p>
                <p className="mt-3 text-sm text-slate-700">Open one item to practice this lane.</p>
              </Card>
              <div className="space-y-4">
                {activeSubtopicTutorials.map((tutorial, index) => (
                  <button
                    key={tutorial.id}
                    type="button"
                    onClick={() => openTutorial(tutorial.id)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-sky-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {index === 0 ? 'Open first item' : 'Item'}
                        </div>
                        <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{tutorial.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{tutorial.abpathScope?.primaryPath ?? tutorial.summary}</p>
                        {!preferences.focusMode && <p className="mt-3 text-sm text-slate-600">{tutorial.summary}</p>}
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        {tutorial.trackLabel}
                      </span>
                    </div>
                    <div className="mt-4 text-sm font-semibold text-sky-700">Open</div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      </div>

      {activeTutorial && activeTab === 'tutorial' && (
        <Card>
          <div className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="flex items-center text-xl font-semibold font-serif text-slate-900">
              <DocumentTextIcon className="mr-3 h-6 w-6 text-sky-600" />
              Case Tutorial
            </h3>
            <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
              <span className="rounded-full bg-slate-100 px-3 py-1">{activeTutorial.abpathScope?.root ?? activeTutorial.trackLabel}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                {activeTutorial.abpathScope?.primaryPath.split(' > ').at(-1) ?? activeTutorial.trackLabel}
              </span>
            </div>
          </div>
          <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Teaching session</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Move through the case in order, then use flashcards and quick check once the anchor concepts are stable.
                </p>
              </div>
              <div className="grid min-w-[15rem] gap-3 sm:grid-cols-3 lg:min-w-[20rem]">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Sections</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{tutorialSessionSections.length || '--'}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Flashcards</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{activeTutorial.flashcardCount}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Quick check</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{activeTutorial.mcqCount}</div>
                </div>
              </div>
            </div>
            {tutorialSessionSections.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tutorialSessionSections.map((section, index) => (
                  <span
                    key={section.id}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                  >
                    {index + 1}. {section.label}
                  </span>
                ))}
              </div>
            )}
          </div>
          {activeTutorial.interactiveAssets && activeTutorial.interactiveAssets.length > 0 && currentInteractiveAsset && (
                    <div className="mb-8 space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Interactive lab</div>
                            <h4 className="mt-2 text-lg font-semibold text-slate-900">{currentInteractiveAsset.title}</h4>
                            <p className="mt-2 text-sm text-slate-600">{currentInteractiveAsset.summary}</p>
                          </div>
                          <a
                            href={resolveInteractiveAssetUrl(currentInteractiveAsset.path)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                          >
                            Open interactive view
                          </a>
                        </div>
                        {activeTutorial.interactiveAssets.length > 1 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {activeTutorial.interactiveAssets.map((asset, index) => {
                              const isActive = index === interactiveAssetIndex;
                              return (
                                <button
                                  key={asset.id}
                                  type="button"
                                  onClick={() => setInteractiveAssetIndex(index)}
                                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                    isActive
                                      ? 'border-sky-400 bg-sky-50 text-sky-800'
                                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                  }`}
                                >
                                  {asset.title}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                        <iframe
                                key={`${activeTutorial.id}-${currentInteractiveAsset.id}`}
                          title={currentInteractiveAsset.title}
                          src={resolveInteractiveAssetUrl(currentInteractiveAsset.path)}
                          className="h-[860px] w-full border-0 bg-white"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  )}
          {tutorialVignetteSection && (
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50/70 p-6">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Clinical vignette</div>
              <div className="mt-3">
                <MarkdownContent content={tutorialVignetteSection.content} className="[&>*:first-child]:mt-0" />
              </div>
            </div>
          )}
          {(tutorialObjectivesSection || tutorialTeachingPointsSection) && (
            <div className="mb-6 grid gap-4 xl:grid-cols-2">
              {tutorialObjectivesSection && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning objectives</div>
                  <div className="mt-3">
                    <MarkdownContent content={tutorialObjectivesSection.content} className="[&>*:first-child]:mt-0" />
                  </div>
                </div>
              )}
              {tutorialTeachingPointsSection && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teaching points</div>
                  <div className="mt-3">
                    <MarkdownContent content={tutorialTeachingPointsSection.content} className="[&>*:first-child]:mt-0" />
                  </div>
                </div>
              )}
            </div>
          )}
          {tutorialCoreSections.length > 0 ? (
            <div className="space-y-4">
              {tutorialCoreSections.map((section) => (
                <div key={section.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{section.label}</div>
                  <div className="mt-3">
                    <MarkdownContent content={section.content} className="[&>*:first-child]:mt-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !tutorialVignetteSection &&
            !tutorialObjectivesSection &&
            !tutorialTeachingPointsSection &&
            !tutorialReferencesSection && <MarkdownContent content={activeTutorial.body} variant="tutorial" />
          )}
          {tutorialReferencesSection && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">References</div>
              <div className="mt-3">
                <MarkdownContent content={tutorialReferencesSection.content} className="[&>*:first-child]:mt-0" />
              </div>
            </div>
          )}
        </Card>
      )}

      {activeTutorial && activeTab === 'flashcards' && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <BookOpenIcon className="mr-3 h-6 w-6 text-sky-600" />
                    Flashcard Review
                  </h3>
                  {currentFlashcard ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Card {flashcardIndex + 1} of {activeTutorial.flashcards.length}
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
                          disabled={flashcardIndex >= activeTutorial.flashcards.length - 1}
                          onClick={() => {
                            setFlashcardIndex((current) => Math.min(activeTutorial.flashcards.length - 1, current + 1));
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

      {activeTutorial && activeTab === 'quiz' && (
                <Card>
                  <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                    <SparklesIcon className="mr-3 h-6 w-6 text-sky-600" />
                    Quick Check
                  </h3>
                  {currentQuestion ? (
                    <div className="space-y-5">
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: 'cockpit_dashboard', label: 'Cockpit' },
                          { id: 'pthfndr_review_grid', label: 'Review Grid' },
                          { id: 'abpath_anchor_map', label: 'Anchor Map' },
                          { id: 'question_review_stack', label: 'Question Review' },
                          { id: 'board_passing_calculator', label: 'Readiness' },
                        ].map((option) => {
                          const isActive = visualMode === option.id;
                          return (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setVisualMode(option.id as DidacticsVisualMode)}
                              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                                isActive
                                  ? 'border-sky-400 bg-sky-50 text-sky-800'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                              }`}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {performanceSnapshot && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject progress</div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">{performanceSnapshot.percentAnswered}%</div>
                            <div className="mt-1 text-sm text-slate-600">
                              {performanceSnapshot.numberAnswered} answered / {performanceSnapshot.totalQuestions} total
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Accuracy</div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">{performanceSnapshot.percentCorrect}%</div>
                            <div className="mt-1 text-sm text-slate-600">
                              {performanceSnapshot.correct} correct / {performanceSnapshot.incorrect} incorrect
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Percentile</div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">{performanceSnapshot.userPercentile ?? '--'}</div>
                            <div className="mt-1 text-sm text-slate-600">
                              Avg {performanceSnapshot.allUsersAverage}% / Median {performanceSnapshot.allUsersMedian}%
                            </div>
                          </div>
                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Questions remaining</div>
                            <div className="mt-2 text-2xl font-semibold text-slate-900">{performanceSnapshot.remainingQuestions}</div>
                            <div className="mt-1 text-sm text-slate-600">{performanceSnapshot.remainingPercent}% of this set</div>
                          </div>
                        </div>
                      )}
                      {answerKeyAlerts.length > 0 && (
                        <div className="space-y-3">
                          {answerKeyAlerts.map((alert) => (
                            <div
                              key={`${alert.title}-${alert.detail}`}
                              className={`rounded-2xl border px-4 py-4 ${
                                alert.severity === 'high'
                                  ? 'border-amber-300 bg-amber-50 text-amber-950'
                                  : 'border-slate-200 bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div className="text-sm font-semibold">{alert.title}</div>
                              <div className="mt-1 text-sm">{alert.detail}</div>
                              {alert.requiresFacultyReview && (
                                <div className="mt-2 text-xs font-semibold uppercase tracking-wide">
                                  Faculty review required before trusting this key.
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {(visualMode === 'cockpit_dashboard' || visualMode === 'pthfndr_review_grid') && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">P@thfndr review grid</div>
                              <div className="mt-1 text-sm text-slate-600">
                                {PTHFNDR_DIDACTICS_COMMAND_CENTER_SCHEMA.reviewGrid.groupBy === 'abpathAnchor'
                                  ? 'Grouped around the current ABPath frame and weak-question clusters.'
                                  : 'Review tiles for the active question set.'}
                              </div>
                            </div>
                            <div className="text-xs font-medium text-slate-500">
                              Tile click behavior: open question review
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10">
                            {reviewTiles.map((tile) => {
                              const isActive = tile.questionNumber === questionIndex + 1;
                              const tone =
                                tile.result === 'correct'
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                  : tile.result === 'incorrect'
                                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                                    : tile.result === 'flagged'
                                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                                      : 'border-slate-200 bg-white text-slate-600';
                              return (
                                <button
                                  key={tile.questionNumber}
                                  type="button"
                                  onClick={() => {
                                    setQuestionIndex(tile.questionNumber - 1);
                                    setSelectedChoice(null);
                                    setShowRationale(false);
                                    setVisualMode('question_review_stack');
                                  }}
                                  className={`min-h-[3.75rem] rounded-xl border px-2 py-2 text-left text-xs transition ${tone} ${
                                    isActive ? 'ring-2 ring-sky-300' : ''
                                  }`}
                                >
                                  <div className="font-semibold">{tile.questionNumber}</div>
                                  <div className="mt-1 truncate">{tile.result}</div>
                                </button>
                              );
                            })}
                          </div>
                          {weakClusterSummary.length > 0 && (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weak cluster summary</div>
                              <div className="mt-3 grid gap-2">
                                {weakClusterSummary.map((cluster) => (
                                  <div key={cluster.label} className="flex items-center justify-between gap-3 text-sm text-slate-700">
                                    <span className="truncate">{cluster.label}</span>
                                    <span className="whitespace-nowrap text-slate-500">
                                      {cluster.incorrect} incorrect / {cluster.flagged} flagged
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      {(visualMode === 'cockpit_dashboard' || visualMode === 'abpath_anchor_map') && (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">ABPath anchor map</div>
                          <div className="mt-2 text-sm text-slate-600">
                            Every incorrect or flagged item should collapse back to a governed ABPath frame.
                          </div>
                          <div className="mt-4 space-y-3">
                            {reviewTiles
                              .filter((tile) => tile.result === 'incorrect' || tile.result === 'flagged')
                              .slice(0, 8)
                              .map((tile) => (
                                <div key={`anchor-${tile.questionNumber}`} className="rounded-xl border border-slate-200 bg-white p-4">
                                  <div className="text-sm font-semibold text-slate-900">Question {tile.questionNumber}</div>
                                  <div className="mt-1 text-sm text-slate-600">{tile.abpathAnchorPath || tile.domain}</div>
                                </div>
                              ))}
                            {reviewTiles.every((tile) => tile.result === 'unanswered' || tile.result === 'correct') && (
                              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                                Incorrect and flagged questions will map here as soon as they appear.
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {(visualMode === 'cockpit_dashboard' || visualMode === 'board_passing_calculator') && performanceSnapshot && readinessPrediction && (
                        <div className="rounded-2xl border border-slate-200 bg-white p-5">
                          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Predicted readiness</div>
                              <div className="mt-2 text-2xl font-semibold text-slate-900">{readinessPrediction.predictedScore}</div>
                              <div className="mt-1 text-sm text-slate-600">
                                {readinessPrediction.readinessBand} · {readinessPrediction.confidence} confidence
                              </div>
                            </div>
                            {performanceForecast && (
                              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                                <div className="font-semibold text-slate-900">Forecast</div>
                                <div className="mt-1">
                                  {performanceForecast.observedPoints.at(-1)?.value}% now → {performanceForecast.forecastPoints.at(-1)?.value}% projected
                                </div>
                                {performanceForecast.warning && <div className="mt-2 text-amber-700">{performanceForecast.warning}</div>}
                              </div>
                            )}
                          </div>
                          <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Limiting factors</div>
                              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                {readinessPrediction.limitingFactors.length > 0 ? (
                                  readinessPrediction.limitingFactors.map((factor) => <li key={factor}>{factor}</li>)
                                ) : (
                                  <li>Current signals do not show a dominant limiting factor.</li>
                                )}
                              </ul>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next actions</div>
                              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                                {readinessPrediction.nextActions.map((action) => (
                                  <li key={action}>{action}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {[
                              ['MCQ sessions', 'mcqPracticeSessions'],
                              ['P@thfndr sessions', 'pthfndrSessions'],
                              ['Study hours/week', 'studyHoursPerWeek'],
                              ['Feedback quality', 'feedbackQuality'],
                            ].map(([label, field]) => (
                              <label key={field} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                <div className="font-medium text-slate-900">{label}</div>
                                <input
                                  type="number"
                                  min={0}
                                  max={field === 'feedbackQuality' ? 10 : 99}
                                  value={String(readinessInputs[field as keyof BoardPassingPredictorInputs] ?? '')}
                                  onChange={(event) => {
                                    const value = Number(event.target.value);
                                    setReadinessInputs((current) => ({
                                      ...current,
                                      [field]: Number.isFinite(value) ? value : 0,
                                    }));
                                  }}
                                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                                />
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Question {questionIndex + 1} of {activeTutorial.mcqs.length}
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                        <div className="text-lg font-semibold text-slate-900">{currentQuestion.question}</div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                            {activeTutorial.abpathScope?.root || 'Didactics'}
                          </span>
                          <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                            {activeTutorial.abpathScope?.primaryPath || 'ABPath mapping pending'}
                          </span>
                        </div>
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
                        <div className="mt-4 flex flex-wrap gap-2">
                          {[1, 2, 3, 4, 5].map((confidenceValue) => {
                            const isActive = currentQuestionRecord?.confidence === confidenceValue;
                            return (
                              <button
                                key={`confidence-${confidenceValue}`}
                                type="button"
                                onClick={() =>
                                  upsertQuestionSessionRecord((existing) => ({
                                    questionNumber: questionIndex + 1,
                                    questionId: `${activeTutorial.id}-${questionIndex + 1}`,
                                    selectedAnswer: existing?.selectedAnswer || selectedChoice || undefined,
                                    isCorrect: existing?.isCorrect,
                                    isFlagged: existing?.isFlagged,
                                    timeToAnswerSeconds: existing?.timeToAnswerSeconds,
                                    confidence: confidenceValue as 1 | 2 | 3 | 4 | 5,
                                  }))
                                }
                                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                  isActive
                                    ? 'border-sky-400 bg-sky-50 text-sky-800'
                                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                                }`}
                              >
                                Confidence {confidenceValue}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() =>
                              upsertQuestionSessionRecord((existing) => ({
                                questionNumber: questionIndex + 1,
                                questionId: `${activeTutorial.id}-${questionIndex + 1}`,
                                selectedAnswer: existing?.selectedAnswer || selectedChoice || undefined,
                                isCorrect: existing?.isCorrect,
                                isFlagged: !existing?.isFlagged,
                                confidence: existing?.confidence,
                                timeToAnswerSeconds: existing?.timeToAnswerSeconds,
                              }))
                            }
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              currentQuestionRecord?.isFlagged
                                ? 'border-amber-300 bg-amber-50 text-amber-900'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                            }`}
                          >
                            {currentQuestionRecord?.isFlagged ? 'Flagged' : 'Flag question'}
                          </button>
                        </div>
                      </div>
                      {!showRationale ? (
                        <button
                          type="button"
                          onClick={() => {
                            const isCorrect = selectedChoice === currentQuestion.answer;
                            const elapsedSeconds = Math.max(1, Math.round((Date.now() - questionStartedAt) / 1000));
                            upsertQuestionSessionRecord((existing) => ({
                              questionNumber: questionIndex + 1,
                              questionId: `${activeTutorial.id}-${questionIndex + 1}`,
                              selectedAnswer: selectedChoice || undefined,
                              isCorrect,
                              isFlagged: existing?.isFlagged,
                              confidence: existing?.confidence ?? 3,
                              timeToAnswerSeconds: elapsedSeconds,
                            }));
                            setShowRationale(true);
                          }}
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
                          <div className="space-y-2">
                            {getAnswerChoiceReasoning(currentQuestion).map((item) => (
                              <div
                                key={`${currentQuestion.question}-${item.choice}-reasoning`}
                                className={`rounded-xl border px-4 py-3 text-sm ${
                                  item.isCorrect
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                                    : 'border-rose-100 bg-white text-slate-700'
                                }`}
                              >
                                <div className="font-semibold">{item.choice}</div>
                                <div className="mt-1">{item.reasoning}</div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextIndex = Math.min(activeTutorial.mcqs.length - 1, questionIndex + 1);
                              setQuestionIndex(nextIndex);
                              setSelectedChoice(null);
                              setShowRationale(false);
                              setQuestionStartedAt(Date.now());
                            }}
                            disabled={questionIndex >= activeTutorial.mcqs.length - 1}
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
  );
};

export default DidacticTutorials;
