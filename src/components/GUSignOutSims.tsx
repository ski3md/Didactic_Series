import React, { useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ClipboardList, FileText, Microscope, RotateCcw } from 'lucide-react';
import { LearnerLevel, Section } from '../types.ts';
import guSignoutData from '../content/gu/gu_signout_sims.json';
import BreastSignoutMasterclass from './BreastSignoutMasterclass.tsx';
import breastCurriculumData from '../content/breast/breast_signout_curriculum.enhanced.json';
import breastAssetData from '../content/breast/breast_signout_acquired_assets.json';
import { learnerLevelLabels, signOutRubric } from '../content/competency/competencyMatrix.ts';

type Workflow = 'biopsy' | 'resection' | 'gross-only';

interface GuAncillaryOption {
  id: string;
  name: string;
  result: string;
  recommended: boolean;
}

interface GuSignoutCase {
  id: string;
  title: string;
  site: string;
  workflow: Workflow;
  specimenType: string;
  clinicalHistory: string;
  image: {
    src: string;
    caption: string;
    stain: string;
    sourceUrl: string;
  };
  diagnosticSteps: string[];
  ancillaryOptions: GuAncillaryOption[];
  synopticChecklist?: string[];
  grossOnlyChecklist?: string[];
  reportingTarget: string;
  requiredReportElements: string[];
  pitfalls: string[];
}

interface SignoutCurriculum {
  version: string;
  title: string;
  specialty?: string;
  cases: GuSignoutCase[];
}

const specialtySlugFromPath = (filePath: string) =>
  filePath
    .split('/')
    .pop()
    ?.replace(/_signout_sims\.json$/, '')
    .replace(/_/g, '-') ?? 'specialty';

const discoveredCurricula = import.meta.glob('../content/signout_sims/*_signout_sims.json', {
  eager: true,
}) as Record<string, { default: SignoutCurriculum }>;

const curricula = [
  { slug: 'genitourinary', ...(guSignoutData as SignoutCurriculum) },
  ...Object.entries(discoveredCurricula).map(([filePath, module]) => ({
    slug: specialtySlugFromPath(filePath),
    ...module.default,
  })),
].filter((item) => Array.isArray(item.cases) && item.cases.length > 0);

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9+]+/g, ' ').trim();

const imageUrl = (src: string) => `${import.meta.env.BASE_URL}${src}`;

const workflowLabel: Record<Workflow, string> = {
  biopsy: 'Biopsy',
  resection: 'Resection',
  'gross-only': 'Gross / benign specimen',
};

const caseLearnerLevels = (workflow: Workflow): LearnerLevel[] => {
  if (workflow === 'gross-only') {
    return ['PGY1', 'PGY2'];
  }
  if (workflow === 'biopsy') {
    return ['PGY2', 'PGY3'];
  }
  return ['PGY3', 'PGY4', 'PGY5_FELLOW'];
};

const specialtyLabel = (title: string) =>
  title
    .replace(/ pathology sign-out simulations/i, '')
    .replace(/ sign-out simulations/i, '')
    .replace(/^GI$/, 'GI Pathology')
    .replace(/^GU$/, 'GU Pathology');

const breastCurriculum = breastCurriculumData as { cases?: Array<{ id: string }> };
const breastAssets = breastAssetData as { assets?: Array<{ caseId: string }> };
const breastReadyCases = new Set((breastAssets.assets ?? []).map((asset) => asset.caseId)).size;

interface SpecialtySignOutSimsProps {
  onSectionChange?: (section: Section) => void;
}

