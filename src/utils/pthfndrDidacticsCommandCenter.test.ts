import { describe, expect, it } from 'vitest';
import {
  buildBoardPassingPrediction,
  buildPerformanceSnapshot,
  mcqToImportedQuestion,
  validateImportedQuestionAnswerKey,
} from './pthfndrDidacticsCommandCenter.ts';
import type { MCQ, TutorialAbpathScope } from '../types.ts';

describe('pthfndr didactics command center', () => {
  it('flags biologically implausible keyed answers for the Enterococcus/optochin mismatch', () => {
    const mcq: MCQ = {
      topic: 'Medical Microbiology',
      question: 'Which test best distinguishes Enterococcus faecium from Enterococcus faecalis?',
      choices: ['Optochin sensitivity', 'Arabinose fermentation', 'Bacitracin susceptibility', 'PYR negativity'],
      answer: 'Optochin sensitivity',
      rationale: 'Legacy imported rationale.',
    };
    const scope: TutorialAbpathScope = {
      domain: 'CP',
      root: 'Medical Microbiology',
      primaryPath: 'Medical Microbiology > Bacteria, including Mycobacteria, Nocardia, and other Aerobic Actinomycetes',
      title: 'Bacteria, including Mycobacteria, Nocardia, and other Aerobic Actinomycetes',
      confidence: 'high',
      source: 'ABPath Clinical Pathology Content Specifications 04/10/2026',
    };

    const alerts = validateImportedQuestionAnswerKey(mcqToImportedQuestion(mcq, scope));

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]?.requiresFacultyReview).toBe(true);
  });

  it('produces a likely-pass readiness band when performance and study inputs are strong', () => {
    const snapshot = buildPerformanceSnapshot(
      'Chemical Pathology',
      [
        { topic: 'CP', question: 'q1', choices: ['a'], answer: 'a', rationale: 'r' },
        { topic: 'CP', question: 'q2', choices: ['a'], answer: 'a', rationale: 'r' },
        { topic: 'CP', question: 'q3', choices: ['a'], answer: 'a', rationale: 'r' },
      ],
      [
        { questionNumber: 1, questionId: '1', isCorrect: true },
        { questionNumber: 2, questionId: '2', isCorrect: true },
        { questionNumber: 3, questionId: '3', isCorrect: true },
      ]
    );

    const prediction = buildBoardPassingPrediction(
      {
        inServiceScore: 72,
        mcqPracticeSessions: 8,
        pthfndrSessions: 6,
        ankiAccuracy: 86,
        studyHoursPerWeek: 10,
        grossingExperience: 8,
        feedbackQuality: 8,
        wellBeingScore: 7,
      },
      snapshot
    );

    expect(['likely_pass', 'maintenance']).toContain(prediction.readinessBand);
    expect(prediction.predictedScore).toBeGreaterThan(70);
  });
});
