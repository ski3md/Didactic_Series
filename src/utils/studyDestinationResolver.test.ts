import { describe, expect, it } from 'vitest';
import { resolveStudyDestinationForRender } from './studyDestinationResolver.ts';

describe('resolveStudyDestinationForRender', () => {
  it('holds governance-pending item routes in item detail instead of falling back', () => {
    const result = resolveStudyDestinationForRender({
      destination: {
        workspace: 'tutorials',
        kind: 'item_detail',
        majorTopicId: 'Clinical Pathology',
        itemId: 'topic-mb-3-a',
      },
      validRoots: ['Clinical Pathology'],
      subtopicsByRoot: {},
      isValidItemId: () => false,
      isGovernancePendingItemId: (itemId) => itemId === 'topic-mb-3-a',
    });

    expect(result.renderedKind).toBe('item_detail');
    expect(result.governancePending).toBe(true);
    expect(result.destination.itemId).toBe('topic-mb-3-a');
  });

  it('falls back to topic overview for invalid item routes that are not governance pending', () => {
    const result = resolveStudyDestinationForRender({
      destination: {
        workspace: 'tutorials',
        kind: 'item_detail',
        majorTopicId: 'Clinical Pathology',
        itemId: 'unknown-item',
      },
      validRoots: ['Clinical Pathology'],
      subtopicsByRoot: {},
      isValidItemId: () => false,
      isGovernancePendingItemId: () => false,
    });

    expect(result.renderedKind).toBe('topic_overview');
    expect(result.governancePending).toBe(false);
    expect(result.destination.itemId).toBeUndefined();
  });
});
