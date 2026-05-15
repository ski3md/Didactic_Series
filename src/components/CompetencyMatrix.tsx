import React, { useMemo, useState } from 'react';
import { ClipboardDocumentListIcon, ShieldCheckIcon } from './icons.tsx';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import {
  apP0CardBatches,
  apP0CardBatchReadiness,
  apP0CardBatchSummary,
  ApP0CardBatchCard,
} from '../content/competency/apP0CardBatches.ts';
import {
  competencyDomains,
  competencyMatrixRecords,
  competencyMatrixSummary,
  apDesignationCrosswalk,
  cpRotationStandards,
  learnerLevelLabels,
  learnerLevelOrder,
  levelModeGuidance,
  signOutRubric,
  sourceStandardDocuments,
} from '../content/competency/competencyMatrix.ts';
import { apGapClosureQueue } from '../content/competency/apGapClosureQueue.ts';
import { setCurriculumIntent } from '../utils/curriculumNavigation.ts';
import { CompetencyDomain, CompetencyMatrixRecord, LearnerLevel, Section } from '../types.ts';

interface CompetencyMatrixProps {
  onSectionChange: (section: Section) => void;
}

const levelTone: Record<LearnerLevel, string> = {
  PGY1: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PGY2: 'bg-sky-50 text-sky-800 border-sky-200',
  PGY3: 'bg-indigo-50 text-indigo-800 border-indigo-200',
  PGY4: 'bg-violet-50 text-violet-800 border-violet-200',
  PGY5_FELLOW: 'bg-amber-50 text-amber-800 border-amber-200',
  ATTENDING: 'bg-slate-100 text-slate-800 border-slate-300',
};

const difficultyTone: Record<CompetencyMatrixRecord['difficulty'], string> = {
  introductory: 'bg-emerald-50 text-emerald-800',
  core: 'bg-sky-50 text-sky-800',
  advanced: 'bg-indigo-50 text-indigo-800',
  expert: 'bg-slate-100 text-slate-800',
};

const sourceLabels: Record<CompetencyMatrixRecord['sourceType'], string> = {
  curriculum: 'Curriculum',
  lecture: 'Lecture',
  tutorial: 'Tutorial',
  atlas: 'Image Atlas',
  signout: 'Sign-Out',
  assessment: 'Assessment',
  faculty: 'Faculty',
};

const statusTone: Record<CompetencyMatrixRecord['trust']['editorialStatus'], string> = {
  draft: 'bg-amber-50 text-amber-800',
  reviewed: 'bg-sky-50 text-sky-800',
  canonical: 'bg-emerald-50 text-emerald-800',
};

