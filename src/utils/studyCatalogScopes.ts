import type { DidacticAlgorithmRecord } from './algorithmCatalog.ts';
import type { PromotedLectureRecord } from './lectureLibraryCatalog.ts';
import type { DidacticTutorialRecord, TutorialTopicScope } from './tutorialLibraryCatalog.ts';
import { deriveTutorialSubtopic } from './tutorialLibraryCatalog.ts';

export interface StudySubtopicScope {
  id: string;
  label: string;
}

export interface StudyTreeScope {
  roots: StudySubtopicScope[];
  subtopicsByRoot: Record<string, StudySubtopicScope[]>;
}

const sortScopes = (values: StudySubtopicScope[]) =>
  values.slice().sort((left, right) => left.label.localeCompare(right.label));

export const buildTutorialStudyTree = (tutorials: DidacticTutorialRecord[]): StudyTreeScope => {
  const rootSet = new Map<string, StudySubtopicScope>();
  const subtopicsByRoot = tutorials.reduce<Record<string, Map<string, StudySubtopicScope>>>((accumulator, tutorial) => {
    const root = tutorial.abpathScope?.root;
    if (!root) {
      return accumulator;
    }
    rootSet.set(root, { id: root, label: root });
    const subtopic = deriveTutorialSubtopic(tutorial);
    if (!subtopic) {
      return accumulator;
    }
    accumulator[root] ||= new Map<string, TutorialTopicScope>();
    accumulator[root].set(subtopic.id, { id: subtopic.id, label: subtopic.label });
    return accumulator;
  }, {});

  return {
    roots: sortScopes(Array.from(rootSet.values())),
    subtopicsByRoot: Object.fromEntries(
      Object.entries(subtopicsByRoot).map(([root, value]) => [root, sortScopes(Array.from(value.values()))])
    ),
  };
};

export const buildLectureStudyTree = (lectures: PromotedLectureRecord[]): StudyTreeScope => {
  const rootSet = new Map<string, StudySubtopicScope>();
  const subtopicsByRoot = lectures.reduce<Record<string, Map<string, StudySubtopicScope>>>((accumulator, lecture) => {
    const root = lecture.category || (lecture.lectureTrack === 'core-principles' ? 'Core Principles' : 'Curated Lectures');
    rootSet.set(root, { id: root, label: root });
    accumulator[root] ||= new Map<string, StudySubtopicScope>();
    accumulator[root].set(lecture.id, { id: lecture.id, label: lecture.title });
    return accumulator;
  }, {});

  return {
    roots: sortScopes(Array.from(rootSet.values())),
    subtopicsByRoot: Object.fromEntries(
      Object.entries(subtopicsByRoot).map(([root, value]) => [root, sortScopes(Array.from(value.values()))])
    ),
  };
};

export const buildAlgorithmStudyTree = (algorithms: DidacticAlgorithmRecord[]): StudyTreeScope => {
  const rootSet = new Map<string, StudySubtopicScope>();
  const subtopicsByRoot = algorithms.reduce<Record<string, Map<string, StudySubtopicScope>>>((accumulator, algorithm) => {
    const root = algorithm.subspecialtyLabel;
    rootSet.set(root, { id: root, label: root });
    accumulator[root] ||= new Map<string, StudySubtopicScope>();
    accumulator[root].set(algorithm.patternFamily, { id: algorithm.patternFamily, label: algorithm.patternFamily });
    return accumulator;
  }, {});

  return {
    roots: sortScopes(Array.from(rootSet.values())),
    subtopicsByRoot: Object.fromEntries(
      Object.entries(subtopicsByRoot).map(([root, value]) => [root, sortScopes(Array.from(value.values()))])
    ),
  };
};
