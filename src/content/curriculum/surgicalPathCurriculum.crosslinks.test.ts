import { describe, expect, it } from 'vitest';
import { surgicalPathCurriculumModules } from './surgicalPathCurriculum.ts';
import { promotedLectures, preservedAlgorithms } from '../../utils/lectureLibraryCatalog.ts';
import primaryTutorials from '../tutorials/tutorials.normalized.json';
import importedTutorials from '../downloads_imports/normalized/tutorials.normalized.json';
import syllabusTopics from '../syllabus/syllabus.normalized.json';
import { getCuratedAtlasImages } from '../../../utils/curatedHistologyAtlas.ts';
import { getPromotedGranulomatousAtlasImages } from '../../../utils/promotedGranulomatousAtlas.ts';

type LinkedSurface = 'lectures' | 'tutorials' | 'images' | 'syllabus';

const linkedSurfaces: LinkedSurface[] = ['lectures', 'tutorials', 'images', 'syllabus'];

const lectureIds = new Set(promotedLectures.map((lecture) => lecture.id));
const algorithmIds = new Set(preservedAlgorithms.map((algorithm) => algorithm.id));
const tutorialIds = new Set(
  [...primaryTutorials, ...importedTutorials].map((tutorial) => tutorial.id)
);
const syllabusIds = new Set(syllabusTopics.map((topic) => topic.id));
const imageIds = new Set(
  [...getCuratedAtlasImages(), ...getPromotedGranulomatousAtlasImages()].map((image) => image.id)
);

const routeableValues = (surface: LinkedSurface, module: (typeof surgicalPathCurriculumModules)[number]) => {
  switch (surface) {
    case 'lectures':
      return module.linkedLectureIds;
    case 'tutorials':
      return module.linkedTutorialIds;
    case 'images':
      return module.linkedImageIds;
    case 'syllabus':
      return module.linkedSyllabusTopicIds;
  }
};

describe('surgical pathology curriculum cross-links', () => {
  it('resolves explicit curriculum references against current local registries', () => {
    const moduleIds = new Set(surgicalPathCurriculumModules.map((module) => module.moduleId));

    for (const module of surgicalPathCurriculumModules) {
      for (const id of module.relatedModules) {
        expect(moduleIds.has(id), `${module.moduleId} related module ${id}`).toBe(true);
      }
      for (const id of module.linkedLectureIds) {
        expect(lectureIds.has(id), `${module.moduleId} lecture link ${id}`).toBe(true);
      }
      for (const id of module.linkedTutorialIds) {
        expect(tutorialIds.has(id), `${module.moduleId} tutorial link ${id}`).toBe(true);
      }
      for (const id of module.linkedAlgorithmIds) {
        expect(algorithmIds.has(id), `${module.moduleId} algorithm link ${id}`).toBe(true);
      }
      for (const id of module.linkedImageIds) {
        expect(imageIds.has(id), `${module.moduleId} image link ${id}`).toBe(true);
      }
      for (const id of module.linkedSyllabusTopicIds) {
        expect(syllabusIds.has(id), `${module.moduleId} syllabus link ${id}`).toBe(true);
      }
    }
  });

  it('keeps every module routeable through an explicit link or a local navigation intent', () => {
    for (const module of surgicalPathCurriculumModules) {
      const explicitBridgeCount = linkedSurfaces.reduce(
        (count, surface) => count + routeableValues(surface, module).length,
        0
      );
      const intentBridgeCount = Object.keys(module.navigationIntents ?? {}).length;

      expect(explicitBridgeCount + intentBridgeCount, `${module.moduleId} routeable bridge count`).toBeGreaterThan(0);

      for (const [surface, intent] of Object.entries(module.navigationIntents ?? {})) {
        expect(linkedSurfaces, `${module.moduleId} ${surface} intent surface`).toContain(surface);
        expect(
          Boolean(intent.selectedId || intent.query || intent.filter),
          `${module.moduleId} ${surface} intent target`
        ).toBe(true);
      }
    }
  });
});