const LevelBadge: React.FC<{ level: LearnerLevel; active?: boolean }> = ({ level, active = false }) => (
  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${levelTone[level]} ${active ? 'ring-2 ring-offset-1 ring-slate-300' : ''}`}>
    {learnerLevelLabels[level]}
  </span>
);

const recordMatchesDomain = (record: CompetencyMatrixRecord, domain: CompetencyDomain | 'all') =>
  domain === 'all' || record.competencyDomains.includes(domain);

const CompetencyMatrix: React.FC<CompetencyMatrixProps> = ({ onSectionChange }) => {
  const [selectedLevel, setSelectedLevel] = useState<LearnerLevel>('PGY1');
  const [selectedDomain, setSelectedDomain] = useState<CompetencyDomain | 'all'>('all');
  const [selectedP0Category, setSelectedP0Category] = useState<string>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState(competencyMatrixRecords[0]?.id ?? '');

  const filteredRecords = useMemo(() => {
    const lowered = query.trim().toLowerCase();
    return competencyMatrixRecords.filter((record) => {
      if (!record.learnerLevels.includes(selectedLevel)) {
        return false;
      }
      if (!recordMatchesDomain(record, selectedDomain)) {
        return false;
      }
      if (showAvailableOnly && !record.availableNow) {
        return false;
      }
      if (!lowered) {
        return true;
      }
      return [
        record.title,
        record.summary,
        record.rotation,
        record.gapSummary,
        record.closureAction,
        ...record.competencyDomains,
      ].some((value) => value.toLowerCase().includes(lowered));
    });
  }, [query, selectedDomain, selectedLevel, showAvailableOnly]);

  const selectedRecord =
    filteredRecords.find((record) => record.id === selectedRecordId) ??
    filteredRecords[0] ??
    competencyMatrixRecords.find((record) => record.id === selectedRecordId) ??
    competencyMatrixRecords[0];

  const levelCounts = learnerLevelOrder.map((level) => ({
    level,
    count: competencyMatrixRecords.filter((record) => record.learnerLevels.includes(level)).length,
  }));

  const domainCounts = competencyDomains.map((domain) => ({
    domain,
    count: competencyMatrixRecords.filter((record) => record.learnerLevels.includes(selectedLevel) && record.competencyDomains.includes(domain)).length,
  }));

  const p0CategoryRows = useMemo(
    () => Object.entries(apGapClosureQueue.categorySummary)
      .filter(([, summary]) => summary.p0 > 0)
      .sort((a, b) => b[1].p0 - a[1].p0),
    [],
  );

  const visibleP0Rows = useMemo(
    () => apGapClosureQueue.p0Rows
      .filter((row) => selectedP0Category === 'all' || row.categoryId === selectedP0Category)
      .slice(0, 24),
    [selectedP0Category],
  );

  const visibleEntityCards = useMemo<ApP0CardBatchCard[]>(
    () => apP0CardBatches
      .flatMap((batch) => batch.cards)
      .filter((card) => selectedP0Category === 'all' || card.sourceQueueId.startsWith(`${selectedP0Category}-`))
      .slice(0, 12),
    [selectedP0Category],
  );

  const openRecord = (record: CompetencyMatrixRecord) => {
    if (record.linkedSection === Section.PATHOLOGY_CURRICULUM && record.linkedModuleId) {
      setCurriculumIntent({
        moduleId: record.linkedModuleId,
        query: record.linkedQuery ?? record.title,
      });
    }
    onSectionChange(record.linkedSection);
  };

  const guidance = levelModeGuidance[selectedLevel];
  const availableCount = filteredRecords.filter((record) => record.availableNow).length;
  const gapCount = filteredRecords.length - availableCount;
  const batchReadiness = apP0CardBatchReadiness;
  const missingGatePercent = Math.max(
    0,
    100 - batchReadiness.percentComplete - batchReadiness.percentReviewReady,
  );
  const readinessSegments = [
    {
      label: 'complete',
      value: batchReadiness.completedGates,
      percent: batchReadiness.percentComplete,
      className: 'bg-emerald-500',
    },
    {
      label: 'ready-for-review',
      value: batchReadiness.reviewReadyGates,
      percent: batchReadiness.percentReviewReady,
      className: 'bg-sky-500',
    },
    {
      label: 'missing',
      value: batchReadiness.missingGates,
      percent: missingGatePercent,
      className: 'bg-amber-400',
    },
  ];
  const readinessLegend = [
    {
      label: 'complete',
      text: apP0CardBatches[0].readinessLegend.complete,
      className: 'bg-emerald-500',
    },
    {
      label: 'ready-for-review',
      text: apP0CardBatches[0].readinessLegend['ready-for-review'],
      className: 'bg-sky-500',
    },
    {
      label: 'missing',
      text: apP0CardBatches[0].readinessLegend.missing,
      className: 'bg-amber-400',
    },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Competency Matrix"
        subtitle="Map curriculum, images, sign-out practice, rubrics, and faculty QA to learner level."
        icon={<ShieldCheckIcon className="h-10 w-10" />}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Level Mode</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {levelCounts.map(({ level, count }) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => {
                    setSelectedLevel(level);
                    setSelectedRecordId('');
                  }}
                  className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
                    selectedLevel === level
                      ? levelTone[level]
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  {learnerLevelLabels[level]}
                  <span className="ml-2 text-xs opacity-75">{count}</span>
                </button>
              ))}
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Intent</div>
                <p className="mt-2 text-sm text-slate-800">{guidance.intent}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Mode</div>
                <p className="mt-2 text-sm text-slate-800">{guidance.interfaceMode}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evidence</div>
                <p className="mt-2 text-sm text-slate-800">{guidance.expectedEvidence}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2">
            {[
              ['Modules', competencyMatrixSummary.totalCurriculumModules],
              ['Tutorials', competencyMatrixSummary.normalizedTutorials],
              ['Syllabus', competencyMatrixSummary.syllabusEntries],
              ['Sign-out images', competencyMatrixSummary.validatedSpecialtySignoutImages],
              ['Reference images', competencyMatrixSummary.supplementalReferenceImages],
              ['Validated cases', competencyMatrixSummary.apWorkflowContractCases],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Source Standards</div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">Four incorporated pathology competency documents</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
              These documents now drive the level mapping, CP consultation emphasis, AP C/AR/F progression, senior-resident QA expectations, and deterministic assessment language used by the matrix.
            </p>
          </div>
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
            AP topics use ABPath C/AR/F designations. CP topics use consultation, laboratory leadership, rotation-specific evidence, and performance-in-practice assessment.
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {sourceStandardDocuments.map((document) => (
            <article key={document.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{document.scope}</div>
                  <h3 className="mt-1 text-base font-semibold text-slate-950">{document.shortTitle}</h3>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700">{document.pageCount} pages</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{document.publicationContext}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {document.mappedLearnerLevels.map((level) => (
                  <LevelBadge key={`${document.id}-${level}`} level={level} />
                ))}
              </div>
              <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">App use</div>
              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                {document.appUse.slice(0, 2).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">AP Designation Crosswalk</div>
            <div className="mt-3 space-y-3">
              {apDesignationCrosswalk.map((item) => (
                <div key={item.designation} className="rounded-md bg-slate-50 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{item.designation}</span>
                    <span className="text-sm font-semibold text-slate-950">{item.label}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700">{item.appRule}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">CP Rotation Standards</div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {cpRotationStandards.map((standard) => (
                <div key={standard} className="rounded-md bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800">
                  {standard}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">AP Gap Closure Queue</div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">Phase 1 core resident gaps</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">{apGapClosureQueue.definition}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['All gaps', apGapClosureQueue.totals.allMissing],
              ['P0 core', apGapClosureQueue.totals.p0],
              ['P1 safety', apGapClosureQueue.totals.p1],
              ['Fellow depth', apGapClosureQueue.totals.p3],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">{label}</div>
                <div className="mt-1 text-2xl font-semibold text-slate-950">{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[18rem_minmax(0,1fr)]">
          <div>
            <label className="block">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Queue category</span>
              <select
                value={selectedP0Category}
                onChange={(event) => setSelectedP0Category(event.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                <option value="all">All P0 categories</option>
                {p0CategoryRows.map(([categoryId, summary]) => (
                  <option key={categoryId} value={categoryId}>
                    {summary.category} ({summary.p0})
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-4 space-y-2">
              {p0CategoryRows.slice(0, 10).map(([categoryId, summary]) => (
                <button
                  key={categoryId}
                  type="button"
                  onClick={() => setSelectedP0Category(categoryId)}
                  className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition ${
                    selectedP0Category === categoryId
                      ? 'border-amber-300 bg-amber-50 text-amber-950'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold">{summary.category}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{summary.p0}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {apGapClosureQueue.qualityGates.map((gate, index) => (
                <div key={gate} className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Gate {index + 1}</div>
                  <p className="mt-1">{gate}</p>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Draft Entity Cards</div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-700">
                  <span>{apP0CardBatchSummary.batchCount} AP P0 faculty batches</span>
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">draft scaffolds awaiting faculty review</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  The active build-out now covers the original core batch plus cardiovascular/autopsy, endocrine, and dermatopathology P0 batches with the same five-gate promotion model.
                </p>
                <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">Faculty authoring packets</div>
                  <p className="mt-1 leading-6">
                    Use these review packets to fill source-backed content, visual assets, answer keys, and reviewer sign-off before any scaffold becomes canonical.
                  </p>
                  <div className="mt-2 space-y-1">
                    {apP0CardBatches.map((batch) => (
                      <div key={batch.batchName} className="break-all font-mono text-xs text-slate-700">{batch.facultyPacketPath}</div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 rounded-md border border-slate-200 bg-white px-3 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Batch Readiness</div>
                    <div className="text-xs font-semibold text-slate-600">
                      {batchReadiness.completedGates + batchReadiness.reviewReadyGates}/{batchReadiness.totalGates} gates have usable structure
                    </div>
                  </div>
                  <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-label="P0 batch readiness by gate status">
                    {readinessSegments.map((segment) => (
                      <div
                        key={segment.label}
                        className={segment.className}
                        style={{ width: `${segment.percent}%` }}
                        title={`${segment.label}: ${segment.value} gates`}
                      />
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2 text-xs text-slate-600 lg:grid-cols-3">
                    {readinessLegend.map((item) => (
                      <div key={item.label} className="flex gap-2">
                        <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.className}`} />
                        <div>
                          <div className="font-semibold text-slate-900">{item.label}</div>
                          <p className="mt-0.5 leading-5">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {[
                    ['Cards', apP0CardBatchSummary.cardCount],
                    ['Complete gates', apP0CardBatchSummary.completedGates],
                    ['Review-ready gates', apP0CardBatchSummary.reviewReadyGates],
                    ['Missing gates', apP0CardBatchSummary.missingGates],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-md bg-slate-50 px-3 py-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
                      <div className="mt-1 text-lg font-semibold text-slate-950">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid gap-0 divide-y divide-slate-100">
                {visibleEntityCards.length > 0 ? (
                  visibleEntityCards.map((card) => (
                    <article key={card.id} className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-950">{card.title}</div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{card.apSpecPath}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{card.editorialStatus}</span>
                      </div>
                      <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                        <div className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Specimen Context</div>
                          <p className="mt-1 text-slate-700">{card.specimenContext}</p>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visual Anchor</div>
                          <p className="mt-1 text-slate-700">{card.visualAnchorPlan}</p>
                        </div>
                        <div className="rounded-md bg-slate-50 p-3">
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Report Consequence</div>
                          <p className="mt-1 text-slate-700">{card.reportingConsequencePrompt}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Card Sections</div>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {card.entityCardSections.slice(0, 4).map((section) => (
                              <li key={section}>{section}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retrieval Prompts</div>
                          <ul className="mt-2 space-y-1 text-sm text-slate-700">
                            {card.retrievalPrompts.slice(0, 3).map((prompt) => (
                              <li key={prompt}>{prompt}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completion Gates</div>
                        <div className="mt-2 grid gap-2 md:grid-cols-5">
                          {card.gateStatuses.map((gate) => (
                            <div key={gate.id} className="rounded-md border border-slate-200 bg-white p-2">
                              <div className="text-xs font-semibold text-slate-900">{gate.label}</div>
                              <div className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                gate.status === 'complete'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : gate.status === 'ready-for-review'
                                    ? 'bg-sky-50 text-sky-800'
                                    : 'bg-amber-50 text-amber-800'
                              }`}>
                                {gate.status}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="p-4 text-sm text-slate-600">
                    No draft entity cards are in this first batch for the selected category.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Actionable Rows</div>
                  <div className="mt-1 text-sm text-slate-700">
                    Showing {visibleP0Rows.length} of {selectedP0Category === 'all'
                      ? apGapClosureQueue.totals.p0
                      : apGapClosureQueue.categorySummary[selectedP0Category as keyof typeof apGapClosureQueue.categorySummary]?.p0 ?? 0} P0 rows
                  </div>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                  Build entity card {'>'} visual anchor {'>'} retrieval {'>'} QA
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {visibleP0Rows.map((row) => (
                  <article key={row.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-950">{row.title}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{row.path}</p>
                      </div>
                      <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white">{row.learnerLevel}</span>
                    </div>
                    <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deliverables</div>
                        <p className="mt-1 text-slate-700">{row.deliverables}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Learning Treatment</div>
                        <p className="mt-1 text-slate-700">{row.learningTreatment}</p>
                      </div>
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">QA Standard</div>
                        <p className="mt-1 text-slate-700">{row.qaStandard}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="space-y-4">
          <Card className="!mb-0 !p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filter</div>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Search</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Module, gap, domain"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-semibold text-slate-500">Domain</span>
              <select
                value={selectedDomain}
                onChange={(event) => {
                  setSelectedDomain(event.target.value as CompetencyDomain | 'all');
                  setSelectedRecordId('');
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                <option value="all">All domains</option>
                {domainCounts.map(({ domain, count }) => (
                  <option key={domain} value={domain}>
                    {domain} ({count})
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={showAvailableOnly}
                onChange={(event) => setShowAvailableOnly(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700"
              />
              Ready now only
            </label>
          </Card>

          <Card className="!mb-0 !p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rubric</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{signOutRubric.title}</h2>
            <p className="mt-2 text-sm text-slate-600">Deterministic feedback anchors the AI layer and gives attendings an auditable baseline.</p>
            <div className="mt-4 space-y-2">
              {signOutRubric.criteria.map((criterion) => (
                <div key={criterion.id} className="rounded-md bg-slate-50 px-3 py-2">
                  <div className="text-sm font-semibold text-slate-900">{criterion.label}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Pass {criterion.passingScore}/{criterion.maxScore}
                    {criterion.safetyCritical ? ' • safety critical' : ''}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </aside>

        <main className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtered Matrix</div>
              <div className="mt-1 text-sm text-slate-700">
                {filteredRecords.length} rows • {availableCount} ready • {gapCount} gaps
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
            <div className="space-y-3">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((record) => {
                  const isActive = selectedRecord?.id === record.id;
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setSelectedRecordId(record.id)}
                      className={`w-full rounded-lg border bg-white p-4 text-left transition ${
                        isActive ? 'border-sky-400 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-950">{record.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{sourceLabels[record.sourceType]} • {record.rotation}</div>
                        </div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${difficultyTone[record.difficulty]}`}>
                          {record.difficulty}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {record.learnerLevels.map((level) => (
                          <LevelBadge key={level} level={level} active={level === selectedLevel} />
                        ))}
                      </div>
                      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{record.gapSummary}</p>
                    </button>
                  );
                })
              ) : (
                <Card className="!mb-0">
                  <p className="text-sm text-slate-600">No rows match the current level and domain filters.</p>
                </Card>
              )}
            </div>

            {selectedRecord && (
              <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                      {sourceLabels[selectedRecord.sourceType]} • {selectedRecord.autonomyTarget}
                    </div>
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">{selectedRecord.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-700">{selectedRecord.summary}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone[selectedRecord.trust.editorialStatus]}`}>
                    {selectedRecord.trust.editorialStatus}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestone</div>
                    <p className="mt-2 text-sm text-slate-800">{selectedRecord.milestoneOutcome}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Closure Action</div>
                    <p className="mt-2 text-sm text-slate-800">{selectedRecord.closureAction}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Competency Domains</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedRecord.competencyDomains.map((domain) => (
                      <span key={domain} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-5 rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                    <ClipboardDocumentListIcon className="h-5 w-5 text-slate-500" />
                    Provenance and QA
                  </div>
                  <dl className="mt-3 grid gap-3 text-sm md:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reviewed</dt>
                      <dd className="mt-1 text-slate-800">{selectedRecord.trust.lastReviewed}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</dt>
                      <dd className="mt-1 text-slate-800">{selectedRecord.trust.sourceQuality}</dd>
                    </div>
                    <div className="md:col-span-2">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Trace</dt>
                      <dd className="mt-1 text-slate-800">{selectedRecord.trust.provenance}</dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => openRecord(selectedRecord)}
                    className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open linked surface
                  </button>
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CompetencyMatrix;
