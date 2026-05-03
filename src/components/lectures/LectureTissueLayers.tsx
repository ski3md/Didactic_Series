import React, { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card.tsx';
import WSIViewer from '../WSIViewer.tsx';
import { LectureTissueLayerSet } from '../../types.ts';
import { resolveAcquiredImageUrl } from '../../utils/acquiredImageCatalog.ts';

interface LectureTissueLayersProps {
  layerSets: LectureTissueLayerSet[];
  focusMode: boolean;
  initialLayerSetId?: string;
  onComplete?: (layerSetId: string) => void;
}

const LectureTissueLayers: React.FC<LectureTissueLayersProps> = ({
  layerSets,
  focusMode,
  initialLayerSetId,
  onComplete,
}) => {
  const [selectedSetId, setSelectedSetId] = useState(initialLayerSetId || layerSets[0]?.id || '');
  const [showLabels, setShowLabels] = useState(true);
  const [showWhatToNotice, setShowWhatToNotice] = useState(true);
  const [showPitfalls, setShowPitfalls] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showWsi, setShowWsi] = useState(false);

  useEffect(() => {
    if (initialLayerSetId) {
      setSelectedSetId(initialLayerSetId);
    }
  }, [initialLayerSetId]);

  useEffect(() => {
    setStepIndex(0);
    setShowWsi(false);
  }, [selectedSetId]);

  const selectedSet = layerSets.find((set) => set.id === selectedSetId) ?? layerSets[0];
  const teachingSteps = selectedSet?.optionalWsi?.teachingSteps ?? [];
  const currentStep = teachingSteps[stepIndex];

  useEffect(() => {
    if (selectedSet && onComplete) {
      onComplete(selectedSet.id);
    }
  }, [onComplete, selectedSet]);

  const stepCountLabel = useMemo(() => {
    if (!teachingSteps.length) {
      return null;
    }
    return `Field ${stepIndex + 1} of ${teachingSteps.length}`;
  }, [stepIndex, teachingSteps.length]);

  if (!selectedSet) {
    return (
      <Card>
        <p className="text-sm text-slate-600">No lecture-linked tissue layers are attached yet.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Microscopic images</div>
            <h3 className="mt-1 text-2xl font-semibold font-serif text-slate-900">{selectedSet.title}</h3>
            <p className="mt-2 text-sm text-slate-700">{selectedSet.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {layerSets.map((set) => (
              <button
                key={set.id}
                type="button"
                onClick={() => setSelectedSetId(set.id)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  set.id === selectedSet.id
                    ? 'border-sky-400 bg-sky-50 text-sky-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {set.title}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setShowLabels((current) => !current)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              showLabels ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {showLabels ? 'Hide labels' : 'Show labels'}
          </button>
          <button
            type="button"
            onClick={() => setShowWhatToNotice((current) => !current)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              showWhatToNotice ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {showWhatToNotice ? 'Hide what to notice' : 'Show what to notice'}
          </button>
          <button
            type="button"
            onClick={() => setShowPitfalls((current) => !current)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              showPitfalls ? 'border-amber-400 bg-amber-50 text-amber-800' : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {showPitfalls ? 'Hide pitfalls' : 'Show pitfalls'}
          </button>
          {selectedSet.optionalWsi && (
            <button
              type="button"
              onClick={() => setShowWsi((current) => !current)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                showWsi ? 'border-sky-400 bg-sky-50 text-sky-800' : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              {showWsi ? 'Hide zoomable slide' : 'Open zoomable slide'}
            </button>
          )}
        </div>
      </div>

      {showWsi && selectedSet.optionalWsi && (
        <Card>
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Zoomable slide</div>
              <h4 className="mt-1 text-xl font-semibold font-serif text-slate-900">{selectedSet.optionalWsi.title}</h4>
              <p className="mt-2 text-sm text-slate-700">{selectedSet.optionalWsi.description}</p>
            </div>
            <WSIViewer
              dziUrl={selectedSet.optionalWsi.dziUrl}
              staticImageUrl={resolveAcquiredImageUrl(selectedSet.optionalWsi.staticImageUrl)}
              altText={selectedSet.optionalWsi.title}
            />
            {teachingSteps.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Slide review</div>
                    {stepCountLabel && <div className="mt-1 text-sm font-semibold text-slate-900">{stepCountLabel}</div>}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={stepIndex === 0}
                      onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={stepIndex >= teachingSteps.length - 1}
                      onClick={() => setStepIndex((current) => Math.min(teachingSteps.length - 1, current + 1))}
                      className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-700">{currentStep}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <div className={`grid gap-5 ${focusMode ? 'grid-cols-1' : 'xl:grid-cols-2'}`}>
        {selectedSet.images.map((image) => (
          <Card key={image.id}>
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <img
                  src={resolveAcquiredImageUrl(image.imageUrl)}
                  alt={`${image.title} ${image.viewLabel}`.trim()}
                  loading="lazy"
                  className="h-80 w-full object-contain bg-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
                {showLabels && <span className="text-sky-700">{image.label}</span>}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                  {image.viewLabel}
                </span>
                {image.stain && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] tracking-normal text-slate-600">
                    {image.stain}
                  </span>
                )}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-slate-900">{image.title}</h4>
                <p className="mt-1 text-sm text-slate-700">{image.description}</p>
              </div>
              {showWhatToNotice && (
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">What to notice</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {image.whatToNotice.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {showPitfalls && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pitfall layer</div>
                  <p className="mt-3 text-sm text-slate-700">{image.pitfallNote}</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default LectureTissueLayers;
