import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardDocumentListIcon, ShieldCheckIcon } from './icons.tsx';
import Card from './ui/Card.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import { setCurriculumIntent } from '../utils/curriculumNavigation.ts';
import { setReferenceLibraryIntent } from '../utils/referenceLibraryNavigation.ts';
import {
  loadCompetencyMatrixPayload,
  type CompetencyMatrixData,
} from '../utils/competencyMatrixLoader.ts';
import { CompetencyDomain, CompetencyMatrixRecord, LearnerLevel, Section } from '../types.ts';

interface CompetencyMatrixProps {
  onSectionChange: (section: Section) => void;
}

const learnerLevelBadgeLabels: Record<LearnerLevel, string> = {
  PGY1: 'PGY1',
  PGY2: 'PGY2',
  PGY3: 'PGY3',
  PGY4: 'PGY4',
  PGY5_FELLOW: 'PGY5/Fellow',
  ATTENDING: 'Attending',
};

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

const statusLabel: Record<CompetencyMatrixRecord['trust']['editorialStatus'], string> = {
  draft: 'In progress',
  reviewed: 'Faculty reviewed',
  canonical: 'Ready to study',
};

const LevelBadge: React.FC<{ level: LearnerLevel; active?: boolean }> = ({ level, active = false }) => (
  <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${levelTone[level]} ${active ? 'ring-2 ring-offset-1 ring-slate-300' : ''}`}>
    {learnerLevelBadgeLabels[level]}
  </span>
);

const recordMatchesDomain = (record: CompetencyMatrixRecord, domain: CompetencyDomain | 'all') =>
  domain === 'all' || record.competencyDomains.includes(domain);

const fallbackLevelGuidance = {
  intent: 'Keep the learner oriented to the current level and next safe educational action.',
  interfaceMode: 'Compact guidance with explicit scope and expected evidence.',
  expectedEvidence: 'Visible rationale, safe next step, and enough context to continue learning.',
};

const CompetencyMatrix: React.FC<CompetencyMatrixProps> = ({ onSectionChange }) => {
  const [data, setData] = useState<CompetencyMatrixData | null>(null);
  const [loadError, setLoadError] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<LearnerLevel>('PGY1');
  const [selectedDomain, setSelectedDomain] = useState<CompetencyDomain | 'all'>('all');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedRecordId, setSelectedRecordId] = useState('');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const loadedData = await loadCompetencyMatrixPayload();
        if (cancelled) {
          return;
        }
        setData(loadedData);
        setSelectedRecordId(loadedData.competencyMatrixRecords[0]?.id ?? '');
        setLoadError('');
      } catch (error) {
        if (cancelled) {
          return;
        }
        setLoadError(error instanceof Error ? error.message : 'Failed to load competency data.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <h2 className="text-base font-semibold">Competency Matrix unavailable</h2>
        <p className="mt-2">{loadError}</p>
      </div>
    );
  }

  const hasData = Boolean(data);
  const competencyDomains = data?.competencyDomains ?? [];
  const competencyMatrixRecords = data?.competencyMatrixRecords ?? [];
  const competencyMatrixSummary = data?.competencyMatrixSummary ?? {
    totalCurriculumModules: 0,
    validatedSpecialtySignoutImages: 0,
    supplementalReferenceImages: 0,
    normalizedTutorials: 0,
    syllabusEntries: 0,
    apWorkflowContractCases: 0,
  };
  const learnerLevelLabels = data?.learnerLevelLabels ?? learnerLevelBadgeLabels;
  const learnerLevelOrder = data?.learnerLevelOrder ?? (Object.keys(learnerLevelBadgeLabels) as LearnerLevel[]);
  const levelModeGuidance = data?.levelModeGuidance ?? {
    PGY1: fallbackLevelGuidance,
    PGY2: fallbackLevelGuidance,
    PGY3: fallbackLevelGuidance,
    PGY4: fallbackLevelGuidance,
    PGY5_FELLOW: fallbackLevelGuidance,
    ATTENDING: fallbackLevelGuidance,
  };
  const signOutRubric = data?.signOutRubric ?? {
    title: 'Deterministic Sign-Out Rubric',
    criteria: [],
  };
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
  }, [competencyMatrixRecords, query, selectedDomain, selectedLevel, showAvailableOnly]);

  const selectedRecord = useMemo(
    () =>
      filteredRecords.find((record) => record.id === selectedRecordId) ??
      filteredRecords[0] ??
      competencyMatrixRecords.find((record) => record.id === selectedRecordId) ??
      competencyMatrixRecords[0],
    [competencyMatrixRecords, filteredRecords, selectedRecordId],
  );

  const levelCounts = useMemo(
    () => learnerLevelOrder.map((level) => ({
      level,
      count: competencyMatrixRecords.filter((record) => record.learnerLevels.includes(level)).length,
    })),
    [competencyMatrixRecords, learnerLevelOrder],
  );

  const domainCounts = useMemo(
    () => competencyDomains.map((domain) => ({
      domain,
      count: competencyMatrixRecords.filter(
        (record) => record.learnerLevels.includes(selectedLevel) && record.competencyDomains.includes(domain),
      ).length,
    })),
    [competencyDomains, competencyMatrixRecords, selectedLevel],
  );

  if (!hasData) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
        <p>Loading Competency Matrix data…</p>
      </div>
    );
  }

  if (!selectedRecord) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-700">
        <h2 className="text-base font-semibold text-slate-900">Competency Matrix unavailable</h2>
        <p className="mt-2 text-sm">The matrix loaded without a valid record set. Refresh the page or review the competency payload.</p>
      </div>
    );
  }

  const openRecord = (record: CompetencyMatrixRecord) => {
    if (record.linkedSection === Section.PATHOLOGY_CURRICULUM && record.linkedModuleId) {
      setCurriculumIntent({
        moduleId: record.linkedModuleId,
        query: record.linkedQuery ?? record.title,
      });
    }
    onSectionChange(record.linkedSection);
  };

  const guidance = levelModeGuidance[selectedLevel] ?? fallbackLevelGuidance;
  const availableCount = filteredRecords.filter((record) => record.availableNow).length;
  const gapCount = filteredRecords.length - availableCount;
  const openCompetencyReference = () => {
    setReferenceLibraryIntent({
      title: 'Training standards and scoring guide',
      summary: `${learnerLevelLabels[selectedLevel]} study guide for source standards, level expectations, AP/CP training rules, and sign-out scoring.`,
      focusTerms: [selectedLevel],
      tutorialTopics: selectedRecord ? [selectedRecord.title] : [],
    });
    onSectionChange(Section.REFERENCE_LIBRARY);
  };

  return (
    <div className="animate-fade-in space-y-8">
      <SectionHeader
        title="Competency Matrix"
        subtitle="See which lessons, image sets, and sign-out exercises fit each stage of training."
        icon={<ShieldCheckIcon className="h-10 w-10" />}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(22rem,0.8fr)]">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Learner focus</div>
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
            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current level</div>
                  <div className="mt-2 text-lg font-semibold text-slate-950">{learnerLevelLabels[selectedLevel]}</div>
                </div>
                <button
                  type="button"
                  onClick={openCompetencyReference}
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-900"
                >
                  Review standards
                </button>
              </div>
              <p className="mt-3 text-sm text-slate-700">{guidance.intent}</p>
              <p className="mt-2 text-sm text-slate-500">
                Detailed training guidance, source standards, and AP/CP expectations live on the reference page.
              </p>
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Reference page</div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-950">Review source standards and scoring guides when you need them</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-700">
              Open the reference library for source documents, level guidance, AP designation rules, CP rotation standards, and sign-out scoring details.
            </p>
          </div>
          <button
            type="button"
            onClick={openCompetencyReference}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-900"
          >
            Open reference page
          </button>
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
                placeholder="Topic, rotation, or domain"
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
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sign-out scoring</div>
            <h2 className="mt-2 text-lg font-semibold text-slate-950">{signOutRubric.title}</h2>
            <p className="mt-2 text-sm text-slate-600">These checkpoints show what has to be present for a safe, attending-style sign-out.</p>
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
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filtered topics</div>
              <div className="mt-1 text-sm text-slate-700">
                {filteredRecords.length} topics • {availableCount} ready now • {gapCount} still being built
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
                    {statusLabel[selectedRecord.trust.editorialStatus]}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Milestone</div>
                    <p className="mt-2 text-sm text-slate-800">{selectedRecord.milestoneOutcome}</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Best next step</div>
                    <p className="mt-2 text-sm text-slate-800">{selectedRecord.closureAction}</p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Focus areas</div>
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
                    Source and review
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
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reference trail</dt>
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
                    Open linked lesson
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
