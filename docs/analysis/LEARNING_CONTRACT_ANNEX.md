# Learning Contract Annex

Date: 2026-04-01
Scope: Promotion of staged pathology education content into first-class learner-facing surfaces in `Didactic_Series`

## Purpose

This annex turns the benchmark critique into operational promotion rules for the current repository. It applies to content that moves from staged imports into canonical educational surfaces, with initial emphasis on the promotion queues defined in:

- `src/content/downloads_imports/planning/promotion_priority.json`
- `src/content/downloads_imports/planning/promotion_queues.json`
- `src/content/downloads_imports/planning/integration_recommendations.json`

The annex is written as a learning contract between:

- the platform, which must present coherent, appropriately scaffolded educational experiences
- the curator/editor, who must document why a content unit is promoted
- the learner, who must be able to understand the intended level, task, and expected outcome

## Benchmark Families

### Adult education and learner-centered design

- Self-directed use: each promoted unit should make its purpose and expected use obvious without requiring external orientation
- Immediate relevance: each unit should connect to authentic diagnostic, interpretive, or specimen-workup decisions
- Scaffolding: dense reference content should be broken into objectives, progression steps, and retrieval checkpoints
- Reflection and feedback: assessment or self-check should reinforce the intended diagnostic reasoning task

### Professional education and CME-style structure

- Explicit objectives: promoted content needs observable learning objectives
- Practice alignment: the learner should know whether the unit trains recognition, workup, differential diagnosis, reporting, or management-related interpretation
- Assessment-fit: lecture, tutorial, image atlas, and algorithm surfaces should each use the evaluation format that matches the learning task
- Disclosure of level: content should state whether it targets core/foundational, advanced resident, or fellow-level familiarity

### Pathology content-spec alignment

- AP/CP topic anchoring: promoted units must map to one or more topics in `src/content/syllabus/syllabus.normalized.json`
- Exam-level disclosure: promoted units should declare `C`, `AR`, and when relevant `F`
- Discipline boundary clarity: content should state whether it is AP, CP, mixed, or domain-adjacent staging
- Traceable rationale: promotion should cite the source queue and the pathology-spec basis for inclusion

## Promotion Gates

Every promoted unit must satisfy the following minimum gates.

| Gate | Requirement | Evidence |
| --- | --- | --- |
| `orientation` | The learner can tell what the unit is, who it is for, and where it fits | Title, summary, track label, stage label |
| `objective_clarity` | The unit states what the learner should be able to do | Learning objectives or explicit outcomes |
| `workflow_relevance` | The unit teaches a pathology task, not just static facts | Diagnostic pattern, workup, specimen handling, differential, or image interpretation framing |
| `assessment_fit` | The evaluation mode matches the content type | MCQs, flashcards, quick checks, cases, or image prompts |
| `path_spec_traceability` | The unit maps to AP/CP syllabus topics and intended difficulty | Topic/category anchors plus `C` / `AR` / `F` |
| `content_integrity` | The promoted content is curated and not raw staging noise | Deduplicated, labeled, provenance retained |
| `ux_readiness` | The unit can be consumed in the current app without ambiguity | View placement, navigation entry point, and cross-links are defined |

## Required Metadata For Promotion

Each promoted lecture, tutorial, image set, or algorithm should have a traceability record containing:

- `content_id`
- `title`
- `source_repo`
- `promotion_surface`
- `discipline`
- `level`
- `syllabus_topics`
- `learning_objectives_present`
- `assessment_mode`
- `ux_entry_point`
- `promotion_rationale`
- `review_status`

## Promotion Decisions

### Promote now

Content may be promoted when it already satisfies the gates above or can satisfy them with light metadata work.

- `Core Principles Library`
- `Granulomatous Diseases Module`

### Promote after curation

Content may be promoted after topic cleanup, deduplication, and learner-facing track design.

- `ABPath Advanced Board Prep`
- `CP Tutorial Batch Ready`
- `CP Tutorial 11.11.25`

### Hold in staging

Content should remain staged when the current app does not yet provide a coherent learner workflow for it.

- `Microbiology Algorithm Workspace`

## Initial Contract Obligations By Surface

### Core principles lecture module

- Must expose topic-first navigation rather than flat staging-library placement
- Must include explicit objectives and AP/CP discipline labels
- Must cross-link to related tutorials and syllabus topics

### Board-prep tutorials

- Must identify whether the tutorial is AP, CP, or granulomatous/domain-specific
- Must include retrieval practice or self-check, not just narrative text
- Must indicate intended difficulty level and target audience

### Granulomatous atlas and job-aid content

- Must connect image examples to diagnostic reasoning and differential use
- Must show image family labels that are readable and consistent
- Must link back to related tutorials or lectures where available

### Algorithms

- Must be held out of promoted surfaces until the app has an algorithm-specific navigator and domain-fit justification

## Initial Promotion Sequence

1. Promote granulomatous image content that already aligns with the native app workflows.
2. Promote core-principles lectures into a dedicated didactic section with topic-first navigation.
3. Curate one coherent tutorial track from ABPath and CP materials.
4. Leave microbiology algorithms staged until a deliberate infectious-disease or algorithm surface exists.

## Exit Criteria

This annex is being followed correctly when:

- promoted content has machine-readable traceability
- staged versus canonical content is explicit in docs and UI
- each promoted unit has syllabus and difficulty anchors
- the learner can move from lecture to tutorial to syllabus to image evidence without losing context
