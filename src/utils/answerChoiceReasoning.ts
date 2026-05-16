import { MCQ } from '../types.ts';

export interface AnswerChoiceReasoning {
  choice: string;
  isCorrect: boolean;
  reasoning: string;
}

const trimTerminalPunctuation = (value: string) => value.trim().replace(/[.\s]+$/, '');

export const getAnswerChoiceReasoning = (mcq: MCQ): AnswerChoiceReasoning[] =>
  mcq.choices.map((choice) => {
    const authoredReasoning = mcq.choiceRationales?.[choice];
    const isCorrect = choice === mcq.answer;

    if (authoredReasoning) {
      return { choice, isCorrect, reasoning: authoredReasoning };
    }

    if (isCorrect) {
      return {
        choice,
        isCorrect,
        reasoning: `Best answer. ${mcq.rationale}`,
      };
    }

    return {
      choice,
      isCorrect,
      reasoning: `Not the best answer. The keyed finding or workflow step supports "${trimTerminalPunctuation(
        mcq.answer
      )}". Re-check which required feature, discriminator, or report consequence is missing from this option.`,
    };
  });

