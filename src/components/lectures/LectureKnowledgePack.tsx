import React from 'react';
import Card from '../ui/Card.tsx';
import { DxEntityCard, LecturePitfallCard } from '../../types.ts';

interface LectureKnowledgePackProps {
  entityCards: DxEntityCard[];
  pitfalls: LecturePitfallCard[];
  focusMode: boolean;
}

const LectureKnowledgePack: React.FC<LectureKnowledgePackProps> = ({ entityCards, pitfalls, focusMode }) => {
  return (
    <div className="space-y-6">
      <div className={`grid gap-5 ${focusMode ? 'grid-cols-1' : 'xl:grid-cols-2'}`}>
        {entityCards.map((card) => (
          <Card key={card.entityId}>
            <div className="space-y-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Diagnostic criteria</div>
                <h3 className="mt-1 text-2xl font-semibold font-serif text-slate-900">{card.entityId}</h3>
                <p className="mt-2 text-sm text-slate-700">{card.summary}</p>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Morphology</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {card.keyMorphology.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">IHC / Patterns</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {card.keyIHC.positive.map((item) => (
                      <li key={`pos-${item}`}>• Positive: {item}</li>
                    ))}
                    {(card.keyIHC.negative ?? []).map((item) => (
                      <li key={`neg-${item}`}>• Negative: {item}</li>
                    ))}
                    {(card.keyIHC.patterns ?? []).map((item) => (
                      <li key={`pattern-${item}`}>• Pattern: {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {card.keyMolecular && card.keyMolecular.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Molecular findings</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {card.keyMolecular.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">Pearls</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {card.pearls.map((item) => (
                    <li key={`${card.entityId}-${item.type}-${item.text}`}>
                      <span className="font-semibold text-slate-900">{item.type}:</span> {item.text}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Critical differential</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {card.criticalDifferential.map((item) => (
                      <span key={item} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prognosis / management</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{card.prognosis.tier}</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-700">
                    {card.managementImplications.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {pitfalls.length > 0 && (
        <Card>
          <h3 className="text-xl font-semibold font-serif text-slate-900">High-yield pitfalls</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {pitfalls.map((pitfall) => (
              <div key={pitfall.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-base font-semibold text-slate-900">{pitfall.title}</div>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">Common overcall</div>
                <p className="mt-1 text-sm text-slate-700">{pitfall.overcallRisk}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">Common undercall</div>
                <p className="mt-1 text-sm text-slate-700">{pitfall.undercallRisk}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">Where stains help</div>
                <p className="mt-1 text-sm text-slate-700">{pitfall.stainHelp}</p>
                <div className="mt-3 text-xs font-semibold uppercase tracking-wide text-amber-700">Morphology guardrail</div>
                <p className="mt-1 text-sm text-slate-700">{pitfall.morphologyGuardrail}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LectureKnowledgePack;
