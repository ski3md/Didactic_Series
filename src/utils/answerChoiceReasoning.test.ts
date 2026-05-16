import { describe, expect, it } from 'vitest';
import { getAnswerChoiceReasoning } from './answerChoiceReasoning.ts';
import { MCQ } from '../types.ts';

describe('getAnswerChoiceReasoning', () => {
  it('returns learner-facing reasoning for every choice', () => {
    const mcq: MCQ = {
      topic: 'Bladder Pathology',
      question: 'Which finding defines muscle-invasive bladder cancer?',
      choices: ['Lamina propria invasion', 'Muscularis propria invasion', 'Diffuse CK20 staining'],
      answer: 'Muscularis propria invasion',
      rationale: 'Invasion into muscularis propria defines pT2 disease.',
    };

    const reasoning = getAnswerChoiceReasoning(mcq);

    expect(reasoning).toHaveLength(3);
    expect(reasoning.find((item) => item.choice === 'Muscularis propria invasion')).toMatchObject({
      isCorrect: true,
    });
    expect(reasoning.every((item) => item.reasoning.length > 0)).toBe(true);
    expect(reasoning.filter((item) => !item.isCorrect).every((item) => item.reasoning.includes(mcq.answer))).toBe(true);
  });

  it('uses authored choice rationales when present', () => {
    const mcq: MCQ = {
      topic: 'Renal Mass Evaluation',
      question: 'Which pattern favors clear cell papillary renal cell tumor?',
      choices: ['CA9 cup pattern with diffuse CK7 positivity', 'PAX8 positivity alone'],
      answer: 'CA9 cup pattern with diffuse CK7 positivity',
      rationale: 'Clear cell papillary tumors show basolateral CA9 cup staining with diffuse CK7.',
      choiceRationales: {
        'PAX8 positivity alone': 'PAX8 supports renal lineage but does not separate these renal tumors.',
      },
    };

    expect(getAnswerChoiceReasoning(mcq).find((item) => item.choice === 'PAX8 positivity alone')?.reasoning).toBe(
      'PAX8 supports renal lineage but does not separate these renal tumors.'
    );
  });
});

