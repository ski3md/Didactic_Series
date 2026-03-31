import React, { useEffect, useMemo, useState } from 'react';
import Card from './ui/Card';
import SectionHeader from './ui/SectionHeader';
import {
  AcademicCapIcon,
  ArrowPathIcon,
  BookOpenIcon,
  CollectionIcon,
  DocumentTextIcon,
  PhotographIcon,
} from './icons';
import {
  Section,
  SurgicalPathAssetKind,
  SurgicalPathBoardPriority,
  SurgicalPathModule,
  SurgicalPathPatternFamily,
  SurgicalPathPromotionState,
} from '../types';
import {
  surgicalPathBoardPriorities,
  surgicalPathCurriculumModules,
  surgicalPathPromotionStates,
  surgicalPathSubspecialtyOrder,
} from '../src/content/curriculum/surgicalPathCurriculum';
import { setCurriculumDrilldown } from '../utils/curriculumDrilldown';

interface SurgicalPathCurriculumViewProps {
  onSectionChange: (section: Section) => void;
}

const ASSET_LABELS: Record<SurgicalPathAssetKind, string> = {
  lectures: 'Lectures',
  tutorials: 'Tutorials',
  algorithms: 'Algorithms',
  images: 'Atlas Images',
  syllabus: 'Syllabus',
  assessment: 'Assessment',
};

const boardPriorityLabels: Record<SurgicalPathBoardPriority, string> = {
  core: 'Core',
  'high-yield': 'High Yield',
  advanced: 'Advanced',
};

const promotionStateLabels: Record<SurgicalPathPromotionState, string> = {
  canonical: 'Canonical',
  staged: 'Staged',
  archived: 'Archived',
};

