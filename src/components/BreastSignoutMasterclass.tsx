import React, { useMemo, useState } from 'react';
import { ArrowLeft, ClipboardList, Eye, FileText, Microscope, Stethoscope } from 'lucide-react';
import { Section } from '../types.ts';
import DidacticWorkspaceNav from './DidacticWorkspaceNav.tsx';
import SectionHeader from './ui/SectionHeader.tsx';
import curriculumData from '../content/breast/breast_signout_curriculum.enhanced.json';
import acquiredAssetData from '../content/breast/breast_signout_acquired_assets.json';

interface BreastSignoutMasterclassProps {
  onSectionChange: (section: Section) => void;
  embedded?: boolean;
}

interface VisualRequirement {
  slot: string;
  requiredRole: string;
  requiredCaptionElements?: string[];
}

interface DiagnosticStep {
  step: number;
  prompt: string;
  expectedObservation: string;
}

interface BreastCase {
  id: string;
  title: string;
  caseTrack?: string;
  specimenType?: string;
  diagnosticTask: string;
  grossScenario?: string;
  capProtocol?: {
    protocol: string;
    versionAnchor?: string;
    requiredFieldGroups?: Array<{
      group: string;
      fields: string[];
    }>;
    stagingNotes?: string;
  };
  treatmentResponse?: {
    context: string;
    requiredAssessments: string[];
    teachingNote?: string;
  };
  lymphNodeWorkup?: {
    submitted: string;
    requiredCounts: string[];
    nodalResponse?: string;
    stagingFocus?: string;
  };
  reconstructionImplant?: {
    scenario: string;
    pathologyTasks: string[];
    implantCapsuleTasks: string[];
    reportingBoundary?: string;
  };
  synopticChecklist?: Array<{
    group: string;
    items: string[];
  }>;
  visualEvidenceRequirements: VisualRequirement[];
  diagnosticSteps: DiagnosticStep[];
  reportingTarget: string;
  pitfalls?: string[];
}

interface AcquiredAsset {
  id: string;
  sourceId: string;
  caseId: string;
  entityId: string;
  role: string;
  stain?: string;
  markerOrStudy?: string;
  magnification?: string;
  caption: string;
  localPath: string;
  sourceUrl?: string;
  license?: string;
}

const curriculum = curriculumData as { cases: BreastCase[]; entityCoverage: string[] };
const acquiredAssets = (acquiredAssetData as { assets: AcquiredAsset[] }).assets ?? [];

const assetUrl = (asset: AcquiredAsset) => `${import.meta.env.BASE_URL}${asset.localPath}`;

const trackLabels: Record<string, string> = {
  'resection-synoptic': 'Resection synoptic',
  'neoadjuvant-resection': 'Post-neoadjuvant',
  'implant-reconstruction': 'Implant / reconstruction',
};