const GUSignOutSims: React.FC<SpecialtySignOutSimsProps> = ({ onSectionChange }) => {
  const [selectedSpecialtySlug, setSelectedSpecialtySlug] = useState<string | null>(null);
  const activeCurriculum = selectedSpecialtySlug
    ? curricula.find((item) => item.slug === selectedSpecialtySlug) ?? curricula[0]
    : curricula[0];
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'reasoning' | 'report' | 'pitfalls'>('reasoning');
  const [selectedLearnerLevel, setSelectedLearnerLevel] = useState<LearnerLevel>('PGY3');
  const [revealedStepCount, setRevealedStepCount] = useState(0);
  const [selectedAncillaries, setSelectedAncillaries] = useState<string[]>([]);
  const [reportText, setReportText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedCase = selectedCaseId ? activeCurriculum?.cases.find((item) => item.id === selectedCaseId) : undefined;

  const recommendedAncillaries = useMemo(
    () => selectedCase?.ancillaryOptions.filter((item) => item.recommended).map((item) => item.id) ?? [],
    [selectedCase]
  );

  const reportAssessment = useMemo(() => {
    if (!selectedCase) {
      return { present: [], missing: [] };
    }
    const normalizedReport = normalize(reportText);
    const present = selectedCase.requiredReportElements.filter((item) => normalizedReport.includes(normalize(item)));
    const missing = selectedCase.requiredReportElements.filter((item) => !normalizedReport.includes(normalize(item)));
    return { present, missing };
  }, [reportText, selectedCase]);

  const ancillaryAssessment = useMemo(() => {
    const selected = new Set(selectedAncillaries);
    const recommended = new Set(recommendedAncillaries);
    return {
      correct: selectedAncillaries.filter((item) => recommended.has(item)),
      omitted: recommendedAncillaries.filter((item) => !selected.has(item)),
      extra: selectedAncillaries.filter((item) => !recommended.has(item)),
    };
  }, [recommendedAncillaries, selectedAncillaries]);

  const rubricAssessment = useMemo(() => {
    if (!selectedCase || !submitted) {
      return [];
    }
    const normalizedReport = normalize(reportText);
    return signOutRubric.criteria
      .filter((criterion) => criterion.learnerLevels.includes(selectedLearnerLevel))
      .map((criterion) => {
        let score = 0;
        if (criterion.id === 'diagnostic-accuracy') {
          score = normalizedReport.includes(normalize(selectedCase.reportingTarget)) || reportAssessment.present.length > 0 ? 3 : 1;
        } else if (criterion.id === 'report-completeness') {
          score = selectedCase.requiredReportElements.length === 0
            ? criterion.maxScore
            : Math.round((reportAssessment.present.length / selectedCase.requiredReportElements.length) * criterion.maxScore);
        } else if (criterion.id === 'ancillary-appropriateness') {
          score = recommendedAncillaries.length === 0
            ? criterion.maxScore
            : Math.max(0, criterion.maxScore - ancillaryAssessment.omitted.length - Math.min(1, ancillaryAssessment.extra.length));
        } else if (criterion.id === 'staging-synoptic') {
          const checklist = selectedCase.synopticChecklist ?? selectedCase.grossOnlyChecklist ?? [];
          score = checklist.length === 0
            ? criterion.maxScore
            : checklist.some((item) => normalizedReport.includes(normalize(item))) || reportAssessment.missing.length === 0
              ? criterion.passingScore
              : 1;
        } else if (criterion.id === 'safety-critical-misses') {
          score = reportAssessment.missing.length === 0 && ancillaryAssessment.omitted.length === 0 ? criterion.maxScore : 1;
        }
        const boundedScore = Math.min(criterion.maxScore, Math.max(0, score));
        return {
          criterion,
          score: boundedScore,
          passed: boundedScore >= criterion.passingScore,
        };
      });
  }, [
    ancillaryAssessment.extra.length,
    ancillaryAssessment.omitted.length,
    recommendedAncillaries.length,
    reportAssessment.missing.length,
    reportAssessment.present.length,
    reportText,
    selectedCase,
    selectedLearnerLevel,
    submitted,
  ]);

  const openCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActivePanel('reasoning');
    setRevealedStepCount(0);
    setSelectedAncillaries([]);
    setReportText('');
    setSubmitted(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const selectSpecialty = (slug: string) => {
    if (slug === 'breast') {
      setSelectedSpecialtySlug('breast');
      setSelectedCaseId(null);
      setActivePanel('reasoning');
      return;
    }
    const nextCurriculum = curricula.find((item) => item.slug === slug) ?? curricula[0];
    setSelectedSpecialtySlug(nextCurriculum.slug);
    setSelectedCaseId(null);
    setActivePanel('reasoning');
    setRevealedStepCount(0);
    setSelectedAncillaries([]);
    setReportText('');
    setSubmitted(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const backToDirectory = () => {
    setSelectedSpecialtySlug(null);
    setSelectedCaseId(null);
    setActivePanel('reasoning');
  };

  const backToCaseDirectory = () => {
    setSelectedCaseId(null);
    setActivePanel('reasoning');
    setRevealedStepCount(0);
    setSelectedAncillaries([]);
    setReportText('');
    setSubmitted(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const toggleAncillary = (id: string) => {
    setSelectedAncillaries((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  const revealAllSteps = selectedCase ? revealedStepCount >= selectedCase.diagnosticSteps.length : false;

  if (selectedSpecialtySlug === 'breast') {
    return (
      <div className="space-y-4" data-testid="specialty-signout-sims">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={backToDirectory}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Subspecialties
          </button>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Subspecialty Page</div>
            <h2 className="font-serif text-2xl font-semibold text-slate-950">Breast Pathology</h2>
          </div>
        </div>
        <BreastSignoutMasterclass onSectionChange={onSectionChange ?? (() => undefined)} embedded />
      </div>
    );
  }

  if (!selectedSpecialtySlug) {
    return (
      <div className="space-y-5" data-testid="specialty-signout-sims">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Subspecialty Directory</div>
          <h2 className="mt-1 font-serif text-3xl font-semibold text-slate-950">Choose a Sign-Out Subspecialty</h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-700">
            Each subspecialty opens as its own page with a dedicated case list and image-first workspace.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(['PGY2', 'PGY3', 'PGY4', 'PGY5_FELLOW'] as LearnerLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setSelectedLearnerLevel(level)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  selectedLearnerLevel === level
                    ? 'border-sky-300 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {learnerLevelLabels[level]}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            onClick={() => selectSpecialty('breast')}
            className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md"
            data-testid="specialty-page-link-breast"
          >
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Open Page</div>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-slate-950">Breast Pathology</h3>
            <p className="mt-2 text-sm text-slate-700">{breastCurriculum.cases?.length ?? 0} image-first cases</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                CAP synoptics
              </span>
              <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {breastReadyCases} local-image cases
              </span>
            </div>
          </button>
          {curricula.map((item) => {
            const workflowCounts = item.cases.reduce(
              (acc, signoutCase) => {
                acc[signoutCase.workflow] += 1;
                return acc;
              },
              { biopsy: 0, resection: 0, 'gross-only': 0 } as Record<Workflow, number>
            );
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => selectSpecialty(item.slug)}
                className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-sky-300 hover:shadow-md"
                data-testid={`specialty-page-link-${item.slug}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Open Page</div>
                <h3 className="mt-3 font-serif text-2xl font-semibold text-slate-950">{specialtyLabel(item.title)}</h3>
                <p className="mt-2 text-sm text-slate-700">{item.cases.length} image-first cases</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {workflowCounts.biopsy} biopsy
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {workflowCounts.resection} resection
                  </span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    {workflowCounts['gross-only']} gross-only
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (!selectedCase) {
    return (
      <div className="space-y-4" data-testid="specialty-case-directory-page">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={backToDirectory}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Subspecialties
          </button>
          <div className="text-right">
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Subspecialty Page</div>
            <h2 className="font-serif text-2xl font-semibold text-slate-950">{specialtyLabel(activeCurriculum.title)}</h2>
          </div>
        </div>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cases</div>
              <h3 className="mt-1 font-serif text-2xl font-semibold text-slate-950">Choose a Case</h3>
              <p className="mt-1 text-sm text-slate-700">{activeCurriculum.cases.length} image-backed cases</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {activeCurriculum.cases.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => openCase(item.id)}
                data-testid={`gu-case-button-${item.id}`}
                className="w-full rounded-md border border-slate-200 bg-white px-4 py-4 text-left text-slate-700 transition hover:border-sky-300 hover:shadow-sm"
              >
                <span className="block text-sm font-semibold leading-snug text-slate-950">{item.title}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.site} • {workflowLabel[item.workflow]}
                </span>
                <span className="mt-3 flex flex-wrap gap-1.5">
                  {caseLearnerLevels(item.workflow).map((level) => (
                    <span key={level} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {learnerLevelLabels[level]}
                    </span>
                  ))}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="specialty-signout-sims">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={backToDirectory}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Subspecialties
          </button>
          <button
            type="button"
            onClick={backToCaseDirectory}
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            Cases
          </button>
        </div>
        <div className="text-right">
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Subspecialty Page</div>
          <h2 className="font-serif text-2xl font-semibold text-slate-950">{specialtyLabel(activeCurriculum.title)}</h2>
        </div>
      </div>
      <div>
        <section className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                    {selectedCase.site} • {workflowLabel[selectedCase.workflow]}
                  </div>
                  <h2 className="mt-1 font-serif text-2xl font-semibold text-slate-950">{selectedCase.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-700">{selectedCase.clinicalHistory}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {caseLearnerLevels(selectedCase.workflow).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setSelectedLearnerLevel(level)}
                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                          selectedLearnerLevel === level
                            ? 'border-sky-300 bg-sky-50 text-sky-800'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {learnerLevelLabels[level]}
                      </button>
                    ))}
                  </div>
                </div>
                <span className="rounded-md bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
                  {selectedCase.specimenType}
                </span>
              </div>
            </div>

            <div className="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
              <div className="bg-slate-950 p-4" data-testid={`gu-image-stage-${selectedCase.id}`}>
                <figure>
                  <img
                    src={imageUrl(selectedCase.image.src)}
                    alt={selectedCase.image.caption}
                    className="h-[calc(100vh-330px)] min-h-[360px] w-full rounded-md object-contain"
                  />
                  <figcaption className="mt-3 text-sm text-slate-200">
                    {selectedCase.image.caption}
                    <span className="ml-2 font-semibold text-white">{selectedCase.image.stain}</span>
                  </figcaption>
                </figure>
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                  {[
                    ['reasoning', 'Reasoning'],
                    ['report', 'Report'],
                    ['pitfalls', 'Checklist'],
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActivePanel(id as typeof activePanel)}
                      className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                        activePanel === id
                          ? 'border-sky-300 bg-sky-50 text-sky-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {activePanel === 'reasoning' && (
                  <div className="mt-4 space-y-5 xl:max-h-[calc(100vh-390px)] xl:overflow-y-auto xl:pr-1">
                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <Microscope className="h-4 w-4" />
                        Diagnostic Sequence
                      </div>
                      <div className="mt-3 space-y-3" data-testid={`gu-observation-sequence-${selectedCase.id}`}>
                        {selectedCase.diagnosticSteps.map((step, index) => {
                          const isVisible = index < revealedStepCount;
                          return (
                            <div key={step} className="rounded-md border border-slate-200 p-3">
                              <div className="text-sm font-semibold text-slate-900">Step {index + 1}</div>
                              {isVisible ? (
                                <p className="mt-2 text-sm text-slate-700">{step}</p>
                              ) : (
                                <p className="mt-2 text-sm text-slate-400">Observe the slide before revealing this reasoning step.</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setRevealedStepCount((value) => Math.min(value + 1, selectedCase.diagnosticSteps.length))}
                          disabled={revealAllSteps}
                          data-testid="gu-reveal-next-step"
                          className="rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:bg-slate-300"
                        >
                          Reveal Next Step
                        </button>
                        <button
                          type="button"
                          onClick={() => openCase(selectedCase.id)}
                          data-testid="gu-reset-case"
                          className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                        >
                          <RotateCcw className="h-4 w-4" />
                          Reset
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        <ClipboardList className="h-4 w-4" />
                        Ancillary Decisions
                      </div>
                      <div className="mt-3 space-y-2">
                        {selectedCase.ancillaryOptions.map((item) => (
                          <label
                            key={item.id}
                            className={`block rounded-md border px-3 py-2 text-sm transition ${
                              selectedAncillaries.includes(item.id) ? 'border-sky-300 bg-sky-50' : 'border-slate-200 bg-white'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={selectedAncillaries.includes(item.id)}
                                onChange={() => toggleAncillary(item.id)}
                                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700"
                              />
                              <span className="font-semibold text-slate-900">{item.name}</span>
                            </span>
                            {submitted && <span className="mt-2 block text-slate-700">{item.result}</span>}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activePanel === 'report' && (
                  <div className="mt-4" data-testid={`gu-report-panel-${selectedCase.id}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <FileText className="h-4 w-4" />
                      Draft Sign-Out
                    </div>
                    <textarea
                      value={reportText}
                      onChange={(event) => {
                        setReportText(event.target.value);
                        setSubmitted(false);
                      }}
                      rows={8}
                      className="mt-3 w-full rounded-md border border-slate-300 p-3 text-sm text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200"
                      placeholder="Final diagnosis, key qualifiers, margins/stage or adequacy statement..."
                    />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSubmitted(true)}
                        disabled={!reportText.trim()}
                        data-testid="gu-submit-report"
                        className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:bg-slate-300"
                      >
                        Submit Sign-Out
                      </button>
                      {submitted && (
                        <a
                          href={selectedCase.image.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                        >
                          Image Source
                        </a>
                      )}
                    </div>

                    {submitted && (
                      <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                          <CheckCircle2 className="h-4 w-4 text-teal-600" />
                          Attending Feedback
                        </div>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">Present in report</h3>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700">
                              {reportAssessment.present.length > 0 ? (
                                reportAssessment.present.map((item) => <li key={item}>• {item}</li>)
                              ) : (
                                <li>No required elements detected.</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-900">Needs correction</h3>
                            <ul className="mt-2 space-y-1 text-sm text-slate-700">
                              {reportAssessment.missing.length > 0 ? (
                                reportAssessment.missing.map((item) => <li key={item}>• {item}</li>)
                              ) : (
                                <li>All required report elements were detected.</li>
                              )}
                            </ul>
                          </div>
                        </div>
                        <div className="mt-4">
                          <h3 className="text-sm font-semibold text-slate-900">Expected sign-out language</h3>
                          <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCase.reportingTarget}</p>
                        </div>
                        {rubricAssessment.length > 0 && (
                          <div className="mt-4 border-t border-slate-200 pt-4">
                            <h3 className="text-sm font-semibold text-slate-900">
                              {learnerLevelLabels[selectedLearnerLevel]} rubric
                            </h3>
                            <div className="mt-3 grid gap-2">
                              {rubricAssessment.map(({ criterion, score, passed }) => (
                                <div key={criterion.id} className="rounded-md bg-white px-3 py-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="text-sm font-semibold text-slate-900">{criterion.label}</span>
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${passed ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                                      {score}/{criterion.maxScore}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-xs text-slate-600">{criterion.feedbackPrompt}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activePanel === 'pitfalls' && (
                  <div className="mt-4 grid gap-4">
                    {(selectedCase.synopticChecklist || selectedCase.grossOnlyChecklist) && (
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                          {selectedCase.workflow === 'gross-only' ? 'Gross Checklist' : 'Synoptic Fields'}
                        </h3>
                        <ul className="mt-3 space-y-2 text-sm text-slate-700">
                          {(selectedCase.synopticChecklist ?? selectedCase.grossOnlyChecklist ?? []).map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pitfalls</h3>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {selectedCase.pitfalls.map((item) => (
                          <li key={item}>• {item}</li>
                        ))}
                      </ul>
                    </div>

                    {submitted && (
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Ancillary Review</h3>
                        <p className="mt-3 text-sm text-slate-700">
                          Recommended selected: {ancillaryAssessment.correct.length} / {recommendedAncillaries.length}
                        </p>
                        {ancillaryAssessment.omitted.length > 0 && (
                          <p className="mt-2 text-sm text-amber-800">Omitted: {ancillaryAssessment.omitted.join(', ')}</p>
                        )}
                        {ancillaryAssessment.extra.length > 0 && (
                          <p className="mt-2 text-sm text-slate-600">Extra studies selected: {ancillaryAssessment.extra.join(', ')}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default GUSignOutSims;
