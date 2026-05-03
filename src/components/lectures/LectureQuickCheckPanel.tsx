import React, { useEffect, useMemo, useState } from 'react';
import Card from '../ui/Card.tsx';
import { Flashcard, LectureQuickCheck, MCQ } from '../../types.ts';

interface LectureQuickCheckPanelProps {
  checks: LectureQuickCheck[];
  flashcards: Flashcard[];
  extraMcqs: MCQ[];
  onComplete?: (checkId: string) => void;
}

const LectureQuickCheckPanel: React.FC<LectureQuickCheckPanelProps> = ({
  checks,
  flashcards,
  extraMcqs,
  onComplete,
}) => {
  const [revealedChecks, setRevealedChecks] = useState<string[]>([]);
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({});
  const [revealedRationales, setRevealedRationales] = useState<string[]>([]);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardRevealed, setFlashcardRevealed] = useState(false);

  const bundledMcqs = useMemo(() => {
    const checkMcqs = checks.map((check) => check.mcq).filter(Boolean) as MCQ[];
    return [...checkMcqs, ...extraMcqs];
  }, [checks, extraMcqs]);

  useEffect(() => {
    setFlashcardIndex(0);
    setFlashcardRevealed(false);
  }, [flashcards]);

  const currentFlashcard = flashcards[flashcardIndex];

  return (
    <div className="space-y-6">
      <Card>
        <h3 className="text-xl font-semibold font-serif text-slate-900">Quick checks</h3>
        <div className="mt-4 space-y-4">
          {checks.map((check) => {
            const revealed = revealedChecks.includes(check.id);
            const selectedChoice = selectedChoices[check.id];
            const rationaleVisible = revealedRationales.includes(check.id);
            return (
              <div key={check.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{check.checkpointType}</div>
                    <div className="mt-1 text-base font-semibold text-slate-900">{check.prompt}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setRevealedChecks((current) =>
                        revealed ? current.filter((item) => item !== check.id) : [...current, check.id]
                      );
                      if (onComplete) {
                        onComplete(check.id);
                      }
                    }}
                    className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                  >
                    {revealed ? 'Hide cue' : 'Reveal cue'}
                  </button>
                </div>

                {revealed && (
                  <div className="mt-3 rounded-lg bg-white px-4 py-3 text-sm text-slate-700">{check.teachingCue}</div>
                )}

                {check.checkpointType === 'morphology-check' && check.checkpoints && (
                  <div className="mt-4 space-y-2">
                    {check.checkpoints.map((item) => (
                      <div key={item} className="rounded-lg bg-white px-4 py-3 text-sm text-slate-700">
                        • {item}
                      </div>
                    ))}
                  </div>
                )}

                {check.mcq && (
                  <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-semibold text-slate-900">{check.mcq.question}</div>
                    <div className="mt-4 space-y-2">
                      {check.mcq.choices.map((choice) => {
                        const isSelected = selectedChoice === choice;
                        const isCorrect = check.mcq?.answer === choice;
                        return (
                          <button
                            key={choice}
                            type="button"
                            onClick={() => setSelectedChoices((current) => ({ ...current, [check.id]: choice }))}
                            className={`w-full rounded-lg border px-4 py-3 text-left text-sm transition ${
                              isSelected
                                ? isCorrect
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                                  : 'border-rose-300 bg-rose-50 text-rose-900'
                                : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            {choice}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedRationales((current) =>
                            rationaleVisible ? current.filter((item) => item !== check.id) : [...current, check.id]
                          )
                        }
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
                      >
                        {rationaleVisible ? 'Hide rationale' : 'Reveal rationale'}
                      </button>
                    </div>
                    {rationaleVisible && (
                      <div className="mt-3 rounded-lg bg-sky-50 px-4 py-3 text-sm text-slate-700">{check.mcq.rationale}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {flashcards.length > 0 && currentFlashcard && (
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Flashcard drill</div>
              <h3 className="mt-1 text-xl font-semibold font-serif text-slate-900">One concept at a time</h3>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={flashcardIndex === 0}
                onClick={() => {
                  setFlashcardIndex((current) => Math.max(0, current - 1));
                  setFlashcardRevealed(false);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={flashcardIndex >= flashcards.length - 1}
                onClick={() => {
                  setFlashcardIndex((current) => Math.min(flashcards.length - 1, current + 1));
                  setFlashcardRevealed(false);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prompt</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">{currentFlashcard.front}</div>
            <button
              type="button"
              onClick={() => setFlashcardRevealed((current) => !current)}
              className="mt-4 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              {flashcardRevealed ? 'Hide answer' : 'Reveal answer'}
            </button>
            {flashcardRevealed && (
              <div className="mt-4 rounded-xl bg-white px-4 py-3 text-sm text-slate-700">{currentFlashcard.back}</div>
            )}
          </div>
        </Card>
      )}

      {bundledMcqs.length > 0 && (
        <Card>
          <h3 className="text-xl font-semibold font-serif text-slate-900">Additional review questions</h3>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {bundledMcqs.map((mcq) => (
              <div key={`${mcq.topic}-${mcq.question}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{mcq.topic}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{mcq.question}</div>
                <div className="mt-3 text-sm text-slate-700">
                  <span className="font-semibold">Answer:</span> {mcq.answer}
                </div>
                <div className="mt-2 text-sm text-slate-700">{mcq.rationale}</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default LectureQuickCheckPanel;
