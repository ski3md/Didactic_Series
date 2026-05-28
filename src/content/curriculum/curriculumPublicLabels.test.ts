import { describe, expect, it } from 'vitest';
import { activeCurriculumModules } from './activeCurriculum.ts';
import { surgicalPathCurriculumModules } from './surgicalPathCurriculum.ts';

describe('curriculum public label normalization', () => {
  it('does not leave learner-facing GU shorthand in active curriculum titles or summaries', () => {
    const visibleCopy = activeCurriculumModules.flatMap((module) => [module.title, module.summary]);
    expect(visibleCopy.some((entry) => /\bGU\b/.test(entry))).toBe(false);
  });

  it('does not leave learner-facing GU shorthand in surgical pathology curriculum titles or summaries', () => {
    const visibleCopy = surgicalPathCurriculumModules.flatMap((module) => [module.title, module.summary]);
    expect(visibleCopy.some((entry) => /\bGU\b/.test(entry))).toBe(false);
  });
});
