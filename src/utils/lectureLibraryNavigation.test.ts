import { describe, expect, it } from 'vitest';
import { consumeLectureLibraryIntent, setLectureLibraryIntent } from './lectureLibraryNavigation.ts';

describe('lectureLibraryNavigation', () => {
  it('persists and consumes a lecture selection intent exactly once', () => {
    setLectureLibraryIntent({
      selectedId: 'bladder_path_core_principles',
      query: 'Bladder Pathology Core Principles',
      track: 'core-principles',
      initialMode: 'algorithm',
    });

    expect(consumeLectureLibraryIntent()).toEqual({
      selectedId: 'bladder_path_core_principles',
      query: 'Bladder Pathology Core Principles',
      track: 'core-principles',
      initialMode: 'algorithm',
    });
    expect(consumeLectureLibraryIntent()).toBeNull();
  });

  it('returns null when session storage contains malformed JSON', () => {
    window.sessionStorage.setItem('didactic_series_selected_lecture', '{bad-json');
    expect(consumeLectureLibraryIntent()).toBeNull();
  });
});
