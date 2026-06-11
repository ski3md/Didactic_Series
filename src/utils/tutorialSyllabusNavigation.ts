import { findBestSyllabusCategory } from './syllabusCatalog.ts';
import type { SyllabusIntent } from './syllabusNavigation.ts';
import type { DidacticTutorialRecord } from './tutorialLibraryCatalog.ts';

export const buildTutorialSyllabusIntent = (tutorial: DidacticTutorialRecord): SyllabusIntent | null => {
  const scope = tutorial.abpathScope;
  if (!scope || scope.domain !== 'AP') {
    return null;
  }

  const terms = [
    scope.root,
    scope.primaryPath,
    scope.title,
    tutorial.title,
    tutorial.category,
    ...tutorial.topicChips,
    ...tutorial.tags,
  ].filter((term): term is string => Boolean(term));

  return {
    query: scope.title || tutorial.title,
    category: findBestSyllabusCategory(terms),
  };
};
