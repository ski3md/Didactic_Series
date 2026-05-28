import { describe, expect, it } from 'vitest';
import { promotedLectures } from './lectureLibraryCatalog.ts';
import { buildLectureStudyTree } from './studyCatalogScopes.ts';

describe('lecture library category normalization', () => {
  it('canonicalizes GU Pathology into Genitourinary Pathology for promoted lectures', () => {
    const guCategories = promotedLectures
      .filter((lecture) => lecture.title.toLowerCase().includes('testis') || lecture.category?.includes('Genitourinary'))
      .map((lecture) => lecture.category);

    expect(guCategories.length).toBeGreaterThan(0);
    expect(guCategories).toContain('Genitourinary Pathology');
    expect(guCategories).not.toContain('GU Pathology');
  });

  it('builds a single Genitourinary Pathology lecture root from mixed source labels', () => {
    const tree = buildLectureStudyTree(promotedLectures);
    const rootLabels = tree.roots.map((root) => root.label);

    expect(rootLabels).toContain('Genitourinary Pathology');
    expect(rootLabels).not.toContain('GU Pathology');

    const guRoot = tree.subtopicsByRoot['Genitourinary Pathology'] ?? [];
    expect(guRoot.length).toBeGreaterThanOrEqual(6);
  });
});