const BreastSignoutMasterclass: React.FC<BreastSignoutMasterclassProps> = ({ onSectionChange, embedded = false }) => {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'evidence' | 'reasoning' | 'report' | 'checklist'>('reasoning');
  const [revealedStepCount, setRevealedStepCount] = useState(0);
  const [showReport, setShowReport] = useState(false);

  const selectedCase = selectedCaseId ? curriculum.cases.find((item) => item.id === selectedCaseId) : undefined;
  const caseAssets = useMemo(
    () => (selectedCase ? acquiredAssets.filter((asset) => asset.caseId === selectedCase.id) : []),
    [selectedCase]
  );
  const primaryAsset = caseAssets[0];

  const openCase = (caseId: string) => {
    setSelectedCaseId(caseId);
    setActivePanel('reasoning');
    setRevealedStepCount(0);
    setShowReport(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const returnToCaseDirectory = () => {
    setSelectedCaseId(null);
    setActivePanel('reasoning');
    setRevealedStepCount(0);
    setShowReport(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const releaseReadyCases = curriculum.cases.filter((item) => acquiredAssets.some((asset) => asset.caseId === item.id)).length;
  const selectedTrackLabel = selectedCase?.caseTrack ? trackLabels[selectedCase.caseTrack] ?? selectedCase.caseTrack : 'Core sign-out';

  return (
    <div className="animate-fade-in space-y-6" data-testid="breast-signout-masterclass">
      {!embedded && (
        <>
          <SectionHeader
            title="Breast Sign-Out Masterclass"
            subtitle="Image-first diagnostic reasoning and report construction for breast pathology."
            icon={<Microscope className="h-10 w-10" />}
          />

          <DidacticWorkspaceNav activeSection={Section.BREAST_SIGNOUT_MASTERCLASS} onSectionChange={onSectionChange} />
        </>
      )}

      {!selectedCase ? (
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" data-testid="breast-case-directory-page">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cases</div>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-slate-950">Breast Pathology Cases</h2>
              <div className="mt-1 text-sm text-slate-700">{releaseReadyCases} with local visual evidence</div>
            </div>
            <div className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
              {curriculum.cases.length}
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {curriculum.cases.map((item) => {
              const hasAsset = acquiredAssets.some((asset) => asset.caseId === item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openCase(item.id)}
                  data-testid={`case-button-${item.id}`}
                  className="w-full rounded-md border border-slate-200 bg-white px-4 py-4 text-left text-slate-700 transition hover:border-sky-300 hover:shadow-sm"
                >
                  <div className="text-sm font-semibold leading-snug">{item.title}</div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.caseTrack ? `${trackLabels[item.caseTrack] ?? item.caseTrack} • ` : ''}
                    {hasAsset ? 'Local image available' : 'Image source required'}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      ) : (
        <section className="space-y-4" data-testid="breast-case-page">
          <button
            type="button"
            onClick={returnToCaseDirectory}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Breast cases
          </button>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Image-first case</div>
                  <h2 className="mt-1 text-2xl font-semibold font-serif text-slate-950">{selectedCase.title}</h2>
                  <p className="mt-2 max-w-3xl text-sm text-slate-700">{selectedCase.diagnosticTask}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-md bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-800">{selectedTrackLabel}</span>
                    {selectedCase.specimenType && (
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">{selectedCase.specimenType}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700">
                  <Stethoscope className="h-4 w-4" />
                  Clinical sign-out
                </div>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
              <div className="bg-slate-950 p-4" data-testid={`image-stage-${selectedCase.id}`}>
                {primaryAsset ? (
                  <figure>
                    <img
                      src={assetUrl(primaryAsset)}
                      alt={primaryAsset.caption}
                      className="h-[58vh] min-h-[420px] w-full rounded-md object-contain"
                    />
                    <figcaption className="mt-3 text-sm text-slate-200">
                      {primaryAsset.caption}
                      {primaryAsset.stain && <span className="ml-2 font-semibold text-white">{primaryAsset.stain}</span>}
                    </figcaption>
                  </figure>
                ) : (
                  <div className="flex h-[58vh] min-h-[420px] items-center justify-center rounded-md border border-slate-700 text-center text-slate-300">
                    <div>
                      <Eye className="mx-auto h-8 w-8" />
                      <p className="mt-3 text-sm font-semibold">Required visual evidence has not been acquired for this case.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
                  {[
                    ['evidence', 'Evidence'],
                    ['reasoning', 'Reasoning'],
                    ['report', 'Report'],
                    ['checklist', 'Checklist'],
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

                {activePanel === 'evidence' && (
                <div className="mt-4">
                  {selectedCase.grossScenario && (
                    <div className="mb-4 rounded-md border border-slate-200 bg-slate-50 p-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Specimen Scenario</h3>
                      <p className="mt-2 text-sm text-slate-700">{selectedCase.grossScenario}</p>
                    </div>
                  )}
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Visual Evidence</h3>
                  <div className="mt-3 space-y-2">
                    {caseAssets.map((asset) => (
                      <a
                        key={asset.id}
                        href={asset.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-slate-300"
                      >
                        <span className="font-semibold text-slate-900">{asset.role}</span>
                        <span className="block text-xs text-slate-500">{asset.entityId}</span>
                      </a>
                    ))}
                    {caseAssets.length === 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        Acquire an H&E or ancillary image before release.
                      </div>
                    )}
                  </div>
                </div>
                )}

                {activePanel === 'reasoning' && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Observation Sequence</h3>
                  <div className="mt-3 space-y-3" data-testid={`observation-sequence-${selectedCase.id}`}>
                    {selectedCase.diagnosticSteps.map((step, index) => {
                      const isVisible = index < revealedStepCount;
                      return (
                        <div key={step.step} className="rounded-md border border-slate-200 p-3">
                          <div className="text-sm font-semibold text-slate-900">{step.prompt}</div>
                          {isVisible && <p className="mt-2 text-sm text-slate-700">{step.expectedObservation}</p>}
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setRevealedStepCount((value) => Math.min(value + 1, selectedCase.diagnosticSteps.length))}
                      data-testid="reveal-next-step"
                      className="rounded-md bg-sky-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-800"
                    >
                      Reveal Next Step
                    </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRevealedStepCount(0);
                            setShowReport(false);
                            setActivePanel('reasoning');
                      }}
                      data-testid="reset-case"
                      className="rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300"
                    >
                      Reset
                    </button>
                  </div>
                </div>
                )}

                {activePanel === 'report' && (
                  <div className="mt-4" data-testid={`report-panel-${selectedCase.id}`}>
                    <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                      <FileText className="h-4 w-4" />
                      Report Language
                    </div>
                    {showReport ? (
                      <p className="mt-3 text-base font-semibold text-slate-950">{selectedCase.reportingTarget}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowReport(true)}
                        data-testid="reveal-final-diagnosis"
                        className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                      >
                        Reveal Final Diagnosis
                      </button>
                    )}
                  </div>
                )}

                {activePanel === 'checklist' && (
                  <div className="mt-4 space-y-4">
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pitfalls</h3>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {(selectedCase.pitfalls ?? []).map((pitfall) => (
                          <li key={pitfall}>• {pitfall}</li>
                        ))}
                      </ul>
                    </div>

                    {(selectedCase.capProtocol || selectedCase.synopticChecklist) && (
                      <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
                          <ClipboardList className="h-4 w-4" />
                          Synoptic Field Practice
                        </div>
                        {selectedCase.capProtocol && (
                          <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
                            <div className="text-sm font-semibold text-slate-950">{selectedCase.capProtocol.protocol}</div>
                            {selectedCase.capProtocol.versionAnchor && (
                              <p className="mt-1 text-xs text-slate-600">{selectedCase.capProtocol.versionAnchor}</p>
                            )}
                            {selectedCase.capProtocol.stagingNotes && (
                              <p className="mt-2 text-sm text-slate-700">{selectedCase.capProtocol.stagingNotes}</p>
                            )}
                          </div>
                        )}
                        <div className="mt-4 grid gap-3">
                          {(selectedCase.capProtocol?.requiredFieldGroups ?? []).map((group) => (
                            <div key={group.group} className="rounded-md border border-slate-200 p-3">
                              <h3 className="text-sm font-semibold text-slate-950">{group.group}</h3>
                              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                {group.fields.map((field) => (
                                  <li key={field}>• {field}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                          {(selectedCase.synopticChecklist ?? []).map((group) => (
                            <div key={group.group} className="rounded-md border border-slate-200 p-3">
                              <h3 className="text-sm font-semibold text-slate-950">{group.group}</h3>
                              <ul className="mt-2 space-y-1 text-sm text-slate-700">
                                {group.items.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedCase.treatmentResponse || selectedCase.lymphNodeWorkup || selectedCase.reconstructionImplant) && (
                      <div className="grid gap-4">
                        {selectedCase.treatmentResponse && (
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Treatment Response</h3>
                            <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCase.treatmentResponse.context}</p>
                            {selectedCase.treatmentResponse.teachingNote && (
                              <p className="mt-2 text-sm text-slate-700">{selectedCase.treatmentResponse.teachingNote}</p>
                            )}
                            <ul className="mt-3 space-y-1 text-sm text-slate-700">
                              {selectedCase.treatmentResponse.requiredAssessments.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedCase.lymphNodeWorkup && (
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Lymph Nodes</h3>
                            <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCase.lymphNodeWorkup.submitted}</p>
                            {selectedCase.lymphNodeWorkup.nodalResponse && (
                              <p className="mt-2 text-sm text-slate-700">{selectedCase.lymphNodeWorkup.nodalResponse}</p>
                            )}
                            {selectedCase.lymphNodeWorkup.stagingFocus && (
                              <p className="mt-2 text-sm text-slate-700">{selectedCase.lymphNodeWorkup.stagingFocus}</p>
                            )}
                            <ul className="mt-3 space-y-1 text-sm text-slate-700">
                              {selectedCase.lymphNodeWorkup.requiredCounts.map((item) => (
                                <li key={item}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {selectedCase.reconstructionImplant && (
                          <div className="rounded-lg border border-slate-200 bg-white p-4">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Implant / Reconstruction</h3>
                            <p className="mt-2 text-sm font-semibold text-slate-950">{selectedCase.reconstructionImplant.scenario}</p>
                            {selectedCase.reconstructionImplant.reportingBoundary && (
                              <p className="mt-2 text-sm text-slate-700">{selectedCase.reconstructionImplant.reportingBoundary}</p>
                            )}
                            <div className="mt-3 text-sm text-slate-700">
                              <div className="font-semibold text-slate-900">Pathology tasks</div>
                              <ul className="mt-1 space-y-1">
                                {selectedCase.reconstructionImplant.pathologyTasks.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                              <div className="mt-3 font-semibold text-slate-900">Capsule tasks</div>
                              <ul className="mt-1 space-y-1">
                                {selectedCase.reconstructionImplant.implantCapsuleTasks.map((item) => (
                                  <li key={item}>• {item}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default BreastSignoutMasterclass;
