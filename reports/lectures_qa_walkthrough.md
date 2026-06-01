# Lectures QA Walkthrough

Generated: 2026-06-01T22:02:24.782Z

## Counts

- Promoted lectures: 14
- Curated normalized: 2
- Custom local: 1
- GU WHO-complete: 2
- Core principles import: 9
- Categories: Genitourinary Pathology (6), Breast Pathology (1), Endocrine Pathology (1), Gynecologic Pathology (1), Head and Neck Pathology (1), Hepatobiliary Pathology (1), Neuropathology (1), Pancreatic Pathology (1), Thoracic Pathology (1)

## ABPath Contract Coverage

- Contract version: lecture-abpath-contract.v1
- Lectures with contracts: 14/14
- Required tabs present: 14/14
- Anchor minimum met: 14/14
- Contract warnings: 3

- Renal Mass Evaluation: The normalized AP seed currently has stronger medical-kidney/process anchors than renal neoplasm anchors; renal tumor-specific anchors should be added when the source specification is expanded.
- Gynecologic Pathology: Core Principles: The normalized AP source does not currently expose a clean ap_gyn category; this contract is governed by gynecologic path-context filtering and the scope boundary.
- Renal Pathology: Core Principles: The normalized AP seed blends kidney and urothelial/bladder anchors; the lecture contract keeps renal/urologic oncology as the teaching endpoint.

## Broken Or Missing Risk

- MEDIUM fallback-scaffold-dependence: 9 promoted lectures have no raw slide records before interactive ABPath augmentation.
- MEDIUM objective-source-gap: 12 promoted lectures have no source learning-objective array before augmentation.
- MEDIUM retrieval-practice-source-gap: 11 promoted lectures have no source MCQ/flashcard records before augmentation.
- MEDIUM contract-warning: Renal Mass Evaluation carries ABPath contract warning(s).
- MEDIUM contract-warning: Gynecologic Pathology: Core Principles carries ABPath contract warning(s).
- MEDIUM contract-warning: Renal Pathology: Core Principles carries ABPath contract warning(s).

## Learner Wording And Routing Risk

- Positive routing signals: 10
- Missing routing signals: 0
- MEDIUM learner-contract-wording-risk: Renal Mass Evaluation is contract-covered but warning notes kidney medical-process anchors are stronger than renal neoplasm anchors.
- MEDIUM routing-label-scope-risk: Renal Pathology: Core Principles carries a warning that kidney and urothelial/bladder anchors are blended.
- MEDIUM taxonomy-contract-risk: Gynecologic Pathology contract is governed by path-context filtering because the normalized AP source lacks a clean ap_gyn category.

## Top Next Corrections

1. Resolve the three ABPath contract warnings before promotion language says these lectures are fully source-clean. (src/content/lectures/lectureAbpathContracts.json)
2. Review the nine core-principles lectures with zero raw slides/objectives/questions and decide which should get authored content versus explicit scaffold status. (src/content/downloads_imports/normalized/lectures.normalized.json)
3. Keep route labels, card subtitles, and lecture scope boundaries aligned for renal/urologic and gynecologic topics. (src/components/DidacticLectures.tsx)
4. Add reviewer-approved image assets where tissue-layer scaffolds are empty or checklist-only. (src/utils/lectureAbpathAugmentation.ts)

## Review Boundary

- This report does not mutate runtime components or lecture content.
- Generated mappings and scaffolds remain reviewer evidence, not automatically promoted teaching truth.
- Navigation signals are source-level QA signals; browser-visible proof remains separate unless a browser walkthrough is explicitly run.