function formatPatternFamily(pattern: SurgicalPathPatternFamily): string {
  return pattern
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

const SurgicalPathCurriculumView: React.FC<SurgicalPathCurriculumViewProps> = ({ onSectionChange }) => {
  const [selectedId, setSelectedId] = useState(surgicalPathCurriculumModules[0]?.moduleId ?? '');
  const [query, setQuery] = useState('');
  const [subspecialtyFilter, setSubspecialtyFilter] = useState<'all' | SurgicalPathModule['subspecialty']>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | SurgicalPathBoardPriority>('all');
  const [promotionFilter, setPromotionFilter] = useState<'all' | SurgicalPathPromotionState>('all');
  const [patternFilter, setPatternFilter] = useState<'all' | SurgicalPathPatternFamily>('all');

  const patternOptions = useMemo(() => {
    return [
      'all',
      ...new Set(surgicalPathCurriculumModules.flatMap((module) => module.patternFamilies)),
    ] as Array<'all' | SurgicalPathPatternFamily>;
  }, []);

  const filteredModules = useMemo(() => {
    const lowered = query.trim().toLowerCase();

    return surgicalPathCurriculumModules.filter((module) => {
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
      if (!lowered) {
        return true;
      }

      return [
        module.title,
        module.summary,
        module.subspecialty,
        ...module.patternFamilies,
        ...module.specimenContexts,
      ]
        .join(' ')
        .toLowerCase()
        .includes(lowered);
    });
  }, [patternFilter, priorityFilter, promotionFilter, query, subspecialtyFilter]);

  useEffect(() => {
    if (filteredModules.length === 0) {
      return;
    }

    const hasSelectedModule = filteredModules.some((module) => module.moduleId === selectedId);
    if (!hasSelectedModule) {
      setSelectedId(filteredModules[0].moduleId);
    }
  }, [filteredModules, selectedId]);

  const selectedModule = filteredModules.find((module) => module.moduleId === selectedId) ?? filteredModules[0];
  const relatedModules = useMemo(() => {
    if (!selectedModule) {
      return [];
    }
    return selectedModule.relatedModules
      .map((moduleId) => surgicalPathCurriculumModules.find((module) => module.moduleId === moduleId))
      .filter((module): module is SurgicalPathModule => Boolean(module));
  }, [selectedModule]);

  const summaryCounts = useMemo(
    () => ({
      total: surgicalPathCurriculumModules.length,
      canonical: surgicalPathCurriculumModules.filter((module) => module.promotionState === 'canonical').length,
      staged: surgicalPathCurriculumModules.filter((module) => module.promotionState === 'staged').length,
      core: surgicalPathCurriculumModules.filter((module) => module.boardPriority === 'core').length,
    }),
    []
  );

  const openSection = (
    targetSection: Section,
    moduleId: string,
    intent?: SurgicalPathModule['navigationIntents'][keyof SurgicalPathModule['navigationIntents']]
  ) => {
    setCurriculumDrilldown({
      sourceModuleId: moduleId,
      targetSection,
      query: intent?.query,
      track: intent?.track,
      filter: intent?.filter,
    });
    onSectionChange(targetSection);
  };

  const assetStatus = (module: SurgicalPathModule, kind: SurgicalPathAssetKind, linkedCount: number) => {
    if (linkedCount > 0) {
      return { label: `${linkedCount} linked`, tone: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    if (module.plannedAssets.includes(kind)) {
      return { label: 'Planned', tone: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    return { label: 'None', tone: 'bg-slate-50 text-slate-500 border-slate-200' };
  };

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Pathology Curriculum"
        subtitle="Boards-first curriculum shell that now combines canonical surgical pathology modules with curated clinical pathology teaching blocks."
        icon={<AcademicCapIcon className="h-9 w-9" />}
      />

      <Card>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold font-serif text-slate-900">Curriculum Overview</h2>
              <p className="mt-1 text-sm text-slate-600">
                This shell turns the imported corpus into a boards-first pathology pathway. Canonical modules are learner-facing;
                staged modules remain visible so missing assets stay explicit rather than hidden.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Modules', value: summaryCounts.total },
                { label: 'Canonical', value: summaryCounts.canonical },
                { label: 'Staged', value: summaryCounts.staged },
                { label: 'Core Priority', value: summaryCounts.core },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</div>
                  <div className="mt-2 text-2xl font-semibold text-slate-900">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search Modules</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search subspecialty, pattern family, or summary"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
          </label>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Subspecialty</span>
            <select
              value={subspecialtyFilter}
              onChange={(event) => setSubspecialtyFilter(event.target.value as typeof subspecialtyFilter)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="all">All subspecialties</option>
              {surgicalPathSubspecialtyOrder.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Board Priority</span>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value as typeof priorityFilter)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="all">All priorities</option>
              {surgicalPathBoardPriorities.map((option) => (
                <option key={option} value={option}>{boardPriorityLabels[option]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Promotion State</span>
            <select
              value={promotionFilter}
              onChange={(event) => setPromotionFilter(event.target.value as typeof promotionFilter)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="all">All states</option>
              {surgicalPathPromotionStates.map((option) => (
                <option key={option} value={option}>{promotionStateLabels[option]}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Pattern Family</span>
            <select
              value={patternFilter}
              onChange={(event) => setPatternFilter(event.target.value as typeof patternFilter)}
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            >
              <option value="all">All patterns</option>
              {patternOptions.filter((option) => option !== 'all').map((option) => (
                <option key={option} value={option}>{formatPatternFamily(option)}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="space-y-4">
          {filteredModules.map((module) => {
            const isActive = module.moduleId === selectedModule?.moduleId;
            return (
              <button
                key={module.moduleId}
                type="button"
                onClick={() => setSelectedId(module.moduleId)}
                className={`w-full rounded-xl border p-5 text-left shadow-sm transition-all ${
                  isActive
                    ? 'border-primary-400 bg-primary-50 shadow-primary-200/40'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md'
                }`}
              >
                <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
                  <span className="text-primary-700">{module.subspecialty}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                    {boardPriorityLabels[module.boardPriority]}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                    {promotionStateLabels[module.promotionState]}
                  </span>
                </div>
                <h3 className="mt-2 font-serif text-lg font-semibold text-slate-900">{module.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{module.summary}</p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>Order {module.recommendedOrder}</span>
                  <span>Priority score {module.priorityScore}</span>
                </div>
              </button>
            );
          })}
        </div>

        {selectedModule ? (
          <div className="space-y-6">
            <Card>
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-800">
                      {selectedModule.subspecialty}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {boardPriorityLabels[selectedModule.boardPriority]}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {promotionStateLabels[selectedModule.promotionState]}
                    </span>
                  </div>
                  <h2 className="mt-3 font-serif text-3xl font-semibold text-slate-900">{selectedModule.title}</h2>
                  <p className="mt-3 text-slate-600">{selectedModule.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <div className="font-semibold text-slate-900">Recommended Order</div>
                    <div>{selectedModule.recommendedOrder}</div>
                  </div>
                  <div className="rounded-lg bg-slate-50 px-4 py-3">
                    <div className="font-semibold text-slate-900">Priority Score</div>
                    <div>{selectedModule.priorityScore}</div>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-xl font-semibold font-serif text-slate-900">Patterns and Specimen Contexts</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pattern Families</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedModule.patternFamilies.map((pattern) => (
                      <span key={pattern} className="inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-medium text-primary-800">
                        {formatPatternFamily(pattern)}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Specimen Contexts</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedModule.specimenContexts.map((context) => (
                      <span key={context} className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {context}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-xl font-semibold font-serif text-slate-900">Asset Readiness</h3>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[
                  ['lectures', selectedModule.lectures.length],
                  ['tutorials', selectedModule.tutorials.length],
                  ['algorithms', selectedModule.algorithms.length],
                  ['images', selectedModule.images.length],
                  ['syllabus', selectedModule.syllabus.length],
                  ['assessment', 0],
                ].map(([kind, count]) => {
                  const status = assetStatus(selectedModule, kind as SurgicalPathAssetKind, count as number);
                  return (
                    <div key={kind} className={`rounded-xl border px-4 py-3 ${status.tone}`}>
                      <div className="text-xs font-semibold uppercase tracking-wide">{ASSET_LABELS[kind as SurgicalPathAssetKind]}</div>
                      <div className="mt-2 text-sm font-medium">{status.label}</div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card>
              <h3 className="mb-4 text-xl font-semibold font-serif text-slate-900">Open Linked Learning Surfaces</h3>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => openSection(Section.LECTURES, selectedModule.moduleId, selectedModule.navigationIntents?.lectures)}
                  disabled={selectedModule.lectures.length === 0 && !selectedModule.navigationIntents?.lectures}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <AcademicCapIcon className="h-5 w-5" />
                  Open Lectures
                </button>
                <button
                  type="button"
                  onClick={() => openSection(Section.TUTORIALS, selectedModule.moduleId, selectedModule.navigationIntents?.tutorials)}
                  disabled={selectedModule.tutorials.length === 0 && !selectedModule.navigationIntents?.tutorials}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CollectionIcon className="h-5 w-5" />
                  Open Tutorials
                </button>
                <button
                  type="button"
                  onClick={() => openSection(Section.IMAGE_GALLERIES, selectedModule.moduleId, selectedModule.navigationIntents?.images)}
                  disabled={selectedModule.images.length === 0 && !selectedModule.navigationIntents?.images}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PhotographIcon className="h-5 w-5" />
                  Open Atlas
                </button>
                <button
                  type="button"
                  onClick={() => openSection(Section.SYLLABUS_EXPLORER, selectedModule.moduleId, selectedModule.navigationIntents?.syllabus)}
                  disabled={!selectedModule.navigationIntents?.syllabus}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <BookOpenIcon className="h-5 w-5" />
                  Open Syllabus
                </button>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Algorithms are listed inside the module detail until a dedicated algorithm navigator ships.
              </p>
            </Card>

            <Card>
              <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                <DocumentTextIcon className="mr-3 h-6 w-6 text-primary-600" />
                Linked Assets
              </h3>
              <div className="grid gap-6 lg:grid-cols-2">
                {[
                  ['Lectures', selectedModule.lectures],
                  ['Tutorials', selectedModule.tutorials],
                  ['Algorithms', selectedModule.algorithms],
                  ['Atlas Images', selectedModule.images],
                ].map(([label, items]) => (
                  <div key={label}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                    <div className="mt-3 space-y-2">
                      {(items as SurgicalPathModule['lectures']).length > 0 ? (
                        (items as SurgicalPathModule['lectures']).map((item) => (
                          <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                            {item.label}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                          {selectedModule.plannedAssets.includes(
                            ({
                              Lectures: 'lectures',
                              Tutorials: 'tutorials',
                              Algorithms: 'algorithms',
                              'Atlas Images': 'images',
                            } as Record<string, SurgicalPathAssetKind>)[label]
                          )
                            ? 'Planned in roadmap'
                            : 'No linked assets'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {relatedModules.length > 0 && (
              <Card>
                <h3 className="mb-4 flex items-center text-xl font-semibold font-serif text-slate-900">
                  <ArrowPathIcon className="mr-3 h-6 w-6 text-primary-600" />
                  Related Modules
                </h3>
                <div className="flex flex-wrap gap-3">
                  {relatedModules.map((module) => (
                    <button
                      key={module.moduleId}
                      type="button"
                      onClick={() => setSelectedId(module.moduleId)}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                    >
                      {module.title}
                    </button>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          <Card>
            <p className="text-slate-600">No modules matched the current filters.</p>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SurgicalPathCurriculumView;
