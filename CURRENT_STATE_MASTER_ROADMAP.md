# Current-State Master Roadmap

## Purpose

This document consolidates the active direction of `/Users/skim4/Downloads/Didactic_Series` into one current-state plan. It supersedes the narrow “granulomatous module only” framing in older docs without discarding the migration history already captured elsewhere.

## Product Definition

`Didactic_Series` is now best understood as a pathology education platform with four major content surfaces:

1. Granulomatous teaching workflows already native to the app:
- Job Aid & Atlas
- Diagnostic Pathway
- AI Case Generator
- Case Study / Visual Challenge / Evaluation flows

2. Curated migrated educational content:
- Lectures
- Tutorials
- Syllabus Explorer

3. Downloads-derived staging and promotion surface:
- Downloads Library

4. Histology image and atlas experiences:
- Image Galleries
- Curated Histology Atlas
- Supplemental promoted granulomatous atlas content

This is no longer just a single-topic lung granuloma module, even though granulomatous disease remains the strongest and most complete domain in the current app.

## Planning Sources

The current roadmap is synthesized from:

- `LECTURE_CONTENT_MIGRATION_STRATEGY.md`
- `NEXT_10_MIGRATION_BATCH_PLAN.md`
- `src/content/downloads_imports/planning/NEXT_TEN_STEPS_BATCH_REPORT.md`
- `src/content/downloads_imports/planning/integration_recommendations.json`
- The active app surface in `App.tsx`, `types.ts`, and the `components/` tree

## Current Implemented State

### Product surfaces already exposed

- Home
- Job Aid & Atlas
- Case Study
- Case Library
- Lectures
- Tutorials
- Downloads Library
- Syllabus Explorer
- Visual Challenge
- Diagnostic Pathway
- AI Case Generator
- Image Galleries
- ADDIE-related instructional phases

### Content currently staged or promoted

- Primary normalized lecture set: 2 records
- Primary normalized tutorial set: 190 records
- Downloads lecture set: 9 records
- Downloads tutorial set: 290 records
- Downloads image set: 216 records
- Downloads algorithm set: 1 record

### Migration and promotion work already completed

- Structured content pulled from GitHub and Downloads source repos
- Read-only browsers added for lectures, tutorials, syllabus, and downloads imports
- Lazy-loading and on-demand JSON asset loading added for heavier content views
- Curated histology atlas promoted into image and job-aid workflows
- IOC/service-line framing removed from the active educational presentation layer
- Gmail OAuth notifier support added to the pathology pipeline

## What Remains To Be Fleshed Out

### 1. Product coherence

The app contains multiple valid educational surfaces, but they do not yet read as one coherent product. The repo still has:

- an older README centered on a single granulomatous module
- migration docs centered on raw content acquisition
- planning docs centered on Downloads staging

What is missing is one aligned product narrative in the UI and docs:

- who the product is for
- what the main learning modes are
- how migrated content relates to the native granuloma workflows

### 2. Content promotion versus staging

The app can display a large amount of imported material, but much of it is still staged rather than fully integrated.

Still open:

- dedicated core-principles didactic section with topic-first navigation
- curated AP / CP / granulomatous tutorial tracks
- clearer promotion criteria for what graduates from Downloads Library into the main surfaces
- deduplication and prioritization across overlapping tutorial corpora

### 3. Algorithm experience

Algorithms are imported as content, but there is no dedicated algorithm navigator yet.

Still open:

- algorithm-specific browsing surface
- criteria for integrating only domain-aligned algorithms
- decision on whether microbiology/infectious disease content belongs in this product

### 4. Legacy image-manifest path

Older tooling still expects:

- `src/assets/data/image_manifest.json`

That file is still absent, while newer atlas/image systems now exist in parallel. This leaves the repo with two competing image-data paths:

- legacy manifest-driven tooling
- newer curated/promoted atlas content utilities

This should be reconciled rather than left half-migrated.

### 5. Documentation and environment setup

Current docs do not match the active repo state.

Still open:

- replace `.env`-centric setup guidance with current secret-loading guidance
- document the actual content architecture
- document which datasets are canonical versus staged
- document which surfaces are considered production-like versus experimental

### 6. Runtime and repository hygiene

The worktree is currently noisy. There are code changes, generated JSON changes, and local venv package churn in the same repo state.

Still open:

- normalize what belongs in git versus local runtime state
- avoid committing `venv/` package churn
- define what generated content files are canonical outputs
- restore a clean baseline branch state

## Overarching Project Plan

The practical overarching plan should be:

### Phase 1: Stabilize the platform

- Freeze the current surfaces and clean the repository state
- Decide which generated files are source-of-truth outputs
- Resolve the `image_manifest.json` split or retire the old path
- Update setup docs and secret-loading guidance

### Phase 2: Consolidate the information architecture

- Define the primary navigation model for:
  - Native granuloma workflows
  - Core didactics
  - Board-prep tutorials
  - Atlas / images
  - Syllabus
- Decide what remains a staging/library surface versus a promoted teaching surface

### Phase 3: Promote high-value content into first-class surfaces

- Promote Downloads-derived core-principles lectures into a dedicated didactic module
- Curate ABPath and CP tutorials into cleaner topic tracks
- Promote only domain-fit image sets into the atlas and job-aid views
- Hold low-fit imports in staging until matching UI exists

### Phase 4: Build missing navigators

- algorithm navigator
- topic/facet-driven lecture navigation
- better cross-linking between lectures, tutorials, syllabus topics, and images

### Phase 5: Production hardening

- clean docs
- deterministic import/rebuild scripts
- content validation
- build/test verification
- secret/config hygiene

## Recommended Priority Order

### Immediate

1. Clean the repo baseline
- Separate code/content work from venv/runtime churn
- Avoid treating the current dirty worktree as stable

2. Update project documentation
- Replace the stale README framing
- Document the actual platform scope and setup

3. Reconcile the image-data architecture
- Either restore the manifest path or retire it explicitly

### Near-term

4. Promote core-principles lectures into a dedicated didactic section
5. Curate tutorial tracks into AP, CP, and granulomatous subsets
6. Define the boundary between “Downloads Library” and promoted content

### Mid-term

7. Add a dedicated algorithm navigator
8. Cross-link lectures, tutorials, atlas entities, and syllabus topics
9. Normalize duplicate or overlapping imported content

### Long-term

10. Treat the platform as a reusable pathology education shell rather than a single-module app

## Concrete Next Sprint

If work resumes immediately, the highest-signal sprint is:

1. Write a new README aligned to the actual product
2. Clean or quarantine `venv/` churn from the repo state
3. Resolve the missing `src/assets/data/image_manifest.json` issue
4. Promote the highest-value core-principles lectures out of Downloads staging
5. Curate and expose one coherent tutorial track rather than the full raw Downloads mix

## Success Criteria

The project is materially more complete when:

- one current README matches the actual product
- the repo has a clean, intentional git baseline
- staged versus promoted content is explicit
- the image system has one coherent source-of-truth path
- the app has a first-class didactic section, not just a staging library
- board-prep content is curated rather than merely imported
- algorithms either have a real navigator or remain clearly out of scope

## Bottom Line

There is an overarching direction, but it currently lives across several migration and batch-planning artifacts rather than one product plan. The project’s main unfinished work is no longer raw ingestion. It is consolidation:

- consolidate product identity
- consolidate content architecture
- consolidate image pipelines
- consolidate documentation
- consolidate repo hygiene

That is the difference between a successful migration and a finished educational platform.
