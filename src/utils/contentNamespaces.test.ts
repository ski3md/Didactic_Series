import { describe, expect, it } from 'vitest';
import {
  CONTENT_NAMESPACE_DEFINITIONS,
  CONTENT_NAMESPACE_ORDER,
  getContentNamespaceLabel,
  isContentNamespace,
} from './contentNamespaces.ts';

describe('content namespace contract', () => {
  it('keeps canonical before staged for learner-facing promotion decisions', () => {
    expect(CONTENT_NAMESPACE_ORDER).toEqual(['canonical', 'staged']);
    expect(getContentNamespaceLabel('canonical')).toBe('Canonical');
    expect(getContentNamespaceLabel('staged')).toBe('Staged');
  });

  it('defines learner surfaces and promotion rules for both namespaces', () => {
    CONTENT_NAMESPACE_ORDER.forEach((namespace) => {
      expect(CONTENT_NAMESPACE_DEFINITIONS[namespace].learnerSurface).toEqual(expect.any(String));
      expect(CONTENT_NAMESPACE_DEFINITIONS[namespace].promotionRule).toEqual(expect.any(String));
      expect(CONTENT_NAMESPACE_DEFINITIONS[namespace].promotionRule.length).toBeGreaterThan(20);
    });
  });

  it('rejects unrecognized namespace labels', () => {
    expect(isContentNamespace('canonical')).toBe(true);
    expect(isContentNamespace('staged')).toBe(true);
    expect(isContentNamespace('promoted')).toBe(false);
    expect(isContentNamespace('draft')).toBe(false);
  });
});
