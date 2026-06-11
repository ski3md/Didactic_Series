# Canonical and Staged Content Namespaces

## Purpose

This document defines the two content namespaces used by the active didactics app. The goal is to keep learner-facing surfaces clean while preserving imported material, generated packets, and review queues for controlled promotion.

## Canonical

Canonical content is allowed in primary learner-facing study surfaces.

Required properties:

- Source truth, provenance, or validated mapping is available.
- The learner-facing purpose is clear.
- The item has a placement rationale in a lecture, tutorial, workup, image, curriculum, or reference surface.
- Duplicates and storage-language leakage have been removed or hidden.
- Reviewer or validator gates required by the content family are satisfied.

Primary surfaces:

- `src/components/DidacticLectures.tsx`
- `src/components/DidacticTutorials.tsx`
- `src/components/AlgorithmNavigator.tsx`
- `src/components/PathologyCurriculum.tsx`
- `src/components/ReferenceLibrary.tsx`

## Staged

Staged content is preserved for review, curation, or later promotion, but should not be treated as the default learner path.

Typical staged sources:

- raw imports
- Downloads Library remnants
- generated local churn packets
- faculty review queues
- category-only source-map rows
- material batches awaiting stronger local evidence

Staged content can be visible when the surface clearly identifies it as review or staging material. It should not be mislabeled as canonical.

## Code Authority

The shared namespace contract lives in:

- `src/utils/contentNamespaces.ts`

Existing catalog view models should use `ContentNamespace` and `getContentNamespaceLabel()` rather than redefining `canonical` and `staged` labels locally.

## Promotion Rule

Promotion is a state transition:

`staged -> canonical`

Promotion requires the relevant family-specific evidence. Examples include validated CP mappings, tutorial governance rows, faculty signoff, image provenance, or workup routing proof.

If evidence is incomplete, weak, category-only, duplicated, or reviewer-pending, the item remains staged.
