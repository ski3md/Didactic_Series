import React, { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card.tsx';
import { ArrowPathIcon, SparklesIcon } from '../icons.tsx';
import { DxEntityCard, LectureAlgorithmNode, LectureAlgorithmRecord } from '../../types.ts';

interface LectureAlgorithmPlayerProps {
  algorithm: LectureAlgorithmRecord;
  entityCards: DxEntityCard[];
  onOpenTutorial?: (query: string) => void;
  onOpenReference?: (terms: string[]) => void;
  onComplete?: (algorithmId: string) => void;
  initialNodeId?: string;
}

const LectureAlgorithmPlayer: React.FC<LectureAlgorithmPlayerProps> = ({
  algorithm,
  entityCards,
  onOpenTutorial,
  onOpenReference,
  onComplete,
  initialNodeId,
}) => {
  const [currentNodeId, setCurrentNodeId] = useState(initialNodeId || algorithm.startNodeId);
  const [history, setHistory] = useState<string[]>([]);
  const [morphologyChecked, setMorphologyChecked] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCurrentNodeId(initialNodeId || algorithm.startNodeId);
    setHistory([]);
    setMorphologyChecked({});
  }, [algorithm.id, algorithm.startNodeId, initialNodeId]);

  const currentNode = algorithm.nodes[currentNodeId];
  const relatedCards = useMemo(() => {
    if (!currentNode?.diagnosis) {
      return [];
    }
    const diagnosis = currentNode.diagnosis.toLowerCase();
    return entityCards.filter((card) => card.entityId.toLowerCase().includes(diagnosis) || diagnosis.includes(card.entityId.toLowerCase()));
  }, [currentNode?.diagnosis, entityCards]);

  useEffect(() => {
    if (currentNode?.type === 'result' && onComplete) {
      onComplete(algorithm.id);
    }
  }, [algorithm.id, currentNode?.type, onComplete]);

  if (!currentNode) {
    return (
      <Card>
        <p className="text-sm text-rose-700">The selected algorithm node could not be found. Restart the pathway.</p>
      </Card>
    );
  }

  const goForward = (nextNodeId: string) => {
    setHistory((current) => [...current, currentNodeId]);
    setCurrentNodeId(nextNodeId);
    setMorphologyChecked({});
  };

  const handleBack = () => {
    if (history.length === 0) {
      setCurrentNodeId(initialNodeId || algorithm.startNodeId);
      return;
    }
    const previousNodeId = history[history.length - 1];
    setHistory((current) => current.slice(0, -1));
    setCurrentNodeId(previousNodeId);
    setMorphologyChecked({});
  };

  const handleRestart = () => {
    setCurrentNodeId(initialNodeId || algorithm.startNodeId);
    setHistory([]);
    setMorphologyChecked({});
  };

  const allMorphologyConfirmed =
    currentNode.type !== 'morphology_gate' ||
    (currentNode.morphologyFeatures ?? []).every((feature) => morphologyChecked[feature]);

  const renderNodeActions = (node: LectureAlgorithmNode) => {
    if (!node.options || node.options.length === 0) {
      return null;
    }

    return (
      <div className="space-y-3">
        {node.options.map((option) => (
          <button
            key={`${node.id}-${option.label}`}
            type="button"
            disabled={node.type === 'morphology_gate' && !allMorphologyConfirmed}
            onClick={() => goForward(option.nextNodeId)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="font-semibold text-slate-900">
              {node.type === 'morphology_gate' && !allMorphologyConfirmed ? 'Verify features to proceed' : option.label}
            </div>
            {option.rationale && <div className="mt-1 text-sm text-slate-600">{option.rationale}</div>}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic approach</div>
            <h3 className="mt-1 text-2xl font-semibold font-serif text-slate-900">{algorithm.title}</h3>
            <p className="mt-2 text-sm text-slate-700">{algorithm.summary}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleBack}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Back
            </button>
            <button
              type="button"
              onClick={handleRestart}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Restart
            </button>
          </div>
        </div>
        {history.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {history.map((nodeId, index) => (
              <span key={`${nodeId}-${index}`} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600">
                {algorithm.nodes[nodeId]?.title ?? nodeId}
              </span>
            ))}
            <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800">{currentNode.title}</span>
          </div>
        )}
      </div>

      <Card>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic decision</div>
        <h4 className="mt-2 text-2xl font-semibold font-serif text-slate-900">{currentNode.title}</h4>
        <p className="mt-3 text-sm text-slate-700 whitespace-pre-line">{currentNode.description}</p>

        {currentNode.recommendedInitialIHC && currentNode.recommendedInitialIHC.length > 0 && (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended initial studies</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentNode.recommendedInitialIHC.map((item) => (
                <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {currentNode.type === 'morphology_gate' && currentNode.morphologyFeatures && (
          <div className="mt-5 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
            <div className="text-sm font-semibold text-indigo-900">Required microscopic findings</div>
            <p className="mt-1 text-sm text-indigo-800">Confirm the listed findings before advancing the differential.</p>
            <div className="mt-4 space-y-3">
              {currentNode.morphologyFeatures.map((feature) => (
                <label key={feature} className="flex items-start gap-3 rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    checked={Boolean(morphologyChecked[feature])}
                    onChange={(event) =>
                      setMorphologyChecked((current) => ({
                        ...current,
                        [feature]: event.target.checked,
                      }))
                    }
                  />
                  <span>{feature}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(currentNode.pearls?.length || currentNode.pitfalls?.length || currentNode.confirmatoryStudies?.length) && (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {currentNode.confirmatoryStudies && currentNode.confirmatoryStudies.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmatory studies</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {currentNode.confirmatoryStudies.map((study) => (
                    <li key={study}>• {study}</li>
                  ))}
                </ul>
              </div>
            )}
            {currentNode.pearls && currentNode.pearls.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-sky-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Pearls</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {currentNode.pearls.map((pearl) => (
                    <li key={pearl}>• {pearl}</li>
                  ))}
                </ul>
              </div>
            )}
            {currentNode.pitfalls && currentNode.pitfalls.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-amber-700">Pitfalls</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {currentNode.pitfalls.map((pitfall) => (
                    <li key={pitfall}>• {pitfall}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-6">{renderNodeActions(currentNode)}</div>

        {(currentNode.relatedTutorialQuery || currentNode.relatedImageTerms?.length) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {currentNode.relatedTutorialQuery && onOpenTutorial && (
              <button
                type="button"
                onClick={() => onOpenTutorial(currentNode.relatedTutorialQuery!)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Open supporting tutorial
              </button>
            )}
            {currentNode.relatedImageTerms && currentNode.relatedImageTerms.length > 0 && onOpenReference && (
              <button
                type="button"
                onClick={() => onOpenReference(currentNode.relatedImageTerms!)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
              >
                Open image comparison
              </button>
            )}
          </div>
        )}
      </Card>

      {currentNode.type === 'result' && relatedCards.length > 0 && (
        <Card>
          <h4 className="flex items-center text-xl font-semibold font-serif text-slate-900">
            <SparklesIcon className="mr-3 h-6 w-6 text-sky-600" />
            Diagnostic summary
          </h4>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {relatedCards.map((card) => (
              <div key={card.entityId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-base font-semibold text-slate-900">{card.entityId}</div>
                <p className="mt-2 text-sm text-slate-700">{card.summary}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Critical differential</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {card.criticalDifferential.map((item) => (
                    <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LectureAlgorithmPlayer;
