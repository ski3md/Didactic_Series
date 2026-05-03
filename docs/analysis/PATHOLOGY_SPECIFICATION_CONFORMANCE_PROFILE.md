# Pathology Specification Conformance Profile

Date: 2026-04-01
Primary repo-local anchors:

- `src/content/syllabus/ap_spec.raw.txt`
- `src/content/syllabus/cp_spec.raw.txt`
- `src/content/syllabus/syllabus.normalized.json`

## Purpose

This profile defines how promoted content in `Didactic_Series` should demonstrate conformance to pathology content specifications. It is not a claim that the repository already has complete AP or CP coverage. It is a promotion-control document that requires every promoted unit to declare what part of the pathology blueprint it serves.

## Conformance Levels

| Level | Meaning | Promotion Implication |
| --- | --- | --- |
| `L0` | No pathology-spec mapping | Keep staged |
| `L1` | Discipline identified but no topic mapping | Staged or internal review only |
| `L2` | Topic/category mapped to normalized syllabus | Eligible for limited promotion |
| `L3` | Topic mapped and learner level declared (`C` / `AR` / `F`) | Eligible for promoted surface |
| `L4` | Topic mapped, level declared, and cross-links to related lecture/tutorial/image assets present | Preferred promoted-state target |

## Minimum Conformance Requirements

Each promoted unit must declare:

- discipline: `AP`, `CP`, `mixed`, or `domain-adjacent`
- one or more topic anchors from `src/content/syllabus/syllabus.normalized.json` when available
- intended examination or training level: `C`, `AR`, or `F`
- instructional role: `lecture`, `tutorial`, `image-set`, or `algorithm`
- placement rationale: why it belongs in a promoted learner-facing surface

## Current Queue Assessment

### Core Principles Library

Conformance target: `L3` moving to `L4`

Why:

- The lecture set is already organized by recognizable pathology domains such as breast, gynecologic, thoracic, neuropathology, and endocrine areas.
- Those domains can be anchored to normalized syllabus categories already present in `src/content/syllabus/syllabus.normalized.json`.
- Promotion should not occur until each lecture receives explicit level labeling and syllabus anchors.

Required actions:

- assign AP category anchors per lecture
- record intended level as `C` or mixed `C` / `AR` where justified
- cross-link lectures to tutorials and syllabus topics

### Granulomatous Module

Conformance target: `L2` moving to `L4`

Why:

- The product already has native granulomatous workflows, so these assets have strong contextual fit.
- Some content may align more directly to inflammatory or infectious pathology concepts than to a single clean exam blueprint category.
- Promotion is still justified because the learner task is concrete and diagnostically authentic.

Required actions:

- anchor granulomatous tutorials to syllabus topics where possible
- declare when the content is domain-specific reinforcement rather than full AP or CP blueprint coverage
- tie promoted image groups to differential and workup language

### ABPath Advanced Board Prep

Conformance target: `L1` moving to `L3`

Why:

- The corpus is large and assessment-rich, but broad scope alone is not enough for promoted placement.
- Promotion should happen only after the content is sorted into coherent AP and CP subsets with explicit topic anchors.

Required actions:

- split the corpus by AP and CP track
- deduplicate overlapping titles
- apply normalized syllabus mappings to promoted subsets only

### CP Tutorial Batch Ready and CP Tutorial 11.11.25

Conformance target: `L2` moving to `L3`

Why:

- These assets are closer to explicit CP coverage than the broader ABPath corpus.
- They still need track labeling, deduplication, and level assignment before main-surface promotion.

Required actions:

- map promoted items to CP specification topics
- show `C`, `AR`, and `F` where source material indicates it
- present the track as CP board prep, not generic tutorials

### Microbiology Algorithm Workspace

Conformance target: remain `L0` / `L1`

Why:

- The repository does not yet have a promoted algorithm navigator or a deliberate infectious disease track.
- Even if the content is technically structured, it does not yet fit the current promoted pathology learning journey.

Required action:

- hold staged until the product definition expands

## Conformance Review Workflow

1. Identify the candidate content unit and source repo.
2. Assign discipline and instructional role.
3. Map the unit to normalized syllabus topics.
4. Assign intended learner level.
5. Verify that the promoted surface matches the learning task.
6. Record the result in `docs/analysis/benchmark_traceability.yaml`.

## Current Repo-Level Gap

The main gap is not absence of content. The main gap is absence of explicit conformance metadata attached to promotion decisions. This profile closes that gap by requiring promoted content to state what pathology specification role it serves before it moves out of staging.
