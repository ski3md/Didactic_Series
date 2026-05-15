# AP P0 Batch Status Report

Generated: 2026-05-15T22:35:34.017Z

## Source Files

- Queue: `src/content/competency/apGapClosureQueue.ts`
- First batch: `src/content/competency/apP0EntityCardBatch.ts`

## P0 Queue Summary

P0 rows are core AP content-spec entities missing from active teaching surfaces. Each row requires an entity card, visual/gross anchor, retrieval item, and QA metadata before it can be considered closed.

| Metric | Count |
| --- | --- |
| All missing AP rows | 1671 |
| P0 core rows | 279 |
| P1 rows | 55 |
| P2 rows | 558 |
| P3 rows | 779 |

## P0 Category Counts

| Category | Missing rows | P0 rows | First-batch cards |
| --- | --- | --- | --- |
| Cardiovascular / Autopsy-adjacent | 242 | 75 | 0 |
| Endocrine | 193 | 40 | 0 |
| Gastrointestinal | 47 | 28 | 8 |
| Dermatopathology | 419 | 24 | 0 |
| Pediatric / Perinatal | 66 | 24 | 0 |
| Male Reproductive | 125 | 23 | 0 |
| Breast | 196 | 19 | 0 |
| Placenta | 13 | 11 | 11 |
| Soft Tissue, Bone, and Joint | 16 | 11 | 0 |
| Head and Neck | 9 | 5 | 0 |
| Medical Kidney / GU | 9 | 5 | 5 |
| Cytopathology | 32 | 4 | 0 |
| Forensic | 23 | 4 | 0 |
| Neuropathology | 267 | 4 | 0 |
| Respiratory / Thoracic | 14 | 2 | 0 |

## First-Batch Card Summary

Batch: P0 core entity card batch 1

Status: draft scaffolds awaiting faculty-reviewed medical content and visual assets

Strategy: First 24 P0 rows prioritized toward medical kidney/GU, placenta, GI, cardiovascular/autopsy, endocrine, thoracic, soft tissue, cytology, and head and neck before broader long-tail domains.

| Metric | Count |
| --- | --- |
| Cards | 24 |
| Completed gates | 0 |
| Review-ready gates | 24 |
| Missing gates | 96 |
| Total gates | 120 |
| Percent complete | 0% |
| Percent review-ready | 20% |
| Percent missing | 80% |

## First-Batch Categories

| Category | Cards |
| --- | --- |
| Placenta | 11 |
| Gastrointestinal | 8 |
| Medical Kidney / GU | 5 |

## Gate Readiness

| Gate label | Complete | Ready for review | Missing |
| --- | --- | --- | --- |
| Entity card content | 0 | 0 | 24 |
| Faculty review | 0 | 0 | 24 |
| Retrieval answer key | 0 | 0 | 24 |
| Taxonomy QA | 0 | 24 | 0 |
| Visual anchor | 0 | 0 | 24 |

## Missing Gates By Label

| Gate label | Missing count |
| --- | --- |
| Entity card content | 24 |
| Faculty review | 24 |
| Retrieval answer key | 24 |
| Visual anchor | 24 |

## Next Actions

- Assign the highest-volume missing gate work first.
  Rationale: Entity card content is missing on 24 first-batch cards.
- Convert ready taxonomy gates into reviewed gates.
  Rationale: Every first-batch card currently has a structured taxonomy QA scaffold; faculty confirmation is the fastest route to measurable progress.
- Add source-backed content and answer keys before visual-only expansion.
  Rationale: Learner-facing cards should not expose prompts without faculty-reviewed definitions, discriminators, pitfalls, and reveal answers.
- Plan the next P0 batch against uncovered high-count categories.
  Rationale: Top uncovered P0 categories include Cardiovascular / Autopsy-adjacent (75), Endocrine (40), Dermatopathology (24), Pediatric / Perinatal (24), Male Reproductive (23).
