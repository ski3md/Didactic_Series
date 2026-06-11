export type ContentNamespace = 'canonical' | 'staged';

export interface ContentNamespaceDefinition {
  id: ContentNamespace;
  label: string;
  learnerSurface: string;
  promotionRule: string;
}

export const CONTENT_NAMESPACE_DEFINITIONS: Record<ContentNamespace, ContentNamespaceDefinition> = {
  canonical: {
    id: 'canonical',
    label: 'Canonical',
    learnerSurface: 'Primary learner-facing study surfaces',
    promotionRule: 'Use only for curated content with source truth, learner purpose, and placement rationale.',
  },
  staged: {
    id: 'staged',
    label: 'Staged',
    learnerSurface: 'Review queues, imports, and non-primary staging surfaces',
    promotionRule: 'Keep here until provenance, deduplication, linkage, and reviewer gates support promotion.',
  },
};

export const CONTENT_NAMESPACE_ORDER: ContentNamespace[] = ['canonical', 'staged'];

export const getContentNamespaceLabel = (namespace: ContentNamespace): string =>
  CONTENT_NAMESPACE_DEFINITIONS[namespace].label;

export const isContentNamespace = (value: string): value is ContentNamespace =>
  value === 'canonical' || value === 'staged';
