import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card.tsx';
import {
  ActiveCurriculumModule,
  ActiveCurriculumPriority,
  ActiveCurriculumPromotionState,
  Section,
} from '../types.ts';
import { activeCurriculumModules, activeCurriculumSubspecialties } from '../content/curriculum/activeCurriculum.ts';
import { setLectureLibraryIntent } from '../utils/lectureLibraryNavigation.ts';
import { setReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import { setTutorialLibraryIntent } from '../utils/tutorialLibraryNavigation.ts';
import { setAlgorithmNavigatorIntent } from '../utils/algorithmNavigatorNavigation.ts';
import { consumeCurriculumIntent } from '../utils/curriculumNavigation.ts';
import { LearningPreferences } from '../hooks/useLearningPreferences.ts';
import { getGuPilotEnhancement } from '../content/lectures/guPilotEnhancements.ts';
import { deriveModuleCompetency } from '../content/competency/competencyMatrix.ts';
import { resolveDidacticAlgorithmIntent, resolveDidacticAlgorithmRoutes } from '../utils/algorithmCatalog.ts';
import {
  CURRICULUM_SIDEBAR_EVENT,
  readCurriculumViewState,
  writeCurriculumViewState,
  type CurriculumViewState,
} from '../utils/curriculumViewState.ts';

interface PathologyCurriculumProps {
  onSectionChange: (section: Section) => void;
  preferences: LearningPreferences;
}

const promotionLabels: Record<ActiveCurriculumPromotionState, string> = {
  canonical: 'Ready now',
  staged: 'Adding now',
  archived: 'Archived',
};

const cpFeaturedModuleIds = [
  'clinical-path-foundations',
  'hematology-red-cell-core',
  'chemical-pathology-core',
  'management-informatics-core',
] as const;

const PathologyCurriculum: React.FC<PathologyCurriculumProps> = ({ onSectionChange, preferences }) => {
  const [selectedId, setSelectedId] = useState(activeCurriculumModules[0]?.moduleId ?? '');
  const [query, setQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<'all' | 'ap' | 'cp'>('all');
  const [subspecialtyFilter, setSubspecialtyFilter] = useState<'all' | ActiveCurriculumModule['subspecialty']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | ActiveCurriculumPriority>('all');
  const [promotionFilter, setPromotionFilter] = useState<'all' | ActiveCurriculumPromotionState>('all');
  const [patternFilter, setPatternFilter] = useState<'all' | string>('all');
  const [specimenFilter, setSpecimenFilter] = useState<'all' | string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);
  const [isModuleFocusView, setIsModuleFocusView] = useState(false);

  useEffect(() => {
    const intent = consumeCurriculumIntent();
    const storedView = readCurriculumViewState();
    if (!intent) {
      if (storedView) {
        setSelectedId(storedView.selectedId);
        setQuery(storedView.query);
        setDomainFilter(storedView.domainFilter);
        setSubspecialtyFilter(storedView.subspecialtyFilter);
        setPriorityFilter(storedView.priorityFilter);
        setPromotionFilter(storedView.promotionFilter);
        setPatternFilter(storedView.patternFilter);
        setSpecimenFilter(storedView.specimenFilter);
        setShowAdvancedFilters(storedView.showAdvancedFilters);
        setShowAllModules(storedView.showAllModules);
        setIsModuleFocusView(!!storedView.selectedId);
      }
      return;
    }

    if (intent.query) {
      setQuery(intent.query);
    }
    if (intent.subspecialty) {
      setSubspecialtyFilter(intent.subspecialty);
    }
    if (intent.priority) {
      setPriorityFilter(intent.priority);
    }
    if (intent.promotion) {
      setPromotionFilter(intent.promotion);
    }
    if (intent.pattern) {
      setPatternFilter(intent.pattern);
    }
    if (intent.specimen) {
      setSpecimenFilter(intent.specimen);
    }
    if (intent.moduleId) {
      setSelectedId(intent.moduleId);
      setIsModuleFocusView(true);
    }
  }, []);

  useEffect(() => {
    writeCurriculumViewState({
      selectedId,
      query,
      domainFilter,
      subspecialtyFilter,
      priorityFilter,
      promotionFilter,
      patternFilter,
      specimenFilter,
      showAdvancedFilters,
      showAllModules,
    });
  }, [
    domainFilter,
    patternFilter,
    priorityFilter,
    promotionFilter,
    query,
    selectedId,
    showAdvancedFilters,
    showAllModules,
    specimenFilter,
    subspecialtyFilter,
  ]);

  useEffect(() => {
    const handleSidebarSelection = (event: Event) => {
      const detail = (event as CustomEvent<{ moduleId: string; subspecialty: ActiveCurriculumModule['subspecialty'] }>).detail;
      if (!detail) {
        return;
      }
      setSelectedId(detail.moduleId);
      setSubspecialtyFilter(detail.subspecialty);
      if (detail.subspecialty === 'Clinical Pathology') {
        setDomainFilter('cp');
      }
      setShowAllModules(true);
      setIsModuleFocusView(true);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };

    window.addEventListener(CURRICULUM_SIDEBAR_EVENT, handleSidebarSelection as EventListener);
    return () => window.removeEventListener(CURRICULUM_SIDEBAR_EVENT, handleSidebarSelection as EventListener);
  }, []);

  const filteredModules = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return activeCurriculumModules.filter((module) => {
      const isClinicalPath = module.subspecialty === 'Clinical Pathology';
      if (domainFilter === 'cp' && !isClinicalPath) {
        return false;
      }
      if (domainFilter === 'ap' && isClinicalPath) {
        return false;
      }
      if (subspecialtyFilter !== 'all' && module.subspecialty !== subspecialtyFilter) {
        return false;
      }
      if (priorityFilter !== 'all' && module.boardPriority !== priorityFilter) {
        return false;
      }
      if (promotionFilter !== 'all' && module.promotionState !== promotionFilter) {
        return false;
      }
      if (patternFilter !== 'all' && !module.patternFamilies.includes(patternFilter)) {
        return false;
      }
      if (specimenFilter !== 'all' && !module.specimenContexts.includes(specimenFilter)) {
        return false;
      }
      if (!lowered) {
        return true;
      }
      return [
        module.title,
        module.summary,
        module.subspecialty,
        ...module.patternFamilies,
        ...module.specimenContexts,
        ...module.referenceFocusTerms,
        ...module.tutorialTopics,
        ...module.syllabusTopics,
        ...module.algorithmTopics,
        ...module.assessmentTopics,
      ]
        .some((value) => value.toLowerCase().includes(lowered));
    });
  }, [domainFilter, patternFilter, promotionFilter, priorityFilter, query, specimenFilter, subspecialtyFilter]);

  const hasActiveRefinement =
    query.trim().length > 0 ||
    domainFilter !== 'all' ||
    subspecialtyFilter !== 'all' ||
    priorityFilter !== 'all' ||
    promotionFilter !== 'all' ||
    patternFilter !== 'all' ||
    specimenFilter !== 'all';

  const visibleModules = useMemo(() => {
    if (showAllModules || hasActiveRefinement) {
      return filteredModules;
    }

    const shortlist = filteredModules.slice(0, 8);
    if (shortlist.some((module) => module.moduleId === selectedId)) {
      return shortlist;
    }

    const selectedModule = filteredModules.find((module) => module.moduleId === selectedId);
    if (!selectedModule) {
      return shortlist;
    }

    return [selectedModule, ...shortlist.filter((module) => module.moduleId !== selectedModule.moduleId)].slice(0, 8);
  }, [filteredModules, hasActiveRefinement, selectedId, showAllModules]);

  const selectedModule = filteredModules.find((module) => module.moduleId === selectedId) ?? filteredModules[0];
  const selectedModuleResolvedAlgorithms = useMemo(
    () =>
      selectedModule
        ? resolveDidacticAlgorithmRoutes(selectedModule.algorithmTopics, selectedModule.subspecialty)
        : [],
    [selectedModule]
  );
  const selectedModuleUnresolvedAlgorithmTopics = useMemo(() => {
    if (!selectedModule) {
      return [];
    }
    const resolvedTopicSet = new Set(selectedModuleResolvedAlgorithms.map((route) => route.requestedTopic));
    return selectedModule.algorithmTopics.filter((topic) => !resolvedTopicSet.has(topic));
  }, [selectedModule, selectedModuleResolvedAlgorithms]);
  const nextUpModules = useMemo(() => {
    const canonicalModules = activeCurriculumModules.filter((module) => module.promotionState === 'canonical');
    if (domainFilter === 'cp') {
      return cpFeaturedModuleIds
        .map((moduleId) => canonicalModules.find((module) => module.moduleId === moduleId))
        .filter(Boolean) as ActiveCurriculumModule[];
    }
    if (domainFilter === 'ap') {
      return canonicalModules.filter((module) => module.subspecialty !== 'Clinical Pathology').slice(0, 3);
    }
    return canonicalModules.slice(0, 3);
  }, [domainFilter]);

  const openLecture = (
    lectureId?: string,
    lectureTitle?: string,
    options?: { initialMode?: 'overview' | 'algorithm' | 'tissue' | 'knowledge' | 'check' | 'transcript'; imageLayerSetId?: string }
  ) => {
    setLectureLibraryIntent({
      selectedId: lectureId,
      query: lectureTitle,
      track: 'all',
      initialMode: options?.initialMode,
      imageLayerSetId: options?.imageLayerSetId,
    });
    onSectionChange(Section.DIDACTIC_LECTURES);
  };

  const openReferenceLibrary = (module: ActiveCurriculumModule) => {
    const inflammatoryMimicTerms =
      module.moduleId === 'necrosis-inflammatory-mimics' || module.moduleId === 'thoracic-core' || module.patternFamilies.includes('inflammatory mimic')
        ? ['sarcoidosis', 'hypersensitivity pneumonitis', 'gpa', 'blastomycosis', 'cryptococcosis']
        : module.referenceFocusTerms;
    setReferenceLibraryIntent({
      moduleId: module.moduleId,
      title: module.title,
      summary: module.summary,
      focusTerms: inflammatoryMimicTerms,
      tutorialTopics: module.tutorialTopics,
      syllabusTopics: module.syllabusTopics,
      algorithmTopics: module.algorithmTopics,
      imageLayerSetId: getGuPilotEnhancement(module.lectures[0]?.id ?? '')?.tissueLayerSets[0]?.id,
    });
    onSectionChange(Section.REFERENCE_LIBRARY);
  };

  const openTutorials = (module: ActiveCurriculumModule) => {
    setTutorialLibraryIntent({
      query: module.tutorialTopics[0] || module.title,
      lane: 'all',
      track: module.subspecialty === 'Clinical Pathology' ? 'clinical-path' : 'surgical-path',
    });
    onSectionChange(Section.DIDACTIC_TUTORIALS);
  };

  const openAlgorithms = (module: ActiveCurriculumModule, topic?: string) => {
    const targetTopic = topic || module.algorithmTopics[0] || module.title;
    const intent = resolveDidacticAlgorithmIntent(targetTopic, module.subspecialty);

    setAlgorithmNavigatorIntent({
      ...(intent ?? {
        category: module.subspecialty,
        query: targetTopic,
      }),
      sourceModuleId: module.moduleId,
      sourceModuleTitle: module.title,
      sourceModuleSummary: module.summary,
      sourceSubspecialty: module.subspecialty,
      sourceRequestedTopic: targetTopic,
    });
    onSectionChange(Section.DIDACTIC_ALGORITHMS);
  };

  const primaryLecture = selectedModule?.lectures[0];
  const selectedModuleCompetency = selectedModule ? deriveModuleCompetency(selectedModule) : null;
  const primaryLectureEnhancement = getGuPilotEnhancement(primaryLecture?.id ?? '');
  const isPatternBlock = selectedModule?.subspecialty === 'Foundations';
  const isInflammatoryMimicModule = selectedModule
    ? selectedModule.moduleId === 'necrosis-inflammatory-mimics' ||
      selectedModule.moduleId === 'thoracic-core' ||
      selectedModule.patternFamilies.includes('inflammatory mimic')
    : false;
  const guGiModules = activeCurriculumModules.filter((module) =>
    ['renal-testicular-core', 'lower-gu-bladder-core', 'upper-gi-staged', 'colorectal-staged', 'hpb-pancreas-core'].includes(module.moduleId)
  );
  const clinicalPathModules = activeCurriculumModules.filter((module) => module.subspecialty === 'Clinical Pathology');

  const openAssessment = (module: ActiveCurriculumModule) => {
    if (module.subspecialty === 'Clinical Pathology') {
      setTutorialLibraryIntent({
        query: module.assessmentTopics[0] || module.tutorialTopics[0] || module.title,
        lane: 'all',
        track: 'clinical-path',
      });
      onSectionChange(Section.DIDACTIC_TUTORIALS);
      return;
    }

    if (
      module.moduleId === 'necrosis-inflammatory-mimics' ||
      module.moduleId === 'thoracic-core' ||
      module.patternFamilies.includes('inflammatory mimic')
    ) {
      onSectionChange(Section.VISUAL_CHALLENGE);
      return;
    }

    onSectionChange(Section.SIGN_OUT_SIMULATOR);
  };

  const primaryTutorialTopic = selectedModule?.tutorialTopics[0]?.replace(/\s+/g, ' ').trim();
  const primaryAlgorithmTopic = selectedModuleResolvedAlgorithms[0]?.requestedTopic?.replace(/\s+/g, ' ').trim();
  const primaryAssessmentTopic =
    selectedModule?.assessmentTopics[0]?.replace(/\s+/g, ' ').trim() || primaryTutorialTopic;
  const primaryPatternLabel = selectedModule?.patternFamilies[0]?.replace(/\s+/g, ' ').trim();
  const normalizedTutorialTopic = primaryTutorialTopic?.toLowerCase();
  const normalizedAssessmentTopic = primaryAssessmentTopic?.toLowerCase();
  const displayAutonomyTarget =
    selectedModuleCompetency?.autonomyTarget?.toLowerCase() === 'guided'
      ? 'Foundations review'
      : selectedModuleCompetency?.autonomyTarget;
  const lectureActionLabel = primaryLecture?.label ? `Review ${primaryLecture.label}` : 'Review foundations';
  const tutorialActionLabel =
    normalizedTutorialTopic === 'pattern-first sign-out'
      ? 'Review diagnostic approach'
      : primaryTutorialTopic
        ? `Review ${primaryTutorialTopic}`
        : 'Review differential diagnosis';
  const algorithmActionLabel = primaryAlgorithmTopic ? `Review ${primaryAlgorithmTopic}` : 'Review initial workup';
  const imageActionLabel = primaryPatternLabel ? `Review ${primaryPatternLabel} morphology` : 'Review morphology';
  const assessmentActionLabel =
    normalizedAssessmentTopic === 'introductory unknowns'
      ? 'Start introductory unknown cases'
      : primaryAssessmentTopic
        ? `Start practice in ${primaryAssessmentTopic}`
        : 'Start board-style questions';

  const launchCards = selectedModule
    ? (() => {
        const cards = {
          lecture: {
            key: 'lecture',
            label: 'Foundations review',
            buttonLabel: lectureActionLabel,
            onClick: () =>
              openLecture(primaryLecture?.id, primaryLecture?.label, {
                initialMode: primaryLectureEnhancement?.defaultMode ?? 'overview',
              }),
            disabled: !primaryLecture,
          },
          tutorial: {
            key: 'tutorial',
            label: 'Diagnostic approach',
            buttonLabel: tutorialActionLabel,
            onClick: () => openTutorials(selectedModule),
            disabled: selectedModule.tutorialTopics.length === 0,
          },
          algorithm: {
            key: 'algorithm',
            label: 'Initial workup',
            buttonLabel: algorithmActionLabel,
            onClick: () => openAlgorithms(selectedModule),
            disabled: selectedModuleResolvedAlgorithms.length === 0,
          },
          atlas: {
            key: 'atlas',
            label: 'Morphology review',
            buttonLabel: imageActionLabel,
            onClick: () => openReferenceLibrary(selectedModule),
            disabled: selectedModule.referenceFocusTerms.length === 0,
          },
          assessment: {
            key: 'assessment',
            label: normalizedAssessmentTopic === 'introductory unknowns' ? 'Unknown cases' : 'Board-style questions',
            buttonLabel: assessmentActionLabel,
            onClick: () => openAssessment(selectedModule),
            disabled: selectedModule.assessmentTopics.length === 0,
          },
        };

        if (selectedModule.subspecialty === 'Clinical Pathology') {
          return [cards.tutorial, cards.algorithm, cards.assessment, cards.atlas, cards.lecture];
        }

        if (selectedModule.boardPriority === 'advanced') {
          return [cards.atlas, cards.tutorial, cards.assessment, cards.lecture];
        }

        if (isInflammatoryMimicModule) {
          return [cards.atlas, cards.assessment, cards.tutorial, cards.lecture];
        }

        return [cards.lecture, cards.tutorial, cards.atlas, cards.assessment];
      })()
    : [];
  const firstAvailableLaunchCard = launchCards.find((card) => !card.disabled);
  const secondaryLaunchCards = launchCards.filter((card) => !card.disabled && card.key !== firstAvailableLaunchCard?.key).slice(0, 3);
  const nearbyModules = selectedModule
    ? selectedModule.subspecialty === 'Clinical Pathology'
      ? clinicalPathModules
      : ['Genitourinary', 'Gastrointestinal', 'Hepatobiliary & Pancreatic'].includes(selectedModule.subspecialty)
        ? guGiModules
        : []
    : [];
  const clearFilters = () => {
    setQuery('');
    setDomainFilter('all');
    setSubspecialtyFilter('all');
    setPriorityFilter('all');
    setPromotionFilter('all');
    setPatternFilter('all');
    setSpecimenFilter('all');
    setShowAdvancedFilters(false);
    setShowAllModules(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {!isModuleFocusView && (
        <Card>
          <div className="space-y-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-wrap gap-3">
              {[
                { id: 'all', label: 'All' },
                { id: 'ap', label: 'AP' },
                { id: 'cp', label: 'CP' },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    const nextDomain = option.id as typeof domainFilter;
                    setDomainFilter(nextDomain);
                    setShowAllModules(false);
                    if (nextDomain === 'cp') {
                      setSubspecialtyFilter('Clinical Pathology');
                    } else if (subspecialtyFilter === 'Clinical Pathology') {
                      setSubspecialtyFilter('all');
                    }
                  }}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    domainFilter === option.id
                      ? 'border-sky-400 bg-sky-50 text-sky-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto xl:min-w-[30rem]">
              <label className="block flex-1">
                <span className="sr-only">Search topics</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setShowAllModules(false);
                  }}
                  placeholder="Search topics"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </label>
              <div className="flex gap-2 sm:self-end">
                <button
                  type="button"
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                >
                  {showAdvancedFilters ? 'Hide filters' : 'Filter'}
                </button>
                {hasActiveRefinement && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className={`grid gap-3 ${nextUpModules.length > 3 ? 'md:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
            {nextUpModules.map((module) => (
                <button
                  key={module.moduleId}
                  type="button"
                  onClick={() => {
                    setSelectedId(module.moduleId);
                    setSubspecialtyFilter(module.subspecialty);
                    setDomainFilter(module.subspecialty === 'Clinical Pathology' ? 'cp' : 'ap');
                    setPromotionFilter('canonical');
                    setShowAllModules(false);
                    setIsModuleFocusView(true);
                  }}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-sky-300 hover:bg-sky-50"
                >
                <div className="text-base font-semibold text-slate-900">{module.title}</div>
                <div className="mt-1 text-sm text-slate-600">{module.subspecialty}</div>
              </button>
            ))}
          </div>

          {showAdvancedFilters && (
            <div className="grid gap-3 lg:grid-cols-3">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Service</span>
                <select
                  value={subspecialtyFilter}
                  onChange={(event) => {
                    setSubspecialtyFilter(event.target.value as typeof subspecialtyFilter);
                    setShowAllModules(false);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="all">All subspecialties</option>
                  {activeCurriculumSubspecialties.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Board focus</span>
                <select
                  value={priorityFilter}
                  onChange={(event) => {
                    setPriorityFilter(event.target.value as typeof priorityFilter);
                    setShowAllModules(false);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="all">All priorities</option>
                  <option value="core">Core</option>
                  <option value="high-yield">High Yield</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Coverage</span>
                <select
                  value={promotionFilter}
                  onChange={(event) => {
                    setPromotionFilter(event.target.value as typeof promotionFilter);
                    setShowAllModules(false);
                  }}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                >
                  <option value="all">All topics</option>
                  <option value="canonical">Ready now</option>
                  <option value="staged">Still being added</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
          )}
          </div>
        </Card>
      )}

      <div className={isModuleFocusView ? 'space-y-6' : 'grid gap-8 xl:grid-cols-[18rem_minmax(0,1fr)]'}>
        {!isModuleFocusView && (
          <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="text-sm font-medium text-slate-600">
              {hasActiveRefinement ? `${filteredModules.length} topics` : 'Topics'}
            </div>
            {!hasActiveRefinement && filteredModules.length > visibleModules.length && (
              <button
                type="button"
                onClick={() => setShowAllModules((current) => !current)}
                className="text-xs font-semibold uppercase tracking-wide text-sky-700 transition hover:text-sky-900"
              >
                {showAllModules ? 'Show less' : 'Show all'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {visibleModules.map((module) => {
              const isActive = module.moduleId === selectedModule?.moduleId;
              return (
                <button
                  key={module.moduleId}
                  type="button"
                  onClick={() => {
                    setSelectedId(module.moduleId);
                    setSubspecialtyFilter(module.subspecialty);
                    setDomainFilter(module.subspecialty === 'Clinical Pathology' ? 'cp' : 'ap');
                    setShowAllModules(false);
                    setIsModuleFocusView(true);
                  }}
                  className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                    isActive
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{module.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{module.subspecialty}</div>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                        module.promotionState === 'canonical'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {promotionLabels[module.promotionState]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          </div>
        )}

        {selectedModule ? (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">
                    {selectedModule.subspecialty}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    {promotionLabels[selectedModule.promotionState]}
                  </span>
                </div>
                {isModuleFocusView && (
                  <button
                    type="button"
                    onClick={() => setIsModuleFocusView(false)}
                    className="shrink-0 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    Back to topics
                  </button>
                )}
              </div>

              <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <h2 className="font-serif text-3xl font-semibold text-slate-900">{selectedModule.title}</h2>
                  <p className="mt-3 text-slate-600">{selectedModule.summary}</p>
                </div>
                {selectedModule.promotionState !== 'canonical' && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    Some study links are still being added.
                  </div>
                )}
              </div>

              {firstAvailableLaunchCard && (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Start here</div>
                      <div className="mt-1 text-2xl font-semibold text-slate-900">{firstAvailableLaunchCard.label}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">
                        {isPatternBlock
                          ? 'Start with the closest pattern here, then build the differential.'
                          : 'Start here first, then move to supporting review only after the main pattern is clear.'}
                      </div>
                    </div>
                    {secondaryLaunchCards.length > 0 && (
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        {secondaryLaunchCards.map((card) => (
                          <button
                            key={card.key}
                            type="button"
                            onClick={card.onClick}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
                          >
                            {card.buttonLabel}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={firstAvailableLaunchCard.onClick}
                    className="mt-4 inline-flex items-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                  >
                    {firstAvailableLaunchCard.buttonLabel}
                  </button>
                </div>
              )}

              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
                <div className="space-y-4">
                  {(selectedModule.patternFamilies.length > 0 || selectedModule.specimenContexts.length > 0) && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      {selectedModule.patternFamilies.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Common diagnostic patterns</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedModule.patternFamilies.slice(0, 6).map((item) => (
                              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {selectedModule.specimenContexts.length > 0 && (
                        <div className={selectedModule.patternFamilies.length > 0 ? 'mt-5' : ''}>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Common workflow contexts</div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {selectedModule.specimenContexts.slice(0, 4).map((item) => (
                              <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedModule.cpGovernance && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">What to recognize</div>
                      <div className="mt-3 text-lg font-semibold text-slate-900">
                        {selectedModule.cpGovernance.boardMasteryFocusTitle}
                      </div>
                      <div className="mt-4 grid gap-4 lg:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">High-yield points</div>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                            {selectedModule.cpGovernance.mustKnowConcepts.slice(0, 3).map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Common pitfalls</div>
                          <ul className="mt-2 space-y-2 text-sm leading-6 text-slate-700">
                            {selectedModule.cpGovernance.mustNotMissPitfalls.slice(0, 2).map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {(selectedModuleResolvedAlgorithms.length > 0 || selectedModuleUnresolvedAlgorithmTopics.length > 0) && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Initial workup</div>
                      {selectedModuleResolvedAlgorithms.length > 0 ? (
                        <div className="mt-3 flex flex-wrap gap-3">
                          {selectedModuleResolvedAlgorithms.map((route) => (
                            <button
                              key={route.selectedId}
                              type="button"
                              onClick={() => openAlgorithms(selectedModule, route.requestedTopic)}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
                            >
                              <div className="text-sm font-semibold text-slate-900">{route.requestedTopic}</div>
                              <div className="mt-1 text-xs text-slate-500">Open workup</div>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          Workup topics are queued for this module, but the guided routes are still being wired into the navigator.
                        </p>
                      )}
                      {selectedModuleUnresolvedAlgorithmTopics.length > 0 && (
                        <div className="mt-4">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Still being added</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedModuleUnresolvedAlgorithmTopics.map((topic) => (
                              <span
                                key={topic}
                                className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedModuleCompetency && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="max-w-3xl">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic focus</div>
                          <p className="mt-2 text-sm leading-6 text-slate-700">{selectedModuleCompetency.milestoneOutcome}</p>
                        </div>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                          {displayAutonomyTarget}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedModule.cpGovernance && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board blueprint</div>
                      <div className="mt-3 text-sm font-semibold text-slate-900">{selectedModule.cpGovernance.abpathRootTopic}</div>
                      <div className="mt-2 text-sm leading-6 text-slate-600">{selectedModule.cpGovernance.abpathPrimaryPath}</div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {selectedModule.cpGovernance.abpathSpecVersion}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {selectedModule.cpGovernance.abpathPrimaryLevel}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {selectedModule.cpGovernance.abpathPrecisionMode}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {selectedModule.cpGovernance.abpathExamRisk}
                        </span>
                      </div>
                      <div className="mt-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Board-style tasks</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedModule.cpGovernance.abpathTestableTask.map((task) => (
                            <span key={task} className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800">
                              {task}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedModule.lectures.length > 1 && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-5">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Related review</div>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {selectedModule.lectures.map((lecture) => (
                          <button
                            key={lecture.id}
                            type="button"
                            onClick={() =>
                              openLecture(lecture.id, lecture.label, {
                                initialMode: getGuPilotEnhancement(lecture.id)?.defaultMode ?? 'overview',
                              })
                            }
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-900"
                          >
                            {lecture.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {nearbyModules.length > 1 && (
                <div className="mt-6">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Next topics</div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {nearbyModules
                      .filter((module) => module.moduleId !== selectedModule.moduleId)
                      .slice(0, 4)
                      .map((module) => (
                        <button
                          key={module.moduleId}
                          type="button"
                          onClick={() => {
                            setSelectedId(module.moduleId);
                            setSubspecialtyFilter(module.subspecialty);
                            if (module.subspecialty === 'Clinical Pathology') {
                              setDomainFilter('cp');
                            }
                            setPromotionFilter('all');
                            setShowAllModules(false);
                            setIsModuleFocusView(true);
                          }}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          {module.title}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card>
            <p className="text-slate-600">No topics match your filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PathologyCurriculum;
