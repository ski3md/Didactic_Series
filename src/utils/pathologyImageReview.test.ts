import { describe, expect, it } from 'vitest';

import {
  buildPathologySearchText,
  inferMagnification,
  inferMorphologyTags,
  inferOrganSystem,
  inferStain,
  normalizePathologyTitle,
} from './pathologyImageReview.ts';

describe('pathology image review helpers', () => {
  it('normalizes raw storage labels into pathology-friendly titles', () => {
    expect(normalizePathologyTitle('xing mesonephric 20 1')).toBe('Mesonephric Lesion 20x 1');
    expect(normalizePathologyTitle('xing mesonephric CA 10x')).toBe('Mesonephric-like Adenocarcinoma 10x');
  });

  it('extracts pathology-first display metadata', () => {
    expect(inferMagnification('xing mesonephric CA 20x')).toBe('20x');
    expect(inferStain('CK7 positive mesonephric-like adenocarcinoma')).toBe('CK7');
    expect(inferOrganSystem('gynecologic')).toBe('Gynecologic');
    expect(inferMorphologyTags('Papillary clear cell lesion with gland formation')).toEqual([
      'papillary',
      'clear cell',
      'gland-forming',
    ]);
  });

  it('adds pathology aliases to the search surface', () => {
    const searchText = buildPathologySearchText('xing mesonephric CA 20x', 'Gynecologic teaching image');
    expect(searchText).toContain('mesonephric-like adenocarcinoma');
    expect(searchText).toContain('clear cell differential');
    expect(searchText).toContain('kras mutated mullerian');
  });
});
