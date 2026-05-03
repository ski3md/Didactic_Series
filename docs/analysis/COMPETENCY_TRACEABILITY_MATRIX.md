# Competency Traceability Matrix

Date: 2026-04-01

## Use

This matrix is the operational review sheet for promotion decisions. It applies the learning-contract benchmarks to the highest-priority queues already identified in the repository planning outputs.

## Matrix

| Queue / Asset Group | Current Repo Source | Intended Learner Outcome | Adult / Professional Benchmark | Pathology-Spec Anchor | Promotion Decision | Immediate Work |
| --- | --- | --- | --- | --- | --- | --- |
| Core Principles Library lectures | `src/content/downloads_imports/planning/promotion_queues.json` | Build topic-first diagnostic frameworks for major AP domains | High relevance, good self-directed structure, needs explicit objectives and stage labels | Map each lecture to `src/content/syllabus/syllabus.normalized.json` categories and `C` / `AR` levels | Promote first | Add objective metadata, discipline labels, and topic cross-links |
| Granulomatous images | `src/content/downloads_imports/planning/promotion_priority.json` | Support image recognition, differential construction, and native job-aid use | Strong immediate applicability and case relevance | Map to inflammatory/infectious pathology syllabus topics where available; retain granulomatous domain labels | Promote first | Normalize image family labels, add diagnostic summaries, link to related tutorials |
| Granulomatous tutorials | `src/content/downloads_imports/planning/promotion_priority.json` | Reinforce reasoning around a domain already native to the app | Strong contextual relevance, likely low orientation burden | Tag by syllabus topic and intended learner level | Promote with light curation | Add objectives, quick checks, and cross-links to atlas entities |
| ABPath Advanced Board Prep tutorials | `src/content/downloads_imports/planning/promotion_priority.json` | Provide high-yield board-style retrieval practice | Strong assessment density, weaker coherence without track curation | Must map each promoted subset to AP or CP syllabus topics and exam level | Promote after curation | Split into AP, CP, and granulomatous subsets; deduplicate titles; add track labels |
| CP Tutorial Batch Ready | `src/content/downloads_imports/planning/promotion_priority.json` | Deliver focused CP board-prep practice | Good fit for retrieval-based professional study | Must anchor to CP topics from `src/content/syllabus/cp_spec.raw.txt` and normalized syllabus entries where available | Promote after curation | Establish CP-only entry surface and difficulty labeling |
| CP Tutorial 11.11.25 | `src/content/downloads_imports/planning/promotion_priority.json` | Supplement CP board-prep coverage | Useful but too small and duplication-prone to stand alone | Same CP topic anchors as above | Fold into CP queue | Deduplicate against batch-ready set before promotion |
| Microbiology Algorithm Workspace | `src/content/downloads_imports/planning/promotion_priority.json` | Support algorithmic infectious disease reasoning | Workflow mismatch with current learner journey | No current promoted AP/CP track fit in this app | Hold staged | Defer until algorithm navigator and domain decision exist |

## Required Evidence Checklist

Every promoted unit should be reviewed against the following checklist.

| Check | Pass Condition |
| --- | --- |
| Learner orientation | The learner can identify the module type, audience, and task within one screen |
| Objective clarity | At least one observable learning objective is present |
| Diagnostic relevance | The unit teaches interpretation, workup, differential diagnosis, or specimen reasoning |
| Assessment fit | The assessment pattern matches the surface |
| AP/CP traceability | One or more syllabus topic anchors are documented |
| Level disclosure | `C`, `AR`, or `F` is shown or inferable from mapped source |
| UX placement | The content has a defined promoted surface, not only a staging location |
| Provenance retained | Source repo and source path remain recoverable |

## Working Rules

- Promote one coherent lecture set and one coherent tutorial track before broadening scope.
- Do not promote a queue just because it is large; promote it when the learner journey is coherent.
- Treat image-heavy granulomatous content as a native strength of the product rather than as generic imports.
- Do not expose raw mixed AP/CP corpora in the main tutorial browser without track curation.
